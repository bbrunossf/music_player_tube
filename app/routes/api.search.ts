import type { ActionFunctionArgs } from '@remix-run/node'
import { json } from '@remix-run/node'

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const query = formData.get('query') as string

  try {
    const response = await fetch('http://192.168.1.14:5000/api/search', {
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