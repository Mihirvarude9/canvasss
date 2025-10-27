import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../services/api';
import { Project, CreateProjectRequest, UpdateProjectRequest, PaginatedResponse } from '../services/types';

export interface UseProjectsState {
  projects: Project[];
  currentProject: Project | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useProjects() {
  const [state, setState] = useState<UseProjectsState>({
    projects: [],
    currentProject: null,
    isLoading: false,
    error: null,
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    },
  });

  const setLoading = (isLoading: boolean) => {
    setState(prev => ({ ...prev, isLoading, error: isLoading ? null : prev.error }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error, isLoading: false }));
  };

  const loadProjects = useCallback(async (page = 1, limit = 20) => {
    setLoading(true);
    try {
      const response = await apiClient.getProjects(page, limit);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          projects: response.data!.data,
          pagination: response.data!.pagination,
          isLoading: false,
          error: null,
        }));
      } else {
        setError(response.error || 'Failed to load projects');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load projects';
      setError(errorMessage);
    }
  }, []);

  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getProject(id);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentProject: response.data!,
          isLoading: false,
          error: null,
        }));
      } else {
        setError(response.error || 'Failed to load project');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load project';
      setError(errorMessage);
    }
  }, []);

  const createProject = useCallback(async (data: CreateProjectRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.createProject(data);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          projects: [response.data!, ...prev.projects],
          currentProject: response.data!,
          isLoading: false,
          error: null,
        }));
        return response.data;
      } else {
        setError(response.error || 'Failed to create project');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to create project';
      setError(errorMessage);
      return null;
    }
  }, []);

  const updateProject = useCallback(async (id: string, data: UpdateProjectRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.updateProject(id, data);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          projects: prev.projects.map(p => p.id === id ? response.data! : p),
          currentProject: prev.currentProject?.id === id ? response.data! : prev.currentProject,
          isLoading: false,
          error: null,
        }));
        return response.data;
      } else {
        setError(response.error || 'Failed to update project');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update project';
      setError(errorMessage);
      return null;
    }
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.deleteProject(id);
      if (response.success) {
        setState(prev => ({
          ...prev,
          projects: prev.projects.filter(p => p.id !== id),
          currentProject: prev.currentProject?.id === id ? null : prev.currentProject,
          isLoading: false,
          error: null,
        }));
        return true;
      } else {
        setError(response.error || 'Failed to delete project');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete project';
      setError(errorMessage);
      return false;
    }
  }, []);

  const duplicateProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.duplicateProject(id);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          projects: [response.data!, ...prev.projects],
          isLoading: false,
          error: null,
        }));
        return response.data;
      } else {
        setError(response.error || 'Failed to duplicate project');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to duplicate project';
      setError(errorMessage);
      return null;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setCurrentProject = useCallback((project: Project | null) => {
    setState(prev => ({ ...prev, currentProject: project }));
  }, []);

  return {
    ...state,
    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    duplicateProject,
    clearError,
    setCurrentProject,
  };
}
