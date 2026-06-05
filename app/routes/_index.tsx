// Última atualização: lógica do botão "Carregar mais vídeos"

import Layout from '~/components/layout';
import { useState, useEffect } from 'react';
import { useCallback } from "react";
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
import { Link } from "@remix-run/react";

import type { JellyfinItem } from "~/types/jellyfin";    // NOVO



//função loader para carregar as variáveis de ambiente
export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    apiHealthUrl: process.env.PUBLIC_API_URL_HEALTH,
    // NOVO: configuração Jellyfin para buscar playlists existentes
    jellyfinUrl: process.env.JELLYFIN_URL,
    jellyfinApiKey: process.env.JELLYFIN_API,
    jellyfinUserId: process.env.JELLYFIN_USER_ID,
  });
}

export default function Index() {
  const {
      apiHealthUrl,
      jellyfinUrl,
      jellyfinApiKey,
      jellyfinUserId,
  } = useLoaderData<typeof loader>();
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

  // NOVO: estados para opções de pós-download
     const [postDownloadMode, setPostDownloadMode] = useState<"none" | "new" | "existing">("none");
     const [newPlaylistName, setNewPlaylistName] = useState("");
     const [existingPlaylistId, setExistingPlaylistId] = useState("");
     const [jellyfinPlaylists, setJellyfinPlaylists] = useState<JellyfinItem[]>([]);
     const [loadingPlaylists, setLoadingPlaylists] = useState(false);

     const {
         progress,
         current,
         processed,
         total,
         status,
         data: downloadData,
     } = useDownloadProgress(jobId)


    // NOVO: carrega playlists do Jellyfin quando o modal abre
    const loadJellyfinPlaylists = useCallback(async () => {
      if (!jellyfinUrl || !jellyfinApiKey || !jellyfinUserId) return;

      setLoadingPlaylists(true);
      try {
          const baseUrl = jellyfinUrl.replace(/\/$/, "");
          const params = new URLSearchParams({
              IncludeItemTypes: "Playlist",
              Recursive: "true",
              SortBy: "SortName",
              SortOrder: "Ascending",
          });
          const resp = await fetch(
              `${baseUrl}/Users/${jellyfinUserId}/Items?${params}`,
              { headers: { "X-Emby-Token": jellyfinApiKey } }
          );
          if (resp.ok) {
              const data = await resp.json();
              setJellyfinPlaylists(data.Items || []);
          }
      } catch (err) {
          console.error("Erro ao carregar playlists:", err);
      } finally {
          setLoadingPlaylists(false);
      }
  }, [jellyfinUrl, jellyfinApiKey, jellyfinUserId]);


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

        // Reseta opções de pós-download
        setPostDownloadMode("none");
        setNewPlaylistName("");
        setExistingPlaylistId("");

        setShowDownloadModal(true);
        loadJellyfinPlaylists();  // NOVO
    };


    const iniciarDownload = (formato: "video" | "audio") => {
        const selectedVideoIds = Object.keys(selected).filter(id => {
            return selected[id] && !tracks.some(playlist => playlist.id === id);
        });

        // Monta o body com os novos campos
        const body: any = {
            video_ids: selectedVideoIds,
            format: formato,
        };

        if (postDownloadMode === "new") {
            body.create_playlist = true;
            body.playlist_name = newPlaylistName.trim() || undefined;
        } else if (postDownloadMode === "existing") {
            body.create_playlist = true;
            body.target_playlist_id = existingPlaylistId;
        }
        // se "none", create_playlist fica false (default)

        fetch('/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
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
             <p className="font-medium text-zinc-300">
               Status:{" "}
               <span className={
                 status === "error" || status === "playlist_error"
                   ? "text-red-400"
                   : status === "completed"
                   ? "text-green-400"
                   : "text-blue-400"
               }>
                 {status === "scanning_jellyfin" && "Escaneando Jellyfin..."}
                 {status === "creating_playlist" && "Criando playlist..."}
                 {status === "playlist_error" && "Erro na playlist"}
                 {status === "running" && "Baixando"}
                 {status === "completed" && "Concluído"}
                 {status === "error" && "Erro"}
               </span>
             </p>
             <p className="text-zinc-400">{progress}%</p>
           </div>
           <div className="w-full bg-zinc-700 rounded-full h-4">
             <div
               className={`h-4 rounded-full transition-all ${
                 status === "error" || status === "playlist_error"
                   ? "bg-red-500"
                   : status === "completed"
                   ? "bg-green-500"
                   : "bg-blue-500"
               }`}
               style={{ width: `${progress}%` }}
             ></div>
           </div>
           <div className="flex justify-between">
             <p className="text-zinc-300">
               <span className="font-medium">Vídeos:</span> {processed}/{total}
             </p>
             <span className="material-icons text-base text-blue-400">cloud_download</span>
           </div>
           {current && <p className="text-zinc-400 truncate text-base">{current}</p>}

           {/* NOVO: info da playlist */}
           {status === "completed" && downloadData?.playlist_id && (
             <div className="mt-3 pt-3 border-t border-zinc-700">
               <p className="text-green-400 text-sm flex items-center gap-1">
                 <span className="material-icons text-base">playlist_add_check</span>
                 {downloadData.playlist_name
                   ? `Playlist: ${downloadData.playlist_name}`
                   : `Itens adicionados à playlist ${downloadData.playlist_id}`}
               </p>
             </div>
           )}
         </div>
       )}



        {/* Filtros
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
        </div>  */}

        {/* Lista de vídeos */}
        <div className="space-y-5">
          {tracks.map((playlist) => (
            <Card key={playlist.id} className="overflow-hidden bg-zinc-800 border-none shadow-md">
              <CardContent className="p-0">
                <div className="p-5 hover:bg-zinc-700 transition-colors">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      id={`playlist-${playlist.id}`}
                      checked={!!selected[playlist.id]}
                      onCheckedChange={() => togglePlaylist(playlist.id)}
                      className="shrink-0 border-zinc-600 h-6 w-6"
                      // Impedir propagação para que o clique no checkbox não afete outros elementos
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => handleTogglePlaylist(playlist.id)}
                    >
                      <span
                        className="text-lg font-medium leading-tight line-clamp-2"
                      >
                        {playlist.title}
                      </span>
                    </div>
                  </div>
                </div>

                {expandedPlaylistId === playlist.id && (
                  <div className="border-t border-zinc-700 p-4">
                  <Button
                    className="w-full mb-3 h-10 text-base bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => selecionarTodosDaPlaylist(playlist.id)}
                  >
                    Selecionar Todos
                  </Button>
                    {playlist.videos.slice(0, videosToShowMap[playlist.id] || 10).map((video) => (
                      <div key={video.id} className="flex gap-4 p-5 hover:bg-zinc-700 border-b border-zinc-700 transition-colors">
                        <Checkbox
                          id={`video-${video.id}`}
                          checked={!!selected[video.id]}
                          onCheckedChange={() => toggleTrack(video.id)}
                          disabled={!selected[playlist.id]}
                          className="shrink-0 mt-1 border-zinc-600 h-6 w-6"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className="relative shrink-0">
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            className="w-32 h-20 object-cover rounded"
                          />
                          {/* <div className="absolute bottom-1 right-1 bg-black/70 text-sm px-1 rounded">
                            12:45
                          </div> voltar com a função para exibir o tempo do vídeo e o ícone de duração*/}
                        </div>
                        <div className="flex-1">
                          <Label
                            htmlFor={`video-${video.id}`}
                            className="text-base leading-tight line-clamp-2 font-medium mb-2 block"
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
                <span className="material-icons">home</span>
                Home
              </Button>
              <Link to="/editar">
                <Button variant="ghost" className="flex flex-col items-center text-xs">
                  <span className="material-icons">download_for_offline</span>
                  Library
                </Button>
              </Link>
              <Button variant="ghost" className="flex flex-col items-center text-xs">
                <span className="material-icons">settings</span>
                Config
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de seleção de formato + opções de playlist */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-800 rounded-xl p-5 shadow-lg w-full max-w-sm border border-zinc-700 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4 text-center">Opções de Download</h2>

            {/* Escolha do formato */}
            <p className="text-sm text-zinc-400 mb-2">Formato</p>
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

            {/* Divisor */}
            <div className="border-t border-zinc-700 my-4" />

            {/* Opções de pós-download */}
            <p className="text-sm text-zinc-400 mb-3">Após o download</p>

            <div className="space-y-3 mb-5">
              {/* Opção 1: Apenas baixar */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  postDownloadMode === "none"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="postDownload"
                  checked={postDownloadMode === "none"}
                  onChange={() => setPostDownloadMode("none")}
                  className="mt-0.5 accent-blue-500"
                />
                <div>
                  <p className="text-sm font-medium">Apenas baixar</p>
                  <p className="text-xs text-zinc-400">Salva os arquivos sem alterar playlists</p>
                </div>
              </label>

              {/* Opção 2: Criar nova playlist */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  postDownloadMode === "new"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="postDownload"
                  checked={postDownloadMode === "new"}
                  onChange={() => setPostDownloadMode("new")}
                  className="mt-0.5 accent-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Criar nova playlist</p>
                  <p className="text-xs text-zinc-400 mb-2">
                    Cria uma playlist no Jellyfin com os arquivos baixados
                  </p>
                  {postDownloadMode === "new" && (
                    <Input
                      placeholder="Nome da playlist (opcional)"
                      value={newPlaylistName}
                      onChange={(e) => setNewPlaylistName(e.target.value)}
                      className="h-9 text-sm bg-zinc-900 border-zinc-600"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                </div>
              </label>

              {/* Opção 3: Adicionar a playlist existente */}
              <label
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  postDownloadMode === "existing"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-zinc-700 hover:border-zinc-500"
                }`}
              >
                <input
                  type="radio"
                  name="postDownload"
                  checked={postDownloadMode === "existing"}
                  onChange={() => setPostDownloadMode("existing")}
                  className="mt-0.5 accent-blue-500"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium">Adicionar a playlist existente</p>
                  <p className="text-xs text-zinc-400 mb-2">
                    Adiciona os arquivos a uma playlist já criada no Jellyfin
                  </p>
                  {postDownloadMode === "existing" && (
                    <select
                      value={existingPlaylistId}
                      onChange={(e) => setExistingPlaylistId(e.target.value)}
                      className="w-full h-9 text-sm bg-zinc-900 border border-zinc-600 rounded px-2 text-white"
                      onClick={(e) => e.stopPropagation()}
                      disabled={loadingPlaylists}
                    >
                      <option value="">
                        {loadingPlaylists ? "Carregando playlists..." : "Selecione uma playlist"}
                      </option>
                      {jellyfinPlaylists.map((pl) => (
                        <option key={pl.Id} value={pl.Id}>
                          {pl.Name} ({pl.ChildCount ?? 0} itens)
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </label>
            </div>

            {/* Botões de ação */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="ghost"
                onClick={() => setShowDownloadModal(false)}
                className="h-12 border border-zinc-700 hover:bg-zinc-700"
              >
                Cancelar
              </Button>
              <Button
                onClick={() => {
                  if (!downloadFormat) return;
                  if (postDownloadMode === "existing" && !existingPlaylistId) {
                    alert("Selecione uma playlist existente.");
                    return;
                  }
                  iniciarDownload(downloadFormat);
                }}
                disabled={!downloadFormat || (postDownloadMode === "existing" && !existingPlaylistId)}
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
