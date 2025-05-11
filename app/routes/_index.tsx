import { useState, useEffect } from 'react';
import { useFetcher } from '@remix-run/react';
import { useMusicStore } from '~/store/useMusicStore';
import { Button } from '~/components/ui/button'; 
import { Card, CardContent } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { Input } from '~/components/ui/input'; 

export default function Index() {
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
        }
    };

    const handleDownload = () => {
        //const selectedVideoIds = Object.keys(selected).filter(videoId => selected[videoId]);
        const selectedVideoIds = Object.keys(selected).filter(id => {
            // Verifica se o ID é um vídeo
            return selected[id] && !tracks.some(playlist => playlist.id === id); 
        });
        
        if (selectedVideoIds.length === 0) {
            alert('Nenhum vídeo selecionado para download.');
            return; // Se nenhum vídeo estiver selecionado, avise o usuário
        }

        fetch('http://192.168.1.14:5000/api/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ video_ids: selectedVideoIds })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Erro ao iniciar o download');
            }
            return response.json();
        })
        .then(data => {
            console.log(data.status); // Você pode exibir uma mensagem a partir disso
            alert(data.status); // Feedback para o usuário
        })
        .catch(error => {
            console.error('Houve um erro: ', error);
            alert('Houve um erro ao iniciar o download.');
        });
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

    return (
        <div className="p-5">
            <h1 className="text-2xl mb-4">Playlists do YouTube</h1>
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
                                {playlist.videos.length > 0 ? (
                                    playlist.videos.slice(0, 10).map((video) => ( 
                                        <div key={video.id} className="flex items-center mt-2">
                                            <Checkbox
                                                id={`video-${video.id}`}
                                                checked={!!selected[video.id]}
                                                onCheckedChange={() => toggleTrack(video.id)} 
                                                disabled={!selected[playlist.id]} 
                                            />
                                            <img src={video.thumbnail} alt={video.title} className="w-12 h-12 mr-2" />
                                            <Label htmlFor={`video-${video.id}`}>
                                                {`${video.title} (https://www.youtube.com/watch?v=${video.id})`}
                                            </Label>
                                        </div>
                                    ))
                                ) : (
                                    <p>Sem vídeos disponíveis nessa playlist.</p>
                                )}
                                <Button className="mt-2" onClick={() => {/* Lógica para carregar mais videos */}}>
                                    Carregar mais vídeos
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
            <Button className="mt-5" onClick={handleDownload}>
                Baixar Videos Selecionados
            </Button>
        </div>
    );
}