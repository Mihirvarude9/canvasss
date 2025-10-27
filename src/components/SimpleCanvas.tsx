import { useEffect, useRef } from 'react';
import { Canvas as FabricCanvas, Image as FabricImage, Point } from 'fabric';
import { useCanvasStore } from '@/store/canvasStore';

export const SimpleCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvasRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const objectMapRef = useRef<Map<string, any>>(new Map());
  
  const { nodes, zoom, setZoom } = useCanvasStore();

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    console.log('Initializing canvas with touchpad zoom...');
    
    const container = containerRef.current;
    const canvas = new FabricCanvas(canvasRef.current, {
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#ffffff',
      selection: true,
    });
    
    fabricCanvasRef.current = canvas;
    console.log('Canvas initialized successfully');

    // Handle window resize
    const handleResize = () => {
      canvas.setWidth(container.clientWidth);
      canvas.setHeight(container.clientHeight);
      canvas.renderAll();
    };
    
    window.addEventListener('resize', handleResize);

    // Touchpad zoom - zoom to cursor position
    canvas.on('mouse:wheel', (opt) => {
      const evt = opt.e as WheelEvent;
      const delta = evt.deltaY;
      let currentZoom = canvas.getZoom();
      
      // Zoom in/out based on scroll direction
      if (delta > 0) {
        currentZoom *= 0.9; // Zoom out
      } else {
        currentZoom *= 1.1; // Zoom in
      }
      
      // Limit zoom range
      if (currentZoom > 5) currentZoom = 5;
      if (currentZoom < 0.1) currentZoom = 0.1;
      
      // Zoom to cursor position
      const point = new Point(opt.pointer!.x, opt.pointer!.y);
      canvas.zoomToPoint(point, currentZoom);
      setZoom(currentZoom);
      
      evt.preventDefault();
      evt.stopPropagation();
    });

    // Pan on middle mouse or trackpad drag
    let isPanning = false;
    let lastPanPoint = { x: 0, y: 0 };

    canvas.on('mouse:down', (opt) => {
      const evt = opt.e as MouseEvent;
      if (evt.button === 1 || evt.button === 2) { // Middle or right mouse button
        isPanning = true;
        lastPanPoint = { x: evt.clientX, y: evt.clientY };
        canvas.selection = false;
        canvas.setCursor('grabbing');
      }
    });

    canvas.on('mouse:move', (opt) => {
      if (isPanning) {
        const evt = opt.e as MouseEvent;
        const deltaX = evt.clientX - lastPanPoint.x;
        const deltaY = evt.clientY - lastPanPoint.y;
        
        canvas.relativePan({ x: deltaX, y: deltaY });
        lastPanPoint = { x: evt.clientX, y: evt.clientY };
      }
    });

    canvas.on('mouse:up', () => {
      isPanning = false;
      canvas.selection = true;
      canvas.setCursor('default');
    });

    return () => {
      console.log('Disposing canvas...');
      window.removeEventListener('resize', handleResize);
      canvas.dispose();
    };
  }, [setZoom]);

  // Sync nodes with canvas
  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    console.log('Syncing nodes with canvas:', nodes.length);

    const objectMap = objectMapRef.current;
    const existingNodeIds = new Set(nodes.map(n => n.id));
    
    // Remove objects that no longer exist
    Array.from(objectMap.entries()).forEach(([nodeId, fabricObj]) => {
      if (!existingNodeIds.has(nodeId)) {
        canvas.remove(fabricObj);
        objectMap.delete(nodeId);
      }
    });

    // Add or update nodes
    nodes.forEach(node => {
      const existingObj = objectMap.get(node.id);
      
      if (existingObj) {
        // Update existing object
        existingObj.set({
          left: node.x,
          top: node.y,
          scaleX: node.width / (existingObj.width || 1),
          scaleY: node.height / (existingObj.height || 1),
          angle: node.rotation,
          opacity: node.opacity,
        });
        existingObj.setCoords();
      } else {
        // Add new object
        if (node.type === 'image' && node.url) {
          console.log('Loading image:', node.url);
          FabricImage.fromURL(node.url, {
            crossOrigin: 'anonymous',
          }).then((img) => {
            if (!img || !img.width || !img.height) {
              console.error('Image failed to load:', node.url);
              return;
            }
            
            img.set({
              left: node.x,
              top: node.y,
              scaleX: node.width / img.width,
              scaleY: node.height / img.height,
              angle: node.rotation,
              opacity: node.opacity,
              selectable: true,
              data: { id: node.id },
            });
            
            canvas.add(img);
            objectMap.set(node.id, img);
            canvas.renderAll();
            console.log('✅ Image added to canvas:', node.id);
          }).catch((error) => {
            console.error('Error loading image:', error, node.url);
          });
        }
      }
    });

    canvas.renderAll();
  }, [nodes]);

  return (
    <div 
      ref={containerRef}
      className="relative h-full w-full bg-background"
    >
      <canvas ref={canvasRef} />
      <div className="absolute top-4 left-4 bg-white/90 px-2 py-1 rounded text-sm">
        Canvas - Nodes: {nodes.length} | Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
};
