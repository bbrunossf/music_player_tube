import Layout from '~/components/layout';
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, RefreshCw, Clapperboard } from "lucide-react";
import { useJellyfin } from "~/hooks/useJellyfin";
import { ConfigPanel } from "~/components/ConfigPanel";
import { LibrarySelector } from "~/components/LibrarySelector";
import { MediaGrid } from "~/components/MediaGrid";
import { MediaList } from "~/components/MediaList";
import { PlaylistPanel } from "~/components/PlaylistPanel";
import { ViewToggle, type ViewMode } from "~/components/ViewToggle";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { JellyfinItem } from "~/types/jellyfin";

export async function loader({ request }: LoaderFunctionArgs) {
  // ✅ Variáveis de ambiente funcionam no servidor
  const url = process.env.JELLYFIN_URL;
  const apiKey = process.env.JELLYFIN_API;
  const userId = process.env.JELLYFIN_USER_ID;

  return json({
    url,
    apiKey,
    userId,
  });
}

export default function Index() {
  //const Index = () => {
  const { url, apiKey, userId } = useLoaderData<typeof loader>();
  const {
    config,
    libraries,
    items,
    loading,
    error,
    fetchLibraries,
    fetchItems,
    createPlaylist,
    getImageUrl,
    isConfigured,
  } = useJellyfin({ url, apiKey, userId });

  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<JellyfinItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const selectedIds = new Set(selectedItems.map((item) => item.Id));
  const [textFilter, setTextFilter] = useState<string>(""); // filtro de texto para o nome do item


  // Adicione este useMemo para obter itens filtrados pela biblioteca e pelo texto
  const filteredItems = useMemo(() => {
    const byLibrary = items.filter((i) => {
      const libId = (i as any).LibraryId ?? null;
      //return selectedLibrary ? libId === selectedLibrary : true;
      if (selectedLibrary == null) return true; // todas as bibliotecas
      // Se o item não tem LibraryId, não o exclua automaticamente ao filtrar por biblioteca
      if (libId == null) return true;
      return libId === selectedLibrary;      
    });

    const byText = byLibrary.filter((i) => {
      if (!textFilter) return true;
      const name = (i as any).Name ?? "";
      return name.toLowerCase().includes(textFilter.toLowerCase());
    });
    return byText;
  }, [items, selectedLibrary, textFilter]);

  const handleConnect = useCallback(() => {
    fetchLibraries();
    fetchItems();
  }, [fetchLibraries, fetchItems]);

  useEffect(() => {
    if (isConfigured && libraries.length === 0) {
      handleConnect();
    }
  }, [isConfigured, libraries.length, handleConnect]);

  const handleLibrarySelect = (libraryId: string | null) => {
    setSelectedLibrary(libraryId);
    fetchItems(libraryId || undefined);
  };

  const handleToggleItem = (item: JellyfinItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.Id === item.Id);
      if (exists) {
        return prev.filter((i) => i.Id !== item.Id);
      }
      return [...prev, item];
    });
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.Id !== id));
  };

  const handleClearAll = () => {
    setSelectedItems([]);
  };

  const handleCreatePlaylist = async (
    name: string,
    itemIds: string[],
    mediaType: "Audio" | "Video"
  ) => {
    return await createPlaylist(name, itemIds, mediaType);
  };

  return (    
    <div className="min-h-screen bg-gray-100 flex flex-col">    
      {/* Header */}
      <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-800">Jellyfin Playlist</h1>
            <ConfigPanel config={config} onConnect={handleConnect} />
          </div>
      </header>

      {/* Área principal em duas colunas */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-7xl mx-auto h-full flex gap-6 p-4">

          {/* Coluna esquerda: filtros + grid/list */}
          <div className="flex-1 flex flex-col overflow-hidden">

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {!isConfigured && (
            <div className="flex flex-col items-center justify-center flex-1">
              <h2 className="text-2xl font-bold mb-2">Bem-vindo ao Jellyfin Playlist</h2>
              <p className="text-center max-w-md">Configure as credenciais do seu servidor Jellyfin para começar a criar playlists.</p>
            </div>
          )}

          {isConfigured && (
            <>
              <div className="flex gap-4 mb-4">
                <LibrarySelector
                  libraries={libraries}
                  selectedLibrary={selectedLibrary}
                  onSelect={handleLibrarySelect}
                />
                <input
                  type="text"
                  placeholder="Filtrar itens..."
                  value={textFilter}
                  onChange={(e) => setTextFilter(e.target.value)}
                  className="border p-2 rounded w-full"
                />
                <Button
                  variant="outline"
                  onClick={() => fetchItems(selectedLibrary || undefined)}
                  disabled={loading}
                >
                  Atualizar
                </Button>
              </div>

              {/* Área rolável dos cards */}
              <div className="flex-1 overflow-y-auto pr-2">
                {viewMode === "grid" ? (
                  <MediaGrid
                    items={filteredItems}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                    getImageUrl={getImageUrl}
                    loading={loading}
                  />
                ) : (
                  <MediaList
                    items={filteredItems}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                    getImageUrl={getImageUrl}
                  />
                )}
              </div>
            </>            
          )}
          </div>

          {/* Coluna direita: Playlist Panel */}
          <aside className="bg-gray-200 w-1/4 p-4">
            <PlaylistPanel
              selectedItems={selectedItems}
              onRemoveItem={handleRemoveItem}
              onClearAll={handleClearAll}
              onCreatePlaylist={handleCreatePlaylist}
              getImageUrl={getImageUrl}
            />
          </aside>
        </div>
      </main>    
  </div>
  );
}
