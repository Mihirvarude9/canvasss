import { apiClient } from './api';

export interface GeminiIdea {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: string;
}

export interface GeminiAnalysisResult {
  success: boolean;
  ideas: GeminiIdea[];
  analysis: {
    image1Description: string;
    image2Description: string;
    combinedConcept: string;
    styleAnalysis: string;
    colorPalette: string;
    mood: string;
  };
  error?: string;
}

export class GeminiService {
  /**
   * Analyze two images and generate 5 creative ideas using Gemini API
   */
  static async generateDualImageIdeas(
    image1AssetId: string,
    image2AssetId: string,
    onProgress?: (step: string, progress: number) => void
  ): Promise<GeminiAnalysisResult> {
    try {
      onProgress?.('Analyzing images with Gemini...', 10);

      // Get the image URLs
      const image1Url = apiClient.getAssetUrl({ url: `/uploads/${image1AssetId}.jpg` } as any);
      const image2Url = apiClient.getAssetUrl({ url: `/uploads/${image2AssetId}.jpg` } as any);

      onProgress?.('Generating creative ideas...', 30);

      // Call the backend Gemini service
      const response = await fetch('/api/generate/dual-image-ideas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1AssetId,
          image2AssetId,
          image1Url,
          image2Url,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate ideas');
      }

      onProgress?.('Ideas generated successfully!', 100);

      return result;
    } catch (error: any) {
      console.error('Gemini analysis error:', error);
      return {
        success: false,
        ideas: [],
        analysis: {
          image1Description: '',
          image2Description: '',
          combinedConcept: '',
          styleAnalysis: '',
          colorPalette: '',
          mood: '',
        },
        error: error.message || 'Failed to analyze images',
      };
    }
  }

  /**
   * Generate a single creative idea based on two images
   */
  static async generateSingleIdea(
    image1AssetId: string,
    image2AssetId: string,
    category: string = 'creative'
  ): Promise<{ success: boolean; idea?: GeminiIdea; error?: string }> {
    try {
      const response = await fetch('/api/generate/single-dual-idea', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1AssetId,
          image2AssetId,
          category,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate idea');
      }

      return {
        success: true,
        idea: result.idea,
      };
    } catch (error: any) {
      console.error('Gemini single idea error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate idea',
      };
    }
  }
}
