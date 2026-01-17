import { useState, useCallback } from "react";
import type {
  JellyfinConfig,
  JellyfinItem,
  JellyfinLibrary,
} from "~/types/jellyfin";

export function useJellyfin(initialConfig: JellyfinConfig) {
  const [config, setConfig] = useState<JellyfinConfig | null>(initialConfig);

  const [libraries, setLibraries] = useState<JellyfinLibrary[]>([]);
  const [items, setItems] = useState<JellyfinItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playlists, setPlaylists] = useState<JellyfinLibrary[]>([]);

  const getHeaders = useCallback(() => {
    if (!config) return {};
    return {
      "X-Emby-Token": config.apiKey,
      "Content-Type": "application/json",
    };
  }, [config]);

  const getImageUrl = useCallback(
    (item: JellyfinItem, type: "Primary" | "Backdrop" = "Primary") => {
      if (!config) return null;

      const baseUrl = config.url.replace(/\/$/, "");

      if (type === "Primary" && item.ImageTags?.Primary) {
        return `${baseUrl}/Items/${item.Id}/Images/Primary?tag=${item.ImageTags.Primary}&quality=90&fillWidth=300`;
      }

      if (type === "Backdrop" && item.BackdropImageTags?.length) {
        return `${baseUrl}/Items/${item.Id}/Images/Backdrop?tag=${item.BackdropImageTags[0]}&quality=90`;
      }

      return null;
    },
    [config]
  );

  const fetchLibraries = useCallback(async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      const baseUrl = config.url.replace(/\/$/, "");
      const response = await fetch(`${baseUrl}/Library/VirtualFolders`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Erro ao conectar: ${response.status}`);
      }

      const data = await response.json();
      setLibraries(
        data.map((lib: any) => ({
          Id: lib.ItemId,
          Name: lib.Name,
          CollectionType: lib.CollectionType,
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [config, getHeaders]);

  const fetchPlaylists = useCallback(async () => {
    if (!config) return;

    setLoading(true);
    setError(null);

    try {
      const baseUrl = config.url.replace(/\/$/, "");
      const params = new URLSearchParams({
        IncludeItemTypes: "Playlist",
        Recursive: "true",
        SortBy: "SortName",
        SortOrder: "Ascending",
      });

      const response = await fetch(
        `${baseUrl}/Users/${config.userId}/Items?${params}`,
        { headers: getHeaders() }
      );
      console.log("Resultado da listagem de playlists:", response);
      if (!response.ok) {
        throw new Error(`Erro ao buscar playlists: ${response.status}`);
      }

      const data = await response.json();
      setPlaylists(data.Items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  }, [config, getHeaders]);

  const fetchPlaylistItems = useCallback(
    async (playlistId: string): Promise<JellyfinItem[]> => {
      if (!config) return [];

      setLoading(true);
      setError(null);

      try {
        const baseUrl = config.url.replace(/\/$/, "");

        // Parâmetros da query, similar ao seu exemplo Python
        const params = new URLSearchParams({
          IncludeItemTypes: "VideoFile",
          Recursive: "true",
          UserId: config.userId,
          // Se quiser usar a API key na URL também (opcional se já está no header)
          api_key: "aa11489164f544f7b4ac8b3a0c95c1a8",
        });

        // Construa a URL com os parâmetros
        const url = `${baseUrl}/Playlists/${playlistId}/Items?${params.toString()}`;

        // Headers com o token JWT que você obteve
        const headers = {
          accept: "application/json",
          "content-type": "application/json",
          "X-Emby-Token":
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Ijc0OTUxMmYwLWI1M2EtNDRjYi1hNThjLWIwYWZhNWI4YzRkOSJ9.Jkc4i_rEtB9goC5BYpXUwGH9BrLrYnrl0_2yCRHt3nw",
        };

        console.log("Fetching playlist items from:", url);

        const response = await fetch(url, {
          method: "GET",
          //headers,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Erro ao buscar itens da playlist: ${response.status} ${errorText}`
          );
        }

        const data = await response.json();
        console.log("Dados recebidos:", data);

        return data.Items || [];
      } catch (err) {
        console.error("Erro completo:", err);
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [config]
  );

  const addItemsToPlaylist = useCallback(
    async (playlistId: string, itemIds: string[]): Promise<boolean> => {
      if (!config || itemIds.length === 0) return true;

      setLoading(true);
      setError(null);

      try {
        const baseUrl = config.url.replace(/\/$/, "");

        const response = await fetch(
          `${baseUrl}/Users/${config.userId}/Playlists/${playlistId}/Items`,
          {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ Ids: itemIds }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Erro ao adicionar itens: ${response.status} - ${text}`
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [config, getHeaders]
  );

  const removeItemsFromPlaylist = useCallback(
    async (playlistId: string, itemIds: string[]): Promise<boolean> => {
      if (!config || itemIds.length === 0) return true;

      setLoading(true);
      setError(null);

      try {
        const baseUrl = config.url.replace(/\/$/, "");

        const response = await fetch(
          `${baseUrl}/Playlists/${playlistId}/Items`,
          {
            method: "DELETE",
            headers: getHeaders(),
            body: JSON.stringify({ Ids: itemIds }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `Erro ao remover itens: ${response.status} - ${text}`
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [config, getHeaders]
  );

  const fetchItems = useCallback(
    async (libraryId?: string) => {
      if (!config) return;

      setLoading(true);
      setError(null);

      try {
        const baseUrl = config.url.replace(/\/$/, "");
        const params = new URLSearchParams({
          Recursive: "true",
          Fields:
            "Overview,ImageTags,BackdropImageTags,ProductionYear,CommunityRating,RunTimeTicks,SeriesName,SeasonName,IndexNumber,ParentIndexNumber",
          IncludeItemTypes: "Movie,Series,Episode,Audio,MusicAlbum,MusicVideo",
          SortBy: "SortName",
          SortOrder: "Ascending",
        });

        if (libraryId) {
          params.set("ParentId", libraryId);
        }

        //const response = await fetch(`${baseUrl}/Items?${params}`, {
        const response = await fetch(
          `${baseUrl}/Users/${config.userId}/Items?${params}`,
          {
            headers: getHeaders(),
          }
        );
        console.log("Resposta do Items:", response);
        if (!response.ok) {
          throw new Error(`Erro ao buscar itens: ${response.status}`);
        }

        const data = await response.json();
        setItems(data.Items || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    },
    [config, getHeaders]
  );

  const createPlaylist = useCallback(
    async (
      name: string,
      itemIds: string[],
      mediaType: "Audio" | "Video"
    ): Promise<boolean> => {
      if (!config) return false;

      setLoading(true);
      setError(null);

      try {
        const baseUrl = config.url.replace(/\/$/, "");

        // Create playlist with JSON body
        const response = await fetch(`${baseUrl}/Playlists`, {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            Name: name,
            Ids: itemIds,
            MediaType: mediaType,
            UserId: config.userId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Erro ao criar playlist: ${response.status} - ${errorText}`
          );
        }

        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
        return false;
      } finally {
        setLoading(false);
      }
    },
    [config, getHeaders]
  );

  return {
    config,
    libraries,
    playlists,
    fetchPlaylists,
    fetchPlaylistItems,
    addItemsToPlaylist,
    removeItemsFromPlaylist,
    items,
    loading,
    error,
    fetchLibraries,
    fetchItems,
    createPlaylist,
    getImageUrl,
    isConfigured: !!config,
  };
}
