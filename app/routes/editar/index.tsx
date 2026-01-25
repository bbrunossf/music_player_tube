//import { Carousel } from "@material-tailwind/react";
import { MediaItemCard} from "~/components/MediaItemCard";
import { ViewToggle, type ViewMode } from "~/components/ViewToggle";
import {BottomNavigation } from "~/components/BottomNavigation";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";
import { Check, Film, Tv, Music, Star } from 'lucide-react'; //ícones
import Layout from '~/components/layout';
import { Link } from "@remix-run/react";
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
import PlaylistCarousel from "~/components/PlaylistCarousel";
import { CreatePlaylistModal } from "~/components/CreatePlaylistModal";


export async function loader({ request }: LoaderFunctionArgs) {
  const url = process.env.JELLYFIN_URL;
  const apiKey = process.env.JELLYFIN_API;
  const userId = process.env.JELLYFIN_USER_ID;

  return json({ url, apiKey, userId });
}

export default function EditarPlaylists() {
  const { url, apiKey, userId } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('inPlaylist');
  const [viewMode, setViewMode] = useState<ViewMode>("grid");


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
    createPlaylist
  } = useJellyfin({ url, apiKey, userId });

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
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
      };
      console.log("Adicionando item:", item);
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

  

   const defaultSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" 
    xml:space="preserve" width="2048" height="2048" 
    style="shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd"><defs><style>.fil0{fill:#424242;fill-rule:nonzero}</style></defs><g id="Layer_x0020_1"><g id="_337034264"><path id="_337034576" class="fil0" d="M1430.7 1228.39c56.217 0 107.118 22.792 143.962 59.635 36.843 36.843 59.634 87.744 59.634 143.962 0 56.217-22.79 107.118-59.634 143.961-36.844 36.845-87.745 59.635-143.962 59.635-56.217 0-107.118-22.79-143.961-59.635-36.844-36.843-59.635-87.744-59.635-143.96 0-56.22 22.79-107.12 59.635-143.963 36.843-36.843 87.744-59.635 143.961-59.635z"/><path id="_337034192" d="m1533.79 259.873-.006-.058 30.878-3.429c34.35-3.817 65.42 21.038 69.234 55.39.544 4.912.382 2.479.382 7.058v1081.33c0 34.613-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V388.684l-685.712 76.19v1115.53c0 34.615-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V408.814c0-32.915 25.44-58.884 57.661-62.464l778.34-86.482z" style="fill:#424242"/><path id="_337034120" class="fil0" d="M618.439 1382.53c56.531 0 107.717 22.918 144.767 59.968 37.05 37.05 59.968 88.236 59.968 144.767 0 56.531-22.918 107.717-59.968 144.767-37.05 37.049-88.236 59.967-144.767 59.967-56.531 0-107.717-22.918-144.767-59.967-37.049-37.05-59.968-88.235-59.968-144.767 0-56.53 22.92-107.717 59.968-144.767 37.05-37.05 88.235-59.968 144.767-59.968z"/></g></g><path style="fill:none" d="M0 0h2048v2048H0z"/></svg>
  `);

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

// Nova função de criação via modal (usa a função real createPlaylist)
const handleCreatePlaylist = useCallback(
  async (name: string): Promise<boolean> => {
    if (!createPlaylist) return false;

    // Determina mediaType com base nos itens selecionados (exemplo simples)
    const hasVideo = selectedItems.some((i) => (i as any).Type === "Video");
    const mediaType: "Audio" | "Video" = hasVideo ? "Video" : "Audio";

    // Cria a playlist vazia (Ids = [])
    const ok = await createPlaylist(name, [], mediaType);
    if (!ok) return false;

    // Atualiza a lista de playlists e seleciona a recém-criada por nome
    await fetchPlaylists();
    const newPlaylist = playlists.find((p) => p.Name === name);
    if (newPlaylist?.Id) {
      setSelectedPlaylistId(newPlaylist.Id);
      setPlaylistName(name);
      // Carrega itens da nova playlist (você pode ajustar conforme necessidade)
      await fetchPlaylistItems(newPlaylist.Id);
    }
    return true;
  },
  [
    createPlaylist,
    fetchPlaylists,
    playlists,
    fetchPlaylistItems,
    setSelectedPlaylistId,
    setPlaylistName,
    selectedItems
  ]
);



  

  return (      
    <div className="p-6 flex flex-col items-center min-h-screen overflow-hidden">               
          
      {/* Carrossel para exibir listas existentes */}
      <div className="w-full max-w-5xl mb-6">
        <h2 className="text-center mb-4">Playlists</h2>
        <div className="px-6">          
          <PlaylistCarousel
            playlists={playlists}
            selectedPlaylistId={selectedPlaylistId}
            getImageUrl={getImageUrl}
            fallbackImage={defaultSvg}
            onSelect={setSelectedPlaylistId}
            onCreatePlaylist={handleCreatePlaylist}
          />
        </div>
      </div>

      {/* caixa de filtro */}
      <div className="flex gap-4 mb-4">
        <input
          id="text-filter"
          name="text-filter"
          type="text"
          placeholder="Filtrar itens..."
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="border p-2 rounded w-full bg-black text-white"
        />
        <Button
          variant="outline"
          onClick={() => fetchItems(selectedLibrary || undefined)}
          disabled={loading}
          className="rounded-2xl border p-2 bg-green-300 hover:bg-green-400 text-black font-bold"
        >
          Atualizar
        </Button>
      </div>

      <div className="flex gap-4 mb-4">
        <LibrarySelector
          libraries={libraries}
          selectedLibrary={selectedLibrary}
          onSelect={handleLibrarySelect}
        />
      </div>
          
      {/* Tabs para ‘in playlist’ ou ‘add items’ */}
      <div className="flex justify-center space-x-6 mb-4">
        <button 
          className={`p-2 ${activeTab === 'inPlaylist' ? 'text-blue-500 border-b-2 border-blue-500' : ''}`} 
          onClick={() => setActiveTab('inPlaylist')}
        >
          In Playlist
        </button>
        <button 
          className={`p-2 ${activeTab === 'addItems' ? 'text-blue-500 border-b-2 border-blue-500' : ''}`} 
          onClick={() => setActiveTab('addItems')}
        >
          Add Items
        </button>
      </div>

      {/* Área de conteúdo centralizada */}
      <div className="w-full max-w-5xl flex-1 overflow-hidden">

        <ViewToggle viewMode={viewMode} onViewModeChange={setViewMode} />

        {activeTab === 'inPlaylist' && (
          // <div className="playlist-cards grid grid-cols-2 gap-3 py-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          viewMode === "grid" ? (
          <div className="playlist-cards grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 overflow-y-auto max-h-[calc(100vh-260px)] px-2">
            <div>                
              <button
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                onClick={handleSave}
              >
                Salvar Alterações
              </button>
            </div> 
            
            {selectedItems.length === 0 ? (
              <div>Nenhum item nesta playlist.</div>
            ) : (                           
              selectedItems.map((item) => {
                const TypeIcon = getTypeIcon(item.Type);
                const duration = formatDuration(item.RunTimeTicks);
                 return (
                  <MediaItemCard
                    key={item.Id}
                    item={item}
                    imageUrl={getImageUrl(item, "Primary")}
                    onToggle={handleToggleItem}
                    TypeIcon={TypeIcon}
                    duration={duration}
                    imageFit="cover"
                    lineClampTitle
                    showSelectionBorder={false}
                  />
                );
              })              
            )}
          </div>
            ) : (
              <MediaList
                items={selectedItems}
                selectedIds={selectedIds}
                onToggleItem={handleToggleItem}
                getImageUrl={(item) => getImageUrl(item, "Primary")}
              />
            )
        )}
        {activeTab === 'addItems' && (
          viewMode === "grid" ? (
          // <div className="grid grid-cols-2 gap-3 py-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-2 overflow-y-auto max-h-[calc(100vh-260px)] px-2">
            {filteredItems.length === 0 ? (
              <div>Nenhum item encontrado.</div>
              ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.Id);
                const TypeIcon = getTypeIcon(item.Type);
                const duration = formatDuration(item.RunTimeTicks);
                return (
                  <MediaItemCard
                    key={item.Id}
                    item={item}
                    imageUrl={getImageUrl(item, "Primary")}
                    isSelected={isSelected}
                    onToggle={handleToggleItem}
                    TypeIcon={TypeIcon}
                    duration={duration}
                    imageFit="contain"
                    showSelectionBorder
                  />
                );
              })
            )}
          </div>
            ) : (
            <MediaList
              items={filteredItems}
              selectedIds={selectedIds}
              onToggleItem={handleToggleItem}
              getImageUrl={(item) => getImageUrl(item, "Primary")}
            />
          )
        )}
      </div>   

     {/* Barra de navegação inferior */}
      <BottomNavigation />


    </div>     
);
  
}
