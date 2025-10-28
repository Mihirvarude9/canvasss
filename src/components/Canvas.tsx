import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage, FabricObject, Point } from 'fabric';
import { useCanvasStore } from '@/store/canvasStore';
import { type Asset } from '@/services/types';
import { useAssets } from '@/hooks/useAssets';
import { apiClient } from '@/services/api';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';
import { toast } from 'sonner';
import { ExportDialog, type ExportOptions } from '@/components/ExportDialog';
import { exportCanvas } from '@/utils/exportCanvas';
import { ImageResizer } from '@/components/ImageResizer';
import { CanvasModeSelector } from '@/components/CanvasModeSelector';
import { MiniChatWindow } from '@/components/MiniChatWindow';

// Utility function to convert image URL to base64
const imageToBase64 = async (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      try {
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      // Fallback: try without CORS
      const img2 = new Image();
      img2.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = img2.width;
        canvas.height = img2.height;
        ctx.drawImage(img2, 0, 0);
        
        try {
          const base64 = canvas.toDataURL('image/jpeg', 0.9);
          resolve(base64);
        } catch (error) {
          reject(error);
        }
      };
      img2.onerror = () => reject(new Error('Image failed to load'));
      img2.src = url;
    };
    
    img.src = url;
  });
};

// Utility function to load images with base64 conversion
const loadImageWithCORS = async (url: string): Promise<FabricImage> => {
  try {
    console.log('🖼️ Attempting to load image:', url);
    
    // First try direct loading
    try {
      const fabricImg = await FabricImage.fromURL(url, {
        crossOrigin: 'anonymous',
      });
      console.log('✅ FabricImage created directly with CORS:', url);
      return fabricImg;
    } catch (error) {
      console.warn('⚠️ Direct loading failed, trying base64 conversion...', error);
    }
    
    // Fallback: convert to base64 first
    console.log('🔄 Converting image to base64...');
    const base64 = await imageToBase64(url);
    console.log('✅ Image converted to base64 successfully');
    
    const fabricImg = await FabricImage.fromURL(base64);
    console.log('✅ FabricImage created from base64:', url);
    return fabricImg;
    
  } catch (error) {
    console.error('❌ All image loading methods failed:', error);
    throw error;
  }
};

export const Canvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectMapRef = useRef<Map<string, FabricObject>>(new Map());
  
  const { nodes, selectedNodeIds, gridVisible, whiteboardMode, zoom, setZoom, selectNode, selectNodes, clearSelection, updateNode, addNode, exportDialogOpen, closeExportDialog, duplicateSelected, deleteSelectedNodes, alignNodes, undo, redo, history, historyIndex, openExportDialog, toggleGrid, error, clearError, isGenerating, setGenerating, generationStatus, canvasMode, addGeneratedAssetId } = useCanvasStore();
  
  const { uploadAsset, loadAssets } = useAssets();
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ open: boolean; x: number; y: number } | null>(null);
  const [imageResizerOpen, setImageResizerOpen] = useState(false);
  const [miniChatOpen, setMiniChatOpen] = useState(false);
  const [selectedImageForChat, setSelectedImageForChat] = useState<{
    id: string;
    url: string;
    assetId: string;
    name: string;
  } | null>(null);
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 });
  const [draggedImage, setDraggedImage] = useState<{
    id: string;
    url: string;
    assetId: string;
    name: string;
  } | null>(null);
  const [dragOverImage, setDragOverImage] = useState<string | null>(null);

  // Expose export function
  const handleExportCanvas = async (options: ExportOptions) => {
    await exportCanvas(fabricCanvasRef.current, options);
  };

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;
    
    try {
      const rect = containerRef.current.getBoundingClientRect();
      setContextMenu({ open: true, x: e.clientX - rect.left, y: e.clientY - rect.top });
    } catch (error) {
      console.error('Error getting bounding rect:', error);
      // Fallback to simple positioning
      setContextMenu({ open: true, x: e.clientX, y: e.clientY });
    }
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleDuplicate = () => { duplicateSelected(); closeContextMenu(); };
  const handleDelete = () => { deleteSelectedNodes(); closeContextMenu(); };
  const handleAlignRow = () => { alignNodes('row'); closeContextMenu(); };
  const handleAlignColumn = () => { alignNodes('column'); closeContextMenu(); };
  const handleAlignGrid = () => { alignNodes('grid'); closeContextMenu(); };
  const handleZoomIn = () => { setZoom(Math.min(zoom * 1.2, 8)); closeContextMenu(); };
  const handleZoomOut = () => { setZoom(Math.max(zoom / 1.2, 0.1)); closeContextMenu(); };
  const handleZoomReset = () => { setZoom(1); closeContextMenu(); };
  const handleExport = () => { openExportDialog(); closeContextMenu(); };
  const handleToggleGrid = () => { toggleGrid(); closeContextMenu(); };
  const handleOpenImageResizer = () => { setImageResizerOpen(true); closeContextMenu(); };

  useEffect(() => {
    console.log('🎨 Canvas useEffect triggered');
    console.log('🎨 canvasRef.current:', canvasRef.current);
    console.log('🎨 containerRef.current:', containerRef.current);
    
    if (!canvasRef.current || !containerRef.current) {
      console.log('❌ Canvas or container ref not ready yet');
      return;
    }

    console.log('🎨 Initializing Fabric Canvas...');
    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: 'transparent',
      selection: !whiteboardMode, // allow easy panning in whiteboard mode
      preserveObjectStacking: true,
      allowTouchScrolling: true,
    });

    // CORS is configured globally at the top of the file
    
    console.log('✨ Canvas initialized with multi-selection enabled');

    fabricCanvasRef.current = canvas;

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
      canvas.renderAll();
    };
    
    window.addEventListener('resize', handleResize);

    // Mouse wheel zoom - zoom to cursor position
    canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as WheelEvent;
      const delta = evt.deltaY;
      let zoom = canvas.getZoom();
      zoom *= 0.999 ** delta;
      if (zoom > 8) zoom = 8;
      if (zoom < 0.1) zoom = 0.1;
      
      // Zoom to cursor position
      const point = new Point(opt.pointer!.x, opt.pointer!.y);
      canvas.zoomToPoint(point, zoom);
      setZoom(zoom);
      
      evt.preventDefault();
      evt.stopPropagation();
    });

    // Pan on middle mouse or Shift + drag
    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 1 || (evt.button === 0 && evt.shiftKey)) {
        setIsPanning(true);
        setLastPanPoint({ x: evt.clientX, y: evt.clientY });
        canvas.selection = false;
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const evt = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform!;
        vpt[4] += evt.clientX - lastPanPoint.x;
        vpt[5] += evt.clientY - lastPanPoint.y;
        canvas.requestRenderAll();
        setLastPanPoint({ x: evt.clientX, y: evt.clientY });
      }
    });

    canvas.on('mouse:up', () => {
      setIsPanning(false);
      canvas.selection = true;
    });


    // Object modified - sync back to store
    canvas.on('object:modified', (e) => {
      const obj = e.target;
      if (!obj) return;
      
      const data = obj.get('data') as { id?: string } | undefined;
      const nodeId = data?.id;
      if (!nodeId) return;
      
      updateNode(nodeId, {
        x: obj.left || 0,
        y: obj.top || 0,
        width: (obj.width || 0) * (obj.scaleX || 1),
        height: (obj.height || 0) * (obj.scaleY || 1),
        rotation: obj.angle || 0,
      });
    });

    // Selection handling - behavior depends on canvas mode
    canvas.on('selection:created', (e) => {
      if (e.selected && e.selected.length > 0) {
        const ids = e.selected
          .map((obj: any) => {
            const data = obj.get('data') as { id?: string } | undefined;
            return data?.id;
          })
          .filter(Boolean) as string[];
        if (ids.length > 0) {
          if (canvasMode === 'chat') {
            // In chat mode, only allow single selection
            if (ids.length === 1) {
              selectNode(ids[0], false);
              
              // Show mini chat window for single image selection in chat mode
              const selectedNode = nodes.find(node => node.id === ids[0]);
              if (selectedNode && selectedNode.type === 'image' && selectedNode.assetId) {
                const activeObject = canvas.getActiveObject();
                if (activeObject) {
                  const canvasRect = canvas.getElement().getBoundingClientRect();
                  const objectCoords = activeObject.getCoords();
                  
                  // Calculate center of the selected object
                  const centerX = (objectCoords[0].x + objectCoords[2].x) / 2;
                  const centerY = (objectCoords[0].y + objectCoords[2].y) / 2;
                  
                  // Convert canvas coordinates to screen coordinates
                  const screenX = centerX + canvasRect.left;
                  const screenY = centerY + canvasRect.top;
                  
                  console.log('🎯 Opening mini chat for image:', selectedNode.id);
                  console.log('📍 Chat position:', { screenX, screenY, centerX, centerY });
                  
                  setSelectedImageForChat({
                    id: selectedNode.id,
                    url: selectedNode.url,
                    assetId: selectedNode.assetId,
                    name: 'Selected Image'
                  });
                  setChatPosition({
                    x: screenX,
                    y: screenY
                  });
                  
                  // Add a small delay to ensure the selection is visible
                  setTimeout(() => {
                    setMiniChatOpen(true);
                  }, 100);
                }
              }
            } else {
              // Clear selection if multiple items selected in chat mode
              canvas.discardActiveObject();
              clearSelection();
              setMiniChatOpen(false);
              setSelectedImageForChat(null);
            }
          } else if (canvasMode === 'dragdrop') {
            // In dragdrop mode, allow single selection for dragging
            if (ids.length === 1) {
              selectNode(ids[0], false);
              const selectedNode = nodes.find(node => node.id === ids[0]);
              if (selectedNode && selectedNode.type === 'image' && selectedNode.assetId) {
                setDraggedImage({
                  id: selectedNode.id,
                  url: selectedNode.url,
                  assetId: selectedNode.assetId,
                  name: 'Selected Image'
                });
              }
            } else {
              // Clear selection if multiple items selected in dragdrop mode
              canvas.discardActiveObject();
              clearSelection();
              setDraggedImage(null);
            }
          } else {
            // In select mode, allow multiple selections
            if (ids.length > 1) {
              selectNodes(ids);
            } else {
              selectNode(ids[0], false);
            }
            // Close mini chat when switching to select mode
            setMiniChatOpen(false);
            setSelectedImageForChat(null);
          }
        }
      }
    });

    canvas.on('selection:updated', (e) => {
      if (e.selected && e.selected.length > 0) {
        const ids = e.selected
          .map((obj: any) => {
            const data = obj.get('data') as { id?: string } | undefined;
            return data?.id;
          })
          .filter(Boolean) as string[];
        if (ids.length > 0) {
          if (canvasMode === 'chat') {
            // In chat mode, only allow single selection
            if (ids.length === 1) {
              selectNode(ids[0], false);
            } else {
              // Clear selection if multiple items selected in chat mode
              canvas.discardActiveObject();
              clearSelection();
            }
          } else {
            // In select mode, allow multiple selections
            if (ids.length > 1) {
              selectNodes(ids);
            } else {
              selectNode(ids[0], false);
            }
          }
        }
      }
    });

    canvas.on('selection:cleared', () => {
      clearSelection();
      setMiniChatOpen(false);
      setSelectedImageForChat(null);
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
      objectMapRef.current.clear();
    };
  }, []);

  // Handle canvas mode changes
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    if (canvasMode === 'chat') {
      // In chat mode, clear any existing multi-selection
      if (canvas.getActiveObject() && canvas.getActiveObject().type === 'activeSelection') {
        canvas.discardActiveObject();
        clearSelection();
      }
    } else if (canvasMode === 'dragdrop') {
      // In dragdrop mode, clear any existing multi-selection
      if (canvas.getActiveObject() && canvas.getActiveObject().type === 'activeSelection') {
        canvas.discardActiveObject();
        clearSelection();
      }
      
      // Drag & drop mode activated - wait for user to drag images
    }
  }, [canvasMode, clearSelection]);

  // Handle automatic generation when 2 images are selected in drag & drop mode
  useEffect(() => {
    if (canvasMode === 'dragdrop' && selectedNodeIds.length === 2) {
      const selectedImageNodes = nodes.filter(node => 
        selectedNodeIds.includes(node.id) && 
        node.type === 'image' && 
        node.assetId
      );
      
      if (selectedImageNodes.length === 2) {
        console.log('🎯 2 images selected in drag & drop mode, generating variations...');
        const [image1, image2] = selectedImageNodes;
        handleDragDropGeneration(image1, image2);
      }
    }
  }, [canvasMode, selectedNodeIds, nodes]);

  // Drag and drop functionality (simplified - just for visual feedback)
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas || canvasMode !== 'dragdrop') return;

    // Allow normal selection in drag & drop mode
    const handleSelection = (e: any) => {
      if (e.selected && e.selected.length > 0) {
        const selectedIds = e.selected.map((obj: any) => obj.data?.id).filter(Boolean);
        selectNodes(selectedIds);
      } else if (e.deselected && e.deselected.length > 0) {
        // Handle deselection if needed
        const remainingIds = selectedNodeIds.filter(id => 
          !e.deselected.some((obj: any) => obj.data?.id === id)
        );
        selectNodes(remainingIds);
      }
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', () => clearSelection());

    return () => {
      canvas.off('selection:created', handleSelection);
      canvas.off('selection:updated', handleSelection);
      canvas.off('selection:cleared', () => clearSelection());
    };
  }, [canvasMode, selectedNodeIds, selectNodes, clearSelection]);

  // Removed auto-generation function - drag & drop should only generate when user actually drags images

  // Handle drag and drop generation - directly use the 2 images as references
  const handleDragDropGeneration = async (sourceImage: any, targetImage: any) => {
    try {
      setGenerating(true, 'Generating 5 variations using the 2 selected images...');
      const toastId = toast.loading('Drag & Drop: Generating 5 variations...', {
        description: `Using ${sourceImage.name} and ${targetImage.name} as references`
      });

      // Generate 5 variations using Gemini-analyzed prompts
      // The backend will use Gemini to analyze the images and generate proper prompts
      const variations = [
        `Create a beautiful merged composition using the two reference images`,
        `Generate a meaningful artistic fusion of the two provided images`,
        `Combine the two images into a stunning visual piece`,
        `Merge the two reference images into a cohesive artwork`,
        `Blend the two images into a harmonious composition`
      ];

      const generatedAssets = [];
      for (let i = 0; i < variations.length; i++) {
        try {
          setGenerating(true, `Generating variation ${i + 1}/5...`);
          
          const response = await apiClient.generateFromMultipleImages({
            assetIds: [sourceImage.assetId, targetImage.assetId],
            prompt: variations[i],
            width: 1024,
            height: 1024,
            model: 'nano-banana', // Use Gemini for better image-to-image merging
          });

          if (response.success && response.data) {
            generatedAssets.push(response.data);
            addGeneratedAssetId(response.data.id);
          }
        } catch (error) {
          console.error(`Error generating variation ${i + 1}:`, error);
        }
      }

      if (generatedAssets.length > 0) {
        // Add generated images to canvas in a row
        const spacing = 120;
        const startX = 100;
        const startY = 100;

        for (let i = 0; i < generatedAssets.length; i++) {
          const asset = generatedAssets[i];
          addNode({
            type: 'image',
            assetId: asset.id,
            url: apiClient.getAssetUrl(asset),
            x: startX + (i * spacing),
            y: startY,
            width: 100,
            height: 100,
            rotation: 0,
            opacity: 1,
            locked: false,
          });
        }

        toast.success(`Drag & Drop: Generated ${generatedAssets.length} variations!`, {
          id: toastId,
          description: `All variations use your 2 selected images as references`
        });
      } else {
        throw new Error('No variations were generated');
      }
    } catch (error: any) {
      console.error('Drag & Drop generation error:', error);
      toast.error('Failed to generate variations', {
        description: error.message || 'Please try again'
      });
    } finally {
      setGenerating(false);
    }
  };

  // Sync nodes with fabric canvas - only update what changed
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) {
      console.log('Canvas not ready yet');
      return;
    }

    
    try {
      const objectMap = objectMapRef.current;
      const existingNodeIds = new Set(nodes.map(n => n.id));
      
      // Remove objects that no longer exist in nodes
      Array.from(objectMap.entries()).forEach(([nodeId, fabricObj]) => {
        if (!existingNodeIds.has(nodeId)) {
          try {
            canvas.remove(fabricObj);
            objectMap.delete(nodeId);
          } catch (error) {
            console.error('Error removing fabric object:', error);
          }
        }
      });

      // Add or update nodes
      nodes.forEach(node => {
        try {
          const existingObj = objectMap.get(node.id);
          
          if (existingObj) {
            // Check if position/size actually changed
            const currentLeft = existingObj.get('left') || 0;
            const currentTop = existingObj.get('top') || 0;
            const currentWidth = (existingObj.width || 1) * (existingObj.scaleX || 1);
            const currentHeight = (existingObj.height || 1) * (existingObj.scaleY || 1);
            const currentSrc = existingObj.get('src') || '';
            
            const positionChanged = Math.abs(currentLeft - node.x) > 0.1 || Math.abs(currentTop - node.y) > 0.1;
            const sizeChanged = Math.abs(currentWidth - node.width) > 0.1 || Math.abs(currentHeight - node.height) > 0.1;
            const rotationChanged = Math.abs((existingObj.angle || 0) - node.rotation) > 0.1;
            const opacityChanged = Math.abs((existingObj.opacity || 1) - node.opacity) > 0.01;
            const urlChanged = currentSrc !== node.url;
            
            
            // Update if anything changed
            if (positionChanged || sizeChanged || rotationChanged || opacityChanged || urlChanged) {
              const updates: any = {
                left: node.x,
                top: node.y,
                scaleX: node.width / (existingObj.width || 1),
                scaleY: node.height / (existingObj.height || 1),
                angle: node.rotation,
                opacity: node.opacity,
                selectable: !node.locked,
              };

              // If URL changed, update the image source
              if (urlChanged && node.type === 'image') {
                updates.src = node.url;
              }

              existingObj.set(updates);
              existingObj.setCoords();
              
              // If URL changed, we need to reload the image
              if (urlChanged && node.type === 'image') {
                // Validate URL before attempting to reload
                if (!node.url || node.url === 'undefined' || node.url === 'null') {
                  console.error('Invalid image URL for reload:', node.url);
                  return;
                }
                
                (existingObj as any).setSrc(node.url, () => {
                  canvas.renderAll();
                });
              }
              
              // If this object is part of an active selection, update the selection
              const activeSelection = canvas.getActiveObject();
              if (activeSelection && activeSelection.type === 'activeSelection') {
                (activeSelection as any).setCoords();
              }
              
              // Ensure canvas renders after any update
              canvas.renderAll();
            }
          } else {
            // Add new object
            if (node.type === 'image' && node.url) {
              console.log('🖼️ Loading new image:', node.url, 'for node:', node.id);
              // Validate URL before attempting to load
              if (!node.url || node.url === 'undefined' || node.url === 'null') {
                console.error('Invalid image URL:', node.url);
                return;
              }

              loadImageWithCORS(node.url).then((img) => {
                if (!img || !img.width || !img.height) {
                  console.error('Image failed to load or has invalid dimensions:', node.url);
                  return;
                }
                
                console.log('✅ Image loaded successfully:', node.url, 'dimensions:', img.width, 'x', img.height);
                
                img.set({
                  left: node.x,
                  top: node.y,
                  scaleX: node.width / img.width,
                  scaleY: node.height / img.height,
                  angle: node.rotation,
                  opacity: node.opacity,
                  selectable: !node.locked,
                  data: { id: node.id },
                });
                
                canvas.add(img);
                objectMap.set(node.id, img);
                canvas.renderAll();
                console.log('✅ Added new image to canvas:', node.id, 'at position:', node.x, node.y);
              }).catch((error) => {
                console.error('Error loading image:', error, node.url);
                // Don't show toast for every failed image to avoid spam
                if (error.name !== 'NotFoundError') {
                  toast.error('Failed to load image');
                }
              });
            }
          }
        } catch (error) {
          console.error('Error processing node:', node.id, error);
        }
      });

      // Always render to show alignment changes
      canvas.renderAll();
    } catch (error) {
      console.error('Error in canvas sync useEffect:', error);
    }
  }, [nodes]);

  // Handle drag and drop from library OR files from PC
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    // Get drop position relative to canvas viewport
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const zoom = canvas.getZoom();
    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    
    // Calculate position accounting for zoom and pan
    const dropX = (e.clientX - rect.left - vpt[4]) / zoom;
    const dropY = (e.clientY - rect.top - vpt[5]) / zoom;

    try {
      // Check if dropping files from PC
      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        // Handle multiple file uploads
        toast.loading(`Uploading ${files.length} file${files.length > 1 ? 's' : ''}...`);
        
        let uploadedCount = 0;
        const spacing = 50; // Space between images
        
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error(`${file.name} is not a valid image or video file`);
            continue;
          }

          try {
            // Upload to server
            const uploadedAsset = await uploadAsset(file, {
              name: file.name,
              tags: [],
            });

            if (uploadedAsset) {
              // Add to canvas at drop position (with offset for multiple files)
              const fullUrl = apiClient.getAssetUrl(uploadedAsset);
              // Use original asset dimensions without scaling
              const width = uploadedAsset.width;
              const height = uploadedAsset.height;

              addNode({
                type: 'image',
                assetId: uploadedAsset.id,
                url: fullUrl,
                x: dropX + (i * spacing) - width / 2,
                y: dropY - height / 2,
                width,
                height,
                rotation: 0,
                opacity: 1,
                locked: false,
              });
              
              uploadedCount++;
            }
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
          }
        }
        
        // Reload assets to update library
        await loadAssets();
        
        toast.success(`${uploadedCount} file${uploadedCount > 1 ? 's' : ''} uploaded and added to canvas!`);
        return;
      }

      // Handle dropping from library
      const assetData = e.dataTransfer.getData('application/json');
      if (!assetData) return;
      
      const asset: Asset = JSON.parse(assetData);

      // Calculate appropriate size (max 400px, maintain aspect ratio)
      const maxSize = 400;
      let width = asset.width;
      let height = asset.height;
      
      if (width > maxSize || height > maxSize) {
        const ratio = Math.min(maxSize / width, maxSize / height);
        width *= ratio;
        height *= ratio;
      }

      // Get full URL from API client
      const fullUrl = asset.url.startsWith('http') 
        ? asset.url 
        : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${asset.url}`;

      addNode({
        type: asset.type,
        assetId: asset.id,
        url: fullUrl,
        x: dropX - width / 2,
        y: dropY - height / 2,
        width,
        height,
        rotation: 0,
        opacity: 1,
        locked: false,
      });

      toast.success('Added to canvas');
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Failed to add item to canvas');
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full z-10 ${gridVisible ? 'grid-pattern' : 'bg-canvas'} ${isPanning ? 'cursor-grabbing' : ''} ${isDraggingOver ? 'ring-4 ring-primary ring-inset' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onContextMenu={handleContextMenu}
      onClick={() => contextMenu?.open && closeContextMenu()}
    >
      {/* Canvas Mode Selector */}
      <CanvasModeSelector />
      
      {error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[90%]">
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-xl shadow-sm flex items-start gap-3">
            <div className="flex-1">
              <div className="font-medium">Generation error</div>
              <div className="text-sm opacity-90">{error}</div>
              <div className="text-xs mt-2 opacity-70">
                Tip: For multi-image merge, use two images with similar heights (e.g., both around 1080px). Suggested canvas sizes: 1024x1024, 1280x720, 1080x1080, 1920x1080.
              </div>
            </div>
            <button onClick={clearError} className="text-xs underline">Dismiss</button>
          </div>
        </div>
      )}

      {/* Generation Loading Indicator */}
      {isGenerating && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[90%]">
          <div className="bg-primary/10 border border-primary text-primary px-4 py-3 rounded-xl shadow-sm flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="flex-1">
              <div className="font-medium">Generating image...</div>
              <div className="text-sm opacity-90">{generationStatus || 'Please wait while AI creates your image'}</div>
            </div>
          </div>
        </div>
      )}


      {/* Grid background - SVG fallback */}
      {gridVisible && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <pattern id="canvas-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(59, 130, 246, 0.35)" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#canvas-grid)" />
          </svg>
        </div>
      )}
      
      <canvas ref={canvasRef} className="relative z-10" />
      
      {/* Drop zone overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-primary/10 backdrop-blur-sm flex items-center justify-center pointer-events-none z-40">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary mb-2">Drop images here</p>
            <p className="text-sm text-muted-foreground">Multiple files supported</p>
          </div>
        </div>
      )}
      
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center max-w-md">
            <p className="text-lg text-muted-foreground mb-3">Welcome to your Canvas!</p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• <strong>Drag & drop</strong> images from Library to canvas</p>
              <p>• <strong>Click & drag</strong> images to move them</p>
              <p>• <strong>Corner handles</strong> to resize</p>
              <p>• <strong>Rotate handle</strong> (top) to rotate</p>
              <p>• <strong>Shift + drag</strong> to pan the canvas</p>
              <p>• <strong>Scroll</strong> to zoom in/out</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Context Menu */}
      {contextMenu?.open && (
        <div
          className="absolute z-50 min-w-[220px] bg-card border border-border rounded-md shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={undo} disabled={historyIndex <= 0}>Undo</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={redo} disabled={historyIndex >= history.length - 1}>Redo</button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleDuplicate} disabled={selectedNodeIds.length === 0}>Duplicate</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleDelete} disabled={selectedNodeIds.length === 0}>Delete</button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleAlignRow} disabled={selectedNodeIds.length < 2}>Align Row</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleAlignColumn} disabled={selectedNodeIds.length < 2}>Align Column</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleAlignGrid} disabled={selectedNodeIds.length < 2}>Arrange Grid</button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleZoomOut}>Zoom Out</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleZoomReset}>Reset Zoom</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleZoomIn}>Zoom In</button>
          <div className="h-px bg-border my-1" />
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleToggleGrid}>{gridVisible ? 'Hide Grid' : 'Show Grid'}</button>
          <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleExport}>Export...</button>
          {selectedNodeIds.length === 1 && nodes.find(n => n.id === selectedNodeIds[0])?.type === 'image' && (
            <>
              <div className="h-px bg-border my-1" />
              <button className="w-full text-left px-3 py-2 hover:bg-accent" onClick={handleOpenImageResizer}>Resize Image</button>
            </>
          )}
        </div>
      )}

      {/* Export Dialog */}
      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={closeExportDialog}
        onExport={handleExportCanvas}
      />

      {/* Image Resizer Dialog */}
      {imageResizerOpen && selectedNodeIds.length === 1 && (
        <ImageResizer
          open={imageResizerOpen}
          onOpenChange={setImageResizerOpen}
          selectedNodeId={selectedNodeIds[0]}
        />
      )}

      {/* Chat Mode Indicator */}
      {canvasMode === 'chat' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          💬 Chat Mode - Click on an image to start chatting
        </div>
      )}

      {/* Drag & Drop Mode Indicator */}
      {canvasMode === 'dragdrop' && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40 bg-blue-600/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          🎯 Auto-Generate Mode - Generating 5 creative images automatically
        </div>
      )}

      {/* Drag & Drop Mode Indicator */}
      {canvasMode === 'dragdrop' && !isGenerating && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 bg-blue-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          🎯 Drag & Drop Mode: Select 2 images to generate variations automatically
          {selectedNodeIds.length > 0 && (
            <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
              {selectedNodeIds.length}/2 selected
            </span>
          )}
        </div>
      )}

      {/* Generation Progress */}
      {canvasMode === 'dragdrop' && isGenerating && (
        <div className="fixed top-32 left-1/2 transform -translate-x-1/2 z-40 bg-green-500/90 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
          ✨ Generating variations using your selected images...
        </div>
      )}

      {/* Mini Chat Window */}
      {miniChatOpen && selectedImageForChat && (
        <MiniChatWindow
          isOpen={miniChatOpen}
          onClose={() => {
            setMiniChatOpen(false);
            setSelectedImageForChat(null);
          }}
          selectedImage={selectedImageForChat}
          position={chatPosition}
        />
      )}
    </div>
  );
};