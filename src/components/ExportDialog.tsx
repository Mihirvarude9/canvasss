import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileImage, FileType, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export type ExportFormat = 'png' | 'jpg' | 'svg' | 'pdf';
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (options: ExportOptions) => Promise<void>;
}

export interface ExportOptions {
  format: ExportFormat;
  quality: ExportQuality;
  filename: string;
  scale: number;
  backgroundColor: string;
  includeGrid: boolean;
}

const QUALITY_SETTINGS = {
  low: { scale: 1, jpegQuality: 0.6, description: 'Fast, smaller file size' },
  medium: { scale: 2, jpegQuality: 0.8, description: 'Balanced quality and size' },
  high: { scale: 3, jpegQuality: 0.9, description: 'High quality, larger file' },
  ultra: { scale: 4, jpegQuality: 1.0, description: 'Maximum quality' },
};

export const ExportDialog = ({ open, onOpenChange, onExport }: ExportDialogProps) => {
  const [format, setFormat] = useState<ExportFormat>('png');
  const [quality, setQuality] = useState<ExportQuality>('high');
  const [filename, setFilename] = useState('canvas-export');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [includeGrid, setIncludeGrid] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!filename.trim()) {
      toast.error('Please enter a filename');
      return;
    }

    setIsExporting(true);
    try {
      const qualitySettings = QUALITY_SETTINGS[quality];
      await onExport({
        format,
        quality,
        filename: filename.trim(),
        scale: qualitySettings.scale,
        backgroundColor,
        includeGrid,
      });
      
      toast.success(`Exported as ${format.toUpperCase()}`, {
        description: `${filename}.${format} downloaded successfully`,
      });
      
      onOpenChange(false);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('Export failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Canvas
          </DialogTitle>
          <DialogDescription>
            Choose your export format and quality settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Format</Label>
            <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    format === 'png'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="png" id="png" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      <span className="font-medium">PNG</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lossless, transparent
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    format === 'jpg'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="jpg" id="jpg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileImage className="w-4 h-4" />
                      <span className="font-medium">JPG</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Smaller file size
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    format === 'svg'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="svg" id="svg" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileType className="w-4 h-4" />
                      <span className="font-medium">SVG</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Vector, scalable
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-center space-x-3 border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    format === 'pdf'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value="pdf" id="pdf" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileType className="w-4 h-4" />
                      <span className="font-medium">PDF</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Print-ready
                    </p>
                  </div>
                </label>
              </div>
            </RadioGroup>
          </div>

          {/* Quality Selection (for raster formats) */}
          {(format === 'png' || format === 'jpg') && (
            <div className="space-y-3">
              <Label htmlFor="quality" className="text-base font-semibold">
                Quality
              </Label>
              <Select value={quality} onValueChange={(v) => setQuality(v as ExportQuality)}>
                <SelectTrigger id="quality">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Low (1x)</span>
                      <span className="text-xs text-muted-foreground">
                        {QUALITY_SETTINGS.low.description}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Medium (2x)</span>
                      <span className="text-xs text-muted-foreground">
                        {QUALITY_SETTINGS.medium.description}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">High (3x)</span>
                      <span className="text-xs text-muted-foreground">
                        {QUALITY_SETTINGS.high.description}
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="ultra">
                    <div className="flex flex-col items-start">
                      <span className="font-medium">Ultra (4x)</span>
                      <span className="text-xs text-muted-foreground">
                        {QUALITY_SETTINGS.ultra.description}
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Filename */}
          <div className="space-y-3">
            <Label htmlFor="filename" className="text-base font-semibold">
              Filename
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="filename"
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="Enter filename"
                className="flex-1"
              />
              <span className="text-sm text-muted-foreground">.{format}</span>
            </div>
          </div>

          {/* Background Color (for formats that support it) */}
          {format !== 'png' && (
            <div className="space-y-3">
              <Label htmlFor="bgcolor" className="text-base font-semibold">
                Background Color
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="bgcolor"
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1 font-mono"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Options</Label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeGrid}
                onChange={(e) => setIncludeGrid(e.target.checked)}
                className="w-4 h-4 rounded border-border"
              />
              <span className="text-sm">Include grid in export</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
