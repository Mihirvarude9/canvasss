import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useCanvasStore } from '@/store/canvasStore';
import { useAssets } from '@/hooks/useAssets';
import { apiClient } from '@/services/api';
import { Send, Sparkles, Wand2, MessageSquareText, Loader2, Zap, Move, Brain } from 'lucide-react';
import { toast } from 'sonner';
import { type FrameSize } from '@/components/FrameSizeSelector';
import { CreativeProService } from '@/services/creativeProService';
import { GeminiService } from '@/services/geminiService';

interface PromptBarProps {
  frameSize: FrameSize;
}

export const PromptBar = ({ frameSize }: PromptBarProps) => {
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [useEnhancer, setUseEnhancer] = useState(true); // Auto-enhance by default
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [dimMismatchOpen, setDimMismatchOpen] = useState(false);
  const [dimMismatchMessage, setDimMismatchMessage] = useState('');
  const [dualImageMode, setDualImageMode] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<any[]>([]);
  const { selectedNodeIds, nodes, addNode, setError, generationModel, setGenerationModel, kontextMode, setKontextMode, addGeneratedAssetId, isGenerating, setGenerating, canvasMode, setCanvasMode, creativeProMode, setCreativeProMode } = useCanvasStore();
  const { loadAssets } = useAssets();
  
  const selectedNodes = nodes.filter(node => selectedNodeIds.includes(node.id));
  const selectedImageNodes = selectedNodes.filter(node => node.type === 'image' && node.assetId);

  // Debug logging to help understand selection
  console.log('PromptBar Debug:', {
    selectedNodeIds,
    totalNodes: nodes.length,
    selectedNodes: selectedNodes.length,
    selectedImageNodes: selectedImageNodes.length,
    imageNodesWithAssets: selectedImageNodes.map(n => ({ id: n.id, assetId: n.assetId, type: n.type }))
  });

  // Warn immediately when user selects multiple images with very different dimensions
  const checkDimensionMismatch = () => {
    if (selectedImageNodes.length > 1) {
      const widths = selectedImageNodes.map(n => Math.round(n.width));
      const heights = selectedImageNodes.map(n => Math.round(n.height));
      const minW = Math.min(...widths);
      const maxW = Math.max(...widths);
      const minH = Math.min(...heights);
      const maxH = Math.max(...heights);
      const wOk = minW > 0 && maxW / Math.max(1, minW) <= 1.1; // 10% tolerance
      const hOk = minH > 0 && maxH / Math.max(1, minH) <= 1.1; // 10% tolerance
      if (!(wOk && hOk)) {
        const dims = selectedImageNodes
          .map((n, i) => `#${i + 1}: ${Math.round(n.width)}x${Math.round(n.height)}`)
          .join(', ');
        const message = `Please select images with similar dimensions (width and height within 10%). Selected: ${dims}`;
        setDimMismatchMessage(message);
        setDimMismatchOpen(true);
        setError(message);
        toast.error('Use same-dimension images for merging', { description: message });
        return true;
      }
    }
    return false;
  };

  const handleEnhance = async () => {
    if (!prompt.trim()) {
      toast.error('Please enter a prompt first');
      return;
    }

    setIsEnhancing(true);
    try {
      const mode = selectedImageNodes.length > 0 ? 'image-edit' : 'general';
      const response = await apiClient.enhancePrompt({
        prompt: prompt.trim(),
        mode,
      });
      
      if (response.success && response.data) {
        setPrompt(response.data.enhancedPrompt);
        toast.success('Prompt enhanced!', {
          description: 'Your prompt has been improved for better results',
        });
      } else {
        toast.error('Failed to enhance prompt');
      }
    } catch (error) {
      console.error('Enhancement error:', error);
      toast.error('Failed to enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };


  const handleCreativeProGeneration = async () => {
    if (selectedImageNodes.length !== 1) {
      toast.error('Creative Pro mode requires exactly one selected image');
      return;
    }

    const selectedImage = selectedImageNodes[0];
    if (!selectedImage.assetId) {
      toast.error('Selected image must have an asset ID');
      return;
    }

    setGenerating(true, 'Starting Creative Pro generation...');
    const toastId = toast.loading('Creative Pro: Generating 25 images across 5 categories...', {
      description: 'Images will be arranged in a 5x5 grid on the canvas'
    });

    try {
      const result = await CreativeProService.generateCreativeProImages(
        selectedImage.assetId,
        (step, progress) => {
          setGenerating(true, step);
        }
      );

      if (result.success && result.assets.length > 0) {
        // Add all generated assets to library first
        for (const asset of result.assets) {
          addGeneratedAssetId(asset.id);
        }

        // Add all 25 images to canvas in a grid layout
        const gridSize = 5; // 5x5 grid for 25 images
        const spacing = 120; // Space between images
        const imageSize = 100; // Size of each image in the grid
        
        // Find a good starting position - place grid to the right of existing content
        let startX = 100;
        let startY = 100;
        
        // If there are existing nodes, place the grid to the right of them
        if (nodes.length > 0) {
          const rightmostX = Math.max(...nodes.map(n => n.x + n.width));
          startX = rightmostX + 50; // 50px gap from existing content
          startY = 100; // Start from top
        }

        // Calculate grid positions and add each image to canvas
        for (let i = 0; i < result.assets.length; i++) {
          const asset = result.assets[i];
          const row = Math.floor(i / gridSize);
          const col = i % gridSize;
          
          const x = startX + (col * spacing);
          const y = startY + (row * spacing);

          // Add small random variation to make grid look more natural
          const randomOffsetX = (Math.random() - 0.5) * 10; // ±5px variation
          const randomOffsetY = (Math.random() - 0.5) * 10; // ±5px variation

          addNode({
            type: 'image',
            assetId: asset.id,
            url: apiClient.getAssetUrl(asset),
            x: x + randomOffsetX,
            y: y + randomOffsetY,
            width: imageSize,
            height: imageSize,
            rotation: 0,
            opacity: 1,
            locked: false,
          });
        }

        toast.success(`Creative Pro: Generated and added ${result.assets.length} images to canvas!`, {
          id: toastId,
          description: 'All images arranged in a 5x5 grid on the canvas'
        });
        
        // Reload assets to update library
        await loadAssets();
      } else {
        throw new Error(result.error || 'Creative Pro generation failed');
      }
    } catch (error: any) {
      console.error('Creative Pro generation error:', error);
      toast.error('Creative Pro generation failed', {
        description: error.message || 'Please try again',
        id: toastId
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleDualImageIdeas = async () => {
    if (selectedImageNodes.length !== 2) {
      toast.error('Dual Image mode requires exactly 2 selected images');
      return;
    }

    const [image1, image2] = selectedImageNodes;
    if (!image1.assetId || !image2.assetId) {
      toast.error('Both selected images must have asset IDs');
      return;
    }

    setGenerating(true, 'Analyzing images with Gemini AI...');
    const toastId = toast.loading('Dual Image: Analyzing images with Gemini AI...', {
      description: `Analyzing ${image1.assetId} and ${image2.assetId}`
    });

    try {
      const result = await GeminiService.generateDualImageIdeas(
        image1.assetId,
        image2.assetId,
        (step, progress) => {
          setGenerating(true, step);
        }
      );

      if (result.success && result.ideas.length > 0) {
        setGeneratedIdeas(result.ideas);
        setDualImageMode(true);
        
        toast.success(`Dual Image: Generated ${result.ideas.length} creative ideas!`, {
          id: toastId,
          description: `Based on: ${result.analysis.combinedConcept}`
        });
      } else {
        throw new Error(result.error || 'Failed to generate ideas');
      }
    } catch (error: any) {
      console.error('Dual Image ideas generation error:', error);
      toast.error('Dual Image ideas generation failed', {
        description: error.message || 'Please try again',
        id: toastId
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromIdea = async (idea: any) => {
    if (selectedImageNodes.length !== 2) {
      toast.error('Please select exactly 2 images');
      return;
    }

    const assetIds = selectedImageNodes.map(node => node.assetId).filter(Boolean) as string[];
    
    setGenerating(true, `Generating: ${idea.title}...`);
    const toastId = toast.loading(`Generating: ${idea.title}...`, {
      description: idea.description
    });

    try {
      const response = await apiClient.generateFromMultipleImages({
        assetIds: assetIds,
        prompt: idea.prompt,
        width: frameSize.width,
        height: frameSize.height,
        model: generationModel as any,
      });

      if (response.success && response.data) {
        const generatedAsset = response.data;
        const fullUrl = apiClient.getAssetUrl(generatedAsset);

        // Calculate position - place to the right of the rightmost selected image
        const rightmostX = Math.max(...selectedImageNodes.map(n => n.x + n.width));
        const avgY = selectedImageNodes.reduce((sum, n) => sum + n.y, 0) / selectedImageNodes.length;
        
        const x = rightmostX + 50; // 50px gap from rightmost image
        const y = avgY;

        // Add generated image to canvas
        const newNode = {
          type: 'image' as const,
          assetId: generatedAsset.id,
          url: fullUrl,
          x,
          y,
          width: generatedAsset.width || frameSize.width,
          height: generatedAsset.height || frameSize.height,
          rotation: 0,
          opacity: 1,
          locked: false,
        };

        addNode(newNode);
        addGeneratedAssetId(generatedAsset.id);

        toast.success(`Generated: ${idea.title}!`, {
          id: toastId,
          description: 'New image added to canvas and library',
        });
        
        // Reload assets in background
        loadAssets().catch(err => console.warn('Asset reload failed:', err));
      } else {
        throw new Error(response.error || 'Generation failed');
      }
    } catch (error: any) {
      console.error('Idea generation error:', error);
      toast.error('Failed to generate image from idea', {
        description: error.message || 'Please try again',
        id: toastId
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    // In chat mode, only allow single image selection
    if (canvasMode === 'chat' && selectedImageNodes.length > 1) {
      toast.error('Chat mode only supports single image selection');
      return;
    }

    // console.log('PromptBar handleSubmit triggered with prompt:', prompt.trim());
    // console.log('Selected image nodes:', selectedImageNodes.length);
    
    setGenerating(true, 'Starting generation...');

    try {
      // Optionally enhance the prompt first
      let finalPrompt = prompt.trim();
      if (useEnhancer) {
        try {
          const mode = selectedImageNodes.length > 0 ? 'image-edit' : 'general';
          const enhanceResponse = await apiClient.enhancePrompt({
            prompt: finalPrompt,
            mode,
          });
          
          if (enhanceResponse.success && enhanceResponse.data) {
            finalPrompt = enhanceResponse.data.enhancedPrompt;
            console.log('✨ Enhanced prompt:', finalPrompt);
          }
        } catch (error) {
          console.warn('Enhancement failed, using original prompt:', error);
        }
      }

      // Text-to-image: Generate from text when no images are selected
      if (selectedImageNodes.length === 0) {
        setGenerating(true, 'Generating image from text...');
        const toastId = toast.loading('Generating image from text...', {
          description: useEnhancer ? 'Using enhanced prompt' : finalPrompt,
        });

        const response = await apiClient.generateImageFromText({
          prompt: finalPrompt,
          guidance_scale: 3.5,
          num_inference_steps: 28,
          width: frameSize.width,
          height: frameSize.height,
          model: generationModel as any,
        });

        if (response.success && response.data) {
          const generatedAsset = response.data;
          const fullUrl = apiClient.getAssetUrl(generatedAsset);

          // Calculate smart positioning - find empty space or use center
          let x = 200;
          let y = 200;
          
          // If there are existing nodes, place to the right of the last one
          const existingNodes = nodes.filter(n => n.type === 'image');
          if (existingNodes.length > 0) {
            const lastNode = existingNodes[existingNodes.length - 1];
            x = lastNode.x + lastNode.width + 50;
            y = lastNode.y;
          }

          // Add generated image to canvas using actual output dimensions
          const newNode = {
            type: 'image' as const,
            assetId: generatedAsset.id,
            url: fullUrl,
            x,
            y,
            width: generatedAsset.width || frameSize.width,
            height: generatedAsset.height || frameSize.height,
            rotation: 0,
            opacity: 1,
            locked: false,
          };

          addNode(newNode);
          addGeneratedAssetId(generatedAsset.id);

          toast.success('AI image generated!', {
            id: toastId,
            description: 'New image added to canvas and library',
          });
          
          // Reload assets in background without blocking
          loadAssets().catch(err => console.warn('Asset reload failed:', err));
          setPrompt('');
        } else {
          throw new Error(response.error || 'Generation failed');
        }
      } else {
        // Image-to-image: Generate from selected images
        const assetIds = selectedImageNodes.map(node => node.assetId).filter(Boolean) as string[];
        console.log('🚀 Starting image-to-image generation:', {
          selectedImageNodesCount: selectedImageNodes.length,
          assetIds,
          prompt: finalPrompt,
          frameSize,
          enhanced: useEnhancer
        });
        console.log('📸 Selected images will be used as VISUAL REFERENCES for AI generation');
        console.log('🎨 The AI will analyze these images and apply your prompt to them');

        // Check for dimension mismatch before generation
        if (checkDimensionMismatch()) {
          return; // prevent generation until user fixes selection
        }

        const loadingMessage = assetIds.length > 1 
          ? `🎨 Merging ${assetIds.length} images into one...`
          : 'Generating from image...';
        
        setGenerating(true, loadingMessage);
        const toastId = toast.loading(loadingMessage, {
          description: finalPrompt.substring(0, 60) + (finalPrompt.length > 60 ? '...' : ''),
        });

        const response = await apiClient.generateFromMultipleImages({
          assetIds: assetIds,
          prompt: finalPrompt,
          width: frameSize.width,
          height: frameSize.height,
          model: generationModel as any,
        });

        if (response.success && response.data) {
          const generatedAsset = response.data;
          const fullUrl = apiClient.getAssetUrl(generatedAsset);

          // Calculate position - place to the right of the rightmost selected image
          const firstNode = selectedImageNodes[0];
          
          // Find the rightmost edge of all selected images
          const rightmostX = Math.max(...selectedImageNodes.map(n => n.x + n.width));
          const avgY = selectedImageNodes.reduce((sum, n) => sum + n.y, 0) / selectedImageNodes.length;
          
          const x = rightmostX + 50; // 50px gap from rightmost image
          const y = avgY;

          // Add generated image to canvas using actual output dimensions
          const newNode = {
            type: 'image' as const,
            assetId: generatedAsset.id,
            url: fullUrl,
            x,
            y,
            width: generatedAsset.width || frameSize.width,
            height: generatedAsset.height || frameSize.height,
            rotation: 0,
            opacity: 1,
            locked: false,
          };

          addNode(newNode);
          addGeneratedAssetId(generatedAsset.id);

          const successMessage = assetIds.length > 1
            ? `✨ ${assetIds.length} images merged into one!`
            : 'AI image generated!';
          
          toast.success(successMessage, {
            id: toastId,
            description: 'New image added to canvas and library',
          });
          
          // Reload assets in background without blocking
          loadAssets().catch(err => console.warn('Asset reload failed:', err));
          setPrompt('');
        } else {
          throw new Error(response.error || 'Generation failed');
        }
      }
    } catch (error: any) {
      console.error('Generation error:', error);
      const message = error?.message || 'Failed to generate image';
      setError(message);
      toast.error('Failed to generate image', {
        description: message,
      });
    } finally {
        setGenerating(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-3xl px-4">
      <div className="bg-card border border-border rounded-[24px] shadow-xl p-3">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Collapsible prompt bar above model/settings row */}
          {(showPromptInput || canvasMode === 'chat') && (
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={
                  selectedImageNodes.length === 0
                    ? 'Describe the image you want to create...'
                    : selectedImageNodes.length > 1
                    ? `Describe how to merge these ${selectedImageNodes.length} images...`
                    : 'What do you want to change?'
                }
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="pl-10 pr-4 border bg-background focus-visible:ring-1 h-12 text-base rounded-xl"
              />
            </div>
          )}
          
          <div className="flex items-center gap-3">
            {/* Model selector */}
            <div className="w-44">
              <Select value={generationModel} onValueChange={(v) => setGenerationModel(v as any)}>
                <SelectTrigger className="h-12 rounded-full">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flux-kontext">FLUX Kontext</SelectItem>
                  <SelectItem value="flux-pro">FLUX Pro</SelectItem>
                  <SelectItem value="fal-schnell">Fal Schnell</SelectItem>
                  <SelectItem value="nano-banana">Nano Banana (Gemini Edit)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Kontext Mode Selector (only for Flux Kontext) */}
            {generationModel === 'flux-kontext' && (
              <div className="w-56">
                <Select value={kontextMode} onValueChange={(v) => setKontextMode(v as any)}>
                  <SelectTrigger className="h-12 rounded-full">
                    <SelectValue placeholder="Kontext mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image-edit">Image Editing</SelectItem>
                    <SelectItem value="character">Character Consistency</SelectItem>
                    <SelectItem value="text">Text Editing</SelectItem>
                    <SelectItem value="style">Style Transformation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Selected images preview */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selectedImageNodes.length > 0 && (
                <div className="flex gap-2 items-center pl-2 max-w-xs overflow-x-auto scrollbar-thin scrollbar-thumb-primary/50 scrollbar-track-transparent">
                  {selectedImageNodes.map((node, index) => (
                    <div
                      key={node.id}
                      className="relative w-8 h-8 rounded-lg overflow-hidden border-2 border-primary/20 flex-shrink-0"
                      title={`Image ${index + 1} of ${selectedImageNodes.length}`}
                    >
                      <img
                        src={node.url}
                        alt={`Selected ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Chat Toggle Button */}
              <Button
                type="button"
                size="lg"
                variant={canvasMode === 'chat' ? 'default' : 'outline'}
                disabled={isEnhancing || isGenerating}
                onClick={() => {
                  if (canvasMode === 'chat') {
                    setCanvasMode('select');
                    setShowPromptInput(false);
                  } else {
                    setCanvasMode('chat');
                    setShowPromptInput(true);
                  }
                }}
                className="rounded-full h-12 px-4"
                title={canvasMode === 'chat' ? 'Switch to Select Mode' : 'Switch to Chat Mode'}
              >
                <MessageSquareText className="w-4 h-4" />
              </Button>

              {/* Drag & Drop Toggle Button */}
              <Button
                type="button"
                size="lg"
                variant={canvasMode === 'dragdrop' ? 'default' : 'outline'}
                disabled={isEnhancing || isGenerating}
                onClick={() => {
                  if (canvasMode === 'dragdrop') {
                    setCanvasMode('select');
                    setShowPromptInput(false);
                  } else {
                    setCanvasMode('dragdrop');
                    setShowPromptInput(false);
                  }
                }}
                className="rounded-full h-12 px-4"
                title={canvasMode === 'dragdrop' ? 'Switch to Select Mode' : 'Switch to Auto-Generate Mode'}
              >
                <Move className="w-4 h-4" />
              </Button>

              {/* Enhance button */}
              <Button
                type="button"
                size="lg"
                variant={useEnhancer ? 'default' : 'outline'}
                disabled={!prompt.trim() || isEnhancing || isGenerating}
                onClick={() => {
                  if (useEnhancer) {
                    handleEnhance();
                  } else {
                    setUseEnhancer(true);
                  }
                }}
                className="rounded-full h-12 px-4"
                title={useEnhancer ? 'Auto-enhance enabled (click to disable)' : 'Click to enhance prompt'}
              >
                {isEnhancing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className={`w-4 h-4 ${useEnhancer ? '' : 'text-muted-foreground'}`} />
                )}
              </Button>

              {/* Creative Pro button */}
              {selectedImageNodes.length === 1 && (
                <Button
                  type="button"
                  size="lg"
                  variant={creativeProMode ? 'default' : 'outline'}
                  disabled={isGenerating}
                  onClick={() => {
                    if (creativeProMode) {
                      handleCreativeProGeneration();
                    } else {
                      setCreativeProMode(true);
                    }
                  }}
                  className="rounded-full h-12 px-4"
                  title={creativeProMode ? 'Generate Creative Pro images' : 'Enable Creative Pro mode'}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Zap className={`w-4 h-4 ${creativeProMode ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              )}

              {/* Dual Image AI Ideas button */}
              {selectedImageNodes.length === 2 && (
                <Button
                  type="button"
                  size="lg"
                  variant={dualImageMode ? 'default' : 'outline'}
                  disabled={isGenerating}
                  onClick={() => {
                    if (dualImageMode) {
                      handleDualImageIdeas();
                    } else {
                      setDualImageMode(true);
                    }
                  }}
                  className="rounded-full h-12 px-4"
                  title={dualImageMode ? 'Generate AI ideas from 2 images' : 'Enable Dual Image AI mode'}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Brain className={`w-4 h-4 ${dualImageMode ? '' : 'text-muted-foreground'}`} />
                  )}
                </Button>
              )}

   
              {/* Submit button */}
              <Button
                type="submit"
                size="lg"
                disabled={!prompt.trim() || isGenerating || dimMismatchOpen}
                className="rounded-full h-12 px-6"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Dual Image Ideas Display */}
        {dualImageMode && generatedIdeas.length > 0 && (
          <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-primary">🤖 AI-Generated Ideas</h3>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => {
                  setDualImageMode(false);
                  setGeneratedIdeas([]);
                }}
                className="text-xs"
              >
                Close
              </Button>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {generatedIdeas.map((idea, index) => (
                <div
                  key={idea.id}
                  className="p-3 bg-background rounded-md border hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => handleGenerateFromIdea(idea)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground truncate">
                        {idea.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {idea.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                          {idea.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Click to generate
                        </span>
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="ml-2 h-8 px-3 text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateFromIdea(idea);
                      }}
                      disabled={isGenerating}
                    >
                      {isGenerating ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
   
        {/* Help text */}
        {canvasMode === 'dragdrop' ? (
          <p className="text-xs text-blue-600/70 text-center mt-2">
            <span className="font-semibold">🎯 Auto-Generate Mode</span> • Click to generate 5 creative artistic images automatically
            {useEnhancer && <span className="font-medium"> • ✨ Auto-enhance ON</span>}
          </p>
        ) : canvasMode === 'chat' ? (
          selectedImageNodes.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center mt-2">
              💬 Chat Mode • Select a single image to chat with for generation
              {useEnhancer && <span className="text-primary"> • ✨ Auto-enhance ON</span>}
            </p>
          ) : selectedImageNodes.length === 1 ? (
            <p className="text-xs text-primary/70 text-center mt-2">
              <span className="font-semibold">💬 Chat with Image</span> • Describe how to modify the selected image
              {useEnhancer && <span className="font-medium"> • ✨ Auto-enhance ON</span>}
            </p>
          ) : (
            <p className="text-xs text-destructive/70 text-center mt-2">
              ⚠️ Chat Mode • Please select only one image to chat with
            </p>
          )
        ) : (
          <>
            {selectedImageNodes.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Text-to-image mode • Or select images on the canvas for AI variations
                {useEnhancer && <span className="text-primary"> • ✨ Auto-enhance ON</span>}
              </p>
            )}
            {selectedImageNodes.length > 0 && (
              <p className="text-xs text-primary/70 text-center mt-2">
                {selectedImageNodes.length === 2 ? (
                  <>
                    <span className="font-semibold">🤖 Dual Image AI Mode</span> • 2 images will be analyzed by Gemini AI to generate creative ideas
                    {dualImageMode && <span className="font-medium text-blue-600"> • 🧠 AI Ideas Available</span>}
                    {useEnhancer && <span className="font-medium"> • ✨ Auto-enhance ON</span>}
                  </>
                ) : selectedImageNodes.length > 2 ? (
                  <>
                    <span className="font-semibold">🎨 Merge Mode</span> • {selectedImageNodes.length} images will be used as visual references and merged
                    {useEnhancer && <span className="font-medium"> • ✨ Auto-enhance ON</span>}
                  </>
                ) : (
                  <>
                    <span className="font-semibold">🖼️ Image-to-Image</span> • Selected image will be used as reference for AI generation
                    {creativeProMode && <span className="font-medium text-yellow-600"> • ⚡ Creative Pro Mode</span>}
                    {useEnhancer && <span className="font-medium"> • ✨ Auto-enhance ON</span>}
                  </>
                )}
              </p>
            )}
            {creativeProMode && selectedImageNodes.length === 1 && (
              <p className="text-xs text-yellow-600/80 text-center mt-2">
                <span className="font-semibold">⚡ Creative Pro Mode</span> • Will generate 25 images across 5 categories: Marketing, Festive, Billboard, Model, Creative
              </p>
            )}
          </>
        )}
      </div>
   
      {/* Dimension mismatch modal */}
      <Dialog open={dimMismatchOpen} onOpenChange={setDimMismatchOpen}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>Use images with similar dimensions</DialogTitle>
            <DialogDescription>
              {dimMismatchMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setDimMismatchOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};