const API_URL = "http://localhost:8000";

const typeSelect = document.getElementById('typeSelect');
const formatGroup = document.getElementById('formatGroup');
const targetFormatInput = document.getElementById('targetFormat');

// Masquer ou afficher le champ format cible selon la catégorie
typeSelect.addEventListener('change', () => {
    if (typeSelect.value === 'office') {
        formatGroup.style.display = 'none';
    } else {
        formatGroup.style.display = 'flex';
        targetFormatInput.value = typeSelect.value === 'image' ? 'png' : 'mp3';
    }
});

document.getElementById('convertForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('fileInput');
    const typeValue = typeSelect.value;
    const targetFormat = targetFormatInput.value.trim();
    const statusDiv = document.getElementById('status');
    const submitBtn = document.getElementById('submitBtn');
    
    if (fileInput.files.length === 0) {
        showStatus("Veuillez choisir un fichier à convertir.", "error");
        return;
    }

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    let endpoint = "";
    if (typeValue === "image") {
        endpoint = "/convert/image";
        formData.append("target_format", targetFormat);
    } else if (typeValue === "office") {
        endpoint = "/convert/office-pdf";
    } else if (typeValue === "multimedia") {
        endpoint = "/convert/multimedia";
        formData.append("target_format", targetFormat);
    }

    submitBtn.disabled = true;
    showStatus("⏳ Conversion en cours... Veuillez patienter.", "info");

    try {
        const response = await fetch(`${API_URL}${endpoint}`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({ detail: "Erreur serveur" }));
            throw new Error(errData.detail || "Échec du traitement");
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        
        const originalName = fileInput.files[0].name.split('.')[0];
        const ext = typeValue === "office" ? "pdf" : targetFormat;
        a.download = `${originalName}_converti.${ext}`;
        
        document.body.appendChild(a);
        a.click();
        a.remove();

        showStatus("✅ Conversion réussie ! Téléchargement démarré.", "success");
    } catch (err) {
        showStatus(`❌ Erreur : ${err.message}`, "error");
    } finally {
        submitBtn.disabled = false;
    }
});

function showStatus(message, type) {
    const statusDiv = document.getElementById('status');
    statusDiv.className = `status-box ${type}`;
    statusDiv.innerText = message;
}
