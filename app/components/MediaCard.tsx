import { Check, Film, Tv, Music, Star } from 'lucide-react';
import type { JellyfinItem } from '~/types/jellyfin';

interface MediaCardProps {
  item: JellyfinItem;
  imageUrl: string | null;
  isSelected: boolean;
  onToggle: () => void;
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

export function MediaCard({ item, imageUrl, isSelected, onToggle }: MediaCardProps) {
  const TypeIcon = getTypeIcon(item.Type);
  const duration = formatDuration(item.RunTimeTicks);

  return (
    <div
      onClick={onToggle}
      className={`
        group relative rounded-lg overflow-hidden cursor-pointer transition-all duration-300
        ${isSelected 
          ? 'ring-2 ring-primary shadow-glow scale-[1.02]' 
          : 'hover:scale-[1.02] hover:shadow-card'
        }
      `}
    >
      {/* Image Container */}
      <div className="aspect-[2/3] relative bg-secondary">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.Name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary to-muted">
            <TypeIcon className="w-12 h-12 text-muted-foreground" />
          </div>
        )}

        {/* Selection Overlay */}
        <div
          className={`
            absolute inset-0 transition-all duration-200
            ${isSelected 
              ? 'bg-primary/20' 
              : 'bg-transparent group-hover:bg-background/10'
            }
          `}
        />

        {/* Selection Checkbox */}
        <div
          className={`
            absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center
            transition-all duration-200
            ${isSelected 
              ? 'gradient-primary shadow-glow' 
              : 'bg-background/60 backdrop-blur-sm opacity-0 group-hover:opacity-100'
            }
          `}
        >
          <Check className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-foreground'}`} />
        </div>

        {/* Rating Badge */}
        {item.CommunityRating && (
          <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full bg-background/80 backdrop-blur-sm">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span className="text-xs font-medium">{item.CommunityRating.toFixed(1)}</span>
          </div>
        )}

        {/* Gradient Overlay */}
        <div className="absolute bottom-0 left-0 right-0 h-24 gradient-overlay" />

        {/* Info at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon className="w-3 h-3 text-primary" />
            {item.ProductionYear && (
              <span className="text-xs text-muted-foreground">{item.ProductionYear}</span>
            )}
            {duration && (
              <span className="text-xs text-muted-foreground">{duration}</span>
            )}
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="p-3 bg-card">
        <h3 className="font-medium text-sm text-foreground truncate  title={item.Name}">
          {item.Name}
        </h3>
        {item.SeriesName && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {item.SeriesName}
            {item.SeasonName && ` • ${item.SeasonName}`}
          </p>
        )}
      </div>
    </div>
  );
}
