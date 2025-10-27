import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { apiClient, ApiError } from '../services/api';
import { Project, Asset, CanvasNode, CanvasData } from '../services/types';

export interface HistoryState {
  nodes: CanvasNode[];
  timestamp: number;
}

interface CanvasStore {
  // Current project
  currentProject: Project | null;
  
  // Canvas state
  nodes: CanvasNode[];
  selectedNodeIds: string[];
  zoom: number;
  pan: { x: number; y: number };
  gridVisible: boolean;
  snapEnabled: boolean;
  whiteboardMode: boolean;
  libraryVisible: boolean;
  exportDialogOpen: boolean;
  generationModel: 'flux-kontext' | 'flux-pro' | 'fal-schnell' | 'nano-banana';
  kontextMode: 'image-edit' | 'character' | 'text' | 'style';
  aiGeneratedAssetIds: string[];
  canvasMode: 'select' | 'chat' | 'dragdrop';
  creativeProMode: boolean;
  
  // Assets
  assets: Asset[];
  
  // History
  history: HistoryState[];
  historyIndex: number;
  
  // Loading states
  isLoading: boolean;
  isGenerating: boolean;
  generationStatus: string;
  error: string | null;
  
  // Project actions
  loadProject: (id: string) => Promise<void>;
  saveProject: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project | null>;
  
  // Canvas actions
  addNode: (node: Omit<CanvasNode, 'id' | 'zIndex'>) => void;
  updateNode: (id: string, updates: Partial<CanvasNode>) => void;
  deleteNode: (id: string) => void;
  deleteSelectedNodes: () => void;
  selectNode: (id: string, multi?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  clearSelection: () => void;
  duplicateSelected: () => void;
  alignNodes: (alignment: 'row' | 'column' | 'grid') => void;
  
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
  toggleWhiteboard: () => void;
  toggleLibrary: () => void;
  openExportDialog: () => void;
  closeExportDialog: () => void;
  setGenerationModel: (model: 'flux-kontext' | 'flux-pro' | 'fal-schnell' | 'nano-banana') => void;
  setKontextMode: (mode: 'image-edit' | 'character' | 'text' | 'style') => void;
  setCanvasMode: (mode: 'select' | 'chat' | 'dragdrop') => void;
  setCreativeProMode: (enabled: boolean) => void;
  addGeneratedAssetId: (id: string) => void;
  
  // Asset actions
  loadAssets: () => Promise<void>;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  removeAsset: (id: string) => void;
  
  // History actions
  undo: () => void;
  redo: () => void;
  saveHistory: () => void;
  
  // Utility actions
  clearError: () => void;
  setError: (message: string) => void;
  setGenerating: (isGenerating: boolean, status?: string) => void;
  setCurrentProject: (project: Project | null) => void;
}

export const useCanvasStore = create<CanvasStore>((set, get) => ({
  currentProject: null,
  nodes: [],
  selectedNodeIds: [],
  zoom: 1,
  pan: { x: 0, y: 0 },
  gridVisible: true,
  snapEnabled: true,
  whiteboardMode: false,
  libraryVisible: true,
  exportDialogOpen: false,
  generationModel: 'flux-kontext',
  kontextMode: 'image-edit',
  aiGeneratedAssetIds: [],
  canvasMode: 'select',
  creativeProMode: false,
  assets: [],
  history: [],
  historyIndex: -1,
  isLoading: false,
  isGenerating: false,
  generationStatus: '',
  error: null,
  
  // Project actions
  loadProject: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getProject(id);
      if (response.success && response.data) {
        const project = response.data;
        set({
          currentProject: project,
          nodes: project.canvasData.nodes,
          zoom: project.canvasData.zoom,
          pan: project.canvasData.pan,
          gridVisible: project.canvasData.gridVisible,
          snapEnabled: project.canvasData.snapEnabled,
          // keep whiteboard preference as-is
          isLoading: false,
          error: null,
        });
      } else {
        set({ error: response.error || 'Failed to load project', isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load project';
      set({ error: errorMessage, isLoading: false });
    }
  },

  saveProject: async () => {
    const state = get();
    if (!state.currentProject) return;

    set({ isLoading: true, error: null });
    try {
      const canvasData: CanvasData = {
        nodes: state.nodes,
        zoom: state.zoom,
        pan: state.pan,
        gridVisible: state.gridVisible,
        snapEnabled: state.snapEnabled,
          // whiteboardMode is a UI preference; do not persist in project data
        width: state.currentProject.canvasData.width,
        height: state.currentProject.canvasData.height,
      };

      const response = await apiClient.updateProject(state.currentProject.id, {
        canvasData,
      });

      if (response.success && response.data) {
        set({
          currentProject: response.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({ error: response.error || 'Failed to save project', isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to save project';
      set({ error: errorMessage, isLoading: false });
    }
  },

  createProject: async (name: string, description?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.createProject({
        name,
        description,
        canvasData: {
          nodes: [],
          zoom: 1,
          pan: { x: 0, y: 0 },
          gridVisible: true,
          snapEnabled: true,
          // UI preference not persisted: whiteboardMode
          width: 1920,
          height: 1080,
        },
      });

      if (response.success && response.data) {
        set({
          currentProject: response.data,
          nodes: response.data.canvasData.nodes,
          zoom: response.data.canvasData.zoom,
          pan: response.data.canvasData.pan,
          gridVisible: response.data.canvasData.gridVisible,
          snapEnabled: response.data.canvasData.snapEnabled,
      // keep whiteboard preference as-is
          isLoading: false,
          error: null,
        });
        return response.data;
      } else {
        set({ error: response.error || 'Failed to create project', isLoading: false });
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create project';
      set({ error: errorMessage, isLoading: false });
      return null;
    }
  },

  // Canvas actions
  addNode: (node) => {
    const state = get();
    const newNode: CanvasNode = {
      ...node,
      id: nanoid(),
      zIndex: state.nodes.length,
    };
    set({ nodes: [...state.nodes, newNode] });
    get().saveHistory();
  },
  
  updateNode: (id, updates) => {
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === id ? { ...node, ...updates } : node
      ),
    }));
    get().saveHistory();
  },
  
  deleteNode: (id) => {
    set(state => ({
      nodes: state.nodes.filter(node => node.id !== id),
      selectedNodeIds: state.selectedNodeIds.filter(nid => nid !== id),
    }));
    get().saveHistory();
  },
  
  deleteSelectedNodes: () => {
    const state = get();
    set({
      nodes: state.nodes.filter(node => !state.selectedNodeIds.includes(node.id)),
      selectedNodeIds: [],
    });
    get().saveHistory();
  },
  
  selectNode: (id, multi = false) => {
    set(state => {
      if (multi) {
        const isSelected = state.selectedNodeIds.includes(id);
        return {
          selectedNodeIds: isSelected
            ? state.selectedNodeIds.filter(nid => nid !== id)
            : [...state.selectedNodeIds, id],
        };
      }
      return { selectedNodeIds: [id] };
    });
  },
  
  selectNodes: (ids) => {
    set({ selectedNodeIds: ids });
  },
  
  clearSelection: () => {
    set({ selectedNodeIds: [] });
  },
  
  duplicateSelected: () => {
    const state = get();
    const selectedNodes = state.nodes.filter(node =>
      state.selectedNodeIds.includes(node.id)
    );
    
    const newNodes = selectedNodes.map(node => ({
      ...node,
      id: nanoid(),
      x: node.x + 20,
      y: node.y + 20,
      zIndex: state.nodes.length + selectedNodes.indexOf(node),
    }));
    
    set({
      nodes: [...state.nodes, ...newNodes],
      selectedNodeIds: newNodes.map(n => n.id),
    });
    get().saveHistory();
  },

  alignNodes: (alignment) => {
    const state = get();
    const selectedNodes = state.nodes.filter(node =>
      state.selectedNodeIds.includes(node.id)
    );

    if (selectedNodes.length < 2) return;

    const GAP = 20; // Gap between images
    let updatedNodes = [...state.nodes];

    if (alignment === 'row') {
      // Align in a horizontal row
      selectedNodes.sort((a, b) => a.x - b.x);
      let currentX = selectedNodes[0].x;
      const avgY = selectedNodes.reduce((sum, n) => sum + n.y, 0) / selectedNodes.length;

      selectedNodes.forEach(node => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          x: currentX,
          y: avgY,
        };
        currentX += node.width + GAP;
      });
    } else if (alignment === 'column') {
      // Align in a vertical column
      selectedNodes.sort((a, b) => a.y - b.y);
      const avgX = selectedNodes.reduce((sum, n) => sum + n.x, 0) / selectedNodes.length;
      let currentY = selectedNodes[0].y;

      selectedNodes.forEach(node => {
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          x: avgX,
          y: currentY,
        };
        currentY += node.height + GAP;
      });
    } else if (alignment === 'grid') {
      // Arrange in a grid
      const numCols = Math.ceil(Math.sqrt(selectedNodes.length));
      const numRows = Math.ceil(selectedNodes.length / numCols);
      
      // Find max width and height for consistent grid cells
      const maxWidth = Math.max(...selectedNodes.map(n => n.width));
      const maxHeight = Math.max(...selectedNodes.map(n => n.height));
      
      const startX = selectedNodes[0].x;
      const startY = selectedNodes[0].y;

      selectedNodes.forEach((node, index) => {
        const col = index % numCols;
        const row = Math.floor(index / numCols);
        
        const nodeIndex = updatedNodes.findIndex(n => n.id === node.id);
        updatedNodes[nodeIndex] = {
          ...updatedNodes[nodeIndex],
          x: startX + col * (maxWidth + GAP) + (maxWidth - node.width) / 2,
          y: startY + row * (maxHeight + GAP) + (maxHeight - node.height) / 2,
        };
      });
    }

    set({ nodes: updatedNodes });
    get().saveHistory();
  },
  
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  toggleGrid: () => set(state => ({ gridVisible: !state.gridVisible })),
  toggleSnap: () => set(state => ({ snapEnabled: !state.snapEnabled })),
  toggleWhiteboard: () => set(state => ({ whiteboardMode: !state.whiteboardMode })),
  toggleLibrary: () => set(state => ({ libraryVisible: !state.libraryVisible })),
  openExportDialog: () => set({ exportDialogOpen: true }),
  closeExportDialog: () => set({ exportDialogOpen: false }),
  setGenerationModel: (model) => set({ generationModel: model }),
  setKontextMode: (mode) => set({ kontextMode: mode }),
  setCanvasMode: (mode) => set({ canvasMode: mode }),
  setCreativeProMode: (enabled) => set({ creativeProMode: enabled }),
  addGeneratedAssetId: (id) => set(state => ({ aiGeneratedAssetIds: state.aiGeneratedAssetIds.includes(id) ? state.aiGeneratedAssetIds : [id, ...state.aiGeneratedAssetIds] })),
  
  // Asset actions
  loadAssets: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.getAssets();
      if (response.success && response.data) {
        set({
          assets: response.data.data,
          isLoading: false,
          error: null,
        });
      } else {
        set({ error: response.error || 'Failed to load assets', isLoading: false });
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load assets';
      set({ error: errorMessage, isLoading: false });
    }
  },

  addAsset: (asset) => {
    set(state => ({
      assets: [
        {
          ...asset,
          id: nanoid(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...state.assets,
      ],
    }));
  },
  
  removeAsset: (id) => {
    set(state => ({
      assets: state.assets.filter(a => a.id !== id),
    }));
  },
  
  saveHistory: () => {
    const state = get();
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({
      nodes: JSON.parse(JSON.stringify(state.nodes)),
      timestamp: Date.now(),
    });
    
    // Keep only last 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    }
    
    set({
      history: newHistory,
      historyIndex: newHistory.length - 1,
    });
  },
  
  undo: () => {
    const state = get();
    if (state.historyIndex > 0) {
      const newIndex = state.historyIndex - 1;
      set({
        nodes: JSON.parse(JSON.stringify(state.history[newIndex].nodes)),
        historyIndex: newIndex,
        selectedNodeIds: [],
      });
    }
  },
  
  redo: () => {
    const state = get();
    if (state.historyIndex < state.history.length - 1) {
      const newIndex = state.historyIndex + 1;
      set({
        nodes: JSON.parse(JSON.stringify(state.history[newIndex].nodes)),
        historyIndex: newIndex,
        selectedNodeIds: [],
      });
    }
  },

  // Utility actions
  clearError: () => {
    set({ error: null });
  },

  setError: (message) => {
    set({ error: message });
  },
  setGenerating: (isGenerating, status = '') => {
    set({ isGenerating, generationStatus: status });
  },

  setCurrentProject: (project) => {
    set({ currentProject: project });
  },
}));
