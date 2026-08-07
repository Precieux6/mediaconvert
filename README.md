🔄 OmniConvert Web App

Une application web puissante et polyvalente pour la conversion bidirectionnelle de médias (images, documents, audio et vidéo).

🚀 Fonctionnalités Principales

* 🖼️ Conversion d'images (Bidirectionnelle) : Convertissez facilement vos fichiers entre les formats JPG, PNG, WEBP et AVIF (alimenté par Pillow).
* 📄 Conversion PDF & Documents :
* Conversion bidirectionnelle et extraction de PDF vers Images et Images vers PDF (alimenté par PyMuPDF).
* Conversion de documents Office (Excel .xlsx, PowerPoint .pptx) vers PDF (alimenté par LibreOffice).
* 🎥 Conversion Audio & Vidéo (Bidirectionnelle) : Traitement rapide et efficace des flux multimédias (extraction audio, conversion de formats vidéo/audio, alimenté par FFmpeg).

🛠️ Stack Technique & Dépendances

Catégorie

`	`Technologie / Bibliothèque

`	`Description

`	`Backend / Core

`	`Python (FastAPI ou Flask)

`	`Logique métier et gestion de l'API REST

`	`Images

`	`Pillow / pillow-heif

`	`Traitement et conversion des formats d'images

`	`PDF & Documents

`	`PyMuPDF (Fitz) & LibreOffice

`	`Manipulation de PDF et conversion des fichiers Office

`	`Audio / Vidéo

`	`FFmpeg

`	`Encodage et conversion vidéo/audio haute performance

`	`📦 Prérequis Système

Pour exécuter l'application localement ou sur un serveur, les dépendances système suivantes doivent être installées :

* FFmpeg : sudo apt install ffmpeg
* LibreOffice : sudo apt install libreoffice

⚙️ Installation & Lancement

1. Cloner le projet :

git clone https://github.com/votre-compte/omniconvert-web-app.git

cd omniconvert-web-app

1. Créer un environnement virtuel & installer les dépendances Python :

python -m venv venv

source venv/bin/activate  # Sur Windows: venv\Scripts\activate

pip install -r requirements.txt

1. Lancer l'application :

python main.py

📜 Licence

Projet sous licence MIT. Libre à vous de le modifier et de l'adapter selon vos besoins.
