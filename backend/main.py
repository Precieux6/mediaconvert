import os
import uuid
import subprocess
import shutil
import logging
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from PIL import Image
import mimetypes

# ========================================
# Configuration Logging
# ========================================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ========================================
# Configuration FastAPI
# ========================================

app = FastAPI(
    title="OmniConvert API",
    description="API de conversion bidirectionnelle : images, documents Office, audio et vidéo.",
    version="2.0.0"
)

# ========================================
# Configuration CORS
# ========================================

allowed_origins = [
    "http://localhost:3000",
    "http://localhost:8080",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8080",
]

# En production, récupérer le domaine Render
if os.getenv('RENDER') == 'true':
    render_external_url = os.getenv('RENDER_EXTERNAL_URL')
    if render_external_url:
        allowed_origins.append(render_external_url)
        logger.info(f"Render external URL: {render_external_url}")
else:
    # Mode développement : permettre localhost
    allowed_origins.extend([
        "http://localhost",
        "http://127.0.0.1"
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    max_age=3600,
)

# ========================================
# Configuration Uploads
# ========================================

UPLOAD_DIR = os.getenv('UPLOAD_DIR', 'uploads')
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 500 * 1024 * 1024))  # 500MB par défaut

# Créer le répertoire s'il n'existe pas
Path(UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
logger.info(f"Upload directory: {UPLOAD_DIR}")

# ========================================
# Endpoints de santé
# ========================================

@app.get("/health")
def health_check():
    """Endpoint pour vérifier la santé de l'application (Render)"""
    return {
        "status": "ok",
        "version": "2.0.0",
        "upload_dir": UPLOAD_DIR,
        "message": "OmniConvert API est opérationnel"
    }

@app.get("/")
def read_root():
    """Endpoint racine"""
    return {
        "message": "Bienvenue sur l'API OmniConvert v2",
        "docs": "/docs",
        "health": "/health"
    }

# ========================================
# Endpoints de conversion
# ========================================

@app.post("/convert/image")
async def convert_image(file: UploadFile = File(...), target_format: str = Form(...)):
    """
    Convertir une image entre formats supportés
    Formats: jpg, jpeg, png, webp, avif
    """
    target_format = target_format.lower().strip()
    allowed_formats = ["jpg", "jpeg", "png", "webp", "avif"]
    
    if target_format not in allowed_formats:
        raise HTTPException(
            status_code=400,
            detail=f"Format non supporté. Formats acceptés: {', '.join(allowed_formats)}"
        )
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or '.tmp'
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    output_filename = f"{file_id}_converted.{target_format}"
    output_path = os.path.join(UPLOAD_DIR, output_filename)
    
    try:
        # Lire le fichier
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Fichier vide")
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux. Maximum: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        with open(input_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Image conversion started: {file.filename} -> {target_format}")
        
        # Convertir l'image
        img = Image.open(input_path)
        
        # Conversion RGB si nécessaire (pour JPG)
        if target_format in ["jpg", "jpeg"] and img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
        
        # Optimiser pour web si PNG ou WEBP
        if target_format in ["png", "webp"]:
            img.save(output_path, quality=85, optimize=True)
        else:
            img.save(output_path, quality=90)
        
        logger.info(f"Image conversion completed: {output_path}")
        
        # Retourner le fichier
        return FileResponse(
            output_path,
            filename=f"{os.path.splitext(file.filename)[0]}_converted.{target_format}",
            media_type=f"image/{target_format}"
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Image conversion error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la conversion : {str(e)}"
        )
    
    finally:
        # Nettoyer le fichier input
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except Exception as e:
                logger.warning(f"Could not clean up input file: {e}")


@app.post("/convert/office-pdf")
async def convert_office_to_pdf(file: UploadFile = File(...)):
    """
    Convertir des fichiers Office (XLSX, PPTX) en PDF
    Nécessite LibreOffice installé
    """
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or '.tmp'
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    try:
        # Lire et écrire le fichier
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Fichier vide")
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux. Maximum: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        with open(input_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Office to PDF conversion started: {file.filename}")
        
        # Vérifier que LibreOffice est disponible
        try:
            subprocess.run(["which", "libreoffice"], capture_output=True, check=True)
        except subprocess.CalledProcessError:
            raise HTTPException(
                status_code=503,
                detail="LibreOffice n'est pas installé sur le serveur"
            )
        
        # Convertir avec LibreOffice
        cmd = [
            "libreoffice",
            "--headless",
            "--convert-to", "pdf",
            "--outdir", UPLOAD_DIR,
            input_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode != 0:
            logger.error(f"LibreOffice error: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail="Erreur LibreOffice : impossible de convertir le fichier"
            )
        
        output_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        
        if not os.path.exists(output_path):
            raise HTTPException(
                status_code=500,
                detail="Le fichier PDF n'a pas été créé"
            )
        
        logger.info(f"Office to PDF conversion completed: {output_path}")
        
        return FileResponse(
            output_path,
            filename=f"{os.path.splitext(file.filename)[0]}.pdf",
            media_type="application/pdf"
        )
    
    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        logger.error("LibreOffice conversion timeout")
        raise HTTPException(
            status_code=504,
            detail="Conversion timeout - fichier trop complexe"
        )
    except Exception as e:
        logger.error(f"Office conversion error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la conversion : {str(e)}"
        )
    
    finally:
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except Exception as e:
                logger.warning(f"Could not clean up input file: {e}")


@app.post("/convert/multimedia")
async def convert_multimedia(file: UploadFile = File(...), target_format: str = Form(...)):
    """
    Convertir fichiers audio/vidéo
    Formats: mp3, mp4, wav, avi, mov, flv, mkv
    Nécessite FFmpeg installé
    """
    target_format = target_format.lower().strip()
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or '.tmp'
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    output_filename = f"{file_id}_converted.{target_format}"
    output_path = os.path.join(UPLOAD_DIR, output_filename)
    
    try:
        # Lire et écrire le fichier
        content = await file.read()
        
        if len(content) == 0:
            raise HTTPException(status_code=400, detail="Fichier vide")
        
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=413,
                detail=f"Fichier trop volumineux. Maximum: {MAX_FILE_SIZE / (1024*1024):.0f}MB"
            )
        
        with open(input_path, "wb") as f:
            f.write(content)
        
        logger.info(f"Multimedia conversion started: {file.filename} -> {target_format}")
        
        # Vérifier que FFmpeg est disponible
        try:
            subprocess.run(["which", "ffmpeg"], capture_output=True, check=True)
        except subprocess.CalledProcessError:
            raise HTTPException(
                status_code=503,
                detail="FFmpeg n'est pas installé sur le serveur"
            )
        
        # Convertir avec FFmpeg (avec options optimisées)
        cmd = [
            "ffmpeg",
            "-i", input_path,
            "-c:v", "libx264" if target_format in ["mp4"] else "copy",
            "-c:a", "aac" if target_format in ["mp4"] else "copy",
            "-preset", "fast",
            "-y",
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        
        if result.returncode != 0 or not os.path.exists(output_path):
            logger.error(f"FFmpeg error: {result.stderr}")
            raise HTTPException(
                status_code=500,
                detail="Erreur FFmpeg : impossible de convertir le fichier"
            )
        
        logger.info(f"Multimedia conversion completed: {output_path}")
        
        return FileResponse(
            output_path,
            filename=f"{os.path.splitext(file.filename)[0]}_converted.{target_format}",
            media_type=f"video/{target_format}" if target_format in ["mp4", "avi", "mov", "mkv"] else f"audio/{target_format}"
        )
    
    except HTTPException:
        raise
    except subprocess.TimeoutExpired:
        logger.error("FFmpeg conversion timeout")
        raise HTTPException(
            status_code=504,
            detail="Conversion timeout - fichier trop volumineux"
        )
    except Exception as e:
        logger.error(f"Multimedia conversion error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la conversion : {str(e)}"
        )
    
    finally:
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except Exception as e:
                logger.warning(f"Could not clean up input file: {e}")


# ========================================
# Gestion des erreurs globales
# ========================================

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Erreur interne du serveur"},
    )

# ========================================
# Lancement
# ========================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv('PORT', 8000))
    host = os.getenv('HOST', '0.0.0.0')
    
    logger.info(f"Starting server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv('ENVIRONMENT') == 'development',
        log_level='info'
    )
