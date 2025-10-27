import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Send, Loader2, MessageSquareText, Sparkles } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { apiClient } from '@/services/api';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface MiniChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
  selectedImage: {
    id: string;
    url: string;
    assetId: string;
    name: string;
  };
  position: { x: number; y: number };
}

export const MiniChatWindow = ({ isOpen, onClose, selectedImage, position }: MiniChatWindowProps) => {
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{
    id: string;
    type: 'user' | 'ai';
    message: string;
    timestamp: Date;
  }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const { addNode, addGeneratedAssetId, setGenerating } = useCanvasStore();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [chatHistory]);

  // Handle window resize to keep chat window in viewport
  useEffect(() => {
    const handleResize = () => {
      // Trigger a re-render to recalculate position
      if (isOpen) {
        // Force position update on resize
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isGenerating) return;

    const userMessage = message.trim();
    setMessage('');
    
    // Add user message to chat history
    const newUserMessage = {
      id: `user-${Date.now()}`,
      type: 'user' as const,
      message: userMessage,
      timestamp: new Date(),
    };
    setChatHistory(prev => [...prev, newUserMessage]);

    setIsGenerating(true);
    setGenerating(true, 'Generating image based on your chat...');

    try {
      // Generate image based on chat message and selected image
      const response = await apiClient.generateFromMultipleImages({
        assetIds: [selectedImage.assetId],
        prompt: userMessage,
        width: 1024,
        height: 1024,
        model: 'nano-banana', // Using Gemini via nano-banana
      });

      if (response.success && response.data) {
        // Add generated image to canvas
        const newImage = {
          type: 'image' as const,
          assetId: response.data.id,
          url: apiClient.getAssetUrl(response.data),
          x: position.x + Math.random() * 200 - 100, // Place near selected image
          y: position.y + Math.random() * 200 - 100,
          width: response.data.width || 200,
          height: response.data.height || 200,
          rotation: 0,
          opacity: 1,
          locked: false,
        };

        addNode(newImage);
        addGeneratedAssetId(response.data.id);

        // Add AI response to chat history
        const aiMessage = {
          id: `ai-${Date.now()}`,
          type: 'ai' as const,
          message: `Generated new image based on: "${userMessage}"`,
          timestamp: new Date(),
        };
        setChatHistory(prev => [...prev, aiMessage]);

        toast.success('New image generated and added to canvas!');
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Chat generation error:', error);
      
      const errorMessage = {
        id: `error-${Date.now()}`,
        type: 'ai' as const,
        message: `Sorry, I couldn't generate an image. ${error.message || 'Please try again.'}`,
        timestamp: new Date(),
      };
      setChatHistory(prev => [...prev, errorMessage]);
      
      toast.error('Failed to generate image', {
        description: error.message || 'Please try again'
      });
    } finally {
      setIsGenerating(false);
      setGenerating(false);
    }
  };

  const handleEnhancePrompt = async () => {
    if (!message.trim()) return;

    try {
      const response = await apiClient.enhancePrompt({
        prompt: message.trim(),
        mode: 'image-edit',
      });

      if (response.success && response.data) {
        setMessage(response.data.enhancedPrompt);
        toast.success('Prompt enhanced!');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance prompt');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed z-50 bg-white rounded-lg shadow-xl border border-border w-80 max-h-96 flex flex-col"
      style={{
        left: `${Math.min(position.x + 20, window.innerWidth - 340)}px`, // Keep within viewport
        top: `${Math.max(position.y - 20, 20)}px`, // Keep within viewport
        maxWidth: 'calc(100vw - 40px)',
        maxHeight: 'calc(100vh - 40px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded overflow-hidden border border-border">
            <img
              src={selectedImage.url}
              alt="Selected"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-medium text-sm">Chat with Image</span>
            <span className="text-xs text-muted-foreground truncate max-w-32">
              {selectedImage.name}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>

      {/* Chat History */}
      <div 
        ref={chatRef}
        className="flex-1 overflow-y-auto p-3 space-y-2 max-h-48"
      >
        {chatHistory.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm py-4">
            <MessageSquareText className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Start chatting with your selected image!</p>
            <p className="text-xs mt-1">Describe how you want to modify it.</p>
          </div>
        ) : (
          chatHistory.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col gap-1",
                msg.type === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                  msg.type === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {msg.message}
              </div>
              <span className="text-xs text-muted-foreground">
                {msg.timestamp.toLocaleTimeString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Input Area */}
      <div className="p-3 border-t bg-muted/30">
        <form onSubmit={handleSend} className="space-y-2">
          <div className="flex gap-2">
            <Input
              ref={inputRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Describe how to modify the image..."
              disabled={isGenerating}
              className="flex-1 text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnhancePrompt}
              disabled={!message.trim() || isGenerating}
              className="px-2"
            >
              <Sparkles className="w-3 h-3" />
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!message.trim() || isGenerating}
              className="px-3"
            >
              {isGenerating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Send className="w-3 h-3" />
              )}
            </Button>
          </div>
          {isGenerating && (
            <p className="text-xs text-muted-foreground text-center">
              Generating image based on your message...
            </p>
          )}
        </form>
      </div>
    </div>
  );
};
