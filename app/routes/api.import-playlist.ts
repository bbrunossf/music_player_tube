// Nota: não adiantou colocar as variáveis no arquivo .env; no modo de produção o Remix não lê o .env
// É necessário definir as variáveis de ambiente diretamente no servidor ou no serviço de hospedagem.
// A solução foi declarar as variáveis dentro do arquivo do daemon, (frontend.service, no meu caso)
// com a chave Environment=PUBLIC_API_URL_IMPORT_PLAYLIST=http://192.168.1.14:5000/api/import-playlist
//Seguir esse procedimento para outros projetos em Remix que precisem de variáveis de ambiente.

import { json, type ActionFunctionArgs } from '@remix-run/node';

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const url = formData.get('url');

  if (typeof url !== 'string' || !url.trim()) {
    return json({ error: 'URL inválida.' }, { status: 400 });
  }

  const apiUrl = process.env.PUBLIC_API_URL_IMPORT_PLAYLIST;

  if (!apiUrl) {
    console.error('PUBLIC_API_URL_IMPORT_PLAYLIST não definida no .env');
    return json({ error: 'Configuração de API inválida' }, { status: 500 });
  }

  console.log(`Importando playlist da URL: ${url} para ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ url }),
    });

    if (!response.ok) {
      const errorJson = await response.json().catch(() => null);
      const message = errorJson?.detail || 'Erro ao importar playlist';
      return json({ error: message }, { status: response.status });
    }

    const data = await response.json();
    return json({ playlists: data.playlists }, { status: 200 });
  } catch (error) {
    console.error('Erro na chamada à API do backend:', error);
    return json({ error: 'Falha na comunicação com o servidor.' }, { status: 503 });
  }
}
