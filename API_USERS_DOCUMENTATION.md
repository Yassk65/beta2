# API de Gestion des Utilisateurs

**📅 Créé le :** 21 Juillet 2025  
**👨‍💻 Développeur :** Kiro AI Assistant  
**📝 Dernière mise à jour :** 21 Juillet 2025  

Cette API permet aux administrateurs de gérer tous les utilisateurs du système (CRUD complet).

## 🔐 Authentification Requise

**IMPORTANT**: Toutes les routes de cette API nécessitent :
1. Un token JWT valide dans le header `Authorization: Bearer <token>`
2. Le rôle `ADMIN` pour l'utilisateur connecté

## 📋 Endpoints Disponibles

### 1. Obtenir tous les utilisateurs
```
GET /api/users
```

**Paramètres de requête (optionnels):**
- `page` : Numéro de page (défaut: 1)
- `limit` : Nombre d'utilisateurs par page (défaut: 10, max: 100)
- `role` : Filtrer par rôle (PATIENT, HOPITAL, LABO, ADMIN)
- `isActive` : Filtrer par statut (true/false)
- `search` : Recherche dans nom, prénom, email, nom hôpital/labo

**Exemple:**
```bash
GET /api/users?page=1&limit=20&role=PATIENT&isActive=true&search=martin
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "users": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalUsers": 50,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 2. Obtenir un utilisateur par ID
```
GET /api/users/:id
```

**Exemple:**
```bash
GET /api/users/123
```

### 3. Créer un nouvel utilisateur
```
POST /api/users
```

**Corps de la requête:**
```json
{
  "email": "user@example.com",
  "password": "MotDePasse123",
  "role": "PATIENT",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "0123456789",
  "isActive": true,
  
  // Pour PATIENT
  "dateOfBirth": "1990-01-01",
  "address": "123 Rue de la Paix",
  
  // Pour HOPITAL
  "hospitalName": "Hôpital Central",
  "hospitalAddress": "456 Avenue de la Santé",
  "licenseNumber": "LIC123456",
  
  // Pour LABO
  "labName": "Laboratoire Médical",
  "labAddress": "789 Boulevard des Analyses",
  "labLicense": "LAB789012"
}
```

### 4. Mettre à jour un utilisateur
```
PUT /api/users/:id
```

**Corps de la requête (tous les champs sont optionnels):**
```json
{
  "email": "nouveau@example.com",
  "password": "NouveauMotDePasse123",
  "firstName": "Pierre",
  "lastName": "Martin",
  "isActive": false
}
```

### 5. Supprimer un utilisateur (soft delete)
```
DELETE /api/users/:id
```

**Note:** Cette action désactive l'utilisateur (isActive = false) au lieu de le supprimer définitivement.

### 6. Réactiver un utilisateur
```
PATCH /api/users/:id/reactivate
```

### 7. Obtenir les statistiques des utilisateurs
```
GET /api/users/stats
```

**Réponse:**
```json
{
  "success": true,
  "data": {
    "totalUsers": 150,
    "activeUsers": 140,
    "inactiveUsers": 10,
    "roleStats": {
      "PATIENT": 100,
      "HOPITAL": 25,
      "LABO": 20,
      "ADMIN": 5
    }
  }
}
```

## 🔍 Exemples d'utilisation avec curl

### Se connecter en tant qu'admin
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "AdminPassword123"
  }'
```

### Créer un patient
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "patient@example.com",
    "password": "PatientPass123",
    "role": "PATIENT",
    "firstName": "Marie",
    "lastName": "Dubois",
    "phone": "0123456789",
    "dateOfBirth": "1985-05-15",
    "address": "123 Rue de la Santé"
  }'
```

### Lister tous les patients actifs
```bash
curl -X GET "http://localhost:3000/api/users?role=PATIENT&isActive=true" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Mettre à jour un utilisateur
```bash
curl -X PUT http://localhost:3000/api/users/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "firstName": "Marie-Claire",
    "phone": "0987654321"
  }'
```

### Désactiver un utilisateur
```bash
curl -X DELETE http://localhost:3000/api/users/123 \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

## ⚠️ Règles de Sécurité

1. **Authentification obligatoire** : Toutes les routes nécessitent un token JWT valide
2. **Autorisation admin** : Seuls les utilisateurs avec le rôle `ADMIN` peuvent accéder à ces routes
3. **Auto-protection** : Un admin ne peut pas supprimer son propre compte
4. **Validation stricte** : Tous les champs sont validés côté serveur
5. **Soft delete** : Les utilisateurs ne sont jamais supprimés définitivement, seulement désactivés

## 🚀 Intégration Frontend

Dans votre application Angular/Ionic, vous pourrez utiliser ces endpoints pour :

1. **Page d'administration des utilisateurs** : Lister, rechercher, filtrer
2. **Formulaires de création/modification** : Créer et modifier les utilisateurs
3. **Gestion des rôles** : Assigner les bons rôles selon le type d'utilisateur
4. **Dashboard admin** : Afficher les statistiques des utilisateurs
5. **Contrôle d'accès** : Vérifier que seuls les admins accèdent à ces fonctionnalités

## 📝 Notes Importantes

- Les mots de passe sont automatiquement hachés avec bcrypt
- Les emails sont normalisés et vérifiés pour l'unicité
- La pagination est optimisée pour de gros volumes de données
- Les recherches sont insensibles à la casse
- Tous les champs spécifiques aux rôles sont gérés automatiquement