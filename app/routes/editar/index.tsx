import Layout from '~/components/layout';
import { PlaylistEditPanel } from '~/components/PlaylistEditPanel';
import { LibrarySelector } from "~/components/LibrarySelector";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useJellyfin } from "~/hooks/useJellyfin";
import { MediaGrid } from "~/components/MediaGrid";
import { MediaList } from "~/components/MediaList";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import type { JellyfinItem } from "~/types/jellyfin";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = process.env.JELLYFIN_URL;
  const apiKey = process.env.JELLYFIN_API;
  const userId = process.env.JELLYFIN_USER_ID;

  return json({ url, apiKey, userId });
}

export default function EditarPlaylists() {
  const { url, apiKey, userId } = useLoaderData<typeof loader>();

  const {
    items,
    loading,
    error,
    fetchItems,
    fetchPlaylists,
    fetchPlaylistItems,
    addItemsToPlaylist,
    removeItemsFromPlaylist,
    getImageUrl,
    playlists,
    isConfigured,
    fetchLibraries,
    libraries,
  } = useJellyfin({ url, apiKey, userId });

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(
    null
  );
  const [originalItems, setOriginalItems] = useState<JellyfinItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<JellyfinItem[]>([]);
  const [playlistName, setPlaylistName] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [selectedLibrary, setSelectedLibrary] = useState<string | null>(null);
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

  // Carrega playlists e todos os itens ao abrir a tela
  useEffect(() => {
    fetchPlaylists();
    fetchItems();
  }, [fetchPlaylists, fetchItems]);

  // Quando seleciona playlist, carrega os itens dela
  useEffect(() => {
    if (!selectedPlaylistId) return;

    fetchPlaylistItems(selectedPlaylistId).then((playlistItems) => {
      setOriginalItems(playlistItems);
      setSelectedItems(playlistItems);
    });
    // Atualiza o nome da playlist selecionada
    const selectedPlaylist = playlists.find(p => p.Id === selectedPlaylistId);
    if (selectedPlaylist) {
      setPlaylistName(selectedPlaylist.Name);
    }
  }, [selectedPlaylistId, fetchPlaylistItems, playlists]);


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
  




  const originalIds = useMemo(
    () => new Set(originalItems.map((i) => i.Id)),
    [originalItems]
  );

  const selectedIds = useMemo(
    () => new Set(selectedItems.map((i) => i.Id)),
    [selectedItems]
  );

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
    setSelectedItems(prev => prev.filter(item => item.Id !== id));
  };
  
  const handleClearAll = () => {
    setSelectedItems([]);
  };
  
  const handleNameChange = (name: string) => {
    setPlaylistName(name);
  };
  
  const handleUpdatePlaylist = async (id: string, name: string, itemIds: string[]) => {
    if (!id) return false;
    
    setIsSaving(true);
    try {      
        // Caso contrário, use as funções existentes para atualizar
        const toAdd = itemIds.filter(id => !originalIds.has(id));
        const toRemove = [...originalIds].filter(id => !itemIds.includes(id));
        
        // Atualizar nome (supondo que exista uma função para isso)
        // await updatePlaylistName(id, name);
        
        // Atualizar itens
        if (toAdd.length > 0) {
          await addItemsToPlaylist(id, toAdd);
        }
        if (toRemove.length > 0) {
          await removeItemsFromPlaylist(id, toRemove);
        }      
      
      // Atualiza os itens originais após salvar
      setOriginalItems(selectedItems);
      
      setIsSaving(false);
      return true;
    } catch (error) {
      console.error("Erro ao atualizar playlist:", error);
      setIsSaving(false);
      return false;
    }
  };

  const handleSave = async () => {
    if (!selectedPlaylistId) return;
    
    await handleUpdatePlaylist(
      selectedPlaylistId, 
      playlistName, 
      [...selectedIds]
    );
    
    alert("Playlist atualizada com sucesso.");
  };

  

  return (
  <Layout>
    {/* <div className="p-6 grid grid-cols-[1fr,auto] gap-6"> */}
    <div className="p-6 grid grid-cols-[1fr,auto] gap-6 h-screen overflow-hidden">
      {/* Coluna da esquerda com o conteúdo principal */}
      <div className="space-y-6 overflow-y-auto h-full">
        <h1 className="text-2xl font-bold">Editar Playlists</h1>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {/* Dropdown de playlists */}
        <div className="space-y-2">
          <label className="block font-medium">Selecione uma playlist:</label>
          <select
            className="bg-background text-foreground border p-2 rounded w-full max-w-md"
            value={selectedPlaylistId ?? ""}
            onChange={(e) => setSelectedPlaylistId(e.target.value || null)}
          >
            <option value="">-- Escolha uma playlist --</option>
            {playlists.map((pl) => (
              <option key={pl.Id} value={pl.Id}>
                {pl.Name}
              </option>
            ))}
          </select>
        </div>

        {/* Filtro de biblioteca (tipo) e filtro de texto para itens da playlist */}
        <div className="space-y-2">
          <LibrarySelector
            libraries={libraries}
            selectedLibrary={selectedLibrary}
            onSelect={handleLibrarySelect}
          />
          <div className="flex items-center space-x-2">
            <label className="block text-sm font-medium">Filtro</label>
            <input
              type="text"
              placeholder="Filtrar itens pelo nome..."
              value={textFilter}
              onChange={(e) => setTextFilter(e.target.value)}
              className="bg-background text-foreground border p-2 rounded w-full"
            />
          </div>
        </div>

        {/* Grade de mídia */}
        {selectedPlaylistId && (
          <>
            <MediaGrid
              items={filteredItems}
              selectedIds={selectedIds}
              onToggleItem={handleToggleItem}
              getImageUrl={getImageUrl}
              loading={loading}
            />
            {/* <MediaList
              items={items}
              selectedIds={selectedIds}
              onToggleItem={handleToggleItem}
              getImageUrl={getImageUrl}
            /> */}          
          </>        
        )}
      </div>

      {/* Coluna da direita com o painel de edição e o botão de salvar */}
      <div className="flex flex-col gap-4 overflow-y-auto h-full">
      <PlaylistEditPanel
        playlistName={playlistName}
          playlistId={selectedPlaylistId}
          selectedItems={selectedItems}
          onRemoveItem={handleRemoveItem}
          onClearAll={handleClearAll}
          onUpdatePlaylist={handleUpdatePlaylist}
          onNameChange={handleNameChange}
          getImageUrl={getImageUrl}
      />      
      
      </div>
      
    </div>
  </Layout>  
);
  
}
