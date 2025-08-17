# 🤖 Chat Médical avec Bot IA - Documentation Complète

## 🎯 Vue d'ensemble

Le **Chat Médical** est une fonctionnalité innovante qui permet aux patients de discuter avec un bot IA spécialisé en médecine. Le bot utilise des modèles de langage avancés via **OpenRouter** pour fournir des informations médicales générales et orienter les patients vers les professionnels de santé appropriés.

## 🏗️ Architecture

### Composants Principaux

1. **OpenRouter Service** (`openRouterService.js`)
   - Interface avec l'API OpenRouter
   - Gestion des modèles IA médicaux
   - Génération de réponses contextuelles

2. **Medical Chat Service** (`medicalChatService.js`)
   - Gestion des sessions de chat
   - Contexte médical du patient
   - Historique des conversations

3. **Medical Chat Controller** (`medicalChatController.js`)
   - Endpoints API REST
   - Validation des données
   - Gestion des erreurs

4. **Routes** (`medicalChat.js`)
   - Définition des endpoints
   - Middleware d'authentification
   - Validation des paramètres

## 📊 Modèles de Données

### MedicalChatSession
```sql
CREATE TABLE medical_chat_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  patient_id INT NOT NULL,
  session_title VARCHAR(191),
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  ended_at DATETIME NULL,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

### MedicalChatMessage
```sql
CREATE TABLE medical_chat_messages (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  sender_type ENUM('patient', 'bot') NOT NULL,
  content TEXT NOT NULL,
  model_used VARCHAR(100),
  tokens_used INT,
  response_time INT,
  medical_context TEXT,
  confidence_score FLOAT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES medical_chat_sessions(id)
);
```

## 🛣️ API Endpoints

### 1. Vérification de Santé
```http
GET /api/medical-chat/health
```
**Réponse :**
```json
{
  "success": true,
  "service": "medical-chat",
  "openrouter_status": "healthy",
  "models_available": 150,
  "timestamp": "2025-08-12T10:30:00.000Z"
}
```

### 2. Création de Session
```http
POST /api/medical-chat/sessions
Content-Type: application/json
Authorization: Bearer {patient_token}

{
  "message": "Bonjour, j'ai des maux de tête depuis quelques jours..."
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Session de chat créée avec succès",
  "data": {
    "session": {
      "id": 1,
      "title": "Consultation maux de tête",
      "created_at": "2025-08-12T10:30:00.000Z",
      "is_active": true
    },
    "messages": [
      {
        "id": 1,
        "sender_type": "patient",
        "content": "Bonjour, j'ai des maux de tête...",
        "created_at": "2025-08-12T10:30:00.000Z"
      },
      {
        "id": 2,
        "sender_type": "bot",
        "content": "Bonjour ! Je comprends votre inquiétude...",
        "created_at": "2025-08-12T10:30:05.000Z",
        "confidence_score": 0.85
      }
    ]
  }
}
```

### 3. Envoi de Message
```http
POST /api/medical-chat/sessions/{sessionId}/messages
Content-Type: application/json
Authorization: Bearer {patient_token}

{
  "message": "Les maux de tête sont-ils accompagnés de nausées ?"
}
```

### 4. Récupération de Session
```http
GET /api/medical-chat/sessions/{sessionId}
Authorization: Bearer {patient_token}
```

### 5. Liste des Sessions
```http
GET /api/medical-chat/sessions
Authorization: Bearer {patient_token}
```

### 6. Statistiques
```http
GET /api/medical-chat/statistics
Authorization: Bearer {patient_token}
```

### 7. Fin de Session
```http
PUT /api/medical-chat/sessions/{sessionId}/end
Authorization: Bearer {patient_token}
```

## 🤖 Configuration OpenRouter

### Variables d'Environnement
```env
OPENROUTER_API_KEY=sk-or-v1-your-api-key-here
```

### Modèle Utilisé
- **Modèle principal :** `microsoft/wizardlm-2-8x22b`
- **Modèle de titre :** `openai/gpt-3.5-turbo`
- **Température :** 0.3 (précision médicale)
- **Max tokens :** 1000

## 🔐 Sécurité et Permissions

### Authentification
- **Requis :** Token JWT valide
- **Rôle :** Seuls les patients peuvent utiliser le chat médical
- **Validation :** Vérification du rôle utilisateur à chaque requête

### Rate Limiting
- **Limite générale :** 100 requêtes/15 minutes
- **Protection :** Contre les abus et surcharge

### Validation des Données
- **Messages :** 1-2000 caractères
- **Sanitisation :** Nettoyage automatique des entrées
- **Validation :** Express-validator sur tous les endpoints

## 🧠 Intelligence Artificielle

### Prompt Système
Le bot utilise un prompt système spécialisé qui :
- Définit son rôle d'assistant médical
- Établit les limites (pas de diagnostic)
- Recommande toujours une consultation professionnelle
- Utilise un langage empathique et accessible

### Contexte Médical
Le bot accède au contexte du patient :
- **Âge et genre** (si disponibles)
- **Documents récents** (30 derniers jours)
- **Examens récents** (30 derniers jours)
- **Historique de conversation**

### Score de Confiance
Calcul automatique basé sur :
- Longueur de la réponse
- Présence de recommandations médicales
- Inclusion de disclaimers
- Cohérence avec la question

## 📈 Fonctionnalités Avancées

### Génération Automatique de Titres
- Utilise GPT-3.5-turbo pour créer des titres pertinents
- Limite de 50 caractères
- Fallback automatique en cas d'erreur

### Gestion des Erreurs
- **Réponses de fallback** en cas d'indisponibilité
- **Messages d'erreur contextuels**
- **Logs détaillés** pour le debugging

### Métriques et Monitoring
- **Temps de réponse** de l'IA
- **Tokens consommés** par requête
- **Statistiques d'utilisation** par patient
- **Santé du service** OpenRouter

## 🧪 Tests et Validation

### Script de Test Automatisé
```bash
npm run test:medical-chat
```

**Tests inclus :**
- ✅ Connexion patient
- ✅ Vérification santé service
- ✅ Création de session
- ✅ Envoi de messages multiples
- ✅ Récupération d'historique
- ✅ Statistiques d'utilisation
- ✅ Fin de session

### Collection Postman
- **Fichier :** `Medical_Chat_Bot.postman_collection.json`
- **Tests automatisés** avec assertions
- **Variables d'environnement** configurées
- **Scénarios complets** de bout en bout

## 🚀 Utilisation

### 1. Démarrage du Serveur
```bash
cd backend/src
node app.js
```

### 2. Test Rapide
```bash
npm run test:medical-chat
```

### 3. Test avec Postman
1. Importer la collection `Medical_Chat_Bot.postman_collection.json`
2. Configurer l'environnement avec `base_url: http://localhost:3002/api`
3. Exécuter la collection complète

## 🔧 Configuration Avancée

### Personnalisation du Modèle
```javascript
// Dans openRouterService.js
this.defaultModel = 'microsoft/wizardlm-2-8x22b'; // Modèle médical
this.temperature = 0.3; // Précision vs créativité
this.maxTokens = 1000; // Longueur des réponses
```

### Contexte Médical Personnalisé
```javascript
// Ajout de nouvelles données contextuelles
const medicalContext = {
  patientName: patient.name,
  age: calculateAge(patient.date_of_birth),
  recentSymptoms: getRecentSymptoms(patient.id),
  medications: getCurrentMedications(patient.id)
};
```

## 📊 Métriques de Performance

### Temps de Réponse Typiques
- **Création de session :** 2-5 secondes
- **Message simple :** 1-3 secondes
- **Message complexe :** 3-8 secondes

### Consommation de Tokens
- **Message court :** 50-150 tokens
- **Message détaillé :** 200-500 tokens
- **Contexte médical :** 100-300 tokens

## 🛡️ Disclaimers et Responsabilités

### Avertissements Automatiques
Chaque réponse du bot inclut :
- ⚠️ **Disclaimer médical** obligatoire
- 🏥 **Recommandation de consultation** professionnelle
- 🚨 **Numéros d'urgence** si nécessaire

### Limitations
- **Pas de diagnostic** médical
- **Informations générales** uniquement
- **Orientation** vers professionnels de santé
- **Pas de prescription** ou traitement

## 🔄 Évolutions Futures

### Phase 2 - Améliorations
- **Modèles spécialisés** par domaine médical
- **Intégration avec dossier médical** complet
- **Notifications proactives** basées sur les symptômes
- **Analyse de sentiment** des messages patients

### Phase 3 - Intelligence Avancée
- **Détection d'urgences** automatique
- **Recommandations personnalisées** de spécialistes
- **Suivi longitudinal** des symptômes
- **Intégration IoT** (objets connectés santé)

## 🎯 Conclusion

Le **Chat Médical avec Bot IA** représente une innovation majeure dans l'accompagnement des patients. Il combine :

- 🤖 **Intelligence artificielle avancée** via OpenRouter
- 🔐 **Sécurité maximale** et respect de la vie privée
- 🏥 **Contexte médical enrichi** pour des réponses pertinentes
- 📱 **Interface simple** et accessible
- 🧪 **Tests complets** et validation rigoureuse

Cette fonctionnalité améliore significativement l'expérience patient tout en respectant les standards médicaux et éthiques les plus stricts.

---

**🚀 Prêt pour la production et l'intégration dans l'écosystème de santé !**