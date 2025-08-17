# 🧪 Tests Postman - Collection Complète

## 🚀 Configuration Initiale

### Variables d'Environnement Postman
Créer un environnement avec ces variables :

```json
{
  "baseUrl": "http://localhost:3000/api",
  "superAdminToken": "",
  "hospitalAdminToken": "",
  "labAdminToken": "",
  "doctorToken": "",
  "patientToken": "",
  "testPatientId": "",
  "testDocumentId": ""
}
```

## 🔑 Phase 1 : Authentification

### 1.1 🏥 Santé de l'API
```
GET {{baseUrl}}/health
```
**Réponse attendue :** Status 200 avec message de santé

### 1.2 👑 Connexion Super Admin
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin@sante-app.fr",
  "password": "admin123"
}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("superAdminToken", response.data.token);
    console.log("Super Admin Token:", response.data.token);
}
```

### 1.3 🏥 Connexion Admin Hôpital
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin.chu-paris@sante-app.fr",
  "password": "hospital123"
}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("hospitalAdminToken", response.data.token);
}
```

### 1.4 🧪 Connexion Admin Laboratoire
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "admin.cerba@sante-app.fr",
  "password": "lab123"
}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("labAdminToken", response.data.token);
}
```

### 1.5 👩‍⚕️ Connexion Médecin
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "dr.bernard@chu-paris.fr",
  "password": "staff123"
}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("doctorToken", response.data.token);
}
```

### 1.6 👤 Connexion Patient
```
POST {{baseUrl}}/auth/login
Content-Type: application/json

{
  "email": "jean.dupont@email.fr",
  "password": "patient123"
}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.environment.set("patientToken", response.data.token);
}
```

## 📊 Phase 2 : Tests des Profils

### 2.1 👑 Profil Super Admin
```
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{superAdminToken}}
```

### 2.2 🏥 Profil Admin Hôpital
```
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{hospitalAdminToken}}
```

### 2.3 👤 Profil Patient
```
GET {{baseUrl}}/auth/profile
Authorization: Bearer {{patientToken}}
```

## 🏥 Phase 3 : Gestion des Établissements

### 3.1 📋 Liste des Hôpitaux
```
GET {{baseUrl}}/users/hospitals
Authorization: Bearer {{patientToken}}
```

### 3.2 🧪 Liste des Laboratoires
```
GET {{baseUrl}}/users/laboratories
Authorization: Bearer {{patientToken}}
```

### 3.3 📊 Statistiques Générales (Super Admin)
```
GET {{baseUrl}}/users/stats
Authorization: Bearer {{superAdminToken}}
```

### 3.4 🚫 Statistiques Interdites (Patient)
```
GET {{baseUrl}}/users/stats
Authorization: Bearer {{patientToken}}
```
**Réponse attendue :** Status 403 (Forbidden)

## 👥 Phase 4 : Gestion des Patients (Admin)

### 4.1 📊 Statistiques Patients (Admin Hôpital)
```
GET {{baseUrl}}/admin/patients/stats
Authorization: Bearer {{hospitalAdminToken}}
```

### 4.2 📋 Liste des Patients (Admin Hôpital)
```
GET {{baseUrl}}/admin/patients?page=1&limit=5
Authorization: Bearer {{hospitalAdminToken}}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data.patients.length > 0) {
        pm.environment.set("testPatientId", response.data.patients[0].patient.id);
        console.log("Test Patient ID:", response.data.patients[0].patient.id);
    }
}
```

### 4.3 👤 Détails d'un Patient (Admin Hôpital)
```
GET {{baseUrl}}/admin/patients/{{testPatientId}}
Authorization: Bearer {{hospitalAdminToken}}
```

### 4.4 ➕ Créer un Nouveau Patient (Admin Hôpital)
```
POST {{baseUrl}}/admin/patients
Authorization: Bearer {{hospitalAdminToken}}
Content-Type: application/json

{
  "email": "nouveau.patient@test.fr",
  "password": "patient123",
  "first_name": "Nouveau",
  "last_name": "Patient",
  "phone": "06 99 88 77 66",
  "date_of_birth": "1990-01-01",
  "gender": "M"
}
```

### 4.5 ✏️ Modifier un Patient (Admin Hôpital)
```
PUT {{baseUrl}}/admin/patients/{{testPatientId}}
Authorization: Bearer {{hospitalAdminToken}}
Content-Type: application/json

{
  "phone": "06 11 22 33 44",
  "is_active": true
}
```

### 4.6 🚫 Tentative Accès Patient Autre Hôpital (Admin Hôpital)
```
GET {{baseUrl}}/admin/patients/999
Authorization: Bearer {{hospitalAdminToken}}
```
**Réponse attendue :** Status 403 ou 404

## 📄 Phase 5 : Gestion des Documents

### 5.1 📋 Documents d'un Patient (Patient lui-même)
```
GET {{baseUrl}}/documents/patient/{{testPatientId}}
Authorization: Bearer {{patientToken}}
```
**Test Script :**
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    if (response.data.documents.length > 0) {
        pm.environment.set("testDocumentId", response.data.documents[0].id);
        console.log("Test Document ID:", response.data.documents[0].id);
    }
}
```

### 5.2 📋 Documents d'un Patient (Médecin)
```
GET {{baseUrl}}/documents/patient/{{testPatientId}}
Authorization: Bearer {{doctorToken}}
```

### 5.3 🚫 Documents d'un Autre Patient (Patient)
```
GET {{baseUrl}}/documents/patient/999
Authorization: Bearer {{patientToken}}
```
**Réponse attendue :** Status 403 (Forbidden)

### 5.4 👁️ Visualiser un Document (Patient)
```
GET {{baseUrl}}/documents/{{testDocumentId}}/view
Authorization: Bearer {{patientToken}}
```

### 5.5 👁️ Visualiser un Document (Médecin)
```
GET {{baseUrl}}/documents/{{testDocumentId}}/view
Authorization: Bearer {{doctorToken}}
```

### 5.6 🤖 Explication IA d'un Document (Patient)
```
GET {{baseUrl}}/documents/{{testDocumentId}}/ai-explanation
Authorization: Bearer {{patientToken}}
```

### 5.7 🚫 Explication IA Interdite (Médecin)
```
GET {{baseUrl}}/documents/{{testDocumentId}}/ai-explanation
Authorization: Bearer {{doctorToken}}
```
**Réponse attendue :** Status 403 (Fonctionnalité réservée aux patients)

## 📤 Phase 6 : Upload de Documents

### 6.1 📤 Upload par Patient (pour lui-même)
```
POST {{baseUrl}}/documents/upload
Authorization: Bearer {{patientToken}}
Content-Type: multipart/form-data

Form Data:
- patient_id: {{testPatientId}}
- document_type: other
- description: Document de test uploadé par le patient
- file: [Sélectionner un fichier PDF/image]
```

### 6.2 📤 Upload par Médecin (pour un patient)
```
POST {{baseUrl}}/documents/upload
Authorization: Bearer {{doctorToken}}
Content-Type: multipart/form-data

Form Data:
- patient_id: {{testPatientId}}
- document_type: medical_report
- description: Rapport médical de consultation
- file: [Sélectionner un fichier PDF]
```

### 6.3 🚫 Upload Patient pour Autre Patient
```
POST {{baseUrl}}/documents/upload
Authorization: Bearer {{patientToken}}
Content-Type: multipart/form-data

Form Data:
- patient_id: 999
- document_type: other
- description: Tentative upload non autorisé
- file: [Sélectionner un fichier]
```
**Réponse attendue :** Status 403 (Forbidden)

## 💬 Phase 7 : Messagerie

### 7.1 📋 Liste des Conversations (Patient)
```
GET {{baseUrl}}/messages/conversations
Authorization: Bearer {{patientToken}}
```

### 7.2 🔍 Recherche de Contacts (Patient)
```
GET {{baseUrl}}/messages/contacts?search=bernard
Authorization: Bearer {{patientToken}}
```

### 7.3 💬 Créer une Conversation (Patient)
```
POST {{baseUrl}}/messages/conversations
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "participant_ids": [2],
  "title": "Question sur mes résultats",
  "initial_message": "Bonjour Docteur, j'ai une question sur mes derniers résultats d'analyses."
}
```

## 🚫 Phase 8 : Tests de Sécurité

### 8.1 🔒 Accès sans Token
```
GET {{baseUrl}}/admin/patients
```
**Réponse attendue :** Status 401 (Unauthorized)

### 8.2 🔒 Token Invalide
```
GET {{baseUrl}}/admin/patients
Authorization: Bearer invalid_token_here
```
**Réponse attendue :** Status 401 (Token invalide)

### 8.3 🔒 Rôle Insuffisant
```
GET {{baseUrl}}/admin/patients
Authorization: Bearer {{patientToken}}
```
**Réponse attendue :** Status 403 (Permissions insuffisantes)

### 8.4 🔒 Injection SQL (Test de Sécurité)
```
GET {{baseUrl}}/admin/patients/1'; DROP TABLE users; --
Authorization: Bearer {{superAdminToken}}
```
**Réponse attendue :** Status 400 (ID invalide) ou 404

### 8.5 🔒 XSS dans Recherche
```
GET {{baseUrl}}/admin/patients?search=<script>alert('xss')</script>
Authorization: Bearer {{hospitalAdminToken}}
```
**Réponse attendue :** Recherche normale (script échappé)

## 📊 Phase 9 : Tests de Performance

### 9.1 📋 Pagination Importante
```
GET {{baseUrl}}/admin/patients?page=1&limit=100
Authorization: Bearer {{superAdminToken}}
```

### 9.2 🔍 Recherche Complexe
```
GET {{baseUrl}}/admin/patients?search=jean&is_active=true&gender=M&age_min=18&age_max=65
Authorization: Bearer {{hospitalAdminToken}}
```

## 🧪 Phase 10 : Tests Edge Cases

### 10.1 📄 Document Inexistant
```
GET {{baseUrl}}/documents/99999/view
Authorization: Bearer {{patientToken}}
```
**Réponse attendue :** Status 404 (Document non trouvé)

### 10.2 👤 Patient Inexistant
```
GET {{baseUrl}}/admin/patients/99999
Authorization: Bearer {{hospitalAdminToken}}
```
**Réponse attendue :** Status 404 (Patient non trouvé)

### 10.3 📊 Pagination Invalide
```
GET {{baseUrl}}/admin/patients?page=-1&limit=0
Authorization: Bearer {{hospitalAdminToken}}
```
**Réponse attendue :** Status 400 (Paramètres invalides)

### 10.4 📧 Email Déjà Utilisé
```
POST {{baseUrl}}/admin/patients
Authorization: Bearer {{hospitalAdminToken}}
Content-Type: application/json

{
  "email": "jean.dupont@email.fr",
  "password": "patient123",
  "first_name": "Duplicate",
  "last_name": "Patient"
}
```
**Réponse attendue :** Status 409 (Email déjà utilisé)

## 📋 Checklist de Tests

### ✅ Tests d'Authentification
- [ ] Connexion avec tous les rôles
- [ ] Récupération des profils
- [ ] Tokens valides générés

### ✅ Tests de Permissions
- [ ] Super Admin : Accès total
- [ ] Admin Hôpital : Accès limité à son hôpital
- [ ] Admin Labo : Accès limité à son laboratoire
- [ ] Patient : Accès limité à ses données
- [ ] Médecin : Accès limité à son hôpital

### ✅ Tests de Sécurité
- [ ] Accès sans token refusé
- [ ] Token invalide refusé
- [ ] Rôles insuffisants refusés
- [ ] Injection SQL bloquée
- [ ] XSS échappé

### ✅ Tests Fonctionnels
- [ ] CRUD patients complet
- [ ] Upload documents sécurisé
- [ ] Visualisation documents
- [ ] Explications IA (patients uniquement)
- [ ] Messagerie basique

### ✅ Tests Edge Cases
- [ ] Ressources inexistantes
- [ ] Paramètres invalides
- [ ] Données dupliquées
- [ ] Limites de pagination

## 🚀 Ordre d'Exécution Recommandé

1. **Phase 1** : Authentification (obligatoire pour récupérer les tokens)
2. **Phase 2** : Profils (vérifier les données utilisateur)
3. **Phase 3** : Établissements (données de base)
4. **Phase 4** : Gestion patients (fonctionnalités admin)
5. **Phase 5** : Documents (consultation)
6. **Phase 6** : Upload (création de contenu)
7. **Phase 7** : Messagerie (communication)
8. **Phase 8** : Sécurité (tests négatifs)
9. **Phase 9** : Performance (charge)
10. **Phase 10** : Edge cases (robustesse)

## 💡 Conseils pour Postman

### Variables Automatiques
Utilise les **Test Scripts** pour capturer automatiquement :
- Les tokens d'authentification
- Les IDs de patients/documents créés
- Les données de réponse pour les tests suivants

### Collections Organisées
Crée des **dossiers** dans Postman :
- 🔑 Authentication
- 👥 Patient Management
- 📄 Document Management
- 💬 Messaging
- 🚫 Security Tests

### Tests Automatisés
Ajoute des **assertions** dans chaque requête :
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});
```

Avec cette collection complète, tu peux tester tous les aspects de ton API ! 🚀