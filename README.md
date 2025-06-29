# Aplicação para criar biblioteca de clipes e músicas


## Resumo

O código desse repositório tem por objetivo criar uma interface para selecionar vídeos do Youtube e baixar os arquivos (vídeo ou áudio), para criar uma biblioteca própria e variada, que possa tocar localmente, sem propagandas.

O projeto usa um backend em Python (compartimentado em um container Docker) e o frontend foi elaborado usando o framework Remix.

## Ferramentas utilizadas
| Linguagem | Frontend |
|:---------:|:--------:|
 <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg" alt="Python" width="50" /> <br> **Python** |  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg" alt="JavaScript" width="50" /> <br> **JavaScript** <br> <img src="https://remix.run/_brand/remix-glowing.svg" alt="Remix" width="50" /> <br> **Remix** |

## Seções/rotas e arquivos acessórios
### Seções
Como a interface é bem simples, vou detalhar mais os endpoints criados no backend:  
* health: verifica a saúde da imagem  
* search: pesquisa o termo digitado  
* import-playlist: para o usuário indicar direto o link da playlist que ele quer usar  
* download: para baixar o vídeo ou o áudio

### Nota:
Nota: não adiantou colocar as variáveis no arquivo .env; no modo de produção o Remix não lê o .env  
É necessário definir as variáveis de ambiente diretamente no servidor ou no serviço de hospedagem.  
A solução foi declarar as variáveis dentro do arquivo do daemon, (frontend.service, no meu caso)  
com a chave Environment=PUBLIC_API_URL_IMPORT_PLAYLIST=http://192.168.1.14:5000/api/import-playlist  
Seguir esse procedimento para outros projetos em Remix que precisem de variáveis de ambiente.  


## Próximos passos / Orientações para próximos projetos: 
* Fazer integração com a API do Jellyfinn, para popular os arquivos de áudio com as tagas ID3, e também atualizar a playlist com os arquivos novos
