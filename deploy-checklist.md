# ✅ Checklist Déploiement OmniConvert

Utilisez cette checklist pour vérifier que tout est prêt avant le déploiement sur Render.

---

## 📁 Fichiers Requis

Exécutez ceci pour vérifier :

```bash
cd /chemin/vers/omniconvert

# Linux/Mac
ls -la | grep -E "Dockerfile|render.yaml|main.py|requirements.txt|README.md|.gitignore"

# Windows PowerShell
Get-Item Dockerfile, render.yaml, main.py, requirements.txt, README.md, .gitignore
```

**Tous les fichiers doivent être présents** ✅

- [ ] `Dockerfile`
- [ ] `render.yaml`
- [ ] `main.py`
- [ ] `requirements.txt`
- [ ] `README.md`
- [ ] `.gitignore`
- [ ] `.env.example`
- [ ] `docker-compose.yml` (optionnel)
- [ ] `index.html`
- [ ] `script.js`
- [ ] `style.css`
- [ ] `RENDER_DEPLOYMENT.md`

---

## 🔧 Vérification Contenu

### Dockerfile
```bash
grep -q "FROM python:3.11-slim" Dockerfile && echo "✓ Base image OK"
grep -q "ffmpeg" Dockerfile && echo "✓ FFmpeg inclus"
grep -q "libreoffice" Dockerfile && echo "✓ LibreOffice inclus"
grep -q "EXPOSE 8000" Dockerfile && echo "✓ Port 8000 exposé"
grep -q "HEALTHCHECK" Dockerfile && echo "✓ Health check présent"
```

**Tous ces checks doivent afficher ✓**

### render.yaml
```bash
grep -q "type: web" render.yaml && echo "✓ Type web présent"
grep -q "healthCheckPath: /health" render.yaml && echo "✓ Health check configuré"
grep -q "port: 8000" render.yaml && echo "✓ Port 8000"
```

### main.py
```bash
grep -q "FastAPI" main.py && echo "✓ FastAPI présent"
grep -q "@app.post" main.py && echo "✓ Endpoints POST présents"
grep -q "@app.get(\"/health\")" main.py && echo "✓ Health endpoint présent"
grep -q "FFmpeg" main.py && echo "✓ Support FFmpeg"
grep -q "LibreOffice" main.py && echo "✓ Support LibreOffice"
```

### requirements.txt
```bash
grep -q "fastapi" requirements.txt && echo "✓ FastAPI"
grep -q "uvicorn" requirements.txt && echo "✓ Uvicorn"
grep -q "Pillow" requirements.txt && echo "✓ Pillow"
```

---

## 🌐 Vérification Git

```bash
# Vérifier que vous êtes sur la bonne branche
git branch | grep "*" && echo "Current branch OK"

# Vérifier que le repo est synced
git status

# Vérifier la dernière commit
git log -1 --oneline
```

**Les commandes ne doivent retourner aucune erreur** ✅

---

## 🐳 Test Local (Optionnel mais Recommandé)

Si vous avez Docker installé localement :

```bash
# Construire l'image
docker build -t omniconvert:test .
# Devrait afficher: Successfully built ...

# Lancer le conteneur
docker run -p 8000:8000 omniconvert:test

# Dans un autre terminal, tester l'API
curl http://localhost:8000/health
# Devrait retourner: {"status":"ok","version":"2.0.0",...}

# Arrêter le conteneur
# Ctrl + C dans le premier terminal
```

**Si tout fonctionne localement, ça va marcher sur Render** ✅

---

## 📝 Étapes Git Finales

```bash
# 1. Ajouter tous les fichiers
git add .

# 2. Vérifier ce qui va être commité
git status
# Devrait lister tous vos fichiers (pas de "nothing to commit")

# 3. Committer
git commit -m "🚀 OmniConvert v2 - Production ready for Render"

# 4. Pousser vers GitHub
git push origin main
# Devrait afficher: ... -> main

# 5. Vérifier sur GitHub
# Allez sur https://github.com/votre-compte/omniconvert
# Vérifiez que tous les fichiers apparaissent
```

**Résultat** : Tous les fichiers doivent être visibles sur GitHub ✅

---

## 🎯 Rendu Dashboard Checks

Avant de cliquer sur "Create Web Service", vérifiez :

- [ ] **Name** : `omniconvert`
- [ ] **Region** : `Frankfurt` (ou votre région)
- [ ] **Branch** : `main`
- [ ] **Runtime** : `Docker` ✅ **TRÈS IMPORTANT**
- [ ] Root Directory : (vide)

---

## 🚀 Après le Déploiement Render

**Une fois le service lancé sur Render**, testez :

```bash
# Remplacer XXXX par votre ID service
curl https://omniconvert-XXXX.onrender.com/health

# Devrait retourner:
# {"status":"ok","version":"2.0.0",...}
```

**Ouvrir dans le navigateur** :
```
https://omniconvert-XXXX.onrender.com
```

Vous devriez voir :
- ✅ La belle interface redesignée
- ✅ Les 3 cartes de catégories (Images, Documents, Média)
- ✅ Le formulaire de conversion
- ✅ Pas d'erreurs console (F12 → Console)

---

## 🆘 Si Quelque Chose Cloche

### Erreur au Build

1. Rendez-vous sur Render Dashboard → Service → **Logs**
2. Cherchez la ligne d'erreur (en rouge)
3. Lisez le contexte autour
4. Cherchez la solution dans `RENDER_DEPLOYMENT.md`

### Erreur au Runtime

1. Rendez-vous sur Render Dashboard → Service → **Logs**
2. Vérifiez qu'il y a la ligne : `Application startup complete`
3. Si vous voyez une erreur, notez l'URL du service
4. Testez `/health` : `curl https://votre-service.onrender.com/health`

### API Répond Mais Conversion Échoue

1. Vérifiez les logs Render pour l'erreur spécifique
2. Vérifiez que FFmpeg/LibreOffice s'installent bien dans le Dockerfile
3. Testez la conversion en local d'abord

---

## 📋 Récapitulatif Rapide

| Élément | Statut | Notes |
|---------|--------|-------|
| Fichiers complets | ✅ | Tous les 11 fichiers présents |
| GitHub synced | ✅ | `git push` réussi |
| Docker testable | ✅ | `docker build` réussit localement |
| Render.yaml correct | ✅ | Configuration complète |
| Health endpoint | ✅ | `/health` présent |
| API endpoints | ✅ | 3 endpoints de conversion |
| Frontend UI | ✅ | HTML, CSS, JS redesignés |
| CORS configuré | ✅ | Accepte les origins dynamiques |

---

## ✨ Bonus : Scripts Rapides

### Build & Test Local (Mac/Linux)
```bash
#!/bin/bash
set -e
echo "🔨 Building Docker image..."
docker build -t omniconvert:test .
echo "✅ Build successful!"
echo "🚀 Starting container..."
docker run -p 8000:8000 omniconvert:test &
sleep 2
echo "🔍 Testing health endpoint..."
curl http://localhost:8000/health
echo ""
echo "✅ All checks passed!"
```

### Rapide Push vers GitHub
```bash
#!/bin/bash
git add .
git commit -m "🚀 OmniConvert v2 - $(date +%Y-%m-%d)"
git push origin main
echo "✅ Pushed to GitHub!"
```

---

## 🎉 Prêt ?

Si vous avez coché **tous les ✅**, vous êtes prêt pour :

1. ✅ Aller sur [render.com](https://render.com)
2. ✅ Cliquer sur **New Web Service**
3. ✅ Connecter votre repository
4. ✅ Cliquer sur **Create Web Service**
5. ✅ Attendre 2-3 minutes
6. ✅ Profiter de votre OmniConvert en ligne ! 🚀

---

**Bonne chance ! 🍀**

