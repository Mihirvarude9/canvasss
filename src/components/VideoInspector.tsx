import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX,
  Settings, 
  Clock,
  Scissors,
  Zap
} from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';

export const VideoInspector = () => {
  const { nodes, selectedNodeIds, updateNode } = useVideoStore();
  const [activeTab, setActiveTab] = useState('properties');

  const selectedNode = nodes.find(node => selectedNodeIds.includes(node.id));

  const handlePropertyChange = (property: string, value: any) => {
    if (selectedNode) {
      updateNode(selectedNode.id, { [property]: value });
    }
  };

  const handleTimeRangeChange = (startTime: number, endTime: number) => {
    if (selectedNode) {
      updateNode(selectedNode.id, { startTime, endTime });
    }
  };

  if (!selectedNode) {
    return (
      <div className="w-80 h-full border-l border-sidebar-border bg-sidebar flex flex-col">
        <div className="p-4 border-b border-sidebar-border">
          <h2 className="text-lg font-semibold">Video Inspector</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-muted-foreground">
            <Play className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm">Select a video to edit its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 h-full border-l border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-semibold">Video Inspector</h2>
        <p className="text-sm text-muted-foreground truncate">
          {selectedNode.videoUrl.split('/').pop()}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="properties">Properties</TabsTrigger>
            <TabsTrigger value="timing">Timing</TabsTrigger>
            <TabsTrigger value="effects">Effects</TabsTrigger>
          </TabsList>

          <TabsContent value="properties" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Video Properties
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="width">Width</Label>
                  <Input
                    id="width"
                    type="number"
                    value={selectedNode.width}
                    onChange={(e) => handlePropertyChange('width', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="height">Height</Label>
                  <Input
                    id="height"
                    type="number"
                    value={selectedNode.height}
                    onChange={(e) => handlePropertyChange('height', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="x">X Position</Label>
                  <Input
                    id="x"
                    type="number"
                    value={Math.round(selectedNode.x)}
                    onChange={(e) => handlePropertyChange('x', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="y">Y Position</Label>
                  <Input
                    id="y"
                    type="number"
                    value={Math.round(selectedNode.y)}
                    onChange={(e) => handlePropertyChange('y', parseInt(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Volume</Label>
                  <div className="flex items-center gap-2">
                    <VolumeX className="w-4 h-4" />
                    <Slider
                      value={[selectedNode.volume]}
                      onValueChange={([value]) => handlePropertyChange('volume', value)}
                      max={1}
                      step={0.1}
                      className="flex-1"
                    />
                    <Volume2 className="w-4 h-4" />
                    <span className="text-xs w-8">{Math.round(selectedNode.volume * 100)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="muted"
                    checked={selectedNode.muted}
                    onChange={(e) => handlePropertyChange('muted', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="muted">Muted</Label>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timing" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Timing Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Start Time (seconds)</Label>
                  <Slider
                    value={[selectedNode.startTime]}
                    onValueChange={([value]) => handleTimeRangeChange(value, selectedNode.endTime)}
                    max={selectedNode.duration || 60}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {selectedNode.startTime.toFixed(1)}s
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>End Time (seconds)</Label>
                  <Slider
                    value={[selectedNode.endTime]}
                    onValueChange={([value]) => handleTimeRangeChange(selectedNode.startTime, value)}
                    max={selectedNode.duration || 60}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {selectedNode.endTime.toFixed(1)}s
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Duration: {(selectedNode.endTime - selectedNode.startTime).toFixed(1)}s
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="effects" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Video Effects
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Scissors className="w-4 h-4 mr-2" />
                  Add Transition
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Volume2 className="w-4 h-4 mr-2" />
                  Add Audio
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Play className="w-4 h-4 mr-2" />
                  Add Overlay
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
