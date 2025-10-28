import { ApiResponse, PaginatedResponse, Project, Asset, User, AuthResponse, CreateProjectRequest, UpdateProjectRequest, CreateAssetRequest, UpdateAssetRequest, LoginRequest, RegisterRequest } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    // Authentication disabled - no token needed
    this.token = null;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    console.log('🌐 API Request:', {
      url,
      method: options.method || 'GET',
      headers: options.headers,
      body: options.body
    });
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for non-FormData requests
    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Authentication disabled - no auth headers needed
    // if (this.token) {
    //   headers.Authorization = `Bearer ${this.token}`;
    // }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      console.log('📡 Making fetch request to:', url);
      const response = await fetch(url, config);
      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('📡 Response data:', data);

      if (!response.ok) {
        console.error('❌ API Error:', response.status, data);
        throw new ApiError(
          data.error || `HTTP ${response.status}`,
          response.status,
          data
        );
      }

      console.log('✅ API Request successful');
      return data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Network error', 0, error);
    }
  }

  // Authentication methods
  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(data: LoginRequest): Promise<ApiResponse<AuthResponse>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  // Project endpoints
  async getProjects(page = 1, limit = 20): Promise<ApiResponse<PaginatedResponse<Project>>> {
    return this.request(`/projects?page=${page}&limit=${limit}`);
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request(`/projects/${id}`);
  }

  async createProject(data: CreateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: UpdateProjectRequest): Promise<ApiResponse<Project>> {
    return this.request(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse> {
    return this.request(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async duplicateProject(id: string): Promise<ApiResponse<Project>> {
    return this.request(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  // Asset endpoints
  async getAssets(page = 1, limit = 20, search?: string, type?: 'image' | 'video'): Promise<ApiResponse<PaginatedResponse<Asset>>> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (search) params.append('q', search);
    if (type) params.append('type', type);

    return this.request(`/assets?${params.toString()}`);
  }

  async getAsset(id: string): Promise<ApiResponse<Asset>> {
    return this.request(`/assets/${id}`);
  }

  async uploadAsset(file: File, data?: CreateAssetRequest): Promise<ApiResponse<Asset>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (data) {
      if (data.name) formData.append('name', data.name);
      if (data.tags) formData.append('tags', JSON.stringify(data.tags));
      if (data.projectId) formData.append('projectId', data.projectId);
    }

    return this.request('/assets/upload', {
      method: 'POST',
      body: formData,
    });
  }

  async updateAsset(id: string, data: UpdateAssetRequest): Promise<ApiResponse<Asset>> {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAsset(id: string): Promise<ApiResponse> {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // User endpoints
  async getUserProfile(): Promise<ApiResponse<User>> {
    return this.request('/users/profile');
  }

  async updateUserProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return this.request('/users/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount(): Promise<ApiResponse> {
    return this.request('/users/account', {
      method: 'DELETE',
    });
  }

  // Image Generation endpoints
  async checkGenerationStatus(): Promise<ApiResponse<{ configured: boolean; promptEnhancerAvailable: boolean; message: string }>> {
    return this.request('/generate/status');
  }

  async enhancePrompt(data: {
    prompt: string;
    mode?: 'general' | 'image-edit';
    numberOfImages?: number;
  }): Promise<ApiResponse<{ originalPrompt: string; enhancedPrompt: string }>> {
    return this.request('/generate/enhance-prompt', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateImageFromText(data: {
    prompt: string;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    width?: number;
    height?: number;
    model?: 'flux-kontext' | 'flux-pro' | 'fal-schnell' | 'nano-banana';
  }): Promise<ApiResponse<Asset>> {
    return this.request('/generate/text-to-image', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateImageFromImage(data: {
    assetId: string;
    prompt: string;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    strength?: number;
    width?: number;
    height?: number;
    model?: 'flux-kontext' | 'flux-pro' | 'fal-schnell' | 'nano-banana';
  }): Promise<ApiResponse<Asset>> {
    return this.request('/generate/image-to-image', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async generateFromMultipleImages(data: {
    assetIds: string[];
    prompt: string;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    strength?: number;
    width?: number;
    height?: number;
    model?: 'flux-kontext' | 'flux-pro' | 'fal-schnell' | 'nano-banana';
    // nano-banana (Gemini) extras
    nb_num_images?: number;
    nb_output_format?: 'jpeg' | 'png' | 'webp';
    nb_sync_mode?: boolean;
    nb_aspect_ratio?: '21:9' | '1:1' | '4:3' | '3:2' | '2:3' | '5:4' | '4:5' | '3:4' | '16:9' | '9:16' | null;
  }): Promise<ApiResponse<Asset>> {
    return this.request('/generate/multi-image-to-image', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async editImageWithKontext(data: {
    assetId: string;
    prompt: string;
    negative_prompt?: string;
    num_inference_steps?: number;
    guidance_scale?: number;
    width?: number;
    height?: number;
  }): Promise<ApiResponse<Asset>> {
    return this.request('/generate/kontext-edit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Utility methods
  getAssetUrl(asset: Asset): string {
    if (asset.url.startsWith('http')) {
      return asset.url;
    }
    return `${this.baseURL.replace('/api', '')}${asset.url}`;
  }

  getThumbnailUrl(asset: Asset): string {
    if (asset.thumbUrl.startsWith('http')) {
      return asset.thumbUrl;
    }
    return `${this.baseURL.replace('/api', '')}${asset.thumbUrl}`;
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export { ApiError };
