# Use uma imagem oficial do Python
#FROM python:3.9-slim
FROM python:3.11-slim

# Instalar dependências do sistema para yt-dlp/FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
	curl \
	unzip \
    && rm -rf /var/lib/apt/lists/*

# Criar e definir diretório de trabalho
WORKDIR /app

# Copiar requirements primeiro para aproveitar cache de camadas
COPY requirements.txt .

# Instalar Deno
RUN curl -fsSL https://deno.land/install.sh | sh
# Adicionar Deno ao PATH
ENV PATH="/root/.deno/bin:${PATH}"

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar o resto da aplicação
COPY main.py .
COPY .env .env

# Criar diretório para downloads
RUN mkdir -p /app/downloads
RUN mkdir -p /app/downloads/videos
RUN mkdir -p /app/downloads/musicas
RUN mkdir -p /app/downloads/filmes

# Porta da API (deve corresponder ao uso no código)
EXPOSE 5000

# Comando para iniciar a aplicação
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000", "--reload"]
