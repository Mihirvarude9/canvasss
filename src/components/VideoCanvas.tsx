import { useRef, useEffect, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';
import { VideoNode } from '@/store/videoStore';

export const VideoCanvas = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number } | null>(null);

  const {
    nodes,
    selectedNodeIds,
    addNode,
    updateNode,
    selectNode,
    selectNodes,
    clearSelection,
    moveNode,
    generateVideo,
    deleteNode,
  } = useVideoStore();

  // Handle canvas mouse down for selection box
  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Node components call stopPropagation on their own handlers.
    // So any mouse down reaching here is on the canvas background (including the grid layer).
    if (!isDragging && canvasRef.current) {
      setIsSelecting(true);
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setDragStart({ x, y });
      setSelectionBox({ x, y, width: 0, height: 0 });

      // Clear existing selection when starting new selection
      clearSelection();
    }
  };

  // Handle canvas mouse move for selection box
  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isSelecting && selectionBox) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        
        const newBox = {
          x: Math.min(dragStart.x, currentX),
          y: Math.min(dragStart.y, currentY),
          width: Math.abs(currentX - dragStart.x),
          height: Math.abs(currentY - dragStart.y),
        };
        
        setSelectionBox(newBox);
        
        // Select nodes within the selection box
        const nodesInSelection = nodes.filter(node => {
          const nodeRight = node.x + node.width;
          const nodeBottom = node.y + node.height;
          const boxRight = newBox.x + newBox.width;
          const boxBottom = newBox.y + newBox.height;
          
          return node.x < boxRight && 
                 nodeRight > newBox.x && 
                 node.y < boxBottom && 
                 nodeBottom > newBox.y;
        });
        
        if (nodesInSelection.length > 0) {
          const nodeIds = nodesInSelection.map(node => node.id);
          selectNodes(nodeIds);
        }
      }
    }
  };

  // Handle canvas mouse up to finish selection
  const handleCanvasMouseUp = () => {
    if (isSelecting) {
      setIsSelecting(false);
      setSelectionBox(null);
    }
  };

  // Right-click context menu on canvas
  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    setContextMenu({ open: true, x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDeleteSelected = () => {
    if (selectedNodeIds.length === 0) return;
    selectedNodeIds.forEach(id => deleteNode(id));
    closeContextMenu();
  };

  const handleGenerate = async () => {
    try {
      await generateVideo();
    } finally {
      closeContextMenu();
    }
  };

  const handleToggleGrid = () => {
    setShowGrid(v => !v);
    closeContextMenu();
  };

  // Handle node click
  const handleNodeClick = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    e.preventDefault();
    selectNode(nodeId, e.ctrlKey || e.metaKey);
  };

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragNode(nodeId);
    
    // Select node if not already selected
    if (!selectedNodeIds.includes(nodeId)) {
      selectNode(nodeId, e.ctrlKey || e.metaKey);
    }
  };

  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragNode) {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        const node = nodes.find(n => n.id === dragNode);
        if (node) {
          moveNode(dragNode, node.x + deltaX, node.y + deltaY);
        }
        
        setDragStart({ x: e.clientX, y: e.clientY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setDragNode(null);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragNode, dragStart, moveNode, nodes]);

  // Handle asset drop from library (videos or images)
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const assetJson = e.dataTransfer.getData('application/json');
    const videoUrl = e.dataTransfer.getData('video/url');

    if (assetJson) {
      try {
        const asset = JSON.parse(assetJson);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          if (asset.type === 'image' && asset.url) {
            addNode({
              type: 'image',
              x: e.clientX - rect.left - 100,
              y: e.clientY - rect.top - 50,
              // Use original image dimensions without scaling
              width: asset.width || 300,
              height: asset.height || 200,
              imageUrl: asset.url,
              zIndex: nodes.length,
            });
            return;
          }
        }
      } catch (err) {
        console.warn('Failed to parse dragged asset json', err);
      }
    }

    // Fallback: legacy video-specific dataTransfer entries
    if (videoUrl) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        addNode({
          type: 'video',
          x: e.clientX - rect.left - 100,
          y: e.clientY - rect.top - 50,
          width: 200,
          height: 100,
          videoUrl,
          duration: 0,
          startTime: 0,
          endTime: 0,
          volume: 1,
          muted: false,
          zIndex: nodes.length,
        });
      }
    } else {
      console.log('No recognizable asset found in drop data');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div
      ref={canvasRef}
      className="w-full h-full bg-canvas relative overflow-hidden cursor-crosshair"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onContextMenu={handleCanvasContextMenu}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => contextMenu?.open && closeContextMenu()}
    >
      {/* Grid background */}
      {showGrid && (
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
      )}

      {/* Video nodes */}
      {nodes.map((node) => (
        <VideoNodeComponent
          key={node.id}
          node={node}
          isSelected={selectedNodeIds.includes(node.id)}
          onMouseDown={(e) => handleMouseDown(e, node.id)}
          onClick={(e) => handleNodeClick(e, node.id)}
        />
      ))}

      {/* Selection box */}
      {selectionBox && (
        <div
          className="absolute border border-primary bg-primary/10 pointer-events-none"
          style={{
            left: selectionBox.x,
            top: selectionBox.y,
            width: selectionBox.width,
            height: selectionBox.height,
          }}
        />
      )}

      {/* Multi-selection outline */}
      {selectedNodeIds.length > 1 && (
        <div
          className="absolute border border-primary pointer-events-none"
          style={{
            left: Math.min(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.x : 0;
            })),
            top: Math.min(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.y : 0;
            })),
            width: Math.max(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.x + node.width : 0;
            })) - Math.min(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.x : 0;
            })),
            height: Math.max(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.y + node.height : 0;
            })) - Math.min(...selectedNodeIds.map(id => {
              const node = nodes.find(n => n.id === id);
              return node ? node.y : 0;
            })),
          }}
        />
      )}

      {/* Drop zone indicator */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-lg font-semibold mb-2">Video Canvas</h3>
            <p className="text-sm">Drag videos from the library to start creating</p>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu?.open && (
        <div
          className="absolute z-50 min-w-[200px] bg-card border border-border rounded-md shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onMouseLeave={closeContextMenu}
        >
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleGenerate}>Generate Video</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleDeleteSelected} disabled={selectedNodeIds.length === 0}>Delete Selected</button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleToggleGrid}>{showGrid ? 'Hide' : 'Show'} Grid</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={closeContextMenu}>Close</button>
        </div>
      )}
    </div>
  );
};

interface VideoNodeComponentProps {
  node: VideoNode;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
}

const VideoNodeComponent = ({ node, isSelected, onMouseDown, onClick }: VideoNodeComponentProps) => {
  const [videoDuration, setVideoDuration] = useState(0);

  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    setVideoDuration(video.duration);
  };

  return (
    <div
      className={`absolute border-2 rounded-lg cursor-move transition-all ${
        isSelected 
          ? 'border-primary shadow-lg shadow-primary/20' 
          : 'border-border hover:border-primary/50'
      }`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        height: node.height,
        zIndex: node.zIndex,
      }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {/* Media content */}
      <div className="w-full h-full bg-black rounded-lg overflow-hidden relative">
        {node.type === 'video' && node.videoUrl ? (
          <>
            <video
              src={node.videoUrl}
              className="w-full h-full object-cover"
              muted
              onLoadedMetadata={handleVideoLoadedMetadata}
            />
            {/* Video info overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-xs">
              <div className="font-medium truncate">{node.videoUrl.split('/').pop()}</div>
              <div className="flex items-center justify-between">
                {videoDuration > 0 && (
                  <div className="text-xs opacity-75">
                    {Math.floor(videoDuration / 60)}:{(videoDuration % 60).toFixed(0).padStart(2, '0')}
                  </div>
                )}
                <div className="flex items-center gap-1">
                  {node.muted ? (
                    <VolumeX className="w-3 h-3" />
                  ) : (
                    <Volume2 className="w-3 h-3" />
                  )}
                  <span className="text-xs">{Math.round((node.volume || 1) * 100)}%</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          // Image node
          node.type === 'image' && node.imageUrl ? (
            <img src={node.imageUrl} className="w-full h-full object-contain bg-black" alt="dropped" />
          ) : null
        )}

        {/* Selection indicator */}
        {isSelected && (
          <div className="absolute inset-0 border border-primary pointer-events-none" />
        )}
      </div>

      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-primary rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-primary rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
};
