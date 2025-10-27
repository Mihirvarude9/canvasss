import { useEffect, useState } from 'react';
import { Library } from '@/components/Library';
import { SideNav } from '@/components/SideNav';
import { Canvas } from '@/components/Canvas';
import { PromptBar } from '@/components/PromptBar';
import { Inspector } from '@/components/Inspector';
import { Toolbar } from '@/components/Toolbar';
import { ProjectSelector } from '@/components/ProjectSelector';
import { FrameSizeSelector, FRAME_SIZES, type FrameSize } from '@/components/FrameSizeSelector';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useCanvasStore } from '@/store/canvasStore';
import { Button } from '@/components/ui/button';
import { Save, Loader2, Video, Image, Library as LibraryIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Board = () => {
  const [frameSize, setFrameSize] = useState<FrameSize>(FRAME_SIZES[0]);
  const navigate = useNavigate();
  
  const { 
    undo, 
    redo, 
    toggleGrid, 
    duplicateSelected, 
    deleteSelectedNodes,
    saveProject,
    loadAssets,
    currentProject,
    isLoading,
    error,
    whiteboardMode,
    toggleWhiteboard,
    libraryVisible,
    toggleLibrary
  } = useCanvasStore();

  useEffect(() => {
    // Load assets when component mounts
    loadAssets();
  }, [loadAssets]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere with text input in form elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.contentEditable === 'true') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Save project
      if (modifier && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Undo/Redo
      if (modifier && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }

      // Duplicate
      if (modifier && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }

      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelectedNodes();
      }

      // Toggle grid
      if (e.key === 'h') {
        e.preventDefault();
        toggleGrid();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo, duplicateSelected, deleteSelectedNodes, toggleGrid]);

  const handleSave = async () => {
    if (!currentProject) {
      toast.error('No project loaded');
      return;
    }

    try {
      await saveProject();
      toast.success('Project saved successfully');
    } catch (error) {
      toast.error('Failed to save project');
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${whiteboardMode ? '' : ''}`}>
      {!whiteboardMode && (
        <SideNav
        active="text"
        onSelect={(key) => {
          if (key === 'uploads') {
            window.dispatchEvent(new Event('library:openUpload'));
          } else if (key === 'photos') {
            window.dispatchEvent(new CustomEvent('library:setTab', { detail: 'images' }));
          } else if (key === 'videos') {
            window.dispatchEvent(new CustomEvent('library:setTab', { detail: 'videos' }));
          } else if (key === 'magic') {
            window.dispatchEvent(new Event('gallery:openGenerated'));
          } else if (key === 'projects') {
            window.dispatchEvent(new Event('projects:open'));
          }
        }}
      />
      )}
      {!whiteboardMode && libraryVisible && <Library defaultTab="images" />}
      
      <div className="flex-1 relative overflow-hidden">
        {/* Mode Toggle */}
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          {!whiteboardMode && (
            <Button
              variant={libraryVisible ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={toggleLibrary}
            >
              <LibraryIcon className="w-4 h-4" />
              {libraryVisible ? 'Hide Library' : 'Show Library'}
            </Button>
          )}
          <Button
            variant={whiteboardMode ? 'default' : 'outline'}
            size="sm"
            className="gap-2"
            onClick={toggleWhiteboard}
          >
            <Image className="w-4 h-4" />
            {whiteboardMode ? 'Whiteboard On' : 'Whiteboard Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/video')}
          >
            <Video className="w-4 h-4" />
            Video Mode
          </Button>
        </div>

        <ErrorBoundary>
          <Canvas />
        </ErrorBoundary>
      </div>
      {!whiteboardMode && <Inspector />}
      <PromptBar frameSize={frameSize} />
    </div>
  );
};

export default Board;