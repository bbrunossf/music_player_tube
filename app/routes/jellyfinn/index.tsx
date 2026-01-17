import Layout from '~/components/layout';
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { useState, useEffect, useCallback } from "react";
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
    <Layout>
    <div className="min-h-screen bg-background flex">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-border p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Logo & Title */}
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl gradient-primary shadow-glow">
                  <Clapperboard className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-gradient">
                    Jellyfin Playlist
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Gerencie suas playlists facilmente
                  </p>
                </div>
              </div>

              {/* Config Panel */}
              <div className="lg:w-96">
                <ConfigPanel config={config} onConnect={handleConnect} />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Not Configured State */}
            {!isConfigured && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="p-6 rounded-full gradient-primary shadow-glow mb-6">
                  <Clapperboard className="w-16 h-16 text-primary-foreground" />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Bem-vindo ao Jellyfin Playlist
                </h2>
                <p className="text-muted-foreground text-center max-w-md">
                  Configure as credenciais do seu servidor Jellyfin para começar
                  a criar playlists.
                </p>
              </div>
            )}

            {/* Library Content */}
            {isConfigured && (
              <>
                {/* Library Selector & Controls */}
                {libraries.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <LibrarySelector
                        libraries={libraries}
                        selectedLibrary={selectedLibrary}
                        onSelect={handleLibrarySelect}
                      />
                      <div className="flex items-center gap-3">
                        <ViewToggle
                          viewMode={viewMode}
                          onViewModeChange={setViewMode}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            fetchItems(selectedLibrary || undefined)
                          }
                          disabled={loading}
                          className="border-border hover:bg-secondary"
                        >
                          <RefreshCw
                            className={`w-4 h-4 mr-2 ${
                              loading ? "animate-spin" : ""
                            }`}
                          />
                          Atualizar
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Selection Info */}
                {selectedItems.length > 0 && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 border border-primary/20 animate-fade-in">
                    <span className="text-sm font-medium text-primary">
                      {selectedItems.length}{" "}
                      {selectedItems.length === 1
                        ? "item selecionado"
                        : "itens selecionados"}
                    </span>
                  </div>
                )}

                {/* Media Grid/List */}
                {viewMode === "grid" ? (
                  <MediaGrid
                    items={items}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                    getImageUrl={getImageUrl}
                    loading={loading}
                  />
                ) : loading ? (
                  <MediaGrid
                    items={[]}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                    getImageUrl={getImageUrl}
                    loading={loading}
                  />
                ) : (
                  <MediaList
                    items={items}
                    selectedIds={selectedIds}
                    onToggleItem={handleToggleItem}
                    getImageUrl={getImageUrl}
                  />
                )}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Playlist Sidebar */}
      {isConfigured && (
        <PlaylistPanel
          selectedItems={selectedItems}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onCreatePlaylist={handleCreatePlaylist}
          getImageUrl={getImageUrl}
        />
      )}
    </div>
  </Layout>
  );
}
