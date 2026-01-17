import { Check, Film, Tv, Music, Star, Clock } from 'lucide-react';
import type { JellyfinItem } from '~/types/jellyfin';

interface MediaListProps {
  items: JellyfinItem[];
  selectedIds: Set<string>;
  onToggleItem: (item: JellyfinItem) => void;
  getImageUrl: (item: JellyfinItem) => string | null;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'Movie':
      return Film;
    case 'Series':
    case 'Episode':
      return Tv;
    case 'Audio':
    case 'MusicAlbum':
      return Music;
    default:
      return Film;
  }
};

const formatDuration = (ticks?: number) => {
  if (!ticks) return null;
  const minutes = Math.floor(ticks / 600000000);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${remainingMinutes}m`;
  }
  return `${minutes}m`;
};

export function MediaList({ items, selectedIds, onToggleItem, getImageUrl }: MediaListProps) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => {
        const TypeIcon = getTypeIcon(item.Type);
        const imageUrl = getImageUrl(item);
        const isSelected = selectedIds.has(item.Id);
        const duration = formatDuration(item.RunTimeTicks);

        return (
          <div
            key={item.Id}
            onClick={() => onToggleItem(item)}
            className={`
              flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all duration-200
              animate-fade-in
              ${isSelected 
                ? 'bg-primary/10 ring-1 ring-primary shadow-glow' 
                : 'bg-card hover:bg-card-hover'
              }
            `}
            style={{ animationDelay: `${Math.min(index * 20, 200)}ms` }}
          >
            {/* Selection Checkbox */}
            <div
              className={`
                w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center
                transition-all duration-200
                ${isSelected 
                  ? 'gradient-primary shadow-glow' 
                  : 'bg-secondary border border-border'
                }
              `}
            >
              {isSelected && <Check className="w-4 h-4 text-primary-foreground" />}
            </div>

            {/* Thumbnail */}
            <div className="w-12 h-16 rounded bg-secondary flex-shrink-0 overflow-hidden">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={item.Name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <TypeIcon className="w-5 h-5 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-foreground line-clamp-2">
                {item.Name}
              </h3>
              <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TypeIcon className="w-3.5 h-3.5 text-primary" />
                  {item.Type}
                </span>
                {item.ProductionYear && (
                  <span>{item.ProductionYear}</span>
                )}
                {item.SeriesName && (
                  <span className="truncate">{item.SeriesName}</span>
                )}
              </div>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-4 flex-shrink-0">
              {item.CommunityRating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-warning fill-warning" />
                  <span className="text-foreground font-medium">
                    {item.CommunityRating.toFixed(1)}
                  </span>
                </div>
              )}
              {duration && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{duration}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
