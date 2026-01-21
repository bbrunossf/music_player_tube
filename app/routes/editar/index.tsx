//import { Carousel } from "@material-tailwind/react";

import Slider from "react-slick";
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

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
    infinite: true,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
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

   const SliderComponent = typeof window === 'undefined' ? Slider.default : Slider;

   const defaultSvg =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(`
    <svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'>
      <rect width='200' height='200' fill='#1f2937'/>
      <g transform='translate(50,40) scale(0.6)'>
        <path d='M70 60v80c0 11 9 20 20 20s20-9 20-20V80h20v60c0 11 9 20 20 20s20-9 20-20V60z' fill='#9ca3af'/>
      </g>
    </svg>
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
                    <h3 className="text-sm mt-2 truncate">{playlist.Name}</h3>
                  </div>
                </div>
              );
            })}          
          </SliderComponent>
        </div>
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
                      src={getImageUrl(item, 'Primary')}
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
                        src={getImageUrl(item, 'Primary')}
                        alt={item.Name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
    </div>     
);
  
}
