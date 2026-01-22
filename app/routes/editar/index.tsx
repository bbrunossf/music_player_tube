//import { Carousel } from "@material-tailwind/react";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

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

export async function loader({ request }: LoaderFunctionArgs) {
  const url = process.env.JELLYFIN_URL;
  const apiKey = process.env.JELLYFIN_API;
  const userId = process.env.JELLYFIN_USER_ID;

  return json({ url, apiKey, userId });
}

export default function EditarPlaylists() {
  const { url, apiKey, userId } = useLoaderData<typeof loader>();
  const [activeTab, setActiveTab] = useState('inPlaylist');

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

  const sliderSettings = {
    dots: true,
    infinite: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 3,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        }
      }
    ]
  };

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

  //o Slider tem que ser assim porque esse não tem suporte ao SSR do Remix
   const SliderComponent = typeof window === 'undefined' ? Slider.default : Slider;

   const defaultSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" 
    xml:space="preserve" width="2048" height="2048" 
    style="shape-rendering:geometricPrecision;text-rendering:geometricPrecision;image-rendering:optimizeQuality;fill-rule:evenodd;clip-rule:evenodd"><defs><style>.fil0{fill:#424242;fill-rule:nonzero}</style></defs><g id="Layer_x0020_1"><g id="_337034264"><path id="_337034576" class="fil0" d="M1430.7 1228.39c56.217 0 107.118 22.792 143.962 59.635 36.843 36.843 59.634 87.744 59.634 143.962 0 56.217-22.79 107.118-59.634 143.961-36.844 36.845-87.745 59.635-143.962 59.635-56.217 0-107.118-22.79-143.961-59.635-36.844-36.843-59.635-87.744-59.635-143.96 0-56.22 22.79-107.12 59.635-143.963 36.843-36.843 87.744-59.635 143.961-59.635z"/><path id="_337034192" d="m1533.79 259.873-.006-.058 30.878-3.429c34.35-3.817 65.42 21.038 69.234 55.39.544 4.912.382 2.479.382 7.058v1081.33c0 34.613-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V388.684l-685.712 76.19v1115.53c0 34.615-28.08 62.694-62.694 62.694-34.613 0-62.694-28.08-62.694-62.694V408.814c0-32.915 25.44-58.884 57.661-62.464l778.34-86.482z" style="fill:#424242"/><path id="_337034120" class="fil0" d="M618.439 1382.53c56.531 0 107.717 22.918 144.767 59.968 37.05 37.05 59.968 88.236 59.968 144.767 0 56.531-22.918 107.717-59.968 144.767-37.05 37.049-88.236 59.967-144.767 59.967-56.531 0-107.717-22.918-144.767-59.967-37.049-37.05-59.968-88.235-59.968-144.767 0-56.53 22.92-107.717 59.968-144.767 37.05-37.05 88.235-59.968 144.767-59.968z"/></g></g><path style="fill:none" d="M0 0h2048v2048H0z"/></svg>
  `);


  

  return (      
    <div className="p-6 flex flex-col items-center min-h-screen overflow-hidden">               
          
      {/* Carrossel para exibir listas existentes */}
      <div className="w-full max-w-5xl mb-6">
        <h2 className="text-center mb-4">Playlists</h2>
        <div className="px-6">
          <SliderComponent {...sliderSettings}>
            {/* use playlist map */}
            {playlists.map((playlist) => {
              const isActive = playlist.Id === selectedPlaylistId;
              return (
                <div 
                key={playlist.Id} 
                // style={{ padding: "10px", cursor: "pointer" }} 
                className="px-2 cursor-pointer"
                onClick={() => setSelectedPlaylistId(playlist.Id)}
                >
                  <div
                    // style={{
                    //   border: "1px solid #ccc",
                    //   borderRadius: "8px",
                    //   padding: "10px",
                    //   textAlign: "center",
                    //   backgroundColor: isActive ? "#e6f0ff" : "transparent",
                    // }}
                    className={`border rounded-lg p-2 text-center transition ${
                      isActive ? "bg-blue-100 border-blue-400" : "border-gray-600"
                    }`}
                  >
                    <div className="w-full aspect-square bg-gray-800 rounded overflow-hidden flex items-center justify-center">
                    <img
                      src={getImageUrl(playlist, "Primary") || defaultSvg}
                      alt={playlist.Name}
                      // style={{ width: "100%", borderRadius: "4px" }}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = defaultSvg;
                      }}
                    />
                    </div>
                    <h3 className="text-sm mt-2 break-words">{playlist.Name}</h3>
                  </div>
                </div>
              );
            })}          
          </SliderComponent>
        </div>
      </div>

      {/* caixa de filtro */}
      <div className="flex gap-4 mb-4">
        <input
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

        {activeTab === 'inPlaylist' && (
          // <div className="playlist-cards grid grid-cols-2 gap-3 py-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="playlist-cards grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2 overflow-y-auto max-h-[calc(100vh-260px)] px-2">
            <div>                
                  <button
                    className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
                    onClick={handleSave}
                  >
                    Salvar Alterações
                  </button>
                </div> 
            {/* style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 12,
              overflowY: 'auto',
              padding: '8px 0'
            }}
          > */}
            {selectedItems.length === 0 ? (
              <div>Nenhum item nesta playlist.</div>
            ) : (                           
              selectedItems.map((item) => (
                <div
                  key={item.Id}
                  style={{
                    borderRadius: 12,
                    border: '1px solid #333',
                    overflow: 'hidden',
                    background: '#111',
                    height: 260
                  }}
                >
                  <div style={{ height: 180, position: 'relative' }}>
                    <img
                      src={getImageUrl(item, 'Primary') || defaultSvg}
                      alt={item.Name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                    {/* <span
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        left: 8,
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        borderRadius: 999
                      }}
                    >
                      {item.Name}
                    </span> */}
                  </div>
                  <div
                    style={{
                      padding: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span style={{ color: '#bbb', fontSize: 12 }}>
                      {item.Name}
                    </span>
                    <button
                      className="fab"
                      onClick={() => handleToggleItem(item)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        background: '#ff3b83',
                        color: '#fff',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      aria-label="Selecionar item"
                    >
                      +
                    </button>
                  </div>
                
                
              </div>
              ))
              
            )}
            

          </div>
        )}
        {activeTab === 'addItems' && (
          // <div className="grid grid-cols-2 gap-3 py-2 overflow-y-auto max-h-[calc(100vh-200px)]">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-2 overflow-y-auto max-h-[calc(100vh-260px)] px-2">
            {filteredItems.length === 0 ? (
              <div>Nenhum item encontrado.</div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedIds.has(item.Id);

                return (
                  <div
                    key={item.Id}
                    style={{
                      borderRadius: 12,
                      border: isSelected ? '2px solid #3b82f6' : '1px solid #333',
                      overflow: 'hidden',
                      background: '#111',
                      height: 260
                    }}
                  >
                    <div style={{ height: 180 }}>
                      <img
                        src={getImageUrl(item, 'Primary') || defaultSvg}
                        alt={item.Name}
                        style={{ width: '100%', height: '100%', objectFit: 'scale-down' }}
                      />
                    </div>

                    <div
                      style={{
                        padding: 8,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span style={{ color: '#bbb', fontSize: 12 }}>
                        {item.Name}
                      </span>

                      <button
                        onClick={() => handleToggleItem(item)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 17,
                          background: isSelected ? '#22c55e' : '#ff3b83',
                          color: '#fff',
                          border: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        aria-label="Selecionar item"
                      >
                        {isSelected ? '✓' : '+'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
    </div>   

     {/* Barra de navegação inferior */}
      <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 py-2 px-4">
        <div className="max-w-md mx-auto">
          
          
          <div className="flex justify-between mt-4 text-zinc-400">
            <Link to="/">
            <Button variant="ghost" className="flex flex-col items-center text-xs">
              <span className="material-icons">home</span>
              Home
            </Button>
            </Link>
            
              <Button variant="ghost" className="flex flex-col items-center text-xs">
                <span className="material-icons">download_for_offline</span>                
                Library
              </Button>
            
            <Button variant="ghost" className="flex flex-col items-center text-xs">
              <span className="material-icons">settings</span>
              Config
            </Button>
          </div>
        </div>
      </div>


    </div>     
);
  
}
