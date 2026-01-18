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
    const [query, setQuery] = useState('');
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
            { query },
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

    // const handleDownload = () => {
    //     //const selectedVideoIds = Object.keys(selected).filter(videoId => selected[videoId]);
    //     const selectedVideoIds = Object.keys(selected).filter(id => {
    //         // Verifica se o ID é um vídeo
    //         return selected[id] && !tracks.some(playlist => playlist.id === id); 
    //     });
        
    //     if (selectedVideoIds.length === 0) {
    //         alert('Nenhum vídeo selecionado para download.');
    //         return; // Se nenhum vídeo estiver selecionado, avise o usuário
    //     }

    //     fetch('http://192.168.1.14:5000/api/download', {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify({ video_ids: selectedVideoIds })
    //     })
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error('Erro ao iniciar o download');
    //         }
    //         return response.json();
    //     })
    //     .then(data => {
    //         console.log(data.status); // Você pode exibir uma mensagem a partir disso
    //         alert(data.status); // Feedback para o usuário
    //     })
    //     .catch(error => {
    //         console.error('Houve um erro: ', error);
    //         alert('Houve um erro ao iniciar o download.');
    //     });
    // };

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
        console.log('Importando URL:', url);
        if (!url.trim()) {
            alert("Informe uma URL de playlist válida.");
            return;
        }

        searchFetcher.submit(
            { url },
            { method: 'post', action: '/api/import-playlist' }
        );
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
        <Layout>
        <div className="page home-page min-h-screen">
        <div className="w-full max-w-md mx-auto bg-zinc-100 text-zinc-950 px-3 py-4">

            <h1 className="text-xl font-semibold text-center mb-4 tracking-tight">
                YouTube Playlist Downloader
            </h1>

            <div className="flex gap-1.5 mb-2">
                <Input
                    placeholder="URL da playlist"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-sm h-9"
                />
                <Button onClick={handleImportUrl} size="sm" className="shrink-0 px-3">
                    OK
                </Button>
            </div>

            <div className="flex gap-1.5 mb-4">
                <Input
                    placeholder="Nome da playlist"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="text-sm h-9"
                />
                <Button onClick={handleSearch} size="sm" className="shrink-0 px-3">
                    Pesquisar
                </Button>
            </div>

            <div className="space-y-2">
            {tracks.map((playlist) => (
                <Card key={playlist.id} className="overflow-hidden">
                    <CardContent className="p-3">
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id={`playlist-${playlist.id}`}
                                checked={!!selected[playlist.id]}
                                onCheckedChange={() => togglePlaylist(playlist.id)} 
                                className="shrink-0"
                            />
                            <Label 
                                htmlFor={`playlist-${playlist.id}`} 
                                className="cursor-pointer text-sm font-medium leading-tight line-clamp-2" 
                                onClick={() => handleTogglePlaylist(playlist.id)}
                            >
                                {playlist.title}
                            </Label>
                        </div>

                        {expandedPlaylistId === playlist.id && (
                            <div className="mt-3 pt-3 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full mb-3 text-xs h-8"
                                    onClick={() => selecionarTodosDaPlaylist(playlist.id)}
                                >
                                    Selecionar todos os visíveis
                                </Button>

                                {playlist.videos.length > 0 ? (
                                    <div className="space-y-2">
                                        {playlist.videos.slice(0, videosToShowMap[playlist.id] || 10).map((video) => (
                                            <div key={video.id} className="flex gap-2 p-2 bg-white rounded-lg border">
                                                <Checkbox
                                                    id={`video-${video.id}`}
                                                    checked={!!selected[video.id]}
                                                    onCheckedChange={() => toggleTrack(video.id)}
                                                    disabled={!selected[playlist.id]} 
                                                    className="shrink-0 mt-1"
                                                />
                                                <img
                                                    src={video.thumbnail}
                                                    alt={video.title}
                                                    className="w-20 h-14 object-cover rounded shrink-0"
                                                />
                                                <Label 
                                                    htmlFor={`video-${video.id}`} 
                                                    className="text-xs leading-tight line-clamp-3 flex-1"
                                                >
                                                    {video.title}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">Sem vídeos disponíveis.</p>
                                )}
                                
                                {videosToShowMap[playlist.id] < playlist.videos.length && (
                                    <Button 
                                        className="w-full mt-3 text-xs h-8" 
                                        variant="secondary"
                                        onClick={() => handleLoadMoreVideos(playlist.id)}
                                    >
                                        Carregar mais vídeos
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
            </div>

            <div className="sticky bottom-0 bg-zinc-100 pt-3 pb-2 -mx-3 px-3 border-t mt-4">
                <Button className="w-full h-11 text-sm font-medium" onClick={handleDownload}>
                    Baixar Videos Selecionados
                </Button>
            </div>

            {showDownloadModal && (
                <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 p-3">
                    <div className="bg-white rounded-xl p-4 shadow-lg w-full max-w-md">
                        <h2 className="text-base font-semibold mb-4 text-center">Escolha o formato</h2>

                        <div className="grid grid-cols-2 gap-2 mb-4">
                            <Button
                                variant={downloadFormat === "video" ? "default" : "outline"}
                                onClick={() => setDownloadFormat("video")}
                                className="h-12"
                            >
                                Vídeo
                            </Button>
                            <Button
                                variant={downloadFormat === "audio" ? "default" : "outline"}
                                onClick={() => setDownloadFormat("audio")}
                                className="h-12"
                            >
                                Áudio
                            </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <Button variant="ghost" onClick={() => setShowDownloadModal(false)} className="h-10">
                                Cancelar
                            </Button>
                            <Button
                                className="h-10"
                                onClick={() => {
                                    if (!downloadFormat) {
                                        alert("Selecione uma opção.");
                                        return;
                                    }
                                    iniciarDownload(downloadFormat);
                                }}
                            >
                                OK
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {jobId && (
                <div className="mt-4 p-3 bg-white rounded-lg border text-xs space-y-1">
                    <p><span className="font-medium">Status:</span> {status}</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                    </div>
                    <p><span className="font-medium">Vídeos:</span> {processed}/{total}</p>
                    <p className="text-gray-500 truncate">{current}</p>
                </div>
            )}    
        
            <footer className="mt-6 pt-3 border-t flex items-center justify-center gap-2 text-xs text-gray-500">
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
        </div>
        </Layout>
    );
    
}