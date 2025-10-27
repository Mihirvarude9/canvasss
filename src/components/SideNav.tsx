import { Type, Badge, CloudUpload, Pencil, FolderClosed, AppWindow, Wand2, Image as ImageIcon, Video as VideoIcon, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Item {
  key: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick?: () => void;
}

interface SideNavProps {
  active?: string;
  onSelect?: (key: string) => void;
}

const ITEMS_TOP: Item[] = [
  { key: 'text', label: 'Text', icon: Type },
  { key: 'brand', label: 'Brand', icon: Badge },
  { key: 'uploads', label: 'Uploads', icon: CloudUpload },
  { key: 'tools', label: 'Tools', icon: Pencil },
  { key: 'projects', label: 'Projects', icon: FolderClosed },
  { key: 'apps', label: 'Apps', icon: AppWindow },
];

const ITEMS_BOTTOM: Item[] = [
  { key: 'magic', label: 'Magic Media', icon: Wand2 },
  { key: 'photos', label: 'Photos', icon: ImageIcon },
  { key: 'videos', label: 'Videos', icon: VideoIcon },
  { key: 'charts', label: 'Charts', icon: BarChart3 },
];

export const SideNav = ({ active, onSelect }: SideNavProps) => {
  const renderItem = (item: Item) => {
    const Icon = item.icon;
    const isActive = active === item.key;
    return (
      <button
        key={item.key}
        className={cn(
          'w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm transition-colors',
          isActive ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-accent'
        )}
        onClick={() => onSelect?.(item.key)}
        title={item.label}
      >
        <Icon className="w-5 h-5" />
      </button>
    );
  };

  return (
    <div className="w-[72px] h-full border-r border-sidebar-border bg-sidebar flex flex-col items-center justify-between py-4">
      <div className="flex flex-col items-center gap-3">
        {ITEMS_TOP.map(renderItem)}
      </div>
      <div className="w-10 h-px bg-border mb-3" />
      <div className="flex flex-col items-center gap-3">
        {ITEMS_BOTTOM.map(renderItem)}
      </div>
    </div>
  );
};


