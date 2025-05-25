import os
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from googleapiclient.discovery import build
import yt_dlp as youtube_dl
from typing import List
import threading

app = FastAPI()

load_dotenv()
# Obtém a chave da API do YouTube a partir das variáveis de ambiente
API_KEY = os.getenv('YOUTUBE_API_KEY')
print(f"API_KEY: {API_KEY}") # Para verificar se a chave está sendo lida corretamente




youtube = build(
    'youtube',
    'v3',
    developerKey=API_KEY
)

# Configurar CORS para permitir comunicação com frontend Remix
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001"],  # Porta padrão do Remix para modo desenvolvimento (5173)
    allow_methods=["POST"],
    allow_headers=["*"],
)

class SearchRequest(BaseModel):
    query: str

class Video(BaseModel):
    id: str
    title: str
    #thumbnail: str
    thumbnail: Optional[str] = None

class Playlist(BaseModel):
    id: str
    title: str
    videos: List[Video]

class SearchResponse(BaseModel):
    playlists: List[Playlist]

class DownloadRequest(BaseModel):
    video_ids: List[str]

#def search_playlists(query, next_page_token=None):
def search_playlists(query):
    request = youtube.search().list(
        q=query,
        part='id,snippet',
        maxResults=5,
        type='playlist',
        #pageToken=next_page_token
    )
    print("executando a busca por playlists...")
    response = request.execute()
    #print(response.keys()) #retorna o 'items'
    return response

# def get_videos_info(video_id):
#     request = youtube.videos().list(
#         part='snippet,contentDetails',
#         id=video_id)
#     print("obtendo dados do video...")
#     return request.execute()

def get_videos_info(playlist_id):
    videos = []
    request = youtube.playlistItems().list(
        playlistId=playlist_id,
        part='snippet',
        maxResults=50  # Pega até 50 vídeos (ajuste conforme necessário)
    )
    response = request.execute()
    #print(f"{playlist_id} - {response}") 

    # Extrai informações dos vídeos na playlist
    for item in response['items']:
        if item['snippet']['resourceId'].get('kind') != "youtube#video":
            continue
        video_title = item['snippet']['title']
        video_id = item['snippet']['resourceId']['videoId']        
        
        # Tenta obter o URL do thumbnail, tratando o caso de ausência
        try:
            video_thumbnail = item['snippet']['thumbnails']['standard']['url']
        except KeyError:
            video_thumbnail = None  # Ou poderia definir um valor padrão, como uma imagem

        videos.append(Video(id=video_id, title=video_title, thumbnail=video_thumbnail))

    return videos

# def get_playlist_videos(playlist_id):
#     videos = []
#     request = youtube.playlistItems().list(
#         playlistId=playlist_id,
#         part='snippet,contentDetails',
#         maxResults=50
#     )
#     response = request.execute()

#     #print(response['items']) #retorna uma lista de dicionários com 'title', 'resourceId' e 'thumbnails'

#     # Extrai informações dos vídeos na playlist
#     for item in response['items']:
#         video_title = item['snippet']['title']
#         video_id = item['snippet']['resourceId']['videoId']
#         video_url = f"https://www.youtube.com/watch?v={video_id}"

#         videos.append((video_title, video_url))

#     return videos

@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/search")
async def search_tracks(request: SearchRequest):
    response = search_playlists(request.query)
    #print(f"dados de playlist retornados: {response}") #retorna um youtube#searchListResponse, composto por
    #'items', que é uma lista de dicionários youtube#searchResult que tem 'kind', 'id' e 'snippet', e cada 'snippet' tem:
    #'title' , que é o título da playlist
    
    if not response.get('items'):
        raise HTTPException(
            status_code=404,
            detail="Nenhuma playlist encontrada para esta música"
        )
           
    # playlists = [
    # {
    #     "title": item['snippet']['title'],
    #     "id": item['id']['playlistId']
    # }
    # for item in response['items']
    # if item['id'].get('kind') == "youtube#playlist"
    # ]   

    #print(f"playlists encontradas: {playlists}") #retorna uma lista de dicionários com 'title' e 'id' da playlist
    playlists = []
    
    for item in response['items']:
        if item['id'].get('kind') != "youtube#playlist":
            continue

        playlist_id = item['id']['playlistId']
        playlist_title = item['snippet']['title']
        
        # Obter vídeos relacionados à playlist
        videos = get_videos_info(playlist_id)
        
        playlists.append(Playlist(id=playlist_id, title=playlist_title, videos=videos))

    #return {"playlists": playlists}
    return SearchResponse(playlists=playlists)    
    

def download_video(video_id: str):
    ydl_opts = {
        'format': 'best',  # Define que quer baixar o melhor formato de vídeo #VOU DEIXAR O DEFAULT MESMO
        'outtmpl': 'downloads/%(title)s.%(ext)s',  # Define o template do nome do arquivo
        'postprocessors': [],  # Nenhum postprocessador, pois queremos salvar o vídeo completo
    }

    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f'https://www.youtube.com/watch?v={video_id}'])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao baixar o vídeo com ID {video_id}: {str(e)}")

def download_audio(video_id: str):
    ydl_opts = {
        'format': 'bestaudio/best',
        'outtmpl': 'downloads/%(title)s.%(ext)s',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
    }    
    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            ydl.download([f'https://www.youtube.com/watch?v={video_id}'])
    except Exception as e:
        # Retornando uma mensagem mais descritiva sobre o erro
        raise HTTPException(status_code=400, detail=f"Erro ao baixar o vídeo com ID {video_id}: {str(e)}")

@app.post("/api/download")
async def start_download(request: DownloadRequest):
    print(f"dados brutos recebidos: {request}")
    error_messages = []
    try:
        # Processar downloads em background
        def process_downloads():
            for video_id in request.video_ids:
                try:
                    download_video(video_id) #aqui pode usar o download_audio se quiser baixar o audio
                except HTTPException as e:
                    error_messages.append(str(e.detail))
        
        threading.Thread(target=process_downloads).start()

        if error_messages:
            return {"status": "Downloads iniciados, mas houve erros.", "errors": error_messages}                        
        return {"status": "Downloads iniciados com sucesso!"}
    
    except Exception as e:
        # raise HTTPException(
        #     status_code=500,
        #     detail=str(e)
        # )
        print(f"Erro ao iniciar o download: {str(e)}")