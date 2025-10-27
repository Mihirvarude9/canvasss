import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useProjects } from '@/hooks/useProjects';
import { useCanvasStore } from '@/store/canvasStore';
import { Plus, FolderOpen, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProjectSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const { projects, loadProjects, createProject, isLoading } = useProjects();
  const { setCurrentProject, loadProject } = useCanvasStore();

  // Listen for projects:open event from SideNav
  useEffect(() => {
    const handleOpenProjects = () => {
      setIsOpen(true);
    };
    
    window.addEventListener('projects:open', handleOpenProjects);
    return () => window.removeEventListener('projects:open', handleOpenProjects);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen, loadProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    setIsCreating(true);
    try {
      const project = await createProject({ name: newProjectName.trim() });
      if (project) {
        setCurrentProject(project);
        setNewProjectName('');
        setIsOpen(false);
        toast.success('Project created successfully');
      }
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectProject = async (projectId: string) => {
    try {
      await loadProject(projectId);
      setIsOpen(false);
      toast.success('Project loaded successfully');
    } catch (error) {
      toast.error('Failed to load project');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Projects
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select or Create Project</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Create New Project */}
          <div className="space-y-2">
            <Label htmlFor="project-name">Create New Project</Label>
            <div className="flex gap-2">
              <Input
                id="project-name"
                placeholder="Enter project name"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateProject();
                  }
                }}
                disabled={isCreating}
              />
              <Button
                onClick={handleCreateProject}
                disabled={isCreating || !newProjectName.trim()}
                size="sm"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Existing Projects */}
          <div className="space-y-2">
            <Label>Recent Projects</Label>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : projects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No projects found. Create your first project above.
                </p>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleSelectProject(project.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {project.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created: {new Date(project.createdAt).toLocaleDateString()} · Updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
