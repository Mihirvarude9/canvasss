import { useEffect, useState } from 'react';
import { X, Lock, Unlock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useCanvasStore } from '@/store/canvasStore';

export const Inspector = () => {
  const { selectedNodeIds, nodes, updateNode, clearSelection } = useCanvasStore();
  
  const selectedNode = selectedNodeIds.length === 1 
    ? nodes.find(n => n.id === selectedNodeIds[0]) 
    : null;

  const [localValues, setLocalValues] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    rotation: 0,
    opacity: 100,
  });

  useEffect(() => {
    if (selectedNode) {
      setLocalValues({
        x: Math.round(selectedNode.x),
        y: Math.round(selectedNode.y),
        width: Math.round(selectedNode.width),
        height: Math.round(selectedNode.height),
        rotation: Math.round(selectedNode.rotation),
        opacity: Math.round(selectedNode.opacity * 100),
      });
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="w-80 h-full border-l border-sidebar-border bg-sidebar flex items-center justify-center z-20">
        <div className="text-center px-6">
          <p className="text-sm text-muted-foreground">
            Select an object to view properties
          </p>
        </div>
      </div>
    );
  }

  const handleUpdate = (key: keyof typeof localValues, value: number) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));
    
    const mappedKey = key === 'opacity' ? 'opacity' : key;
    const mappedValue = key === 'opacity' ? value / 100 : value;
    
    updateNode(selectedNode.id, { [mappedKey]: mappedValue });
  };

  return (
    <div className="w-80 h-full border-l border-sidebar-border bg-sidebar flex flex-col z-20">
      <div className="p-4 border-b border-sidebar-border flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inspector</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={clearSelection}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Selected image size (read-only) */}
        {selectedNode.type === 'image' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Size</Label>
            <div className="text-sm text-muted-foreground">
              {Math.round(selectedNode.width)} × {Math.round(selectedNode.height)} px
            </div>
          </div>
        )}

        {/* Rotation */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Rotation</Label>
          <div className="flex gap-3 items-center">
            <Slider
              value={[localValues.rotation]}
              onValueChange={([value]) => handleUpdate('rotation', value)}
              min={0}
              max={360}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={localValues.rotation}
              onChange={(e) => handleUpdate('rotation', parseFloat(e.target.value) || 0)}
              className="h-9 w-20"
            />
          </div>
        </div>

        {/* Opacity */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Opacity</Label>
          <div className="flex gap-3 items-center">
            <Slider
              value={[localValues.opacity]}
              onValueChange={([value]) => handleUpdate('opacity', value)}
              min={0}
              max={100}
              step={1}
              className="flex-1"
            />
            <Input
              type="number"
              value={localValues.opacity}
              onChange={(e) => handleUpdate('opacity', parseFloat(e.target.value) || 0)}
              className="h-9 w-20"
            />
          </div>
        </div>

        {/* Text (only when text node) */}
        {selectedNode.type === 'text' && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Text</Label>
            <div className="space-y-2">
              <Input
                value={selectedNode.text || ''}
                onChange={(e) => updateNode(selectedNode.id, { text: e.target.value })}
                placeholder="Add text"
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Font Size</Label>
                  <Input
                    type="number"
                    value={selectedNode.fontSize || 16}
                    onChange={(e) => updateNode(selectedNode.id, { fontSize: parseInt(e.target.value) || 16 })}
                    className="h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1">Weight</Label>
                  <Input
                    value={String(selectedNode.fontWeight || 400)}
                    onChange={(e) => updateNode(selectedNode.id, { fontWeight: e.target.value })}
                    className="h-9"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Color</Label>
                <Input
                  type="color"
                  value={selectedNode.fill || '#111827'}
                  onChange={(e) => updateNode(selectedNode.id, { fill: e.target.value })}
                  className="h-9"
                />
              </div>
            </div>
          </div>
        )}

        {/* Lock */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Lock</Label>
          <Button
            variant="outline"
            onClick={() => updateNode(selectedNode.id, { locked: !selectedNode.locked })}
            className="w-full justify-start"
          >
            {selectedNode.locked ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4 mr-2" />
                Unlocked
              </>
            )}
          </Button>
        </div>

        {/* Type & Asset Info */}
        <div className="space-y-3 pt-3 border-t border-sidebar-border">
          <div className="text-sm">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <p className="mt-1 font-medium capitalize">{selectedNode.type}</p>
          </div>
          {selectedNode.url && (
            <div className="text-sm">
              <Label className="text-xs text-muted-foreground">Asset</Label>
              <div className="mt-2 aspect-video rounded-lg overflow-hidden bg-muted">
                <img
                  src={selectedNode.url}
                  alt="Asset preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};