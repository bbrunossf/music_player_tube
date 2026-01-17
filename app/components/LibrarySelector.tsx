import { Film, Tv, Music, Folder, Library } from "lucide-react";
import { Button } from "~/components/ui/button";
import type { JellyfinLibrary } from "~/types/jellyfin";

interface LibrarySelectorProps {
  libraries: JellyfinLibrary[];
  selectedLibrary: string | null;
  onSelect: (libraryId: string | null) => void;
}

const getLibraryIcon = (collectionType?: string) => {
  switch (collectionType) {
    case "movies":
      return Film;
    case "tvshows":
      return Tv;
    case "music":
      return Music;
    default:
      return Folder;
  }
};

export function LibrarySelector({
  libraries,
  selectedLibrary,
  onSelect,
}: LibrarySelectorProps) {
  return (
    <div className="flex flex-wrap gap-2 animate-fade-in">
      <Button
        variant={selectedLibrary === null ? "default" : "outline"}
        size="sm"
        onClick={() => onSelect(null)}
        className={
          selectedLibrary === null
            ? "gradient-primary text-primary-foreground shadow-glow"
            : "border-border hover:bg-secondary"
        }
      >
        <Library className="w-4 h-4 mr-2" />
        Todas
      </Button>

      {libraries.map((library) => {
        const Icon = getLibraryIcon(library.CollectionType);
        const isSelected = selectedLibrary === library.Id;

        return (
          <Button
            key={library.Id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(library.Id)}
            className={
              isSelected
                ? "gradient-primary text-primary-foreground shadow-glow"
                : "border-border hover:bg-secondary"
            }
          >
            <Icon className="w-4 h-4 mr-2" />
            {library.Name}
          </Button>
        );
      })}
    </div>
  );
}
