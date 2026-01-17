import { useState } from "react";
import {
  ListMusic,
  Plus,
  X,
  Trash2,
  Check,
  Loader2,
  Film,
  Tv,
  Music,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { JellyfinItem } from "~/types/jellyfin";

interface PlaylistPanelProps {
  selectedItems: JellyfinItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onCreatePlaylist: (
    name: string,
    itemIds: string[],
    mediaType: "Audio" | "Video"
  ) => Promise<boolean>;
  getImageUrl: (item: JellyfinItem) => string | null;
}

const getMediaType = (items: JellyfinItem[]): "Audio" | "Video" => {
  // If any item is audio-type, return Audio; otherwise Video
  const hasAudio = items.some(
    (item) => item.Type === "Audio" || item.Type === "MusicAlbum"
  );
  return hasAudio ? "Audio" : "Video";
};

const getTypeIcon = (type: string) => {
  switch (type) {
    case "Movie":
      return Film;
    case "Series":
    case "Episode":
      return Tv;
    case "Audio":
    case "MusicAlbum":
      return Music;
    default:
      return Film;
  }
};

export function PlaylistPanel({
  selectedItems,
  onRemoveItem,
  onClearAll,
  onCreatePlaylist,
  getImageUrl,
}: PlaylistPanelProps) {
  const [playlistName, setPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleCreate = async () => {
    if (!playlistName.trim() || selectedItems.length === 0) return;

    setIsCreating(true);
    const mediaType = getMediaType(selectedItems);
    const result = await onCreatePlaylist(
      playlistName,
      selectedItems.map((item) => item.Id),
      mediaType
    );
    setIsCreating(false);

    if (result) {
      setSuccess(true);
      setPlaylistName("");
      setTimeout(() => {
        setSuccess(false);
        onClearAll();
      }, 2000);
    }
  };

  return (
    <div className="w-80 bg-sidebar border-l border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg gradient-primary shadow-glow">
              <ListMusic className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-sidebar-foreground">
                Nova Playlist
              </h2>
              <p className="text-xs text-muted-foreground">
                {selectedItems.length} {selectedItems.length === 1 ? 'item' : 'itens'}
              </p>
            </div>
          </div>
          {selectedItems.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Playlist Name Input */}
        <div className="space-y-2">
          <Input
            placeholder="Nome da playlist"
            value={playlistName}
            onChange={(e) => setPlaylistName(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border focus:border-primary focus:ring-primary/20"
          />
          <Button
            onClick={handleCreate}
            disabled={!playlistName.trim() || selectedItems.length === 0 || isCreating}
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Criando...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Criada!
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Criar Playlist
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Items List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {selectedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <ListMusic className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                Selecione itens da biblioteca para adicionar à playlist
              </p>
            </div>
          ) : (
            selectedItems.map((item, index) => {
              const TypeIcon = getTypeIcon(item.Type);
              const imageUrl = getImageUrl(item);
              
              return (
                <div
                  key={item.Id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent group animate-slide-in-right"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Thumbnail */}
                  <div className="flex flex-col items-center gap-1 flex-shrink-0">
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.Name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <TypeIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    {/* Remove Button - agora abaixo da thumbnail e sempre visível */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemoveItem(item.Id)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground break-words">
                      {item.Name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.Type}
                      {item.ProductionYear && ` • ${item.ProductionYear}`}
                    </p>
                  </div>                  
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
