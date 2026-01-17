import { Loader2, SearchX } from "lucide-react";
import { MediaCard } from "./MediaCard";
import type { JellyfinItem } from "~/types/jellyfin";

interface MediaGridProps {
  items: JellyfinItem[];
  selectedIds: Set<string>;
  onToggleItem: (item: JellyfinItem) => void;
  getImageUrl: (item: JellyfinItem) => string | null;
  loading: boolean;
}

export function MediaGrid({
  items,
  selectedIds,
  onToggleItem,
  getImageUrl,
  loading,
}: MediaGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Carregando biblioteca...</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
        <SearchX className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="font-display text-xl font-semibold text-foreground mb-2">
          Nenhum item encontrado
        </h3>
        <p className="text-muted-foreground text-center max-w-md">
          Nao foram encontrados itens na biblioteca selecionada. Tente
          selecionar outra biblioteca ou verifique as configuracoes.
        </p>
      </div>
    );
  }

  return (
    // <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
    <div className="
      grid 
      grid-cols-2 
      
      gap-4
    ">
      {items.map((item, index) => (
        <div
          key={item.Id}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
        >
          <MediaCard
            item={item}
            imageUrl={getImageUrl(item)}
            isSelected={selectedIds.has(item.Id)}
            onToggle={() => onToggleItem(item)}
          />
        </div>
      ))}
    </div>
  );
}
