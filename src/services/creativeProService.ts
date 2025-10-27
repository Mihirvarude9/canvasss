import { apiClient } from './api';
import { CREATIVE_PRO_PROMPTS, type CreativeProPrompt } from '@/utils/creativeProPrompts';
import { Asset } from './types';

export interface CreativeProGenerationResult {
  success: boolean;
  assets: Asset[];
  error?: string;
}

export class CreativeProService {
  /**
   * Generate Creative Pro images for a selected product
   */
  static async generateCreativeProImages(
    selectedImageAssetId: string,
    onProgress?: (step: string, progress: number) => void
  ): Promise<CreativeProGenerationResult> {
    const results: Asset[] = [];
    const errors: string[] = [];

    try {
      onProgress?.('Starting Creative Pro generation...', 0);

      // Generate images for each prompt category
      for (let i = 0; i < CREATIVE_PRO_PROMPTS.length; i++) {
        const category = CREATIVE_PRO_PROMPTS[i];
        const progress = (i / CREATIVE_PRO_PROMPTS.length) * 100;
        
        onProgress?.(`Generating ${category.name} variations...`, progress);

        try {
          // Generate 5 variations for each category using Gemini
          for (let j = 0; j < category.variations.length; j++) {
            const variation = category.variations[j];
            
            const response = await apiClient.generateFromMultipleImages({
              assetIds: [selectedImageAssetId],
              prompt: variation.prompt,
              width: 1024,
              height: 1024,
              model: 'nano-banana', // Using Gemini via nano-banana
            });

            if (response.success && response.data) {
              // Add category and variation metadata to the asset
              const enhancedAsset = {
                ...response.data,
                category: category.name,
                variation: variation.name,
                variationId: variation.id
              };
              results.push(enhancedAsset as Asset);
            } else {
              errors.push(`Failed to generate ${category.name} - ${variation.name}: ${response.error || 'Unknown error'}`);
            }
          }
        } catch (error: any) {
          errors.push(`Error generating ${category.name}: ${error.message || 'Unknown error'}`);
        }
      }

      onProgress?.('Creative Pro generation complete!', 100);

      return {
        success: errors.length === 0,
        assets: results,
        error: errors.length > 0 ? errors.join('; ') : undefined
      };

    } catch (error: any) {
      return {
        success: false,
        assets: results,
        error: error.message || 'Creative Pro generation failed'
      };
    }
  }

  /**
   * Get available Creative Pro prompt types
   */
  static getAvailablePrompts(): CreativeProPrompt[] {
    return CREATIVE_PRO_PROMPTS;
  }

  /**
   * Get prompt by ID
   */
  static getPromptById(id: string): CreativeProPrompt | undefined {
    return CREATIVE_PRO_PROMPTS.find(prompt => prompt.id === id);
  }
}
