// app/routes/playlists.tsx
import { LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { getAuthenticatedApi, getCurrentUserId } from "~/lib/jellyfinClient";
import { getLibraryApi, getItemsApi } from '@jellyfin/sdk/lib/utils/api/index.js';
import { useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
  const api = await getAuthenticatedApi();
  const userId = await getCurrentUserId();
  
  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  // Primeiro, buscar as pastas de mídia para encontrar a pasta de playlists
  const foldersResponse = await getLibraryApi(api).getMediaFolders();
  const playlistsFolder = foldersResponse.data.Items?.find(
    folder => folder.CollectionType === 'playlists'
  );

  if (!playlistsFolder) {
    return { playlists: [] };
  }

  // Agora buscar as playlists dentro da pasta de playlists
  const playlistsResponse = await getItemsApi(api).getItems({
    userId: userId,
    parentId: playlistsFolder.Id,
    includeItemTypes: ['Playlist']
  });

  return {
    playlists: playlistsResponse.data.Items || [],
  };
}

export default function PlaylistsRoute() {
  const { playlists } = useLoaderData<typeof loader>();
  const [newPlaylistName, setNewPlaylistName] = useState("");

  return (
    <div className="min-h-screen p-6 bg-zinc-100 text-zinc-900">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Minhas Playlists no Jellyfin
      </h1>

      <div className="mb-8 border rounded-lg p-4 bg-white shadow-sm">
        <h2 className="text-xl font-semibold mb-2">Criar nova playlist</h2>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            placeholder="Nome da nova playlist"
            className="flex-1 px-4 py-2 border rounded"
            value={newPlaylistName}
            onChange={(e) => setNewPlaylistName(e.target.value)}
          />
          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Criar
          </button>
        </div>
      </div>

      <div className="grid gap-6">
        {playlists.map((playlist) => (
          <div
            key={playlist.Id}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold">{playlist.Name}</h3>
              <button className="text-sm text-red-500 hover:underline">
                Excluir
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(playlist.Items || []).map((item: any) => (
                <div
                  key={item.Id}
                  className="border rounded p-2 bg-gray-50"
                >
                  <p className="text-sm font-medium">{item.Name}</p>
                  <button className="text-xs text-red-400 hover:underline mt-1">
                    Remover
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <button className="text-sm text-blue-500 hover:underline">
                Adicionar arquivos da biblioteca
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}