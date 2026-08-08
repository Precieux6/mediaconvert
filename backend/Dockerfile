# ========================================
# Build stage
# ========================================
FROM python:3.11-slim as builder

WORKDIR /app

# Installer les dépendances de build
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dépendances Python
COPY backend/requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# ========================================
# Runtime stage
# ========================================
FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système (FFmpeg, LibreOffice, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libreoffice \
    libreoffice-calc \
    libreoffice-impress \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier les packages Python du builder
COPY --from=builder /root/.local /root/.local

# Ajouter le local pip bin au PATH
ENV PATH=/root/.local/bin:$PATH

# Copier les fichiers backend
COPY backend/main.py .
COPY backend/requirements.txt .

# Copier les fichiers frontend
COPY frontend/index.html .
COPY frontend/style.css .
COPY frontend/script.js .

# Créer le répertoire uploads
RUN mkdir -p uploads

# Exposer le port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Commande de démarrage
CMD ["python", "main.py"]
