import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles, Grid3x3, Layers } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* Header */}
      <header className="border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">WildBoard</span>
          </div>
          <Button onClick={() => navigate('/board')} size="lg">
            Get Started
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-6xl font-bold tracking-tight">
              Create visual boards
              <br />
              <span className="text-primary">with AI assistance</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              WildBoard is an infinite canvas for organizing images, videos, and ideas. 
              Use AI to transform and enhance your content effortlessly.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4">
            <Button onClick={() => navigate('/board')} size="lg" className="text-lg px-8 py-6">
              Launch Canvas
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="p-6 rounded-xl border border-sidebar-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Grid3x3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Infinite Canvas</h3>
              <p className="text-sm text-muted-foreground">
                Pan, zoom, and arrange unlimited content on a boundless workspace with smart grid snapping.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-sidebar-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI-Powered Edits</h3>
              <p className="text-sm text-muted-foreground">
                Transform selections with natural language prompts. Remove backgrounds, change styles, and more.
              </p>
            </div>

            <div className="p-6 rounded-xl border border-sidebar-border bg-card">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Rich Media Library</h3>
              <p className="text-sm text-muted-foreground">
                Upload and organize images and videos. Drag and drop onto your canvas to create stunning compositions.
              </p>
            </div>
          </div>

          {/* Demo hint */}
          <div className="pt-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Try the demo board with sample assets
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-sidebar-border py-6">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>Built with React, Fabric.js, and Lovable • Keyboard shortcuts: H (grid) • Cmd+Z (undo) • Del (delete)</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;