import { create } from 'zustand';
import { apiClient } from '@/services/api';

export interface VideoNode {
  id: string;
  type: 'video' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  // Media-specific fields
  videoUrl?: string; // present when type === 'video'
  imageUrl?: string; // present when type === 'image'
  // Video-only fields (optional for images)
  duration?: number;
  startTime?: number;
  endTime?: number;
  volume?: number;
  muted?: boolean;
  // Common
  zIndex: number;
  selected: boolean;
}

export interface VideoProject {
  id: string;
  name: string;
  description?: string;
  nodes: VideoNode[];
  createdAt: string;
  updatedAt: string;
}

interface VideoStore {
  // State
  nodes: VideoNode[];
  selectedNodeIds: string[];
  currentProject: VideoProject | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addNode: (node: Omit<VideoNode, 'id'>) => void;
  updateNode: (id: string, updates: Partial<VideoNode>) => void;
  deleteNode: (id: string) => void;
  selectNode: (id: string, multi?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  clearSelection: () => void;
  moveNode: (id: string, x: number, y: number) => void;
  resizeNode: (id: string, width: number, height: number) => void;
  
  // Project management
  saveProject: (name: string, description?: string) => Promise<void>;
  loadProject: (id: string) => Promise<void>;
  createProject: (name: string, description?: string) => Promise<void>;
  
  // Video generation
  generateVideo: () => Promise<string>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useVideoStore = create<VideoStore>((set, get) => ({
  // Initial state
  nodes: [],
  selectedNodeIds: [],
  currentProject: null,
  isLoading: false,
  error: null,

  // Node management
  addNode: (nodeData) => {
    const id = `video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNode: VideoNode = {
      id,
      // Defaults for videos; harmless for images as consumers guard on type
      volume: nodeData.type === 'video' ? 1 : undefined,
      muted: nodeData.type === 'video' ? false : undefined,
      ...nodeData,
      selected: false,
    };
    
    set((state) => ({
      nodes: [...state.nodes, newNode],
    }));
  },

  updateNode: (id, updates) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
  },

  deleteNode: (id) => {
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      selectedNodeIds: state.selectedNodeIds.filter((nodeId) => nodeId !== id),
    }));
  },

  selectNode: (id, multi = false) => {
    set((state) => {
      if (multi) {
        const isSelected = state.selectedNodeIds.includes(id);
        return {
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter((nodeId) => nodeId !== id)
            : [...state.selectedNodeIds, id],
        };
      } else {
        return {
          selectedNodeIds: [id],
        };
      }
    });
  },

  selectNodes: (ids) => {
    set({ selectedNodeIds: ids });
  },

  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },

  moveNode: (id, x, y) => {
    get().updateNode(id, { x, y });
  },

  resizeNode: (id, width, height) => {
    get().updateNode(id, { width, height });
  },

  // Project management
  saveProject: async (name, description) => {
    const { nodes } = get();
    const project: VideoProject = {
      id: `project-${Date.now()}`,
      name,
      description,
      nodes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await apiClient.post('/video/projects', project);
      set({ currentProject: project });
    } catch (error) {
      console.error('Failed to save project:', error);
      set({ error: 'Failed to save project' });
    }
  },

  loadProject: async (id) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.get(`/video/projects/${id}`);
      const project = response.data;
      set({ 
        currentProject: project,
        nodes: project.nodes || [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to load project:', error);
      set({ error: 'Failed to load project', isLoading: false });
    }
  },

  createProject: async (name, description) => {
    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.post('/video/projects', {
        name,
        description,
        nodes: [],
      });
      const project = response.data;
      set({ 
        currentProject: project,
        nodes: [],
        isLoading: false 
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      set({ error: 'Failed to create project', isLoading: false });
    }
  },

  // Video generation
  generateVideo: async () => {
    const { nodes } = get();
    if (nodes.length === 0) {
      throw new Error('No videos selected for generation');
    }

    try {
      set({ isLoading: true, error: null });
      const response = await apiClient.post('/video/generate', {
        nodes: nodes.map(node => ({
          id: node.id,
          videoUrl: node.videoUrl,
          startTime: node.startTime,
          endTime: node.endTime,
          order: nodes.indexOf(node),
        })),
      });
      
      set({ isLoading: false });
      return response.data.videoUrl;
    } catch (error) {
      console.error('Failed to generate video:', error);
      set({ error: 'Failed to generate video', isLoading: false });
      throw error;
    }
  },

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
}));
