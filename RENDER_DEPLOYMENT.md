# 🚀 Guide Complet : Déployer OmniConvert sur Render

Ce guide vous accompagne étape par étape pour déployer OmniConvert sur Render.

---

## ✅ Prérequis

- ✓ Account GitHub avec ce repository
- ✓ Account Render (gratuit) : [render.com](https://render.com)
- ✓ Repository pushé avec tous les fichiers

---

## 📋 Checklist Avant Déploiement

Vérifiez que **ces fichiers existent** à la racine du repository :

- [ ] `Dockerfile` — Image Docker multi-stage optimisée
- [ ] `render.yaml` — Configuration Render
- [ ] `main.py` — Backend FastAPI
- [ ] `requirements.txt` — Dépendances Python
- [ ] `docker-compose.yml` — Dev local (optionnel)
- [ ] `README.md` — Documentation
- [ ] `.gitignore` — Fichiers ignorés

---

## 🎯 Étapes de Déploiement

### Étape 1 : Préparer GitHub

```bash
cd /chemin/vers/omniconvert

# Vérifier que tout est à jour
git status

# Ajouter et committer
git add .
git commit -m "🚀 OmniConvert v2 - Production ready for Render"

# Pousser vers GitHub
git push origin main
```

**Résultat attendu** : Tous les fichiers sont visibles sur GitHub.

---

### Étape 2 : Connecter Render à GitHub

1. Allez sur **[render.com](https://render.com)**
2. **Sign Up** ou **Sign In**
3. Cliquez sur **Dashboard** (en haut à droite)
4. Cliquez sur **New +** → **Web Service**

---

### Étape 3 : Sélectionner le Repository

1. Si c'est votre première connexion, cliquez sur **Connect GitHub**
2. Autorisez Render à accéder à vos repositories
3. Recherchez `omniconvert` dans la liste
4. Cliquez sur **Connect**

---

### Étape 4 : Configurer le Service

Remplissez les champs suivants :

| Champ | Valeur | Notes |
|-------|--------|-------|
| **Name** | `omniconvert` | Identifiant unique dans Render |
| **Region** | `Frankfurt` | Choisir selon votre localisation |
| **Branch** | `main` | Ou votre branche par défaut |
| **Runtime** | `Docker` | ✅ Très important |
| **Root Directory** | (vide) | Laissez vide |

---

### Étape 5 : Plan & Ressources

Sélectionnez votre plan :

**Pour démarrer (GRATUIT)** ✅
- Plan : **Free**
- Instance : 0.5 CPU, 0.5 GB RAM
- Auto-sleep après 15 min d'inactivité

**Pour production** (Payant)
- Plan : **Standard** ou **Pro**
- Instance : 1-2 CPU, 2-4 GB RAM
- Pas d'auto-sleep

**⚠️ Note** : Le plan gratuit redémarrera chaque jour. Acceptable pour démo/test.

---

### Étape 6 : Vérifier la Détection Docker

Render devrait **automatiquement détecter** :
- ✅ `Dockerfile` dans la racine
- ✅ `render.yaml` avec configuration

**Si ce n'est pas détecté** :
1. Cliquez sur **Advanced** (en bas)
2. Sous **Build Command**, mettez vide
3. Sous **Start Command**, mettez vide
4. Render utilisera les valeurs du `Dockerfile` ✅

---

### Étape 7 : Ajouter les Variables d'Environnement (Optionnel)

1. Cliquez sur **Environment** (à gauche)
2. Cliquez sur **Add Environment Variable**
3. Ajoutez (ou laissez vides pour utiliser les défauts) :

```
ENVIRONMENT=production
MAX_FILE_SIZE=524288000
RENDER=true
```

**Render ajoute automatiquement** :
- `RENDER_EXTERNAL_URL` (votre domaine)

---

### Étape 8 : Vérifier les Paramètres Avancés

1. Aller dans **Advanced** (bas de la page)
2. **Build Command** : Vide ✅
3. **Start Command** : Vide ✅
4. **Plan** : Votre choix (Free / Standard / Pro)

---

### Étape 9 : Déployer ! 🚀

Cliquez sur le bouton bleu **Create Web Service**.

Render va maintenant :
1. ✅ Cloner votre repository
2. ✅ Builder l'image Docker (2-3 min)
3. ✅ Lancer le conteneur
4. ✅ Effectuer les health checks

**Vous verrez** : Une progression en temps réel dans les logs.

---

## 🔍 Vérifier que le Déploiement est Réussi

### Via le Dashboard Render

1. Allez dans votre service `omniconvert`
2. Regardez la couleur du statut :
   - 🟢 **Vert** = En ligne ✅
   - 🟡 **Jaune** = En déploiement
   - 🔴 **Rouge** = Erreur

3. Vérifiez les **Logs** :
   ```
   INFO:     Started server process
   INFO:     Waiting for application startup.
   INFO:     Application startup complete
   INFO:     Uvicorn running on http://0.0.0.0:8000
   ```

### Via l'API Health Check

Rendez-vous à :
```
https://omniconvert-xxxx.onrender.com/health
```

**Réponse attendue** :
```json
{
  "status": "ok",
  "version": "2.0.0",
  "message": "OmniConvert API est opérationnel"
}
```

### Via votre Frontend

Ouvrez dans le navigateur :
```
https://omniconvert-xxxx.onrender.com
```

Vous devriez voir la belle interface redesignée ! 🎉

---

## 🐛 Problèmes Courants et Solutions

### ❌ Erreur : "Dockerfile not found"

**Cause** : Le fichier n'est pas à la racine du repository.

**Solution** :
```bash
# Vérifier que le fichier existe
ls -la Dockerfile

# Vérifier que vous êtes à la racine
pwd
# Doit afficher: /chemin/vers/omniconvert

# Pusher vers GitHub
git add Dockerfile
git commit -m "Add Dockerfile"
git push
```

### ❌ Erreur : "LibreOffice not found"

**Cause** : Rarement (c'est dans le Dockerfile).

**Solution** :
1. Vérifiez que le `Dockerfile` inclut : `libreoffice libreoffice-calc libreoffice-impress`
2. Redéployez via **Manual Deploy** (Dashboard → Deploys → Deploy)

### ❌ Erreur : "FFmpeg not found"

**Cause** : Rarement (c'est dans le Dockerfile).

**Solution** : Même que LibreOffice, redéployez.

### ❌ Port erreur : "Address already in use"

**Cause** : Le port 8000 est déjà utilisé localement.

**Solution** : C'est OK sur Render. Render expose sur 8000 automatiquement.

### ❌ CORS Error depuis le Frontend

**Cause** : Frontend et API sur des domaines différents.

**Vérifier** : Dans `script.js` ligne ~8 :
```javascript
// En production, cela doit être automatiquement détecté
if (window.location.hostname === 'localhost') {
    return 'http://localhost:8000';
}
return window.location.origin.replace(/:\d+$/, ':8000');
```

✅ C'est déjà configuré correctement.

### ❌ "Internal Server Error (500)"

**Vérifier les logs** :
1. Dashboard Render → Service → **Logs**
2. Cherchez la ligne d'erreur complète
3. Posez sur GitHub Issues

---

## 📊 Monitoring & Maintenance

### Vérifier l'État du Service

**Dashboard Render** → Votre service → **Overview**
- Statut (🟢 = OK)
- URL publique
- Dernier déploiement

### Consulter les Logs

**Dashboard Render** → Votre service → **Logs**
- Chaque requête est loggée
- Les erreurs apparaissent en rouge

### Redéployer Manuellement

Si vous changez le code :
```bash
git push origin main
```

Render va **automatiquement redéployer** (si **Auto-Deploy** est activé).

Ou manuellement :
1. Dashboard → Service → **Deploys**
2. Cliquez sur **Deploy** (bouton bleu)

### Arrêter / Redémarrer le Service

**Dashboard** → Service → **Settings** → **Service** → Suspend / Resume

---

## 💰 Coûts Render

| Plan | CPU | RAM | Coût/Mois | Auto-sleep |
|------|-----|-----|-----------|------------|
| **Free** | 0.5 | 0.5 GB | $0 | Oui (15 min) |
| **Standard** | 1 | 2 GB | $12 | Non |
| **Pro** | 2+ | 4+ GB | $120+ | Non |

✅ **Recommandation** : Démarrez avec **Free**, montez à **Standard** si besoin.

---

## 🔗 URLs Utiles

- **Render Dashboard** : https://dashboard.render.com
- **Votre Service Logs** : https://dashboard.render.com (→ Service → Logs)
- **API Health** : `https://votre-service.onrender.com/health`
- **Frontend** : `https://votre-service.onrender.com`

---

## ✨ Prochaines Étapes

1. ✅ Testez les conversions sur votre instance
2. ✅ Partagez l'URL avec des amis
3. ✅ Laissez une ⭐ sur GitHub !
4. 📈 Montez à un plan payant si nécessaire

---

**🎉 Félicitations !** Votre OmniConvert est en ligne et prête à convertir ! 🚀

