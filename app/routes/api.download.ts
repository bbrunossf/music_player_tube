import type { ActionFunctionArgs } from '@remix-run/node';
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from '@remix-run/node'

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("job_id");

  if (!jobId) {
    return json({ error: "job_id não informado" }, { status: 400 });
  }

  const apiUrl = process.env.PUBLIC_API_URL_STATUS;
  // exemplo: http://192.168.1.14:5000/api/download-status

  const response = await fetch(`${apiUrl}/${jobId}`);

  if (!response.ok) {
    return json({ error: "Job não encontrado" }, { status: 404 });
  }

  const data = await response.json();
  return json(data);
}

export async function action({ request }: ActionFunctionArgs) {
  // const formData = await request.formData()
  // const video_ids = JSON.parse(formData.get('video_ids') as string)
  const { video_ids, format } = await request.json()

  try {
    //const response = await fetch('http://192.168.1.14:5000/api/download', {
    // ✅ process.env funciona perfeitamente aqui (servidor)
    const apiUrl = process.env.PUBLIC_API_URL_DOWNLOAD
    
    if (!apiUrl) {
      console.error('API_URL_DOWNLOAD não definida no .env')
      return json({ error: 'Configuração de API inválida' }, { status: 500 })
    }

    console.log(`Iniciando download de ${video_ids.length} vídeos na URL: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_ids, format })
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Erro no download' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    console.log('Resposta da API de download:', data)

    // return new Response(JSON.stringify({ status: 'Downloads iniciados com sucesso!' }), {
    //   status: 200,
    //   headers: { 'Content-Type': 'application/json' }
    // })
  return json({
      job_id: data.job_id,
      status: data.status
    })    
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}