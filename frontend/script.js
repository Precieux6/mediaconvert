// ========================================
// Configuration API
// ========================================

const getAPIUrl = () => {
    // Mode local ouvert directement depuis un fichier HTML
    if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        return 'http://localhost:8000';
    }
    
    // Pointage direct vers le backend FastAPI sur Render
    return 'https://mediaconvert-s0nb.onrender.com';
};

const API_URL = getAPIUrl();

// Debug: afficher l'URL utilisée
console.log('🌐 API URL détecté:', API_URL || '(Relative URL)');
console.log('🌍 Hostname:', window.location.hostname);

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
    console.log('✅ DOM chargé, initialisation en cours...');
    setupCategoryCards();
    setupDropZone();
    setupFileInput();
    setupFormSubmit();
    console.log('✅ Initialisation terminée');
});

// ========================================
// CATÉGORIES
// ========================================

function setupCategoryCards() {
    const cards = document.querySelectorAll('.category-card');
    console.log('📋 Cartes trouvées:', cards.length);
    
    cards.forEach(card => {
        card.addEventListener('click', () => {
            console.log('🖱️ Catégorie sélectionnée:', card.dataset.type);
            selectCategory(card.dataset.type);
        });
    });
}

function selectCategory(type) {
    selectedCategory = type;
    selectedFile = null;
    selectedFormat = null;
    
    console.log('📝 Sélection catégorie:', type);
    
    const titles = {
        image: 'Convertisseur d\'Images',
        office: 'Convertisseur de Documents',
        multimedia: 'Convertisseur Audio & Vidéo'
    };

    document.getElementById('converterTitle').textContent = titles[type];
    
    document.getElementById('categories').style.display = 'none';
    document.getElementById('converterSection').style.display = 'block';
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('dropZone').style.display = 'flex';
    document.getElementById('progressSection').style.display = 'none';
    
    buildFormatOptions(type);
    
    setTimeout(() => {
        document.getElementById('converterSection').scrollIntoView({ behavior: 'smooth' });
    }, 100);
}

function buildFormatOptions(type) {
    const container = document.getElementById('formatOptions');
    container.innerHTML = '';
    
    console.log('🎨 Construction formats pour:', type);
    
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
            console.log('✅ Format par défaut:', selectedFormat);
        }
    }
}

function selectFormat(format, element) {
    console.log('🎯 Format sélectionné:', format);
    
    document.querySelectorAll('.format-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
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
            console.log('📥 Fichier déposé:', files[0].name);
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
            console.log('📁 Fichier sélectionné:', e.target.files[0].name);
            handleFileSelect(e.target.files[0]);
        }
    });
}

function handleFileSelect(file) {
    selectedFile = file;
    
    console.log('✅ Fichier accepté:', {
        nom: file.name,
        taille: formatFileSize(file.size),
        type: file.type
    });
    
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
    console.log('🚀 Début conversion...');
    
    if (!selectedFile || !selectedFormat) {
        console.warn('⚠️ Fichier ou format manquant');
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

        const fullURL = `${API_URL}${endpoint}`;
        console.log('📡 Requête API:', {
            url: fullURL,
            methode: 'POST',
            fichier: selectedFile.name,
            format: selectedFormat,
            categorie: selectedCategory
        });

        let progress = 10;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += Math.random() * 30;
                progressFill.style.width = Math.min(progress, 90) + '%';
            }
        }, 200);

        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('⏱️ Timeout API (5min)');
        }, 300000);

        const response = await fetch(fullURL, {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        progressFill.style.width = '100%';

        console.log('📥 Réponse API:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok
        });

        if (!response.ok) {
            let errorMsg = 'Erreur de conversion';
            try {
                const errData = await response.json();
                errorMsg = errData.detail || errorMsg;
                console.error('❌ Erreur serveur détaillée:', errData);
            } catch (e) {
                errorMsg = `Erreur serveur (${response.status})`;
                console.error('❌ Erreur parsing réponse:', e);
            }
            throw new Error(errorMsg);
        }

        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);

        console.log('✅ Conversion réussie!', {
            taille: formatFileSize(blob.size),
            type: blob.type
        });

        showResults();

        const originalName = selectedFile.name.split('.')[0];
        const ext = selectedCategory === 'office' ? 'pdf' : selectedFormat;
        document.getElementById('downloadBtn').dataset.filename = `${originalName}_converted.${ext}`;

    } catch (error) {
        console.error('❌ Erreur conversion:', {
            message: error.message,
            stack: error.stack
        });
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
    console.log('🎉 Affichage des résultats');
    
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('errorSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'flex';

    const downloadBtn = document.getElementById('downloadBtn');
    downloadBtn.addEventListener('click', () => {
        console.log('💾 Téléchargement:', downloadBtn.dataset.filename);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = downloadBtn.dataset.filename || 'converted_file';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }, { once: true });
}

function showError(message) {
    console.error('🚨 Erreur affichée:', message);
    
    document.getElementById('convertForm').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('errorSection').style.display = 'flex';
    document.getElementById('errorMessage').textContent = `❌ ${message}`;
}

// ========================================
// RESET
// ========================================

function resetConverter() {
    console.log('🔄 Réinitialisation');
    
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
    console.log('🟢 Connexion rétablie');
});

window.addEventListener('offline', () => {
    console.log('🔴 Connexion perdue');
    showError('Connexion perdue. Vérifiez votre réseau.');
});

console.log('%c🚀 OmniConvert v2 - Prêt', 'color: green; font-weight: bold;');
