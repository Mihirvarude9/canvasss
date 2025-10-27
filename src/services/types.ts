// Re-export types from backend for consistency
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  thumbnail?: string;
  canvasData: CanvasData;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CanvasNode {
  id: string;
  type: 'image' | 'video' | 'group' | 'text';
  assetId?: string;
  url?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  zIndex: number;
  blendMode?: string;
  shadow?: boolean;
  radius?: number;
  // Text-specific fields (when type === 'text')
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fill?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export interface CanvasData {
  nodes: CanvasNode[];
  zoom: number;
  pan: { x: number; y: number };
  gridVisible: boolean;
  snapEnabled: boolean;
  width: number;
  height: number;
}

export interface Asset {
  id: string;
  userId: string;
  projectId?: string;
  type: 'image' | 'video';
  url: string;
  thumbUrl: string;
  name: string;
  originalName: string;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface HistoryState {
  nodes: CanvasNode[];
  timestamp: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  canvasData?: Partial<CanvasData>;
  isPublic?: boolean;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  canvasData?: Partial<CanvasData>;
  isPublic?: boolean;
}

export interface CreateAssetRequest {
  name?: string;
  tags?: string[];
  projectId?: string;
}

export interface UpdateAssetRequest {
  name?: string;
  tags?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
