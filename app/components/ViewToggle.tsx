import { LayoutGrid, List } from 'lucide-react';
import { Button } from '~/components/ui/button';

export type ViewMode = 'grid' | 'list';

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewModeChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-border p-1 bg-secondary/50">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('grid')}
        className={`
          px-3 py-1.5 h-auto transition-all
          ${viewMode === 'grid' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
          }
        `}
      >
        <LayoutGrid className="w-4 h-4 mr-1.5" />
        Grid
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={`
          px-3 py-1.5 h-auto transition-all
          ${viewMode === 'list' 
            ? 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground' 
            : 'text-muted-foreground hover:text-foreground hover:bg-transparent'
          }
        `}
      >
        <List className="w-4 h-4 mr-1.5" />
        Lista
      </Button>
    </div>
  );
}
