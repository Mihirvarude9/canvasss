import { useState, useEffect } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Lock, Unlock, Ratio } from 'lucide-react';

interface ImageResizerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNodeId: string;
}

export const ImageResizer = ({ open, onOpenChange, selectedNodeId }: ImageResizerProps) => {
  const { nodes, updateNode } = useCanvasStore();
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [aspectRatioLocked, setAspectRatioLocked] = useState(true);
  const [originalAspectRatio, setOriginalAspectRatio] = useState(1);

  const selectedNode = nodes.find(n => n.id === selectedNodeId);

  useEffect(() => {
    if (selectedNode) {
      setWidth(selectedNode.width);
      setHeight(selectedNode.height);
      setOriginalAspectRatio(selectedNode.width / selectedNode.height);
    }
  }, [selectedNode]);

  const handleWidthChange = (newWidth: number) => {
    setWidth(newWidth);
    if (aspectRatioLocked) {
      setHeight(newWidth / originalAspectRatio);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setHeight(newHeight);
    if (aspectRatioLocked) {
      setWidth(newHeight * originalAspectRatio);
    }
  };

  const handleApply = () => {
    if (selectedNode && width > 0 && height > 0) {
      updateNode(selectedNodeId, {
        width,
        height,
      });
      onOpenChange(false);
    }
  };

  const handleReset = () => {
    if (selectedNode) {
      setWidth(selectedNode.width);
      setHeight(selectedNode.height);
    }
  };

  const toggleAspectRatio = () => {
    setAspectRatioLocked(!aspectRatioLocked);
  };

  if (!selectedNode) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Resize Image</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={Math.round(width)}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Height (px)</Label>
              <div className="flex gap-2">
                <Input
                  id="height"
                  type="number"
                  value={Math.round(height)}
                  onChange={(e) => handleHeightChange(Number(e.target.value))}
                  min="1"
                  step="1"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleAspectRatio}
                  title={aspectRatioLocked ? "Unlock aspect ratio" : "Lock aspect ratio"}
                >
                  {aspectRatioLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Ratio className="h-4 w-4" />
            <span>
              Aspect ratio: {aspectRatioLocked ? 'Locked' : 'Unlocked'} 
              {aspectRatioLocked && ` (${(width / height).toFixed(2)})`}
            </span>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Original: {Math.round(selectedNode.width)} × {Math.round(selectedNode.height)} px
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleApply} disabled={width <= 0 || height <= 0}>
            Apply
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
