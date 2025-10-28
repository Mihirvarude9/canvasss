import { useState, useRef, useEffect } from 'react';
import { Upload, Search, Image as ImageIcon, Video, X, Type as TypeIcon, Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectSelector } from '@/components/ProjectSelector';
import { Input } from '@/components/ui/input';
import { useCanvasStore } from '@/store/canvasStore';
import { useAssets } from '@/hooks/useAssets';
import { apiClient } from '@/services/api';
import { Asset } from '@/services/types';
import { toast } from 'sonner';
import { saveAllGeneratedImages } from '@/utils/exportCanvas';

interface LibraryProps {
  defaultTab?: 'images' | 'videos';
}

export const Library = ({ defaultTab = 'images' }: LibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'images' | 'videos'>(defaultTab);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { addNode, aiGeneratedAssetIds } = useCanvasStore();
  const { assets, uploadAsset, deleteAsset, isLoading, loadAssets } = useAssets();

  // Load assets when component mounts
  useEffect(() => {
    console.log('Loading assets...');
    loadAssets();
  }, [loadAssets]);

  // Test image loading
  useEffect(() => {
    const testImage = new Image();
    testImage.crossOrigin = 'anonymous';
    testImage.onload = () => {
      console.log('✅ Test image loaded successfully');
    };
    testImage.onerror = (e) => {
      console.error('❌ Test image failed to load:', e);
    };
    testImage.src = 'https://cycloidal-enrico-nonremedially.ngrok-free.dev/uploads/thumbnails/oQA0IVXLGwKKxI379WDdD-thumb.jpg';
  }, []);

  // Keep activeTab in sync with parent prop (e.g., switching between pages)
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  // Listen for global events to switch tabs from SideNav
  useEffect(() => {
    const onSetTab = (e: Event) => {
      const detail = (e as CustomEvent<'images' | 'videos'>).detail;
      if (detail === 'images' || detail === 'videos') {
        setActiveTab(detail);
        document.getElementById('library-root')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };
    window.addEventListener('library:setTab', onSetTab as EventListener);
    const onOpenUpload = () => {
      // Ensure visible tab (images default) and trigger file picker
      setActiveTab('images');
      document.getElementById('library-root')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      setTimeout(() => fileInputRef.current?.click(), 50);
    };
    window.addEventListener('library:openUpload', onOpenUpload);
    return () => {
      window.removeEventListener('library:setTab', onSetTab as EventListener);
      window.removeEventListener('library:openUpload', onOpenUpload);
    };
  }, []);

  useEffect(() => {
    console.log('📚 Library assets updated:', assets.length, 'total assets');
    console.log('📚 AI Generated assets:', assets.filter(asset => aiGeneratedAssetIds.includes(asset.id)).length);
    console.log('📚 All assets:', assets.map(a => ({ id: a.id, name: a.name, type: a.type, isAI: aiGeneratedAssetIds.includes(a.id) })));
  }, [assets, aiGeneratedAssetIds]);
  
  const filteredAssets = assets.filter(asset => {
    const matchesType = activeTab === 'images' ? asset.type === 'image' : asset.type === 'video';
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesType && matchesSearch;
  });

  console.log('Filtered assets for tab', activeTab, ':', filteredAssets);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('Files selected:', Array.from(files).map(f => ({ name: f.name, type: f.type, size: f.size })));

    for (const file of Array.from(files)) {
      console.log('Processing file:', file.name, file.type, file.size);
      
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        console.log('Invalid file type:', file.type);
        toast.error(`${file.name} is not a valid image or video file`);
        continue;
      }

      try {
        console.log('Uploading file:', file.name, file.size, file.type);
        const uploadedAsset = await uploadAsset(file, {
          name: file.name,
          tags: [],
        });

        console.log('Upload result:', uploadedAsset);

        if (uploadedAsset) {
          toast.success(`${file.name} uploaded successfully`);
          // Reload assets to show the new upload
          await loadAssets();
        }
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}`);
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragStart = (asset: Asset, e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    
    // Add video-specific data for video canvas
    if (asset.type === 'video') {
      e.dataTransfer.setData('video/url', apiClient.getAssetUrl(asset));
      e.dataTransfer.setData('video/name', asset.name);
      console.log('Dragging video:', asset.name, apiClient.getAssetUrl(asset));
    }
  };

  const handleAddToCanvas = (asset: Asset) => {
    console.log('Adding asset to canvas:', asset);
    addNode({
      type: asset.type,
      assetId: asset.id,
      url: apiClient.getAssetUrl(asset),
      x: 100,
      y: 100,
      width: asset.width,
      height: asset.height,
      rotation: 0,
      opacity: 1,
      locked: false,
    });
    toast.success('Added to canvas');
  };

  const handleRemoveAsset = async (asset: Asset) => {
    try {
      const success = await deleteAsset(asset.id);
      if (success) {
        toast.success('Asset removed');
        await loadAssets();
      }
    } catch (error) {
      toast.error('Failed to remove asset');
    }
  };

  const handleSaveAllGenerated = async () => {
    try {
      const generatedAssets = assets.filter(asset => 
        aiGeneratedAssetIds.includes(asset.id) && asset.type === 'image'
      );

      if (generatedAssets.length === 0) {
        toast.error('No generated images found to save');
        return;
      }

      toast.loading(`Saving ${generatedAssets.length} generated images...`);
      await saveAllGeneratedImages(assets, aiGeneratedAssetIds);
      toast.success(`Successfully saved ${generatedAssets.length} generated images!`);
    } catch (error: any) {
      console.error('Save all generated images error:', error);
      toast.error('Failed to save generated images', {
        description: error.message || 'Please try again'
      });
    }
  };

  // Open generated gallery when side-nav magic button clicked
  useEffect(() => {
    const onOpenGenerated = () => {
      setActiveTab('images');
      setSearchQuery('');
      // Scroll and highlight generated assets by reordering view
      document.getElementById('library-root')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    window.addEventListener('gallery:openGenerated', onOpenGenerated);
    return () => window.removeEventListener('gallery:openGenerated', onOpenGenerated);
  }, []);

  return (
    <div className="w-80 h-full border-r border-sidebar-border bg-sidebar flex flex-col">
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Library</h2>
          <ProjectSelector />
        </div>
        
        <div className="flex gap-2 mb-3" id="library-root">
          <Button
            variant={activeTab === 'images' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('images')}
            className="flex-1"
            data-lib-tab="images"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Images
          </Button>
          <Button
            variant={activeTab === 'videos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('videos')}
            className="flex-1"
            data-lib-tab="videos"
          >
            <Video className="w-4 h-4 mr-2" />
            Videos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              // Add a default text node to the canvas via store (image canvas)
              try {
                const { addNode } = require('@/store/canvasStore');
                const useCanvasStore = (require('@/store/canvasStore').useCanvasStore);
                const state = useCanvasStore.getState();
                state.addNode({
                  type: 'text',
                  x: 200,
                  y: 200,
                  width: 400,
                  height: 80,
                  rotation: 0,
                  opacity: 1,
                  locked: false,
                  text: 'Add a heading',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: 48,
                  fontWeight: 700,
                  fill: '#111827',
                  textAlign: 'left',
                });
              } catch {}
            }}
            title="Add Text"
          >
            <TypeIcon className="w-4 h-4 mr-2" />
            Text
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Save All Generated Images Button */}
        {assets.filter(asset => aiGeneratedAssetIds.includes(asset.id) && asset.type === 'image').length > 0 && (
          <div className="mt-3">
            <Button
              onClick={handleSaveAllGenerated}
              className="w-full gap-2"
              variant="outline"
              size="sm"
            >
              <Download className="w-4 h-4" />
              Save All Generated ({assets.filter(asset => aiGeneratedAssetIds.includes(asset.id) && asset.type === 'image').length})
            </Button>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading assets...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              {assets.length === 0 ? 'Upload assets to start building your board' : 'No assets found'}
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredAssets
              .slice()
              .sort((a, b) => {
                const aGen = aiGeneratedAssetIds.includes(a.id) ? 0 : 1;
                const bGen = aiGeneratedAssetIds.includes(b.id) ? 0 : 1;
                return aGen - bGen; // generated first
              })
              .map((asset) => {
                const thumbnailUrl = apiClient.getThumbnailUrl(asset);
                const mainImageUrl = apiClient.getAssetUrl(asset);
                // Add cache-busting parameter to force fresh requests
                const cacheBustedThumbnailUrl = `${thumbnailUrl}?v=${Date.now()}`;
                const cacheBustedMainUrl = `${mainImageUrl}?v=${Date.now()}`;
                console.log('🖼️ Rendering asset:', asset.name, 'thumbnail:', cacheBustedThumbnailUrl, 'main:', cacheBustedMainUrl);
                return (
              <div
                key={asset.id}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                draggable
                onDragStart={(e) => handleDragStart(asset, e)}
                onClick={() => handleAddToCanvas(asset)}
              >
                <img
                  src={cacheBustedThumbnailUrl}
                  alt={asset.name}
                  className="w-full h-full object-cover"
                  onLoad={() => {
                    console.log('✅ Library thumbnail loaded:', cacheBustedThumbnailUrl);
                  }}
                  onError={(e) => {
                    console.warn('⚠️ Library thumbnail failed, falling back to main image:', cacheBustedThumbnailUrl);
                    console.warn('⚠️ Error details:', e);
                    console.warn('⚠️ Error type:', e.type);
                    console.warn('⚠️ Error target:', e.target);
                    // Fallback to main image if thumbnail fails to load
                    const target = e.target as HTMLImageElement;
                    console.log('🔄 Falling back to main image:', cacheBustedMainUrl);
                    if (target.src !== cacheBustedMainUrl) {
                      target.src = cacheBustedMainUrl;
                    }
                  }}
                />
                {aiGeneratedAssetIds.includes(asset.id) && (
                  <div className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground">AI</div>
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {asset.type === 'video' && (
                      <Video className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAsset(asset);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                  <p className="text-xs text-white truncate">{asset.name}</p>
                </div>
              </div>
                );
              })}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button onClick={() => fileInputRef.current?.click()} className="w-full">
          <Upload className="w-4 h-4 mr-2" />
          Upload Files
        </Button>
      </div>
    </div>
  );
};