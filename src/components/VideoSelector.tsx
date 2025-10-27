import { Play, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVideoStore } from '@/store/videoStore';
import { toast } from 'sonner';

export const VideoSelector = () => {
  const { nodes, selectedNodeIds, deleteNode } = useVideoStore();

  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
  const selectedVideoNodes = selectedNodes.filter(node => node.type === 'video');

  const handleDeleteSelected = () => {
    selectedVideoNodes.forEach(node => {
      deleteNode(node.id);
    });
    toast.success(`Deleted ${selectedVideoNodes.length} video(s)`);
  };

  if (selectedVideoNodes.length === 0) {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
        <div className="bg-card border border-border rounded-lg shadow-lg p-4">
          <div className="text-center text-muted-foreground">
            <Play className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Select videos to enhance with AI</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-card border border-border rounded-lg shadow-lg p-4">
        <form className="flex items-center gap-3">
          {/* Selected Video Thumbnails */}
          {selectedVideoNodes.length > 0 && (
            <div className="flex gap-2 items-center max-w-xs overflow-x-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
              {selectedVideoNodes.map((node, index) => (
                <div
                  key={node.id}
                  className="w-16 h-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border-2 border-primary shadow-sm relative group"
                  title={`Video ${index + 1}: ${node.videoUrl.split('/').pop()}`}
                >
                  <video
                    src={node.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    poster={node.videoUrl}
                  />
                  {/* Video number badge */}
                  <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Prompt Input */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Describe enhancements like transitions, effects, or style changes"
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Play className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteSelected}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button type="submit" size="sm">
              Enhance
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
