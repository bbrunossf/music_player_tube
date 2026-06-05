import os
import time                                          # NOVO
from datetime import datetime                        # NOVO
from pathlib import Path                             # NOVO
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from googleapiclient.discovery import build
import yt_dlp as youtube_dl
from typing import List, Dict
import threading
from urllib.parse import urlparse, parse_qs
import re
import uuid
import httpx                                         # NOVO

app = FastAPI()

load_dotenv()
# Obtém a chave da API do YouTube a partir das variáveis de ambiente
API_KEY = os.getenv('YOUTUBE_API_KEY')
print(f"API_KEY: {API_KEY}") # Para verificar se a chave está sendo lida corretamente

#uai, não posso passar o endereço como env também?
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:3001")

# NOVO: Configurações do Jellyfin
JELLYFIN_URL = os.getenv("JELLYFIN_URL", "http://192.168.1.14:8096")
JELLYFIN_API_KEY = os.getenv("JELLYFIN_API_KEY", "aa11489164f544f7b4ac8b3a0c95c1a8")
JELLYFIN_USER_ID = os.getenv("JELLYFIN_USER_ID", "cdc4c651276d4ebb9651cc89f197a98f")


youtube = build(
    'youtube',
    'v3',
    developerKey=API_KEY
)

# Configurar CORS para permitir comunicação com frontend Remix
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Porta padrão do Remix para modo desenvolvimento (5173)
    allow_methods=["GET", "POST"],                    # ALTERADO: adicionado "GET"
    allow_headers=["*"],
)

jobs: Dict[str, dict] = {}
class DownloadRequest(BaseModel):
    video_ids: List[str]
    format: Optional[str] = "video"
    # NOVO: campos para criação automática de playlist no Jellyfin
    create_playlist: bool = False
    playlist_name: Optional[str] = None


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


class ImportRequest(BaseModel):
    url: str

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

    #retorna a url da playlist, o título e o ID
    #print(f"response: {response}") #para verificar o que está sendo retornado
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
        #print(f"playlist_id: {playlist_id}") #para verificar se o ID da playlist está correto
        playlist_title = item['snippet']['title']

        # Obter vídeos relacionados à playlist
        videos = get_videos_info(playlist_id)

        playlists.append(Playlist(id=playlist_id, title=playlist_title, videos=videos))

    #return {"playlists": playlists}
    return SearchResponse(playlists=playlists)





@app.post("/api/import-playlist")
async def import_playlist(url: str = Form(...)):
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)

    playlist_ids = query_params.get("list")
    if not playlist_ids:
        raise HTTPException(
            status_code=400,
            detail="URL inválida. Parâmetro 'list' não encontrado."
        )

    playlist_id = playlist_ids[0]  # Primeiro valor do parâmetro 'list'
    print(f"playlist_id: {playlist_id}")  # Para verificar se o ID da playlist está correto

    videos = get_videos_info(playlist_id)
    if not videos:
        raise HTTPException(
            status_code=404,
            detail="Não foi possível obter vídeos dessa playlist."
        )

    playlist_title = f"Playlist importada ({playlist_id})"

    return SearchResponse(playlists=[
        Playlist(id=playlist_id, title=playlist_title, videos=videos)
    ])

def download_video(video_id: str):
    ydl_opts = {
        "remote_components": "ejs:github", #agora precisa
        'format': 'best',  # Define que quer baixar o melhor formato de vídeo #VOU DEIXAR O DEFAULT MESMO
        'outtmpl': 'downloads/videos/%(title)s.%(ext)s',  # Define o template do nome do arquivo

        'addmetadata': True,
        'embedmetadata': True,
        'writethumbnail': True,

        'postprocessors': [
        {
            'key': 'FFmpegMetadata',
        }],  # Nenhum postprocessador, pois queremos salvar o vídeo completo
    }

    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            #ydl.download([f'https://www.youtube.com/watch?v={video_id}'])
            info = ydl.extract_info(
                f'https://www.youtube.com/watch?v={video_id}',
                download=True
            )
            filepath = ydl.prepare_filename(info)
            return os.path.abspath(filepath)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erro ao baixar o vídeo com ID {video_id}: {str(e)}")

def download_audio(video_id: str):
    ydl_opts = {
        "remote_components": "ejs:github", #agora precisa
        'format': 'bestaudio/best',
        'outtmpl': 'downloads/musicas/%(artist,creator)s/%(title)s.%(ext)s',

        'addmetadata': True,
        'embedmetadata': True,
        'writethumbnail': True,
        'embedthumbnail': True,

        'parse_metadata': [
            'title:%(artist)s - %(title)s'
        ],

        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        },
        {'key': 'EmbedThumbnail'},
        {'key': 'FFmpegMetadata'},
        ],
    }
    try:
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            #ydl.download([f'https://www.youtube.com/watch?v={video_id}'])
            info = ydl.extract_info(
                f'https://www.youtube.com/watch?v={video_id}',
                download=True
            )
            # prepare_filename retorna a extensão original (ex: .webm)
            # mas o FFmpegExtractAudio converte para .mp3
            filepath = ydl.prepare_filename(info)
            base, _ = os.path.splitext(filepath)
            filepath = base + '.mp3'
            return os.path.abspath(filepath)
    except Exception as e:
        # Retornando uma mensagem mais descritiva sobre o erro
        raise HTTPException(status_code=400, detail=f"Erro ao baixar o vídeo com ID {video_id}: {str(e)}")

# ============================================================
# NOVO: Funções auxiliares para integração com Jellyfin
# ============================================================

def _jellyfin_headers() -> dict:
    """Retorna os headers padrão para chamadas à API do Jellyfin."""
    return {
        "X-Emby-Token": JELLYFIN_API_KEY,
        "Accept": "application/json",
    }


def trigger_jellyfin_scan() -> bool:
    """
    Dispara um refresh completo da biblioteca do Jellyfin.
    Retorna True se o scan foi iniciado com sucesso.
    """
    try:
        resp = httpx.post(
            f"{JELLYFIN_URL}/Library/Refresh",
            headers=_jellyfin_headers(),
            timeout=30,
        )
        print(f"[Jellyfin] Scan disparado: HTTP {resp.status_code}")
        return resp.is_success
    except Exception as e:
        print(f"[Jellyfin] Erro ao disparar scan: {e}")
        return False


def find_jellyfin_items_by_filenames(
    filenames: set,
    media_type: str,
    max_retries: int = 6,
    retry_delay: int = 5,
) -> list:
    """
    Busca no Jellyfin os itens cujo nome de arquivo (parte final do Path)
    bate com algum dos nomes fornecidos.

    Args:
        filenames: conjunto de nomes de arquivo (ex: "Sweet Child O' Mine.mp3")
        media_type: "Audio" ou "Video"
        max_retries: número máximo de tentativas (aguardando o scan)
        retry_delay: segundos entre tentativas

    Returns:
        Lista de dicts com {"Id": ..., "Name": ..., "Path": ...}
    """
    base_url = JELLYFIN_URL.rstrip("/")
    include_types = "Audio" if media_type == "Audio" else "Video"
    limit = len(filenames) + 20  # margem extra

    for attempt in range(max_retries):
        time.sleep(retry_delay)

        try:
            resp = httpx.get(
                f"{base_url}/Users/{JELLYFIN_USER_ID}/Items",
                params={
                    "SortBy": "DateCreated",
                    "SortOrder": "Descending",
                    "limit": limit,
                    "Fields": "Path,DateCreated",
                    "Recursive": "true",
                    "IncludeItemTypes": include_types,
                },
                headers=_jellyfin_headers(),
                timeout=30,
            )
            resp.raise_for_status()
            data = resp.json()
            items = data.get("Items", [])

            # Filtra os itens cujo nome do arquivo bate com algum dos nossos
            matched = []
            for item in items:
                item_path = item.get("Path", "")
                if not item_path:
                    continue
                item_filename = os.path.basename(item_path)
                if item_filename in filenames:
                    matched.append({
                        "Id": item["Id"],
                        "Name": item.get("Name", ""),
                        "Path": item_path,
                    })

            print(
                f"[Jellyfin] Tentativa {attempt + 1}: "
                f"{len(matched)}/{len(filenames)} itens encontrados"
            )

            if len(matched) >= len(filenames):
                return matched

        except Exception as e:
            print(f"[Jellyfin] Erro na busca (tentativa {attempt + 1}): {e}")

    # Última tentativa — retorna o que conseguiu
    return matched if 'matched' in dir() else []


def create_jellyfin_playlist(
    name: str,
    item_ids: list,
    media_type: str,
) -> dict | None:
    """
    Cria uma playlist no Jellyfin com os IDs fornecidos.
    Retorna o JSON de resposta ou None em caso de erro.
    """
    base_url = JELLYFIN_URL.rstrip("/")

    try:
        resp = httpx.post(
            f"{base_url}/Playlists",
            json={
                "Name": name,
                "Ids": item_ids,
                "MediaType": media_type,
                "UserId": JELLYFIN_USER_ID,
            },
            headers=_jellyfin_headers(),
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        print(f"[Jellyfin] Playlist criada: {data.get('Id')} — '{name}'")
        return data
    except Exception as e:
        print(f"[Jellyfin] Erro ao criar playlist: {e}")
        return None


@app.post("/api/download")
async def start_download(request: DownloadRequest):
    job_id = str(uuid.uuid4())

    # Cria estrutura inicial do job
    jobs[job_id] = {
        "job_id": job_id,
        "status": "running",
        "total_videos": len(request.video_ids),
        "processed_videos": 0,
        "current_video": None,
        "progress_percent": 0,
        "errors": [],
        # NOVO: campos relacionados à playlist do Jellyfin
        "saved_paths": [],
        "playlist_id": None,
        "playlist_name": None,
        "create_playlist": request.create_playlist,
    }

    def process_downloads():
        saved_paths = []  # NOVO: acumula paths dos arquivos salvos

        try:
            for index, video_id in enumerate(request.video_ids, start=1):
                jobs[job_id]["current_video"] = video_id

                try:
                    if request.format == "audio":
                        filepath = download_audio(video_id)
                    else:
                        filepath = download_video(video_id)

                    saved_paths.append(filepath)       # NOVO
                    jobs[job_id]["saved_paths"] = saved_paths  # NOVO

                except Exception as e:
                    jobs[job_id]["errors"].append(
                        f"{video_id}: {str(e)}"
                    )

                # Atualiza progresso
                jobs[job_id]["processed_videos"] = index
                jobs[job_id]["progress_percent"] = int(
                    (index / jobs[job_id]["total_videos"]) * 100
                )

            jobs[job_id]["status"] = "completed"

            # ================================================
            # NOVO: Criação automática de playlist no Jellyfin
            # ================================================
            if request.create_playlist and saved_paths:
                jobs[job_id]["status"] = "creating_playlist"
                _create_playlist_for_job(job_id, saved_paths, request)

        except Exception as e:
            jobs[job_id]["status"] = "error"
            jobs[job_id]["errors"].append(str(e))

    threading.Thread(target=process_downloads, daemon=True).start()

    return {
        "job_id": job_id,
        "status": "started"
    }

def _create_playlist_for_job(job_id: str, saved_paths: list, request: DownloadRequest):
    """
    Fluxo completo pós-download:
    1. Extrai nomes de arquivo dos paths salvos
    2. Dispara scan da biblioteca no Jellyfin
    3. Aguarda e busca os itens recém-indexados
    4. Cria a playlist com os IDs encontrados
    """
    # Extrai os nomes de arquivo (ex: "Sweet Child O' Mine.mp3")
    filenames = {os.path.basename(p) for p in saved_paths}
    media_type = "Audio" if request.format == "audio" else "Video"

    print(f"[Jellyfin] {len(filenames)} arquivos para buscar no Jellyfin")

    # 1. Disparar scan da biblioteca
    jobs[job_id]["status"] = "scanning_jellyfin"
    trigger_jellyfin_scan()

    # 2. Aguardar scan e buscar itens (tenta por até ~30s)
    matched_items = find_jellyfin_items_by_filenames(filenames, media_type)

    if not matched_items:
        jobs[job_id]["status"] = "playlist_error"
        jobs[job_id]["errors"].append(
            "Nenhum item encontrado no Jellyfin após o scan. "
            "Verifique se as pastas de download são monitoradas pelo Jellyfin."
        )
        return

    # 3. Criar a playlist
    playlist_name = request.playlist_name or datetime.now().strftime(
        "Downloads %d/%m/%Y %H:%M"
    )
    item_ids = [item["Id"] for item in matched_items]

    result = create_jellyfin_playlist(playlist_name, item_ids, media_type)

    if result:
        jobs[job_id]["status"] = "completed"
        jobs[job_id]["playlist_id"] = result.get("Id")
        jobs[job_id]["playlist_name"] = playlist_name
        jobs[job_id]["matched_items"] = len(matched_items)
        jobs[job_id]["total_matched"] = len(filenames)
    else:
        jobs[job_id]["status"] = "playlist_error"
        jobs[job_id]["errors"].append(
            "Falha ao criar a playlist no Jellyfin. "
            "Verifique a conexão e as credenciais."
        )

@app.get("/api/download/{job_id}")
def get_download_status(job_id: str):
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job não encontrado")

    return jobs[job_id]
