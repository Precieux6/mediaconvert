// ========================================
// Configuration API
// ========================================

// Détection dynamique de l'API URL
const getAPIUrl = () => {
    // En développement local
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    // En production (Render)
    return window.location.origin.replace(/:\d+$/, ':8000');
};

const API_URL = getAPIUrl();

// ========================================
// Variables globales
// ========================================

let selectedCategory = null;
let selectedFormat = null;
let selectedFile = null;
let downloadUrl = null;

// Formats supportés par catégorie
const formatsByCategory = {
    image: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
    office: [],
    multimedia: ['mp3', 'mp4', 'wav', 'avi', 'mov', 'flv', 'mkv']
};

const formatLabels = {
    jpg: 'JPG',
    jpeg: 'JPEG',
    png: 'PNG',
    webp: 'WEBP',
    avif: 'AVIF',
    mp3: 'MP3',
    mp4: 'MP4',
    wav: 'WAV',
    avi: 'AVI',
    mov: 'MOV',
    flv: 'FLV',
    mkv: 'MKV'
};

// ========================================
// Initialisation
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    setupCategoryCards();
    setupDropZone();
    setupFileInput();
    setupFormSubmit();
});

// ========================================
// CATÉGORIES
// ========================================

function setupCategoryCards() {
    const cards = document.querySelectorAll('.category-card');
    cards.forEach(card => {
        card.addEventListener('click', () => selectCategory(card.dataset.type));
    });
}

function selectCategory(type) {
    selectedCategory = type;
    selectedFile = null;
    selectedFormat = null;
    
    // Récupérer les titres
    const titles = {
        image: 'Convertisseur d\'Images',
        office: 'Convertisseur de Documents',
        multimedia: 'Convertisseur Audio & Vidéo'
    };

    document.getElementById('converterTitle').textContent = titles[type];
    
    // Afficher les sections appropriées
    document.getElementById('categories').style.display = 'none';
    document.getElementById('converterSection').style.display = 'block';
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('progressSection').style.display = 'none';
    
    // Construire les options de format
    buildFormatOptions(type);
    
    // Scroll vers le formulaire
    setTimeout(() => {
        document.getElementById('converterSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function buildFormatOptions(type) {
    const container = document.getElementById('formatOptions');
    container.innerHTML = '';
    
    if (type === 'office') {
        container.innerHTML = '<div class="format-option active" data-format="pdf">PDF</div>';
        selectedFormat = 'pdf';
        document.getElementById('targetFormat').value = 'pdf';
    } else {
        const formats = formatsByCategory[type];
        formats.forEach(format => {
            const option = document.createElement('div');
            option.className = 'format-option';
            if (format === formats[0]) option.classList.add('active');
            option.textContent = formatLabels[format].toUpperCase();
            option.dataset.format = format;
            option.addEventListener('click', () => selectFormat(format, option));
            container.appendChild(option);
        });
        
        if (formats.length > 0) {
            selectedFormat = formats[0];
            document.getElementById('targetFormat').value = formats[0];
        }
    }
}

function selectFormat(format, element) {
    // Retirer active de tous
    document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Ajouter active à l'élément sélectionné
    element.classList.add('active');
    selectedFormat = format;
    document.getElementById('targetFormat').value = format;
}

// ========================================
// DRAG & DROP
// ========================================

function setupDropZone() {
    const dropZone = document.getElementById('dropZone');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('dragover');
        });
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFileSelect(files[0]);
        }
    });

    dropZone.addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
}

function setupFileInput() {
    document.getElementById('fileInput').addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    selectedFile = file;
    
    // Valider le type de fichier basique
    const validMimeTypes = {
        image: ['image/jpeg', 'image/png', 'image/webp'],
        office: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 
                 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
        multimedia: ['audio/mpeg', 'audio/wav', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
    };

    // Afficher le formulaire et masquer la drop zone
    document.getElementById('dropZone').style.display = 'none';
    document.getElementById('convertForm').style.display = 'flex';
    document.getElementById('fileInfoName').textContent = `📎 ${file.name} (${formatFileSize(file.size)})`;
}

// ========================================
// FORMULAIRE & CONVERSION
// ========================================

function setupFormSubmit() {
    document.getElementById('convertForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await handleConversion();
    });
}

async function handleConversion() {
    if (!selectedFile || !selectedFormat) {
        showError('Veuillez sélectionner un fichier et un format.');
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    const progressSection = document.getElementById('progressSection');
    const progressFill = document.getElementById('progressFill');
    
    submitBtn.disabled = true;
    progressSection.style.display = 'flex';
    progressFill.style.width = '0%';

    try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        let endpoint = '';
        if (selectedCategory === 'image') {
            endpoint = '/convert/image';
            formData.append('target_format', selectedFormat);
        } else if (selectedCategory === 'office') {
            endpoint = '/convert/office-pdf';
        } else if (selectedCategory === 'multimedia') {
            endpoint = '/convert/multimedia';
            formData.append('target_format', selectedFormat);
        }

        // Simuler la progression
        let progress = 10;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 30;
                progressFill.style.width = Math.min(progress, 90) + '%';
            }
        }, 200);

        // Appel API avec timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes

        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        if (!response.ok) {
            let errorMsg = 'Erreur de conversion';
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errorMsg;
            } catch (e) {
                errorMsg = `Erreur serveur (${response.status})`;
            }
            throw new Error(errorMsg);
        }

        // Récupérer le blob et créer l'URL de téléchargement
        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);

        // Afficher les résultats
        showResults();

        // Définir le nom du fichier
        const originalName = selectedFile.name.split('.')[0];
        const ext = selectedCategory === 'office' ? 'pdf' : selectedFormat;
        document.getElementById('downloadBtn').dataset.filename = `${originalName}_converted.${ext}`;

    } catch (error) {
        console.error('Conversion error:', error);
        showError(error.message);
    } finally {
        submitBtn.disabled = false;
        progressSection.style.display = 'none';
    }
}

// ========================================
// RÉSULTATS & ERREURS
// ========================================

function showResults() {
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'flex';

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = downloadBtn.dataset.filename || 'converted_file';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }, { once: true });
}

function showError(message) {
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'flex';
    document.getElementById('errorMessage').textContent = `❌ ${message}`;
}

// ========================================
// RESET
// ========================================

function resetConverter() {
    selectedCategory = null;
    selectedFile = null;
    selectedFormat = null;
    downloadUrl = null;
    
    document.getElementById('converterSection').style.display = 'none';
    document.getElementById('categories').style.display = 'block';
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('fileInput').value = '';
    document.getElementById('progressSection').style.display = 'none';
    
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ========================================
// UTILITAIRES
// ========================================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// ========================================
// GESTION ERREURS RÉSEAU
// ========================================

window.addEventListener('online', () => {
    console.log('Connexion rétablie');
});

window.addEventListener('offline', () => {
    showError('Connexion perdue. Vérifiez votre réseau.');
});
