import os
import uuid
import subprocess
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image

app = FastAPI(
    title="MediaConvert API",
    description="API de conversion bidirectionnelle d'images, documents Office et fichiers audio/vidéo.",
    version="1.0.0"
)

# Configuration CORS pour autoriser les requêtes depuis n'importe quel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Bienvenue sur l'API MediaConvert !"}

@app.post("/convert/image")
async def convert_image(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower().strip()
    allowed_formats = ["jpg", "jpeg", "png", "webp", "avif"]
    
    if target_format not in allowed_formats:
        raise HTTPException(status_code=400, detail=f"Format non supporté. Formats acceptés : {', '.join(allowed_formats)}")
    
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    output_filename = f"{file_id}_converted.{target_format}"
    output_path = os.path.join(UPLOAD_DIR, output_filename)
    
    with open(input_path, "wb") as f:
        f.write(await file.read())
        
    try:
        import pillow_avif
        import pillow_heif
        pillow_heif.register_heif_opener()

        img = Image.open(input_path)
        
        # Déterminer le format exact pour Pillow
        clean_format = target_format.lstrip('.').upper()
        if clean_format in ["JPG", "JPEG"]:
            save_format = "JPEG"
        elif clean_format == "AVIF":
            save_format = "AVIF"
        elif clean_format == "WEBP":
            save_format = "WEBP"
        elif clean_format == "PNG":
            save_format = "PNG"
        else:
            save_format = clean_format

        # Conversion RGB si enregistrement en JPEG depuis un format transparent
        if save_format == "JPEG" and img.mode in ("RGBA", "LA", "P"):
            img = img.convert("RGB")
            
        # Enregistrement du fichier converti
        img.save(output_path, format=save_format)
        return FileResponse(output_path, filename=f"converted_{file.filename}.{target_format}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion de l'image : {str(e)}")

@app.post("/convert/office-pdf")
async def convert_office_to_pdf(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    
    with open(input_path, "wb") as f:
        f.write(await file.read())
        
    try:
        cmd = ["libreoffice", "--headless", "--convert-to", "pdf", input_path, "--outdir", UPLOAD_DIR]
        subprocess.run(cmd, check=True)
        
        output_path = os.path.join(UPLOAD_DIR, f"{file_id}.pdf")
        return FileResponse(output_path, filename=f"{os.path.splitext(file.filename)[0]}.pdf")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la conversion du document Office en PDF : {str(e)}")

@app.post("/convert/multimedia")
async def convert_multimedia(file: UploadFile = File(...), target_format: str = Form(...)):
    target_format = target_format.lower().strip()
    file_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1]
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}{ext}")
    output_filename = f"{file_id}_converted.{target_format}"
    output_path = os.path.join(UPLOAD_DIR, output_filename)
    
    with open(input_path, "wb") as f:
        f.write(await file.read())
        
    try:
        cmd = ["ffmpeg", "-i", input_path, "-y", output_path]
        subprocess.run(cmd, check=True)
        return FileResponse(output_path, filename=f"converted_{os.path.splitext(file.filename)[0]}.{target_format}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur FFmpeg lors de la conversion média : {str(e)}")
