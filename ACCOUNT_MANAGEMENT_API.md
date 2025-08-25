# 📚 DOCUMENTATION - ENDPOINTS GESTION DE COMPTE

## Vue d'ensemble

Cette documentation décrit les nouveaux endpoints ajoutés pour la gestion complète des comptes utilisateurs dans l'application LabResultat.

## 🔗 Base URL

```
http://localhost:3000/api
```

## 🔐 Authentification

Tous les endpoints protégés nécessitent un token JWT dans l'en-tête Authorization :

```
Authorization: Bearer <token>
```

---

## 📋 ENDPOINTS DISPONIBLES

### 1. 👤 Récupération du profil utilisateur

**GET** `/auth/profile`

Récupère les informations complètes du profil utilisateur connecté.

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "patient@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "phone": "+33123456789",
      "role": "patient",
      "created_at": "2025-08-22T10:00:00.000Z",
      "patient": {
        "date_of_birth": "1990-01-01",
        "gender": "M",
        "address": "123 Rue de la Santé, 75001 Paris"
      }
    }
  }
}
```

---

### 2. ✏️ Mise à jour du profil utilisateur

**PUT** `/auth/profile`

Met à jour les informations du profil utilisateur.

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "first_name": "Jean",
  "last_name": "Dupont",
  "email": "nouveau.email@example.com",
  "phone": "+33987654321",
  "date_of_birth": "1990-01-01",
  "address": "456 Avenue de la République, 75011 Paris"
}
```

**Validation:**
- `first_name` : 2-50 caractères, lettres uniquement
- `last_name` : 2-50 caractères, lettres uniquement  
- `email` : Format email valide, unique
- `phone` : 8-15 caractères, format téléphone
- `date_of_birth` : Format ISO8601 (YYYY-MM-DD)
- `address` : Maximum 255 caractères

**Response 200:**
```json
{
  "success": true,
  "message": "Profil mis à jour avec succès",
  "data": {
    "user": {
      "id": 1,
      "email": "nouveau.email@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "phone": "+33987654321",
      "role": "patient",
      "updated_at": "2025-08-22T12:00:00.000Z"
    }
  }
}
```

---

### 3. 🔒 Changement de mot de passe

**PUT** `/auth/change-password`

Permet à l'utilisateur de changer son mot de passe.

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "currentPassword": "ancienMotDePasse123",
  "newPassword": "nouveauMotDePasse456"
}
```

**Validation:**
- `currentPassword` : Requis, doit correspondre au mot de passe actuel
- `newPassword` : Minimum 6 caractères, au moins une minuscule, une majuscule et un chiffre

**Response 200:**
```json
{
  "success": true,
  "message": "Mot de passe modifié avec succès"
}
```

**Response 401:**
```json
{
  "success": false,
  "message": "Mot de passe actuel incorrect"
}
```

---

### 4. 🔔 Récupération des paramètres de notification

**GET** `/notifications/settings`

Récupère les paramètres de notification de l'utilisateur.

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "settings": {
      "user_id": 1,
      "new_message_enabled": true,
      "new_document_enabled": true,
      "exam_status_enabled": true,
      "in_app_enabled": true,
      "email_enabled": false,
      "push_enabled": true,
      "email_frequency": "daily",
      "quiet_hours_start": "22:00",
      "quiet_hours_end": "07:00"
    }
  }
}
```

---

### 5. 🔔 Mise à jour des paramètres de notification

**PUT** `/notifications/settings`

Met à jour les paramètres de notification de l'utilisateur.

**Headers:**
```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "new_message_enabled": true,
  "new_document_enabled": true,
  "exam_status_enabled": false,
  "in_app_enabled": true,
  "email_enabled": false,
  "push_enabled": true,
  "email_frequency": "hourly",
  "quiet_hours_start": "23:00",
  "quiet_hours_end": "08:00"
}
```

**Paramètres disponibles:**
- `new_message_enabled` : Notifications pour nouveaux messages (boolean)
- `new_document_enabled` : Notifications pour nouveaux documents (boolean)
- `exam_status_enabled` : Notifications pour statut des examens (boolean)
- `in_app_enabled` : Notifications dans l'application (boolean)
- `email_enabled` : Notifications par email (boolean)
- `push_enabled` : Notifications push (boolean)
- `email_frequency` : Fréquence emails ('immediate', 'hourly', 'daily', 'weekly', 'never')
- `quiet_hours_start` : Début heures de silence (format HH:MM)
- `quiet_hours_end` : Fin heures de silence (format HH:MM)

**Response 200:**
```json
{
  "success": true,
  "message": "Paramètres de notification mis à jour avec succès",
  "data": {
    "settings": {
      "user_id": 1,
      "new_message_enabled": true,
      "email_frequency": "hourly",
      // ... autres paramètres
    }
  }
}
```

---

### 6. 📄 Export des données personnelles

**POST** `/auth/data-export`

Génère un export de toutes les données personnelles de l'utilisateur.

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Export des données préparé",
  "data": {
    "user": {
      "id": 1,
      "email": "patient@example.com",
      "first_name": "Jean",
      "last_name": "Dupont",
      "created_at": "2025-08-22T10:00:00.000Z",
      "patient": {
        "date_of_birth": "1990-01-01",
        "gender": "M"
      },
      "notifications": [
        {
          "type": "new_message",
          "title": "Nouveau message",
          "created_at": "2025-08-22T11:00:00.000Z"
        }
      ],
      "documents": [
        {
          "filename": "resultat_analyse.pdf",
          "document_type": "blood_test",
          "created_at": "2025-08-22T09:00:00.000Z"
        }
      ]
    },
    "exportDate": "2025-08-22T12:00:00.000Z",
    "disclaimer": "Ces données sont confidentielles et ne doivent pas être partagées."
  }
}
```

---

### 7. 🗑️ Suppression du compte

**DELETE** `/auth/account`

Désactive le compte utilisateur (suppression logique).

**Headers:**
```json
{
  "Authorization": "Bearer <token>"
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Compte supprimé avec succès"
}
```

**Note:** Cette opération désactive le compte (`is_active = false`) plutôt que de le supprimer physiquement, permettant une restauration ultérieure si nécessaire.

---

## 🚨 Codes d'erreur communs

### 400 Bad Request
```json
{
  "success": false,
  "message": "Données invalides",
  "errors": [
    {
      "field": "email",
      "message": "Email valide requis",
      "value": "email-invalide"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Token invalide ou expiré"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Permissions insuffisantes"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Ressource non trouvée"
}
```

### 409 Conflict
```json
{
  "success": false,
  "message": "Un compte avec cet email existe déjà"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Erreur interne du serveur"
}
```

---

## 🧪 Tests

Pour tester les endpoints, utilisez le script de test fourni :

```bash
cd backend
node test_account_management.js
```

Ou utilisez la collection Postman disponible dans le dossier backend.

---

## 🔐 Sécurité

- **JWT** : Tous les endpoints protégés utilisent l'authentification JWT
- **Validation** : Validation stricte des entrées avec express-validator
- **Hachage** : Mots de passe hachés avec bcrypt (12 rounds)
- **CORS** : Configuration CORS sécurisée
- **Helmet** : En-têtes de sécurité via Helmet.js

---

## 📝 Notes d'implémentation

1. **Transactions** : Les opérations critiques utilisent des transactions Prisma
2. **Validation** : Validation côté serveur et côté client
3. **Logging** : Tous les erreurs sont loggées pour le débogage
4. **Performance** : Requêtes optimisées avec les relations Prisma appropriées
5. **Compatibilité** : Compatible avec l'architecture existante

---

## 🚀 Utilisation Frontend

Ces endpoints sont intégrés dans l'interface utilisateur via le service `UserService` Angular/Ionic. Voir la documentation frontend pour plus de détails sur l'utilisation côté client.