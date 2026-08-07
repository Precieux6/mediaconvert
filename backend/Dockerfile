FROM python:3.10-slim

# Installation automatisée des paquets système nécessaires (FFmpeg & LibreOffice)
RUN apt-get update && apt-get install -y --no-install-recommends     ffmpeg     libreoffice     && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Variable d'environnement pour Python
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
