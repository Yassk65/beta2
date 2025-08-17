# 💬 SYSTÈME DE MESSAGERIE MVP - DOCUMENTATION COMPLÈTE

## 📋 Vue d'ensemble

Le système de messagerie permet la communication sécurisée entre tous les utilisateurs de la plateforme avec des restrictions basées sur les rôles et les établissements.

### 🎯 Fonctionnalités Principales

- **Conversations privées** entre utilisateurs autorisés
- **Messages en temps réel** avec historique complet
- **Recherche de contacts** avec filtres par rôle et établissement
- **Gestion des participants** (ajout/suppression)
- **Permissions granulaires** selon les rôles utilisateurs
- **Statistiques de messagerie** personnalisées

## 🏗️ Architecture des Permissions

### 🤒 Patient
- ✅ Peut contacter le staff de son établissement (hôpital/laboratoire)
- ✅ Peut contacter les super admins
- ❌ Ne peut pas contacter les patients d'autres établissements
- ❌ Ne peut pas contacter le staff d'autres établissements

### 👨‍⚕️ Staff Hospitalier (`hospital_staff`)
- ✅ Peut contacter tous les utilisateurs de son hôpital
- ✅ Peut contacter les super admins
- ❌ Ne peut pas contacter les utilisateurs d'autres établissements

### 👩‍⚕️ Staff Laboratoire (`lab_staff`)
- ✅ Peut contacter tous les utilisateurs de son laboratoire
- ✅ Peut contacter les super admins
- ❌ Ne peut pas contacter les utilisateurs d'autres établissements

### 👑 Admins (`hospital_admin`, `lab_admin`)
- ✅ Mêmes permissions que leur staff respectif
- ✅ Peuvent ajouter des participants aux conversations
- ✅ Peuvent gérer les conversations de leur établissement

### 🌟 Super Admin
- ✅ Accès complet à toutes les conversations
- ✅ Peut contacter tous les utilisateurs
- ✅ Peut gérer toutes les conversations

## 📡 API Endpoints

### 🔐 Authentification
Toutes les routes nécessitent un token JWT valide.

```http
Authorization: Bearer <token>
```

### 📋 Gestion des Conversations

#### GET `/api/messages/conversations`
Liste les conversations de l'utilisateur connecté.

**Query Parameters :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 20, max: 100)
- `search` : Recherche dans les titres de conversations

**Réponse :**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "id": 1,
        "title": "Question sur mes résultats",
        "created_at": "2025-01-11T10:00:00Z",
        "participants": [
          {
            "id": 2,
            "name": "Dr. Jean Dupont",
            "role": "hospital_staff",
            "establishment": "Hôpital Central"
          }
        ],
        "lastMessage": {
          "id": 5,
          "content": "Merci pour votre réponse...",
          "sender": {
            "id": 1,
            "name": "Marie Patient",
            "role": "patient"
          },
          "created_at": "2025-01-11T14:30:00Z"
        },
        "messageCount": 3,
        "unreadCount": 0
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

#### POST `/api/messages/conversations`
Créer une nouvelle conversation.

**Body :**
```json
{
  "participant_ids": [2, 3],
  "title": "Consultation de suivi",
  "initial_message": "Bonjour, j'aimerais programmer une consultation de suivi."
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Conversation créée avec succès",
  "data": {
    "conversation": {
      "id": 10,
      "title": "Consultation de suivi",
      "created_at": "2025-01-11T15:00:00Z",
      "participants": [...],
      "messages": [...]
    }
  }
}
```

#### GET `/api/messages/conversations/:id`
Obtenir une conversation spécifique avec tous ses messages.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "conversation": {
      "id": 1,
      "title": "Question sur mes résultats",
      "created_at": "2025-01-11T10:00:00Z",
      "participants": [...],
      "messages": [
        {
          "id": 1,
          "content": "Bonjour, j'aimerais avoir des informations...",
          "sender": {
            "id": 1,
            "name": "Marie Patient",
            "role": "patient"
          },
          "created_at": "2025-01-11T10:00:00Z"
        }
      ]
    }
  }
}
```

### 📨 Gestion des Messages

#### GET `/api/messages/conversations/:id/messages`
Lister les messages d'une conversation avec pagination.

**Query Parameters :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre de messages par page (défaut: 50, max: 100)
- `before` : Date ISO pour charger les messages plus anciens

#### POST `/api/messages/conversations/:id/messages`
Envoyer un nouveau message dans une conversation.

**Body :**
```json
{
  "content": "Merci pour votre réponse détaillée."
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "Message envoyé avec succès",
  "data": {
    "message": {
      "id": 15,
      "content": "Merci pour votre réponse détaillée.",
      "sender": {
        "id": 1,
        "name": "Marie Patient",
        "role": "patient"
      },
      "created_at": "2025-01-11T16:00:00Z"
    }
  }
}
```

### 👥 Gestion des Participants

#### POST `/api/messages/conversations/:id/participants`
Ajouter un participant à une conversation.

**Permissions :** Créateur de la conversation ou admins

**Body :**
```json
{
  "user_id": 5
}
```

#### DELETE `/api/messages/conversations/:id/participants/me`
Quitter une conversation.

### 🔍 Recherche et Contacts

#### GET `/api/messages/contacts`
Rechercher des utilisateurs pour démarrer une conversation.

**Query Parameters :**
- `search` : Terme de recherche (nom, prénom, email) - requis, min 2 caractères
- `role` : Filtrer par rôle (optionnel)
- `page`, `limit` : Pagination

**Exemple :**
```http
GET /api/messages/contacts?search=jean&role=hospital_staff&page=1&limit=10
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "contacts": [
      {
        "id": 2,
        "name": "Dr. Jean Dupont",
        "email": "jean.dupont@hopital.fr",
        "role": "hospital_staff",
        "establishment": "Hôpital Central"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1,
      "pages": 1
    }
  }
}
```

### 📊 Statistiques

#### GET `/api/messages/stats`
Statistiques de messagerie de l'utilisateur connecté.

**Réponse :**
```json
{
  "success": true,
  "data": {
    "totalConversations": 5,
    "totalMessages": 23,
    "recentMessages": 8,
    "unreadCount": 2
  }
}
```

### 🔄 Utilitaires

#### PUT `/api/messages/conversations/:id/read`
Marquer une conversation comme lue.

## 🔒 Sécurité et Validation

### Validation des Données
- **Messages :** 1-2000 caractères
- **Titres de conversation :** 1-100 caractères
- **Recherche :** 2-50 caractères
- **IDs :** Entiers positifs

### Contrôles de Sécurité
- Vérification des permissions avant chaque action
- Validation de l'appartenance aux conversations
- Filtrage des contacts selon les établissements
- Protection contre l'injection SQL via Prisma

### Gestion des Erreurs
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "content",
      "message": "Message requis (1-2000 caractères)",
      "value": ""
    }
  ]
}
```

## 🗄️ Structure de Base de Données

### Table `conversations`
```sql
id          INT PRIMARY KEY
title       VARCHAR(191)
created_by  INT (référence vers users.id)
created_at  DATETIME
```

### Table `conversation_participants`
```sql
id              INT PRIMARY KEY
conversation_id INT (référence vers conversations.id)
user_id         INT (référence vers users.id)
joined_at       DATETIME
```

### Table `messages`
```sql
id              INT PRIMARY KEY
conversation_id INT (référence vers conversations.id)
sender_id       INT (référence vers users.id)
content         TEXT
created_at      DATETIME
```

## 🧪 Tests

### Exécution des Tests
```bash
node backend/test_messaging_system.js
```

### Couverture des Tests
- ✅ Authentification des différents types d'utilisateurs
- ✅ Recherche de contacts avec permissions
- ✅ Création de conversations simples et multi-participants
- ✅ Envoi et réception de messages
- ✅ Récupération des données avec pagination
- ✅ Statistiques personnalisées
- ✅ Vérification des permissions
- ✅ Gestion des participants

## 📊 Cas d'Usage Typiques

### Patient → Staff Médical
1. **Recherche :** Patient recherche "docteur" ou nom du médecin
2. **Contact :** Sélection du médecin dans les résultats
3. **Conversation :** Création avec message initial
4. **Suivi :** Échange de messages pour clarifications

### Staff → Patient
1. **Notification :** Staff initie conversation pour résultats
2. **Explication :** Envoi de messages détaillés
3. **Questions :** Réponses aux questions du patient
4. **Suivi :** Planification de rendez-vous si nécessaire

### Admin → Équipe
1. **Coordination :** Création de conversations de groupe
2. **Instructions :** Diffusion d'informations importantes
3. **Suivi :** Gestion des participants selon les besoins

## 🚀 Fonctionnalités Futures

### Prévues pour v2.0
- [ ] **Notifications push** en temps réel
- [ ] **Statuts de lecture** des messages
- [ ] **Pièces jointes** (images, documents)
- [ ] **Messages vocaux** pour accessibilité
- [ ] **Traduction automatique** des messages
- [ ] **Archivage** des conversations anciennes

### Améliorations Techniques
- [ ] **WebSocket** pour messagerie temps réel
- [ ] **Cache Redis** pour performances
- [ ] **Compression** des messages longs
- [ ] **Chiffrement** end-to-end
- [ ] **Modération** automatique du contenu

## 🔧 Configuration et Déploiement

### Variables d'Environnement
```env
# Base de données (déjà configurée)
DATABASE_URL="mysql://user:password@localhost:3306/health_mvp"

# JWT (déjà configurée)
JWT_SECRET="votre-secret-jwt"
JWT_EXPIRES_IN="24h"
```

### Optimisations de Performance
- Index sur `conversation_id` et `created_at` pour les messages
- Index sur `user_id` pour les participants
- Pagination efficace avec curseurs
- Limitation du nombre de participants par conversation

## 📈 Métriques et Monitoring

### Métriques Importantes
- Nombre de conversations créées par jour
- Nombre de messages envoyés par utilisateur
- Temps de réponse moyen du staff
- Taux d'engagement par type d'utilisateur

### Logs à Surveiller
- Tentatives d'accès non autorisées
- Erreurs de validation fréquentes
- Performances des requêtes de recherche
- Utilisation des fonctionnalités par rôle

Le système de messagerie est maintenant prêt et offre une communication sécurisée et efficace entre tous les utilisateurs de la plateforme !