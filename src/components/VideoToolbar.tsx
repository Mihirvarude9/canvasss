import { Button } from '@/components/ui/button';
import { 
  Undo, 
  Redo, 
  Trash2, 
  Copy, 
  Play, 
  Square,
  Download,
  Settings
} from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';
import { toast } from 'sonner';

export const VideoToolbar = () => {
  const {
    nodes,
    selectedNodeIds,
    deleteNode,
    generateVideo,
    isLoading,
    clearSelection,
  } = useVideoStore();

  const handleDelete = () => {
    if (selectedNodeIds.length === 0) {
      toast.error('No videos selected');
      return;
    }
    
    selectedNodeIds.forEach(id => deleteNode(id));
    clearSelection();
    toast.success(`Deleted ${selectedNodeIds.length} video(s)`);
  };

  const handleGenerate = async () => {
    if (nodes.length === 0) {
      toast.error('No videos added to canvas');
      return;
    }

    try {
      toast.info('Generating video... This may take a few minutes.');
      const videoUrl = await generateVideo();
      toast.success('Video generated successfully!');
      
      // Open the generated video in a new tab
      window.open(videoUrl, '_blank');
    } catch (error) {
      toast.error('Failed to generate video');
      console.error('Video generation error:', error);
    }
  };

  const handlePreview = () => {
    if (nodes.length === 0) {
      toast.error('No videos to preview');
      return;
    }
    toast.info('Preview functionality coming soon');
  };

  const handleExport = () => {
    if (nodes.length === 0) {
      toast.error('No videos to export');
      return;
    }
    toast.info('Export functionality coming soon');
  };

  return (
    <div className="absolute top-4 left-4 z-40 flex items-center gap-2 bg-background/80 backdrop-blur-sm border border-border rounded-lg p-2">
      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" disabled>
          <Undo className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" disabled>
          <Redo className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Selection actions */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete}
          disabled={selectedNodeIds.length === 0}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled={selectedNodeIds.length === 0}
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Video controls */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePreview}
          disabled={nodes.length === 0}
        >
          <Play className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          disabled
        >
          <Square className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-border" />

      {/* Generate/Export */}
      <div className="flex items-center gap-1">
        <Button 
          onClick={handleGenerate}
          disabled={isLoading || nodes.length === 0}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Video
            </>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={handleExport}
          disabled={nodes.length === 0}
        >
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      {/* Status indicator */}
      {nodes.length > 0 && (
        <div className="ml-2 text-sm text-muted-foreground">
          {nodes.length} video{nodes.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
};

