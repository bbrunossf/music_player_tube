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
        <div className="page home-page">
        {/* <div className="min-h-screen flex"> */}
        {/* <div className="min-h-screen bg-zinc-100 text-zinc-950 px-4 sm:px-6 lg:px-8"> */}
        <div className="flex-1 bg-zinc-100 text-zinc-950 px-4 sm:px-6 lg:px-8">

            {/* <h1 className="text-2xl mb-4">Playlists do YouTube</h1> */}
            <h1 className="text-3xl font-semibold text-center mb-6 tracking-tight">
                YouTube Playlist Downloader
            </h1>


            <div className="flex gap-2 mb-3">
                <Input
                    placeholder="URL da playlist"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                />
                <Button onClick={handleImportUrl}>
                    OK
                </Button>
            </div>

            <div className="flex gap-2 mb-5">
                <Input
                    placeholder="Nome da playlist"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                />
                <Button onClick={handleSearch}>
                    Pesquisar
                </Button>
            </div>
            {tracks.map((playlist) => (
                <Card key={playlist.id}>
                    <CardContent>
                        <div className="flex items-center">
                            <Checkbox
                                id={`playlist-${playlist.id}`}
                                checked={!!selected[playlist.id]}
                                onCheckedChange={() => togglePlaylist(playlist.id)} 
                            />
                            <Label htmlFor={`playlist-${playlist.id}`} className="cursor-pointer" onClick={() => handleTogglePlaylist(playlist.id)}>
                                {playlist.title}
                            </Label>
                        </div>

                        {expandedPlaylistId === playlist.id && (
                            <div className="ml-4 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mb-2"
                                    onClick={() => selecionarTodosDaPlaylist(playlist.id)}
                                >
                                    Selecionar todos os visíveis
                                </Button>

                                {playlist.videos.length > 0 ? (
                                    //v2.1 assim ficou mais bonito
                                    // <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-4">
                                        {playlist.videos.slice(0, videosToShowMap[playlist.id] || 10).map((video) => {
                                            //console.log(video);
                                            return (
                                            <Card key={video.id} className="p-2">                                                
                                                <CardContent>
                                                    <div className="flex flex-col items-start">
                                                        <Checkbox
                                                            id={`video-${video.id}`}
                                                            checked={!!selected[video.id]}
                                                            onCheckedChange={() => toggleTrack(video.id)}
                                                            disabled={!selected[playlist.id]} 
                                                        />
                                                        <img
                                                            src={video.thumbnail}
                                                            alt={video.title}
                                                            className="w-full h-auto mt-2 mb-2"
                                                        />
                                                        <Label htmlFor={`video-${video.id}`} className="text-base sm:text-sm">
                                                            {video.title}
                                                        </Label>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )})}
                                    </div>


                                ) : (
                                    <p>Sem vídeos disponíveis nessa playlist.</p>
                                )}
                                {/* <Button className="mt-2" onClick={() =>  Lógica para carregar mais videos */}
                                {videosToShowMap[playlist.id] < playlist.videos.length && (
                                    <Button className="mt-2" onClick={() => handleLoadMoreVideos(playlist.id)}>
                                    Carregar mais vídeos
                                </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
            <div className="flex justify-center mt-8">
                <Button size="lg" onClick={handleDownload}>
                    Baixar Videos Selecionados
                </Button>
            </div>

            

            {showDownloadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full">
                    <h2 className="text-lg font-semibold mb-4">Escolha o formato do download</h2>

                    <div className="flex justify-around mb-4">
                        <Button
                        variant={downloadFormat === "video" ? "default" : "outline"}
                        onClick={() => setDownloadFormat("video")}
                        >
                        Vídeo
                        </Button>
                        <Button
                        variant={downloadFormat === "audio" ? "default" : "outline"}
                        onClick={() => setDownloadFormat("audio")}
                        >
                        Áudio
                        </Button>
                    </div>

                    <div className="flex justify-between">
                        <Button variant="ghost" onClick={() => setShowDownloadModal(false)}>
                        Cancelar
                        </Button>
                        <Button
                        onClick={() => {
                            if (!downloadFormat) {
                            alert("Selecione uma opção antes de continuar.");
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
                <div style={{ marginTop: 20 }}>
                <p><strong>Status:</strong> {status}</p>
                <p><strong>Progresso:</strong> {progress}%</p>
                <p><strong>Vídeos:</strong> {processed} de {total}</p>
                <p><strong>Atual:</strong> {current}</p>
                </div>
            )}    
        
        {/* <footer className="mt-10 flex justify-center items-center gap-2 text-sm text-muted-foreground"> */}
        <footer className="mt-10 pt-4 border-t text-center text-sm text-gray-500">
            <div
                className={`w-3 h-3 rounded-full ${
                    apiStatus === "ok" ? "bg-green-500" : "bg-red-500"
                }`}
                title={apiStatus === "ok" ? "Conectado ao backend" : "Erro de conexao"}
            ></div>
            <span>
                Conexao com o backend (a cada 30s):{" "}
                {apiStatus === "checking" ? "verificando..." : apiStatus === "ok" ? "ativa" : "falha"}
            </span>
        </footer>

        </div>

        {/*
        <div className="flex-1 bg-zinc-200 text-zinc-950 px-4 sm:px-6 lg:px-8">
            Conteudo da direita
        </div>
        */}

        </div>
        </Layout>
    );
    
}