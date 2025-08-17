# 📄 API Documents - Guide Complet

## 🎯 Fonctionnalités Implémentées

### ✅ Avec Internet (Mode Connecté)
- **📋 Liste des documents** envoyés par hôpitaux/labos
- **👁️ Ouvrir** les documents de manière sécurisée
- **🤖 Résumer avec IA** (OpenAI GPT-3.5-turbo)
- **🗑️ Supprimer** les documents (avec permissions)
- **💾 Télécharger** les documents
- **📤 Transférer** à médecin/laborantin
- **🔔 Notifications** automatiques

### ✅ Sans Internet (Mode Hors Ligne)
- **📱 Consultation** des fichiers déjà téléchargés
- **🔒 Documents cryptés**, consultables uniquement dans l'app
- **🚫 Pas de nouvelles actions** (résumé IA, upload, transfert désactivés)

## 🛠️ Configuration Requise

### Variables d'Environnement (.env)
```bash
# OpenAI pour les résumés IA
OPENAI_API_KEY=sk-your-openai-api-key-here

# Base de données
DATABASE_URL="file:./dev.db"

# JWT pour l'authentification
JWT_SECRET=your_super_secret_jwt_key

# URLs
FRONTEND_URL=http://localhost:8100
BACKEND_URL=http://localhost:3000
```

### Dépendances NPM
```bash
npm install @prisma/client express jsonwebtoken bcryptjs multer axios dotenv
```

## 📡 Endpoints API

### 1. Upload de Document
```http
POST /api/documents/upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body:
- file: File (PDF, Images, Word, Texte)
- patient_id: number
- document_type: string (blood_test, medical_report, prescription, imaging, other)
- description: string (optionnel)
```

### 2. Liste des Documents d'un Patient
```http
GET /api/documents/patient/{patientId}?page=1&limit=10&type=blood_test&search=analyse
Authorization: Bearer {token}
```

### 3. Visualiser un Document
```http
GET /api/documents/{id}/view?download=false
Authorization: Bearer {token}
```

### 4. Résumé IA d'un Document
```http
POST /api/documents/{id}/ai-summary
Authorization: Bearer {token}
```

### 5. Transférer un Document
```http
POST /api/documents/{id}/transfer
Authorization: Bearer {token}
Content-Type: application/json

{
  "recipient_id": 123,
  "recipient_type": "doctor", // ou "lab"
  "message": "Message optionnel"
}
```

### 6. Liste des Destinataires
```http
GET /api/documents/transfer-recipients?type=doctor
Authorization: Bearer {token}
```

### 7. Données Hors Ligne
```http
GET /api/documents/{id}/offline-data
Authorization: Bearer {token}
```

### 8. Supprimer un Document
```http
DELETE /api/documents/{id}
Authorization: Bearer {token}
```

## 🔒 Sécurité et Permissions

### Rôles et Accès
- **Patient**: Peut voir/gérer ses propres documents uniquement
- **Hospital Staff**: Peut voir les documents de son hôpital
- **Lab Staff**: Peut voir les documents de son laboratoire
- **Admin**: Accès complet selon son établissement
- **Super Admin**: Accès complet à tous les documents

### Sécurité des Fichiers
- **Stockage chiffré** avec noms de fichiers hashés
- **Tokens sécurisés** pour l'accès aux documents
- **Audit trail** de tous les accès aux documents
- **Validation stricte** des types de fichiers
- **Limite de taille** : 25MB par fichier

## 🤖 Intelligence Artificielle

### Résumé IA avec OpenAI
- **Modèle**: GPT-3.5-turbo (économique et performant)
- **Extraction de texte** automatique des documents
- **Langage simple** adapté aux patients
- **Cache des résumés** pour éviter les appels répétés
- **Gestion d'erreurs** robuste avec messages d'aide

### Exemple de Résumé
```json
{
  "success": true,
  "data": {
    "summary": "**Résumé principal**\nVos analyses sanguines montrent des résultats normaux...\n\n**Résultats clés**\n- Hémoglobine: normale\n- Globules blancs: normaux\n\n**Recommandations**\nAucune action particulière requise...",
    "generated_at": "2025-08-16T18:30:00Z",
    "document": {
      "id": 123,
      "filename": "analyse_sang.pdf",
      "document_type": "blood_test"
    }
  }
}
```

## 🔔 Système de Notifications

### Types de Notifications
- **Nouveau document** reçu
- **Document transféré** vers vous
- **Résumé IA** généré
- **Document supprimé**

### Canaux de Notification
- **In-app** (temps réel)
- **Email** (configurable)
- **Push** (à venir)

## 📱 Mode Hors Ligne

### Fonctionnement
1. **Téléchargement** : Les documents sont sauvés localement lors du téléchargement
2. **Chiffrement** : Stockage sécurisé dans localStorage
3. **Consultation** : Accès aux métadonnées même hors ligne
4. **Synchronisation** : Mise à jour automatique en ligne

### Limitations Hors Ligne
- ❌ Pas de résumé IA
- ❌ Pas de transfert
- ❌ Pas d'upload
- ❌ Pas de suppression
- ✅ Consultation des documents téléchargés
- ✅ Visualisation des métadonnées

## 🧪 Tests et Validation

### Script de Test Automatique
```bash
# Vérifier la configuration
node setup_and_test.js

# Tester uniquement les endpoints
node test_documents_endpoints.js

# Vérifier la base de données
node check_database_schema.js
```

### Tests Couverts
- ✅ Upload de documents
- ✅ Récupération des listes
- ✅ Visualisation sécurisée
- ✅ Résumé IA
- ✅ Transfert de documents
- ✅ Gestion hors ligne
- ✅ Suppression sécurisée

## 🚀 Démarrage Rapide

### 1. Configuration
```bash
# Copier le fichier d'exemple
cp .env.example .env

# Éditer les variables d'environnement
nano .env

# Configurer la base de données
npx prisma generate
npx prisma db push
```

### 2. Installation
```bash
# Installer les dépendances
npm install

# Vérifier la configuration
node setup_and_test.js
```

### 3. Démarrage
```bash
# Démarrer le serveur
npm start

# Dans un autre terminal, démarrer le frontend
cd ../frontend/labresultat
ionic serve
```

### 4. Test
```bash
# Tester les endpoints
node test_documents_endpoints.js
```

## 📊 Monitoring et Logs

### Logs Disponibles
- **Accès aux documents** (audit trail)
- **Erreurs IA** (OpenAI)
- **Transferts** de documents
- **Uploads** et suppressions

### Métriques
- Nombre de documents par patient
- Utilisation de l'IA
- Transferts effectués
- Erreurs et performances

## 🔧 Maintenance

### Nettoyage Automatique
- **Fichiers temporaires** supprimés après upload
- **Cache IA** avec expiration
- **Logs** avec rotation automatique

### Sauvegarde
- **Base de données** : Prisma migrations
- **Fichiers** : Stockage sécurisé avec backup
- **Configuration** : Variables d'environnement

## 📞 Support et Dépannage

### Problèmes Courants

#### 1. Erreur 404 sur les endpoints
```bash
# Vérifier que le serveur est démarré
npm start

# Vérifier les routes
curl http://localhost:3000/api/documents/patient/1
```

#### 2. Résumé IA ne fonctionne pas
```bash
# Vérifier la clé OpenAI
echo $OPENAI_API_KEY

# Tester l'API OpenAI
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### 3. Upload échoue
- Vérifier la taille du fichier (< 25MB)
- Vérifier le type de fichier (PDF, images, Word, texte)
- Vérifier les permissions du dossier uploads

### Logs de Debug
```bash
# Activer les logs détaillés
export LOG_LEVEL=debug
npm start

# Consulter les logs
tail -f logs/app.log
```

## 🎯 Roadmap

### Prochaines Fonctionnalités
- [ ] **OCR** pour extraction de texte des images
- [ ] **Signatures électroniques** pour les documents
- [ ] **Versioning** des documents
- [ ] **Partage temporaire** avec liens sécurisés
- [ ] **API mobile** native
- [ ] **Intégration DICOM** pour l'imagerie médicale

### Améliorations IA
- [ ] **Modèles spécialisés** par type de document
- [ ] **Détection d'anomalies** automatique
- [ ] **Suggestions de suivi** personnalisées
- [ ] **Traduction** multilingue des résumés