import type { ActionFunctionArgs } from '@remix-run/node'


export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const video_ids = JSON.parse(formData.get('video_ids') as string)

  try {
    //const response = await fetch('http://192.168.1.14:5000/api/download', {
    // ✅ process.env funciona perfeitamente aqui (servidor)
    const apiUrl = process.env.API_URL_DOWNLOAD
    
    if (!apiUrl) {
      console.error('API_URL_DOWNLOAD não definida no .env')
      return json({ error: 'Configuração de API inválida' }, { status: 500 })
    }

    console.log(`Iniciando download de ${video_ids.length} vídeos na URL: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ video_ids })
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Erro no download' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ status: 'Downloads iniciados com sucesso!' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Serviço indisponível' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}