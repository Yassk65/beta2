# Guide de Migration - Nouvelle Structure Multi-Tables

## 📋 Vue d'ensemble

Cette migration transforme votre système d'authentification d'une table `User` unique vers une structure multi-tables spécialisée :

- **patients** : Utilisateurs patients
- **hospitals** : Informations des hôpitaux
- **hospital_admins** : Administrateurs d'hôpitaux
- **hospital_staff** : Personnel hospitalier
- **laboratories** : Informations des laboratoires
- **lab_admins** : Administrateurs de laboratoires
- **lab_staff** : Personnel de laboratoire

## 🚀 Étapes de Migration

### 1. Sauvegarde de la Base de Données

```bash
# Créer une sauvegarde complète
mysqldump -u [username] -p [database_name] > backup_before_migration.sql
```

### 2. Exécuter le Script de Migration

```bash
# Se connecter à MySQL
mysql -u [username] -p [database_name]

# Exécuter le script de migration
source migration_new_structure.sql
```

### 3. Mettre à Jour le Schéma Prisma

```bash
# Remplacer le fichier schema.prisma actuel
cp prisma/schema_new_structure.prisma prisma/schema.prisma

# Générer le nouveau client Prisma
npx prisma generate

# Optionnel : Synchroniser avec la base de données
npx prisma db push
```

### 4. Mettre à Jour l'Application

```bash
# Remplacer les fichiers de contrôleurs
cp src/controllers/authController_new_structure.js src/controllers/authController.js
cp src/controllers/userController_new_structure.js src/controllers/userController.js

# Remplacer les middlewares
cp src/middleware/auth_new_structure.js src/middleware/auth.js

# Remplacer les routes
cp src/routes/auth_new_structure.js src/routes/auth.js
cp src/routes/users_new_structure.js src/routes/users.js

# Remplacer le fichier principal de l'application
cp src/app_new_structure.js src/app.js
```

### 5. Tester la Migration

```bash
# Démarrer le serveur
npm start

# Dans un autre terminal, exécuter les tests
node test_new_structure.js
```

## 🔄 Changements Principaux

### Structure des Tokens JWT

**Avant :**
```json
{
  "userId": 123,
  "role": "ADMIN"
}
```

**Après :**
```json
{
  "userId": 123,
  "userType": "hospital_admin",
  "entityId": 456
}
```

### Endpoints d'Authentification

**Inscription :**
```javascript
// POST /api/auth/register
{
  "userType": "hospital_admin", // patient, hospital_admin, hospital_staff, lab_admin, lab_staff
  "email": "admin@hopital.com",
  "password": "password123",
  "nom": "Dupont",
  "prenom": "Jean",
  // Champs spécifiques selon le type...
}
```

**Connexion :**
```javascript
// POST /api/auth/login
{
  "email": "admin@hopital.com",
  "password": "password123"
}

// Réponse
{
  "success": true,
  "data": {
    "user": { /* données utilisateur */ },
    "userType": "hospital_admin",
    "token": "jwt_token"
  }
}
```

### Endpoints CRUD Utilisateurs

```javascript
// GET /api/users - Liste tous les utilisateurs
// GET /api/users?userType=patient - Filtre par type
// GET /api/users/patient/123 - Utilisateur spécifique
// PUT /api/users/patient/123 - Modifier un utilisateur
// DELETE /api/users/patient/123 - Supprimer un utilisateur
```

## 📊 Types d'Utilisateurs

### 1. Patient
```javascript
{
  "userType": "patient",
  "email": "patient@email.com",
  "password": "password",
  "nom": "Martin",
  "prenom": "Marie",
  "telephone": "0123456789",
  "photo_profil": "base64_image" // optionnel
}
```

### 2. Admin d'Hôpital (avec création d'hôpital)
```javascript
{
  "userType": "hospital_admin",
  "email": "admin@hopital.com",
  "password": "password",
  "nom": "Dupont",
  "prenom": "Jean",
  "hospital_name": "Hôpital Central",
  "hospital_address": "123 Rue de la Santé",
  "hospital_ville": "Paris",
  "hospital_pays": "France",
  "hospital_telephone": "0123456789",
  "hospital_email": "contact@hopital.fr"
}
```

### 3. Personnel Hospitalier
```javascript
{
  "userType": "hospital_staff",
  "hospital_id": 1, // ID de l'hôpital existant
  "email": "medecin@hopital.com",
  "password": "password",
  "nom": "Durand",
  "prenom": "Pierre",
  "telephone": "0123456789",
  "staff_role": "medecin" // medecin, infirmier, autre
}
```

### 4. Admin de Laboratoire
```javascript
{
  "userType": "lab_admin",
  "email": "admin@labo.com",
  "password": "password",
  "nom": "Moreau",
  "prenom": "Sophie",
  "lab_name": "Laboratoire BioTest",
  "lab_address": "456 Avenue des Sciences",
  "lab_ville": "Lyon",
  "lab_pays": "France"
}
```

### 5. Personnel de Laboratoire
```javascript
{
  "userType": "lab_staff",
  "lab_id": 1, // ID du laboratoire existant
  "email": "technicien@labo.com",
  "password": "password",
  "nom": "Bernard",
  "prenom": "Luc",
  "staff_poste": "technicien" // technicien, responsable, autre
}
```

## 🔐 Autorisations

### Niveaux d'Accès

1. **Patients** : Accès à leur profil uniquement
2. **Hospital Staff** : Accès aux données de leur hôpital
3. **Hospital Admin** : Gestion complète de leur hôpital
4. **Lab Staff** : Accès aux données de leur laboratoire
5. **Lab Admin** : Gestion complète de leur laboratoire

### Middlewares d'Autorisation

```javascript
// Authentification requise
authenticateToken

// Admins uniquement (hôpital ou labo)
requireAnyAdmin

// Admin d'hôpital uniquement
requireHospitalAdmin

// Admin de laboratoire uniquement
requireLabAdmin

// Personnel hospitalier (admin + staff)
requireHospitalAccess

// Personnel de laboratoire (admin + staff)
requireLabAccess

// Accès à une entité spécifique
requireEntityAccess('hospital')
requireEntityAccess('laboratory')
```

## 🧪 Tests et Validation

### Tests Automatisés

```bash
# Exécuter tous les tests
node test_new_structure.js

# Tests spécifiques
node -e "require('./test_new_structure').testCreateHospitalAdmin()"
```

### Tests Manuels avec curl

```bash
# Test de santé de l'API
curl http://localhost:3000/api/health

# Inscription d'un patient
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "userType": "patient",
    "email": "test@patient.com",
    "password": "password123",
    "nom": "Test",
    "prenom": "Patient"
  }'

# Connexion
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@patient.com",
    "password": "password123"
  }'
```

## 🔧 Dépannage

### Problèmes Courants

1. **Erreur de migration SQL**
   - Vérifier les permissions de la base de données
   - S'assurer que toutes les tables sont accessibles

2. **Erreur Prisma Client**
   ```bash
   npx prisma generate
   npm install @prisma/client
   ```

3. **Erreur de token JWT**
   - Vérifier la variable d'environnement JWT_SECRET
   - Régénérer les tokens après migration

4. **Erreur de validation**
   - Vérifier les champs requis selon le type d'utilisateur
   - Consulter les messages d'erreur détaillés

### Rollback

En cas de problème, restaurer la sauvegarde :

```bash
mysql -u [username] -p [database_name] < backup_before_migration.sql
```

## 📝 Notes Importantes

1. **Emails uniques** : Chaque email ne peut exister que dans une seule table
2. **Mots de passe** : Toujours hachés avec bcrypt (12 rounds)
3. **Relations** : Les suppressions en cascade sont activées
4. **Tokens** : Incluent maintenant le type d'utilisateur et l'ID d'entité
5. **Validation** : Renforcée selon le type d'utilisateur

## 🎯 Prochaines Étapes

1. Mettre à jour le frontend pour utiliser les nouveaux endpoints
2. Adapter les tests existants
3. Mettre à jour la documentation API
4. Former les utilisateurs aux nouveaux workflows

---

**Date de création :** 8 Août 2025  
**Version :** 1.0  
**Auteur :** Kiro AI Assistant