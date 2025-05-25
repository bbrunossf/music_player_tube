import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'


export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const query = formData.get('query') as string

  try {
    //const response = await fetch('http://192.168.1.14:5000/api/search', {
    // ✅ process.env funciona perfeitamente aqui (servidor)
    const apiUrl = process.env.PUBLIC_API_URL_SEARCH
    
    if (!apiUrl) {
      console.error('PUBLIC_API_URL_SEARCH não definida no .env')
      return json({ error: 'Configuração de API inválida' }, { status: 500 })
    }

    console.log(`Fazendo busca para: "${query}" na URL: ${apiUrl}`)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    })

    if (!response.ok) {
      return json({ error: 'Erro na busca' }, { status: 400 })
    }

    //return response
    const data = await response.json();
    console.log(data); // Verifique o que está sendo retornado
    return json({ playlists: data.playlists }, { status: 200 }); // Ajuste para retornar playlists    
  } catch (error) {
    return json({ error: 'Serviço indisponível' }, { status: 503 })
  }
}