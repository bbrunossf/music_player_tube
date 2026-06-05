import { useEffect, useState } from 'react'

type DownloadStatus = {
  job_id: string
  status: 'running' | 'completed' | 'error' | 'creating_playlist' | 'scanning_jellyfin' | 'playlist_error'
  total_videos: number
  processed_videos: number
  current_video: string | null
  progress_percent: number
  errors: string[]
  saved_paths?: string[]
  playlist_id?: string | null
  playlist_name?: string | null
}

// Status que indicam fim do job (paramos o polling)
const FINAL_STATUSES = ['completed', 'error', 'playlist_error'];

export function useDownloadProgress(jobId: string | null) {
  const [data, setData] = useState<DownloadStatus | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!jobId) return

    setLoading(true)

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/download-status?job_id=${jobId}`)
        const json = await res.json()

        setData(json)

        if (FINAL_STATUSES.includes(json.status)) {
          clearInterval(interval)
          setLoading(false)
        }
      } catch (err) {
        console.error("Erro no polling:", err)
        clearInterval(interval)
        setLoading(false)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [jobId])

  return {
    data,
    loading,
    progress: data?.progress_percent ?? 0,
    current: data?.current_video,
    processed: data?.processed_videos ?? 0,
    total: data?.total_videos ?? 0,
    status: data?.status
  }
}
