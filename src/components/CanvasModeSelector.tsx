import { MousePointer, MessageCircle, Move } from 'lucide-react';
import { useCanvasStore } from '@/store/canvasStore';
import { cn } from '@/lib/utils';

export const CanvasModeSelector = () => {
  const { canvasMode, setCanvasMode } = useCanvasStore();

  return (
    <div className="absolute top-4 left-4 z-50 bg-white border border-gray-300 rounded-lg shadow-sm">
      <div className="flex">
        {/* Select Mode Button */}
        <button
          onClick={() => setCanvasMode('select')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
            'first:rounded-l-lg last:rounded-r-lg',
            canvasMode === 'select'
              ? 'bg-gray-100 text-gray-900 border-r border-gray-300'
              : 'text-gray-600 hover:bg-gray-50 border-r border-gray-300'
          )}
          title="Select and manipulate images"
        >
          <MousePointer className="w-4 h-4" />
          <span>Select</span>
        </button>

        {/* Chat Mode Button */}
        <button
          onClick={() => setCanvasMode('chat')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
            'first:rounded-l-lg last:rounded-r-lg',
            canvasMode === 'chat'
              ? 'bg-gray-100 text-gray-900 border-r border-gray-300'
              : 'text-gray-600 hover:bg-gray-50 border-r border-gray-300'
          )}
          title="Chat with selected image for generation"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat</span>
        </button>

        {/* Drag & Drop Mode Button */}
        <button
          onClick={() => setCanvasMode('dragdrop')}
          className={cn(
            'flex items-center gap-2 px-3 py-2 text-sm font-medium transition-colors',
            'first:rounded-l-lg last:rounded-r-lg',
            canvasMode === 'dragdrop'
              ? 'bg-gray-100 text-gray-900'
              : 'text-gray-600 hover:bg-gray-50'
          )}
          title="Auto-generate 5 creative images"
        >
          <Move className="w-4 h-4" />
          <span>Drag & Drop</span>
        </button>
      </div>
    </div>
  );
};
