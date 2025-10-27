import { 
  Undo2, 
  Redo2, 
  Maximize2, 
  Download,
  Copy,
  Trash2,
  ZoomIn,
  ZoomOut,
  AlignHorizontalDistributeCenter,
  AlignVerticalDistributeCenter,
  LayoutGrid,
  Grid3X3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FrameSizeSelector, type FrameSize } from '@/components/FrameSizeSelector';
import { useCanvasStore } from '@/store/canvasStore';
import { toast } from 'sonner';

interface ToolbarProps {
  frameSize: FrameSize;
  setFrameSize: (frameSize: FrameSize) => void;
}

export const Toolbar = ({ frameSize, setFrameSize }: ToolbarProps) => {
  const {
    snapEnabled,
    toggleSnap,
    gridVisible,
    toggleGrid,
    zoom,
    setZoom,
    history,
    historyIndex,
    undo,
    redo,
    duplicateSelected,
    deleteSelectedNodes,
    selectedNodeIds,
    alignNodes,
    openExportDialog,
  } = useCanvasStore();

  const handleZoomIn = () => {
    setZoom(Math.min(zoom * 1.2, 8));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom / 1.2, 0.1));
  };

  const handleZoomReset = () => {
    setZoom(1);
  };

  return (
    <div className="absolute top-4 left-4 z-40">
      <div className="bg-card border border-border rounded-lg shadow-lg px-2 py-2 flex items-center gap-1">
        {/* Undo/Redo */}
        <Button
          variant="ghost"
          size="icon"
          onClick={undo}
          disabled={historyIndex <= 0}
          title="Undo (Cmd+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Selection actions */}
        <Button
          variant="ghost"
          size="icon"
          onClick={duplicateSelected}
          disabled={selectedNodeIds.length === 0}
          title="Duplicate (Cmd+D)"
        >
          <Copy className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={deleteSelectedNodes}
          disabled={selectedNodeIds.length === 0}
          title="Delete (Del)"
        >
          <Trash2 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Alignment */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            alignNodes('row');
            toast.success('Aligned in a row');
          }}
          disabled={selectedNodeIds.length < 2}
          title="Align in Row"
        >
          <AlignHorizontalDistributeCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            alignNodes('column');
            toast.success('Aligned in a column');
          }}
          disabled={selectedNodeIds.length < 2}
          title="Align in Column"
        >
          <AlignVerticalDistributeCenter className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            alignNodes('grid');
            toast.success('Arranged in a grid');
          }}
          disabled={selectedNodeIds.length < 2}
          title="Arrange in Grid"
        >
          <LayoutGrid className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* View controls */}
        <Button
          variant={gridVisible ? "default" : "ghost"}
          size="icon"
          onClick={toggleGrid}
          title="Toggle Grid (H)"
        >
          <Grid3X3 className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Zoom */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomOut}
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        <button
          onClick={handleZoomReset}
          className="px-3 py-1 text-sm font-medium hover:bg-sidebar-hover rounded min-w-[60px]"
          title="Reset Zoom (Cmd+0)"
        >
          {Math.round(zoom * 100)}%
        </button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleZoomIn}
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Export */}
        <Button
          variant="ghost"
          size="icon"
          onClick={openExportDialog}
          title="Export Canvas"
        >
          <Download className="w-4 h-4" />
        </Button>

        <Separator orientation="vertical" className="h-6 mx-1" />

        {/* Frame Size Selector */}
        <FrameSizeSelector value={frameSize} onChange={setFrameSize} />
      </div>
    </div>
  );
};