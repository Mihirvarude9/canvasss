import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface FrameSize {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const FRAME_SIZES: FrameSize[] = [
  { label: 'Square (1:1)', width: 1024, height: 1024, aspectRatio: '1:1' },
  { label: 'Portrait (2:3)', width: 768, height: 1152, aspectRatio: '2:3' },
  { label: 'Portrait (3:4)', width: 768, height: 1024, aspectRatio: '3:4' },
  { label: 'Portrait (9:16)', width: 576, height: 1024, aspectRatio: '9:16' },
  { label: 'Landscape (3:2)', width: 1152, height: 768, aspectRatio: '3:2' },
  { label: 'Landscape (4:3)', width: 1024, height: 768, aspectRatio: '4:3' },
  { label: 'Landscape (16:9)', width: 1024, height: 576, aspectRatio: '16:9' },
  { label: 'Ultra Wide (21:9)', width: 1344, height: 576, aspectRatio: '21:9' },
];

interface FrameSizeSelectorProps {
  value?: FrameSize;
  onChange: (size: FrameSize) => void;
  className?: string;
}

export const FrameSizeSelector = ({
  value = FRAME_SIZES[0],
  onChange,
  className = '',
}: FrameSizeSelectorProps) => {
  const [selectedSize, setSelectedSize] = useState<FrameSize>(value);

  const handleChange = (sizeLabel: string) => {
    const size = FRAME_SIZES.find((s) => s.label === sizeLabel);
    if (size) {
      setSelectedSize(size);
      onChange(size);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Maximize2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <Select value={selectedSize.label} onValueChange={handleChange}>
        <SelectTrigger className="h-10 min-w-[140px] border-0 bg-muted/50 hover:bg-muted focus:ring-1">
          <SelectValue placeholder="Select size" />
        </SelectTrigger>
        <SelectContent>
          {FRAME_SIZES.map((size) => (
            <SelectItem key={size.label} value={size.label}>
              <div className="flex items-center justify-between gap-3">
                <span>{size.label}</span>
                <span className="text-xs text-muted-foreground">
                  {size.width}×{size.height}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

