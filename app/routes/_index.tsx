// Última atualização: lógica do botão "Carregar mais vídeos" 

import Layout from '~/components/layout';
import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { useMusicStore } from '~/store/useMusicStore';
import { Button } from '~/components/ui/button'; 
import { Card, CardContent } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input'; 

import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

import { Form, useActionData } from '@remix-run/react'
import { useDownloadProgress } from '~/hooks/useDownloadProgress'
import { action } from './api.search';


//função loader para carregar as variáveis de ambiente
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    apiHealthUrl: process.env.PUBLIC_API_URL_HEALTH,
  });
}

export default function Index() {
    const { apiHealthUrl } = useLoaderData<typeof loader>();
    console.log('API Health URL:', apiHealthUrl); // Verifica se a URL está correta
   
    const {
        tracks,
        selected,
        toggleTrack,
        togglePlaylist,
        setTracks // Método para definir as playlists
    } = useMusicStore();

    const searchFetcher = useFetcher();
    const [searchurl, setsearchUrl] = useState('');
    // const [query, setQuery] = useState('');
    const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);
    const [videosToShowMap, setVideosToShowMap] = useState({});
    const [url, setUrl] = useState('');
    const [apiStatus, setApiStatus] = useState<"ok" | "error" | "checking">("checking");
    //const apiHealthUrl = process.env.PUBLIC_API_URL_HEALTH ;
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadFormat, setDownloadFormat] = useState<"video" | "audio" | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);

    const {
        progress,
        current,
        processed,
        total,
        status
    } = useDownloadProgress(jobId)



    const handleSearch = () => {
        searchFetcher.submit(
            { query: searchurl },
            { method: 'post', action: '/api/search' }
        );
    };

    const handleTogglePlaylist = (playlistId) => {
        if (expandedPlaylistId === playlistId) {
            setExpandedPlaylistId(null); // Colapsa se já estiver expandida
        } else {
            setExpandedPlaylistId(playlistId); // Expande a playlist

            // Initialize videos to show for this playlist if not already set
            if (!videosToShowMap[playlistId]) {
                setVideosToShowMap(prevMap => ({
                    ...prevMap,
                    [playlistId]: 10
                }));
            }
        }
    };

    const handleLoadMoreVideos = (playlistId) => {
        setVideosToShowMap(prevMap => ({
            ...prevMap,
            [playlistId]: (prevMap[playlistId] || 0) + 10
        }));
    };

    
    const handleDownload = () => {
    const selectedVideoIds = Object.keys(selected).filter(id => {
        return selected[id] && !tracks.some(playlist => playlist.id === id); 
    });

    if (selectedVideoIds.length === 0) {
        alert('Nenhum vídeo selecionado para download.');
        return;
    }

    setShowDownloadModal(true); // Abre o modal
};

const iniciarDownload = (formato: "video" | "audio") => {
    const selectedVideoIds = Object.keys(selected).filter(id => {
        return selected[id] && !tracks.some(playlist => playlist.id === id); 
    });

    fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            video_ids: selectedVideoIds,
            format: formato // Enviado para o backend decidir
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Erro ao iniciar o download');
        }
        return response.json();
    })
    .then(data => {
        setJobId(data.job_id);
        console.log("Job iniciado:", data.job_id);
        alert(data.status);
    })
    .catch(error => {
        console.error('Erro:', error);
        alert('Houve um erro ao iniciar o download.');
    });

    setShowDownloadModal(false);
    setDownloadFormat(null);
};


    const selecionarTodosDaPlaylist = (playlistId) => {
        const playlist = tracks.find(p => p.id === playlistId);
        if (!playlist) return;

        const limite = videosToShowMap[playlistId] || 10;
        const visiveis = playlist.videos.slice(0, limite);

        visiveis.forEach(video => {
            toggleTrack(video.id); // Ativa ou desativa
        });
    };

    const handleImportUrl = () => {
        console.log('Importando URL:', searchurl);
        if (!searchurl.trim()) {
            alert("Informe uma URL de playlist válida.");
            return;
        }

        searchFetcher.submit(
            { url: searchurl },
            { method: 'post', action: '/api/import-playlist' }
        );
    };

    const handleUnifiedInput = () => {
        const input = searchurl.trim();
        
        // Verifica se a entrada parece ser uma URL
        if (input.startsWith('http://') || input.startsWith('https://') || input.startsWith('www.')) {
            // É uma URL, executa a importação
            handleImportUrl();
        } else if (input) {
            // É um termo de pesquisa, chama o fetcher diretamente
            searchFetcher.submit(
                { query: input },
                { method: 'post', action: '/api/search' }
            );
        } else {
            // Campo vazio
            alert('Por favor, insira uma URL ou termo de pesquisa');
        }
        };



    useEffect(() => {
        if (searchFetcher.data?.playlists) {
            setTracks(searchFetcher.data.playlists); 
            searchFetcher.data = undefined; 
        }

        if (searchFetcher.data?.error) {
            console.error('Erro ao buscar playlists:', searchFetcher.data.error);
            searchFetcher.data = undefined; 
        }
    }, [searchFetcher.data, setTracks]);

useEffect(() => {
    const checkApi = async () => {
        try {
            const res = await fetch(apiHealthUrl, { cache: "no-store" });
            if (res.ok) {
                setApiStatus("ok");
            } else {
                setApiStatus("error");
            }
        } catch {
            setApiStatus("error");
        }
    };

    checkApi(); // Verifica uma vez ao carregar

    // (Opcional) Verifica a cada 30s
    const interval = setInterval(checkApi, 30000);
    return () => clearInterval(interval);
}, [apiHealthUrl]);


    return (
//   <Layout>
    <div className="page home-page min-h-screen bg-zinc-900 text-white">
      {/* <div className="w-full max-w-md mx-auto px-3 py-6"> */}
       <div className="w-full sm:w-[90%] md:w-[85%] lg:w-[75%] xl:w-[65%] mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-center mb-6 tracking-tight">
          Video Downloader
        </h1>

        {/* Barra de pesquisa principal */}
        <div className="flex gap-2 mb-5 bg-zinc-800 p-3 rounded-lg">
          <Input
            placeholder="Digite um termo para pesquisar ou cole uma URL de playlist"
            value={searchurl}
            onChange={(e) => setsearchUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleUnifiedInput()}
            // className="text-sm h-10 bg-zinc-800 border-none focus:ring-1 focus:ring-blue-500"
            className="text-lg h-14 bg-zinc-800 border-none focus:ring-1 focus:ring-blue-500"

          />
          <Button 
            onClick={handleUnifiedInput} 
            className="shrink-0 px-5 bg-blue-600 hover:bg-blue-700 h-14 min-w-[56px]"
          >
            <span className="material-icons text-2xl">search</span>
          </Button>
        </div>

       {jobId && (
        <div className="mb-6 p-5 bg-zinc-800 rounded-lg border border-zinc-700 text-base space-y-3">
          <div className="flex justify-between items-center">
            <p className="font-medium text-zinc-300">Status: <span className="text-blue-400">{status}</span></p>
            <p className="text-zinc-400">{progress}%</p>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-4">
            <div 
              className="bg-blue-500 h-4 rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="flex justify-between">
            <p className="text-zinc-300">
              <span className="font-medium">Vídeos:</span> {processed}/{total}
            </p>
            <span className="material-icons text-base text-blue-400">cloud_download</span>
          </div>
          <p className="text-zinc-400 truncate text-base">{current}</p>
        </div>
      )} 

        {/* Filtros */}
        <div className="flex gap-3 mb-6 overflow-x-auto py-3">
          <Button variant="ghost" className="rounded-full px-6 py-3 text-lg bg-zinc-800 h-12 min-w-[80px]">All</Button>
          <Button variant="ghost" className="rounded-full px-6 py-3 text-lg flex items-center gap-2 bg-zinc-800 h-12 min-w-[100px]">
            <span className="material-icons text-lg">videocam</span>Video
          </Button>
          <Button variant="ghost" className="rounded-full px-6 py-3 text-lg flex items-center gap-2 bg-zinc-800 h-12 min-w-[100px]">
            <span className="material-icons text-lg">audiotrack</span>Audio
          </Button>
          <Button variant="ghost" className="rounded-full px-6 py-3 text-lg flex items-center gap-2 bg-zinc-800 h-12 min-w-[120px]">
            <span className="material-icons text-lg">playlist_play</span>Playlist
          </Button>
        </div>

        {/* Lista de vídeos */}
        <div className="space-y-5">
          {tracks.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden bg-zinc-800 border-none shadow-md">
              <CardContent className="p-0">
                <div 
                  className="p-5 cursor-pointer hover:bg-zinc-700 transition-colors"
                  onClick={() => handleTogglePlaylist(playlist.id)}
                >
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id={`playlist-${playlist.id}`}
                      checked={!!selected[playlist.id]}
                      onCheckedChange={() => togglePlaylist(playlist.id)}
                      className="shrink-0 border-zinc-600 h-6 w-6"
                    />
                    <Label
                      htmlFor={`playlist-${playlist.id}`}
                      className="cursor-pointer text-lg font-medium leading-tight line-clamp-2"
                    >
                      {playlist.title}
                    </Label>
                  </div>
                </div>

                {expandedPlaylistId === playlist.id && (
                  <div className="border-t border-zinc-700">
                    {playlist.videos.slice(0, videosToShowMap[playlist.id] || 10).map((video) => (
                      <div key={video.id} className="flex gap-4 p-5 hover:bg-zinc-700 border-b border-zinc-700 transition-colors">
                        <Checkbox
                          id={`video-${video.id}`}
                          checked={!!selected[video.id]}
                          onCheckedChange={() => toggleTrack(video.id)}
                          disabled={!selected[playlist.id]}
                          className="shrink-0 mt-1 border-zinc-600 h-6 w-6"
                        />
                        <div className="relative shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded"
                          />
                          <div className="absolute bottom-1 right-1 bg-black/70 text-sm px-1 rounded">
                            12:45
                          </div>
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={`video-${video.id}`}
                            className="text-base leading-tight line-clamp-2 font-medium mb-2"
                          >
                            {video.title}
                          </Label>
                          {/* <p className="text-base text-zinc-400">
                            Channel Name • 1.2M views • 2 days ago
                          </p> */}
                        </div>
                      </div>
                    ))}

                    {videosToShowMap[playlist.id] < playlist.videos.length && (
                      <Button
                        // className="w-full py-2 text-xs font-medium bg-transparent hover:bg-zinc-700 text-blue-400"
                        className="w-full py-3 text-base font-medium bg-transparent hover:bg-zinc-700 text-blue-400 h-14"
                        variant="ghost"
                        onClick={() => handleLoadMoreVideos(playlist.id)}
                      >
                        Load more videos
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Barra de navegação inferior */}
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-800 border-t border-zinc-700 py-2 px-4">
          <div className="max-w-md mx-auto">
            <Button 
              className="w-full h-12 text-sm font-medium bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2" 
              onClick={handleDownload}
            >
              <span className="material-icons">download</span>
              Download Selected ({Object.keys(selected).filter(id => selected[id] && !tracks.some(playlist => playlist.id === id)).length})
            </Button>
            
            <div className="flex justify-between mt-4 text-zinc-400">
              <Button variant="ghost" className="flex flex-col items-center text-xs">
                <span className="material-icons">search</span>
                Search
              </Button>
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

      {/* Modal de seleção de formato */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-xl p-5 shadow-lg w-full max-w-sm border border-zinc-700">
            <h2 className="text-lg font-semibold mb-4 text-center">Choose Format</h2>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <Button
                variant={downloadFormat === "video" ? "default" : "outline"}
                onClick={() => setDownloadFormat("video")}
                className={`h-14 ${downloadFormat === "video" ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-700 border-zinc-600"}`}
              >
                <span className="material-icons mr-2">videocam</span>
                Video
              </Button>
              <Button
                variant={downloadFormat === "audio" ? "default" : "outline"}
                onClick={() => setDownloadFormat("audio")}
                className={`h-14 ${downloadFormat === "audio" ? "bg-blue-600 hover:bg-blue-700" : "bg-zinc-700 border-zinc-600"}`}
              >
                <span className="material-icons mr-2">audiotrack</span>
                Audio
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="ghost" 
                onClick={() => setShowDownloadModal(false)}
                className="h-12 border border-zinc-700 hover:bg-zinc-700"
              >
                Cancel
              </Button>
              <Button
                onClick={() => downloadFormat && iniciarDownload(downloadFormat)}
                disabled={!downloadFormat}
                className="h-12 bg-blue-600 hover:bg-blue-700"
              >
                Download
              </Button>
            </div>
          </div>
        </div>        
      )}

      {/* Status da API */}
        <footer className="mt-6 pt-3 border-t border-zinc-700 flex items-center justify-center gap-2 text-xs text-zinc-500">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${
              apiStatus === "ok" ? "bg-green-500" : apiStatus === "checking" ? "bg-yellow-500" : "bg-red-500"
            }`}
          />
          <span>
            Backend: {apiStatus === "checking" ? "verificando..." : apiStatus === "ok" ? "conectado" : "falha"}
          </span>
        </footer>
    </div>
//   </Layout>
);
    
}