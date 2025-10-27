import { useState, useEffect, useCallback } from 'react';
import { apiClient, ApiError } from '../services/api';
import { Asset, CreateAssetRequest, UpdateAssetRequest, PaginatedResponse } from '../services/types';

export interface UseAssetsState {
  assets: Asset[];
  currentAsset: Asset | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useAssets() {
  const [state, setState] = useState<UseAssetsState>({
    assets: [],
    currentAsset: null,
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

  const loadAssets = useCallback(async (page = 1, limit = 20, search?: string, type?: 'image' | 'video') => {
    setLoading(true);
    try {
      const response = await apiClient.getAssets(page, limit, search, type);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          assets: response.data!.data,
          pagination: response.data!.pagination,
          isLoading: false,
          error: null,
        }));
      } else {
        setError(response.error || 'Failed to load assets');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load assets';
      setError(errorMessage);
    }
  }, []);

  const loadAsset = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.getAsset(id);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          currentAsset: response.data!,
          isLoading: false,
          error: null,
        }));
      } else {
        setError(response.error || 'Failed to load asset');
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to load asset';
      setError(errorMessage);
    }
  }, []);

  const uploadAsset = useCallback(async (file: File, data?: CreateAssetRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.uploadAsset(file, data);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          assets: [response.data!, ...prev.assets],
          isLoading: false,
          error: null,
        }));
        return response.data;
      } else {
        setError(response.error || 'Failed to upload asset');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to upload asset';
      setError(errorMessage);
      return null;
    }
  }, []);

  const updateAsset = useCallback(async (id: string, data: UpdateAssetRequest) => {
    setLoading(true);
    try {
      const response = await apiClient.updateAsset(id, data);
      if (response.success && response.data) {
        setState(prev => ({
          ...prev,
          assets: prev.assets.map(a => a.id === id ? response.data! : a),
          currentAsset: prev.currentAsset?.id === id ? response.data! : prev.currentAsset,
          isLoading: false,
          error: null,
        }));
        return response.data;
      } else {
        setError(response.error || 'Failed to update asset');
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to update asset';
      setError(errorMessage);
      return null;
    }
  }, []);

  const deleteAsset = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const response = await apiClient.deleteAsset(id);
      if (response.success) {
        setState(prev => ({
          ...prev,
          assets: prev.assets.filter(a => a.id !== id),
          currentAsset: prev.currentAsset?.id === id ? null : prev.currentAsset,
          isLoading: false,
          error: null,
        }));
        return true;
      } else {
        setError(response.error || 'Failed to delete asset');
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Failed to delete asset';
      setError(errorMessage);
      return false;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const setCurrentAsset = useCallback((asset: Asset | null) => {
    setState(prev => ({ ...prev, currentAsset: asset }));
  }, []);

  return {
    ...state,
    loadAssets,
    loadAsset,
    uploadAsset,
    updateAsset,
    deleteAsset,
    clearError,
    setCurrentAsset,
  };
}
