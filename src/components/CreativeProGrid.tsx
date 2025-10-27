import { useState, useEffect } from 'react';
import { Asset } from '@/services/types';
import { Button } from '@/components/ui/button';
import { X, Download, Grid, List, Loader2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CreativeProGridProps {
  assets: Asset[];
  isOpen: boolean;
  onClose: () => void;
  onAddToCanvas: (asset: Asset) => void;
  onAddAllToCanvas: (assets: Asset[]) => void;
}

export const CreativeProGrid = ({ assets, isOpen, onClose, onAddToCanvas, onAddAllToCanvas }: CreativeProGridProps) => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isAddingAll, setIsAddingAll] = useState(false);

  // Group assets by category
  const groupedAssets = assets.reduce((acc, asset) => {
    const category = (asset as any).category || 'Unknown';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(asset);
    return acc;
  }, {} as Record<string, Asset[]>);

  const categories = Object.keys(groupedAssets);

  const filteredAssets = selectedCategory === 'all' 
    ? assets 
    : groupedAssets[selectedCategory] || [];

  const handleDownloadAll = async () => {
    if (assets.length === 0) {
      toast.error('No images to download');
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading('Creating ZIP file with all images...', {
      description: `Preparing ${assets.length} images for download`
    });

    try {
      // Create a zip file containing all generated images
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Add each image to the zip
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        try {
          // Fetch the image
          const response = await fetch(asset.url.startsWith('http') 
            ? asset.url 
            : `${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001'}${asset.url}`
          );
          
          if (!response.ok) {
            console.warn(`Failed to fetch image ${asset.name}:`, response.statusText);
            continue;
          }

          const blob = await response.blob();
          
          // Create organized folder structure
          const category = (asset as any).category || 'Unknown';
          const variation = (asset as any).variation || 'Variation';
          
          // Create safe filenames
          const safeCategory = category.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
          const safeVariation = variation.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_');
          const safeName = asset.name.replace(/[^a-zA-Z0-9\s\-_]/g, '').replace(/\s+/g, '_').substring(0, 50);
          
          const filename = `${safeCategory}/${safeVariation}_${safeName}_${i + 1}.jpg`;
          zip.file(filename, blob);
        } catch (error) {
          console.warn(`Failed to add image ${asset.name} to zip:`, error);
        }
      }

      // Generate and download the zip file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const link = document.createElement('a');
      link.download = `creative_pro_images_${new Date().toISOString().split('T')[0]}.zip`;
      link.href = zipUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
      
      toast.success(`Downloaded ${assets.length} images successfully!`, {
        id: toastId
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error('Failed to download images', {
        description: error.message || 'Please try again',
        id: toastId
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleAddAllToCanvas = async () => {
    if (assets.length === 0) {
      toast.error('No images to add to canvas');
      return;
    }

    setIsAddingAll(true);
    const toastId = toast.loading('Adding all images to canvas in grid layout...', {
      description: `Placing ${assets.length} images in a perfect grid`
    });

    try {
      // Calculate grid layout (5x5 for 25 images)
      const gridSize = Math.ceil(Math.sqrt(assets.length));
      const spacing = 120; // Space between images
      const startX = 100;
      const startY = 100;

      // Add all images to canvas in grid layout
      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const row = Math.floor(i / gridSize);
        const col = i % gridSize;
        
        const x = startX + (col * spacing);
        const y = startY + (row * spacing);

        onAddToCanvas({
          ...asset,
          x,
          y,
          width: 100, // Standard size for grid
          height: 100,
        });
      }

      toast.success(`Added ${assets.length} images to canvas in grid layout!`, {
        id: toastId
      });
    } catch (error: any) {
      console.error('Add all to canvas error:', error);
      toast.error('Failed to add images to canvas', {
        description: error.message || 'Please try again',
        id: toastId
      });
    } finally {
      setIsAddingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold">Creative Pro Results</h2>
            <p className="text-muted-foreground">
              {assets.length} images generated across {categories.length} categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={handleDownloadAll}
              disabled={isDownloading || assets.length === 0}
              className="gap-2"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {isDownloading ? 'Creating ZIP...' : 'Download All'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAddAllToCanvas}
              disabled={isAddingAll || assets.length === 0}
              className="gap-2"
            >
              {isAddingAll ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <LayoutGrid className="w-4 h-4" />
              )}
              {isAddingAll ? 'Adding to Canvas...' : 'Add All to Canvas'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
            >
              All ({assets.length})
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category} ({groupedAssets[category].length})
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="group relative aspect-square rounded-lg overflow-hidden bg-muted cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => onAddToCanvas(asset)}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                    {(asset as any).category || 'Unknown'}
                  </div>
                  
                  {/* Variation Badge */}
                  <div className="absolute top-2 right-2 bg-secondary text-secondary-foreground text-xs px-2 py-1 rounded-full">
                    {(asset as any).variation || 'Variation'}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary">
                        Add to Canvas
                      </Button>
                    </div>
                  </div>
                  
                  {/* Index Number */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                    #{index + 1}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssets.map((asset, index) => (
                <div
                  key={asset.id}
                  className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                  onClick={() => onAddToCanvas(asset)}
                >
                  <img
                    src={asset.url}
                    alt={asset.name}
                    className="w-16 h-16 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{asset.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {(asset as any).category} - {(asset as any).variation}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Add to Canvas
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Click any image to add it to your canvas
            </p>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAddAllToCanvas}
                disabled={isAddingAll || assets.length === 0}
                variant="default"
                className="gap-2"
              >
                {isAddingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LayoutGrid className="w-4 h-4" />
                )}
                {isAddingAll ? 'Adding to Canvas...' : `Add All to Canvas (${assets.length})`}
              </Button>
              <Button
                onClick={handleDownloadAll}
                disabled={isDownloading || assets.length === 0}
                variant="outline"
                className="gap-2"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {isDownloading ? 'Creating ZIP...' : `Download All (${assets.length})`}
              </Button>
              <Button onClick={onClose} variant="outline">
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
