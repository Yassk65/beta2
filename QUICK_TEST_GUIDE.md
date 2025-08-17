# 🚀 Guide Rapide - Tests Postman

## 📥 Import dans Postman

### 1. Importer la Collection
1. Ouvrir Postman
2. Cliquer sur **Import**
3. Sélectionner le fichier `Sante_MVP_API.postman_collection.json`
4. Cliquer sur **Import**

### 2. Importer l'Environnement
1. Cliquer sur **Import**
2. Sélectionner le fichier `Sante_MVP_Environment.postman_environment.json`
3. Cliquer sur **Import**
4. Sélectionner l'environnement **"Santé MVP - Local Development"** en haut à droite

## ⚡ Tests Rapides (5 minutes)

### 🔥 Séquence Minimale
Exécuter ces requêtes dans l'ordre :

1. **🏥 API Health Check** - Vérifier que le serveur fonctionne
2. **👑 Login Super Admin** - Récupérer le token admin
3. **📊 General Stats** - Voir les statistiques
4. **👤 Login Patient** - Récupérer le token patient
5. **📋 Get Patient Documents** - Voir les documents du patient

### 🧪 Test Complet (15 minutes)
Exécuter tous les dossiers dans l'ordre :

1. **🔑 Authentication** (tous les logins)
2. **👥 Patient Management** (gestion des patients)
3. **📄 Document Management** (gestion des documents)
4. **🚫 Security Tests** (tests de sécurité)

## 🎯 Tests Spécifiques

### Test des Permissions
```
1. Login Hospital Admin
2. List Patients → ✅ Voir seulement son hôpital
3. Login Patient  
4. List Patients → ❌ Accès refusé (403)
```

### Test des Documents
```
1. Login Patient
2. Get Patient Documents → ✅ Ses documents
3. Get Other Patient Documents → ❌ Accès refusé (403)
4. AI Explanation → ✅ Fonctionne pour patient
5. Login Doctor
6. AI Explanation → ❌ Refusé pour médecin (403)
```

### Test de Sécurité
```
1. No Token Access → ❌ 401 Unauthorized
2. Invalid Token → ❌ 401 Invalid token
3. SQL Injection → ❌ 400 Blocked
```

## 📊 Résultats Attendus

### ✅ Succès (Status 200)
- Health check
- Logins valides
- Accès autorisés selon les rôles
- Récupération de données

### ❌ Erreurs Attendues
- **401** : Pas de token ou token invalide
- **403** : Permissions insuffisantes
- **404** : Ressource non trouvée
- **400** : Données invalides

## 🔧 Dépannage

### Serveur non démarré
```
Error: connect ECONNREFUSED 127.0.0.1:3000
```
**Solution :** Démarrer le serveur
```bash
cd backend/src
node app.js
```

### Base de données vide
```
Error: Patient non trouvé
```
**Solution :** Ajouter les données de test
```bash
cd backend
npm run db:seed
```

### Tokens expirés
```
Error: Token expired
```
**Solution :** Refaire les logins pour récupérer de nouveaux tokens

## 🎯 Points de Validation

### ✅ Authentification
- [ ] Tous les rôles peuvent se connecter
- [ ] Tokens générés et sauvegardés automatiquement
- [ ] Profils récupérés correctement

### ✅ Permissions
- [ ] Super Admin : Accès total
- [ ] Hospital Admin : Limité à son hôpital
- [ ] Lab Admin : Limité à son laboratoire  
- [ ] Patient : Limité à ses données
- [ ] Doctor : Limité à son hôpital

### ✅ Sécurité
- [ ] Accès sans token refusé
- [ ] Token invalide refusé
- [ ] Injection SQL bloquée
- [ ] XSS échappé

### ✅ Fonctionnalités
- [ ] CRUD patients
- [ ] Consultation documents
- [ ] Explications IA (patients uniquement)
- [ ] Messagerie basique

## 🚀 Automatisation

### Runner Postman
1. Sélectionner la collection
2. Cliquer sur **Run**
3. Sélectionner l'environnement
4. Cliquer sur **Run Santé MVP API**

### Tests en Ligne de Commande
```bash
# Installer Newman (CLI Postman)
npm install -g newman

# Exécuter la collection
newman run Sante_MVP_API.postman_collection.json \
  -e Sante_MVP_Environment.postman_environment.json \
  --reporters cli,html \
  --reporter-html-export results.html
```

## 📈 Métriques de Succès

### 🎯 Objectifs
- **100%** des authentifications réussies
- **0** accès non autorisé accordé
- **100%** des erreurs de sécurité bloquées
- **< 500ms** temps de réponse moyen

### 📊 Rapport Type
```
✅ Authentication: 6/6 tests passed
✅ Patient Management: 5/6 tests passed (1 expected failure)
✅ Document Management: 4/6 tests passed (2 expected failures)
✅ Security Tests: 4/4 tests passed
✅ Edge Cases: 3/3 tests passed

Total: 22/25 tests passed (3 expected failures)
Success Rate: 100% (all failures are expected security blocks)
```

Avec ces tests, tu peux valider complètement ton API en quelques minutes ! 🚀