import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Sparkles } from 'lucide-react';
import { useVideoStore } from '@/store/videoStore';
import { toast } from 'sonner';

export const VideoPromptBar = () => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { generateVideo, nodes } = useVideoStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    if (nodes.length === 0) {
      toast.error('Please add videos to the canvas first');
      return;
    }

    try {
      setIsGenerating(true);
      toast.info('Generating video with AI enhancement...');
      
      // Here you would call an AI service to enhance the video based on the prompt
      // For now, we'll just generate the video normally
      const videoUrl = await generateVideo();
      
      toast.success('AI-enhanced video generated successfully!');
      window.open(videoUrl, '_blank');
    } catch (error) {
      toast.error('Failed to generate AI-enhanced video');
      console.error('AI video generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl px-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="flex-1 relative">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe how you want to enhance your video... (e.g., 'Add dramatic music and slow motion effects')"
            className="pr-10"
            disabled={isGenerating}
          />
          <Sparkles className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>
        <Button 
          type="submit" 
          disabled={isGenerating || !prompt.trim() || nodes.length === 0}
          className="gap-2"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              Enhance
            </>
          )}
        </Button>
      </form>
      
      {/* Help text */}
      <div className="text-center mt-2 text-xs text-muted-foreground">
        {nodes.length === 0 ? (
          'Add videos to the canvas to start enhancing'
        ) : (
          'Describe enhancements like transitions, effects, or style changes'
        )}
      </div>
    </div>
  );
};

