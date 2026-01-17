import { useState } from "react";
import {
  ListMusic,
  X,
  Trash2,
  Loader2,
  Film,
  Tv,
  Music,
  Save,
  Check,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { ScrollArea } from "~/components/ui/scroll-area";
import type { JellyfinItem } from "~/types/jellyfin";

interface PlaylistEditPanelProps {
  playlistName: string;
  playlistId: string | null;
  selectedItems: JellyfinItem[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  onUpdatePlaylist: (
    id: string,
    name: string,
    itemIds: string[]
  ) => Promise<boolean>;
  onNameChange: (name: string) => void;
  getImageUrl: (item: JellyfinItem) => string | null;
}

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

export function PlaylistEditPanel({
  playlistName,
  playlistId,
  selectedItems,
  onRemoveItem,
  onClearAll,
  onUpdatePlaylist,
  onNameChange,
  getImageUrl,
}: PlaylistEditPanelProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    if (!playlistId || !playlistName.trim() || selectedItems.length === 0) return;

    setIsSaving(true);
    const result = await onUpdatePlaylist(
      playlistId,
      playlistName,
      selectedItems.map((item) => item.Id)
    );
    setIsSaving(false);

    if (result) {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
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
                Editar Playlist
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
            onChange={(e) => onNameChange(e.target.value)}
            className="bg-sidebar-accent border-sidebar-border focus:border-primary focus:ring-primary/20"
          />
          <Button
            onClick={handleSave}
            disabled={!playlistName.trim() || selectedItems.length === 0 || isSaving || !playlistId}
            className="w-full gradient-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : success ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
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
                {playlistId 
                  ? "Esta playlist está vazia. Adicione itens da biblioteca." 
                  : "Selecione uma playlist para editar."}
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
                    {/* Remove Button */}
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