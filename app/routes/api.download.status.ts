import type { LoaderFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url)
  const jobId = url.searchParams.get('job_id')

  if (!jobId) {
    return json({ error: 'job_id não informado' }, { status: 400 })
  }

  const apiBase = process.env.PUBLIC_API_URL_DOWNLOAD

  if (!apiBase) {
    return json({ error: 'API_URL_DOWNLOAD não definida no servidor' }, { status: 500 })
  }

  try {
    // Ex: se apiBase = http://192.168.1.14:5000/api/download
    // então ficará: http://192.168.1.14:5000/api/download/{job_id}
    const response = await fetch(`${apiBase}/${jobId}`)

    if (!response.ok) {
      return json({ error: 'Job não encontrado no backend' }, { status: 404 })
    }

    const data = await response.json()
    return json(data)

  } catch (error) {
    return json({ error: 'Erro ao consultar backend' }, { status: 503 })
  }
}
