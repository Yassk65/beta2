# 👑 SYSTÈME D'ADMINISTRATION MVP - DOCUMENTATION COMPLÈTE

## 📋 Vue d'ensemble

Le système d'administration permet la gestion complète des utilisateurs, établissements et données par trois niveaux d'administrateurs :

- **Super Admin** : Gestion globale de tout le système
- **Admin Hôpital** : Gestion des utilisateurs et données de son hôpital
- **Admin Laboratoire** : Gestion des utilisateurs et données de son laboratoire

## 🏗️ Architecture des Permissions

### Super Admin (`super_admin`)
- ✅ CRUD complet sur tous les utilisateurs (tous rôles)
- ✅ CRUD complet sur tous les hôpitaux et laboratoires
- ✅ Accès à toutes les données et statistiques
- ✅ Réinitialisation des mots de passe de tous les utilisateurs
- ✅ Création d'autres admins (hôpital/laboratoire)

### Admin Hôpital (`hospital_admin`)
- ✅ CRUD sur les utilisateurs de son hôpital (`hospital_staff`, `patient`)
- ❌ Ne peut pas créer d'autres `hospital_admin`
- ✅ Accès aux documents et données de son hôpital
- ✅ Statistiques de son hôpital
- ✅ Réinitialisation des mots de passe de son staff
- ❌ Accès aux autres hôpitaux/laboratoires

### Admin Laboratoire (`lab_admin`)
- ✅ CRUD sur les utilisateurs de son laboratoire (`lab_staff`, `patient`)
- ❌ Ne peut pas créer d'autres `lab_admin`
- ✅ Accès aux documents et données de son laboratoire
- ✅ Statistiques de son laboratoire
- ✅ Réinitialisation des mots de passe de son staff
- ❌ Accès aux autres hôpitaux/laboratoires

## 📡 API Endpoints

### 🔐 Authentification
Toutes les routes nécessitent un token JWT valide avec le rôle approprié.

```http
Authorization: Bearer <token>
```

### 📊 Tableau de Bord

#### GET `/api/admin/dashboard`
Statistiques selon le rôle de l'admin.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

**Réponse Super Admin :**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 150,
      "active": 140,
      "inactive": 10,
      "byRole": {
        "patient": 100,
        "hospital_staff": 30,
        "lab_staff": 15,
        "hospital_admin": 3,
        "lab_admin": 2
      }
    },
    "establishments": {
      "hospitals": { "total": 5, "active": 5, "inactive": 0 },
      "laboratories": { "total": 3, "active": 3, "inactive": 0 }
    },
    "documents": {
      "total": 500,
      "recent": 25
    }
  }
}
```

**Réponse Admin Hôpital/Laboratoire :**
```json
{
  "success": true,
  "data": {
    "hospital": { "id": 1, "name": "Hôpital Central", "city": "Paris" },
    "staff": {
      "total": 25,
      "active": 23,
      "inactive": 2,
      "byRole": { "hospital_staff": 20, "patient": 5 }
    },
    "documents": {
      "total": 150,
      "recent": 8
    }
  }
}
```

### 👥 Gestion des Utilisateurs

#### GET `/api/admin/users`
Liste des utilisateurs avec filtres et pagination.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

**Query Parameters :**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'éléments par page (défaut: 10, max: 100)
- `search` : Recherche textuelle (nom, prénom, email)
- `role` : Filtrer par rôle
- `is_active` : Filtrer par statut (true/false)
- `hospital_id` : Filtrer par hôpital (super admin seulement)
- `laboratory_id` : Filtrer par laboratoire (super admin seulement)

**Exemple :**
```http
GET /api/admin/users?page=1&limit=20&search=martin&role=patient&is_active=true
```

#### POST `/api/admin/users`
Créer un nouvel utilisateur.

**Permissions :** `super_admin` uniquement

**Body :**
```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "first_name": "Jean",
  "last_name": "Dupont",
  "phone": "0123456789",
  "role": "hospital_staff",
  "hospital_id": 1,
  "laboratory_id": null,
  "date_of_birth": "1990-01-01",
  "gender": "M"
}
```

#### GET `/api/admin/users/:id`
Détails d'un utilisateur spécifique.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

#### PUT `/api/admin/users/:id`
Modifier un utilisateur.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

#### DELETE `/api/admin/users/:id`
Supprimer un utilisateur.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

#### POST `/api/admin/users/:id/reset-password`
Réinitialiser le mot de passe d'un utilisateur.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

**Body :**
```json
{
  "new_password": "nouveaumotdepasse123"
}
```

### 🏥 Gestion des Hôpitaux

#### GET `/api/admin/hospitals`
Liste des hôpitaux.

**Permissions :** `super_admin` uniquement

#### POST `/api/admin/hospitals`
Créer un nouvel hôpital.

**Permissions :** `super_admin` uniquement

**Body :**
```json
{
  "name": "Hôpital Central",
  "address": "123 Rue de la Santé",
  "city": "Paris",
  "phone": "0123456789",
  "email": "contact@hopital.fr",
  "latitude": 48.8566,
  "longitude": 2.3522
}
```

#### PUT `/api/admin/hospitals/:id`
Modifier un hôpital.

**Permissions :** `super_admin` uniquement

### 🧪 Gestion des Laboratoires

#### GET `/api/admin/laboratories`
Liste des laboratoires.

**Permissions :** `super_admin` uniquement

#### POST `/api/admin/laboratories`
Créer un nouveau laboratoire.

**Permissions :** `super_admin` uniquement

#### PUT `/api/admin/laboratories/:id`
Modifier un laboratoire.

**Permissions :** `super_admin` uniquement

### 🤒 Gestion des Patients

#### GET `/api/admin/patients/stats`
Statistiques des patients.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

#### GET `/api/admin/patients`
Liste des patients avec filtres avancés.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

**Query Parameters :**
- `page`, `limit` : Pagination
- `search` : Recherche textuelle
- `is_active` : Statut actif
- `gender` : Genre (M, F, Other)
- `age_min`, `age_max` : Filtres d'âge

#### POST `/api/admin/patients`
Créer un nouveau patient.

**Permissions :** `super_admin`, `hospital_admin`, `lab_admin`

**Body :**
```json
{
  "email": "patient@example.com",
  "password": "motdepasse123",
  "first_name": "Marie",
  "last_name": "Martin",
  "phone": "0123456789",
  "date_of_birth": "1985-03-15",
  "gender": "F",
  "assign_to_hospital": 1,
  "assign_to_laboratory": null
}
```

#### GET `/api/admin/patients/:id`
Détails d'un patient avec ses derniers documents.

#### PUT `/api/admin/patients/:id`
Modifier un patient.

#### DELETE `/api/admin/patients/:id`
Supprimer un patient (seulement si aucun document associé).

### 🏢 Routes Spécialisées par Établissement

#### POST `/api/admin/hospitals/:hospitalId/users`
Créer un utilisateur pour un hôpital spécifique.

**Permissions :** `super_admin`, `hospital_admin` (de cet hôpital)

#### POST `/api/admin/laboratories/:laboratoryId/users`
Créer un utilisateur pour un laboratoire spécifique.

**Permissions :** `super_admin`, `lab_admin` (de ce laboratoire)

#### GET `/api/admin/hospitals/:hospitalId/documents`
Documents d'un hôpital.

**Permissions :** `super_admin`, `hospital_admin`, `hospital_staff`

#### GET `/api/admin/laboratories/:laboratoryId/documents`
Documents d'un laboratoire.

**Permissions :** `super_admin`, `lab_admin`, `lab_staff`

#### GET `/api/admin/hospitals/:hospitalId/stats`
Statistiques détaillées d'un hôpital.

**Permissions :** `super_admin`, `hospital_admin`

#### GET `/api/admin/laboratories/:laboratoryId/stats`
Statistiques détaillées d'un laboratoire.

**Permissions :** `super_admin`, `lab_admin`

## 🔒 Sécurité et Validation

### Rate Limiting
- **Authentification :** 10 tentatives par 15 minutes
- **API générale :** 100 requêtes par 15 minutes

### Validation des Données
- **Emails :** Format valide et normalisation
- **Mots de passe :** Minimum 6 caractères
- **Téléphones :** Format français validé
- **Dates :** Format ISO 8601
- **IDs :** Entiers positifs

### Gestion des Erreurs
```json
{
  "success": false,
  "message": "Description de l'erreur",
  "errors": [
    {
      "field": "email",
      "message": "Email valide requis",
      "value": "email-invalide"
    }
  ]
}
```

## 🧪 Tests

### Exécution des Tests
```bash
node backend/test_admin_system.js
```

### Couverture des Tests
- ✅ Authentification des 3 types d'admins
- ✅ Création et gestion des établissements
- ✅ CRUD complet des utilisateurs
- ✅ Gestion spécialisée des patients
- ✅ Vérification des permissions
- ✅ Tableaux de bord et statistiques

## 📊 Cas d'Usage Typiques

### Super Admin
1. **Setup initial :** Créer les hôpitaux et laboratoires
2. **Gestion globale :** Créer les admins d'établissement
3. **Supervision :** Surveiller les statistiques globales
4. **Support :** Réinitialiser les mots de passe, débloquer les comptes

### Admin Hôpital
1. **Gestion équipe :** Créer et gérer le staff hospitalier
2. **Gestion patients :** Créer les comptes patients de l'hôpital
3. **Suivi activité :** Consulter les statistiques de l'hôpital
4. **Support local :** Réinitialiser les mots de passe du staff

### Admin Laboratoire
1. **Gestion équipe :** Créer et gérer le staff du laboratoire
2. **Gestion patients :** Créer les comptes patients du laboratoire
3. **Suivi activité :** Consulter les statistiques du laboratoire
4. **Support local :** Réinitialiser les mots de passe du staff

## 🚀 Déploiement

### Variables d'Environnement
```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/health_mvp"

# JWT
JWT_SECRET="votre-secret-jwt-super-securise"
JWT_EXPIRES_IN="24h"

# Serveur
PORT=3000
NODE_ENV=production

# Frontend
FRONTEND_URL="https://votre-frontend.com"
```

### Commandes de Démarrage
```bash
# Installation des dépendances
npm install

# Migration de la base de données
npx prisma migrate deploy

# Seed des données initiales
npx prisma db seed

# Démarrage du serveur
npm start
```

## 📈 Métriques et Monitoring

### Logs Importants
- Connexions d'admins
- Créations/modifications d'utilisateurs
- Tentatives d'accès non autorisées
- Erreurs de validation

### Statistiques à Surveiller
- Nombre d'utilisateurs actifs par établissement
- Fréquence de création de nouveaux comptes
- Taux d'erreurs d'authentification
- Performance des requêtes de liste

## 🔄 Évolutions Futures

### Fonctionnalités Prévues
- [ ] Import/Export CSV des utilisateurs
- [ ] Audit trail des actions d'administration
- [ ] Notifications par email
- [ ] Gestion des rôles personnalisés
- [ ] API de synchronisation avec systèmes externes

### Améliorations Techniques
- [ ] Cache Redis pour les statistiques
- [ ] Pagination cursor-based pour de meilleures performances
- [ ] Compression des réponses API
- [ ] Monitoring avancé avec métriques Prometheus