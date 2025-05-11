import { create } from 'zustand'

interface Track {
  id: string
  title: string
}

interface MusicStore {
  query: string
  tracks: Track[]
  selected: Record<string, boolean>
  isLoading: boolean
  error: string | null
  setQuery: (query: string) => void
  setTracks: (tracks: Track[]) => void
  toggleTrack: (id: string) => void
  toggleAllTracks: () => void
  togglePlaylist: (playlistId: string) => void
  setLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
}

export const useMusicStore = create<MusicStore>((set) => ({
  query: '',
  tracks: [],
  selected: {},
  isLoading: false,
  error: null,
  
  setQuery: (query) => set({ query }),
  
  setTracks: (tracks) => set({ tracks, selected: {} }),
  
  toggleTrack: (id) => 
    set((state) => ({
      selected: {
        ...state.selected,
        [id]: !state.selected[id]
      }
    })),
  
  toggleAllTracks: () => 
    set((state) => {
      const allSelected = !Object.values(state.selected).some(Boolean)
      const newSelected = {} as Record<string, boolean>
      
      state.tracks.forEach(track => {
        newSelected[track.id] = allSelected
      })
      
      return { selected: newSelected }
    }),

    togglePlaylist: (playlistId) => set((state) => {
      const newSelected = { ...state.selected };
      newSelected[playlistId] = !newSelected[playlistId]; // Inverte a seleção da playlist
      return { selected: newSelected };
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  reset: () => set({ 
    tracks: [], 
    selected: {}, 
    error: null 
  })
}))