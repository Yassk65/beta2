# 🏥 Flux des Endpoints Patients - Explication Détaillée

## 🎯 Vue d'ensemble des Endpoints Patients

Le système gère deux types principaux d'endpoints pour les patients :

1. **Endpoints Administratifs** (`/api/admin/patients/*`) - Pour la gestion par les admins
2. **Endpoints Documents** (`/api/documents/*`) - Pour la consultation par les patients

## 📊 Matrice des Permissions

| Rôle | Créer Patient | Voir Patients | Modifier Patient | Supprimer Patient | Voir Documents | Upload Documents |
|------|---------------|---------------|------------------|-------------------|----------------|------------------|
| **Patient** | ❌ | ❌ (soi uniquement) | ❌ | ❌ | ✅ (siens uniquement) | ✅ (pour soi) |
| **Hospital Staff** | ❌ | ✅ (hôpital) | ❌ | ❌ | ✅ (hôpital) | ✅ (hôpital) |
| **Hospital Admin** | ✅ (hôpital) | ✅ (hôpital) | ✅ (hôpital) | ✅ (hôpital) | ✅ (hôpital) | ✅ (hôpital) |
| **Lab Staff** | ❌ | ❌ | ❌ | ❌ | ✅ (labo) | ✅ (tous patients) |
| **Lab Admin** | ✅ (labo) | ✅ (labo) | ✅ (labo) | ✅ (labo) | ✅ (labo) | ✅ (tous patients) |
| **Super Admin** | ✅ (tous) | ✅ (tous) | ✅ (tous) | ✅ (tous) | ✅ (tous) | ✅ (tous) |

## 🔄 Flux Détaillés par Endpoint

### 1. 👥 **Création de Patient** - `POST /api/admin/patients`

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Admin fait    │───▶│  Vérification    │───▶│   Création      │
│   la demande    │    │  des permissions │    │   du patient    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Hospital Admin:  │    │ 1. User table   │
                       │ ✅ Son hôpital   │    │ 2. Patient table│
                       │ Lab Admin:       │    │ 3. Assignation  │
                       │ ✅ Son labo      │    │    établissement│
                       │ Super Admin:     │    └─────────────────┘
                       │ ✅ Partout       │
                       └──────────────────┘
```

**Code Logic :**
```javascript
// Déterminer l'établissement d'assignation
if (adminRole === 'super_admin') {
  // Peut assigner à n'importe quel établissement
  hospitalId = assign_to_hospital || null;
  laboratoryId = assign_to_laboratory || null;
} else if (adminRole === 'hospital_admin') {
  // Assigne automatiquement à son hôpital
  hospitalId = adminHospitalId;
} else if (adminRole === 'lab_admin') {
  // Assigne automatiquement à son laboratoire
  laboratoryId = adminLabId;
}
```

### 2. 📋 **Liste des Patients** - `GET /api/admin/patients`

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Demande de    │───▶│    Filtrage      │───▶│   Pagination    │
│   liste avec    │    │   par rôle       │    │   et réponse    │
│   filtres       │    │                  │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ WHERE clauses:   │    │ Retour avec:    │
                       │ hospital_id = X  │    │ • Patients      │
                       │ laboratory_id = Y│    │ • Pagination    │
                       │ + filtres user   │    │ • Métadonnées   │
                       └──────────────────┘    └─────────────────┘
```

**Filtres appliqués automatiquement :**
```javascript
let whereClause = { role: 'patient' };

if (adminRole === 'hospital_admin') {
  whereClause.hospital_id = adminHospitalId;
} else if (adminRole === 'lab_admin') {
  whereClause.laboratory_id = adminLabId;
}
// Super admin voit tous les patients
```

### 3. 👤 **Détails d'un Patient** - `GET /api/admin/patients/:id`

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Demande       │───▶│   Vérification   │───▶│   Récupération  │
│   patient ID    │    │   d'accès        │    │   complète      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Vérifier que:    │    │ Inclure:        │
                       │ • Patient existe │    │ • Profil patient│
                       │ • Appartient à   │    │ • Établissement │
                       │   l'établissement│    │ • 5 derniers    │
                       │   de l'admin     │    │   documents     │
                       └──────────────────┘    │ • Statistiques  │
                                               └─────────────────┘
```

### 4. 📄 **Documents d'un Patient** - `GET /api/documents/patient/:id`

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Utilisateur   │───▶│   Vérification   │───▶│   Filtrage      │
│   demande docs  │    │   des droits     │    │   des documents │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │ Patient:         │    │ WHERE clauses:  │
                       │ ✅ Ses docs      │    │ patient_id = X  │
                       │ Hospital Staff:  │    │ + hospital_id   │
                       │ ✅ Docs hôpital  │    │ + laboratory_id │
                       │ Lab Staff:       │    │ + filtres user  │
                       │ ✅ Docs labo     │    └─────────────────┘
                       └──────────────────┘
```

**Logique de filtrage complexe :**
```javascript
let whereClause = { patient_id: patientId };

if (role === 'patient') {
  // Vérifier que c'est bien SES documents
  if (patient.user_id !== userId) return 403;
} else if (role === 'hospital_staff') {
  // Seulement les documents de son hôpital
  whereClause.hospital_id = hospital_id;
} else if (role === 'lab_staff') {
  // Seulement les documents de son laboratoire
  whereClause.laboratory_id = laboratory_id;
}
```

## 🔐 Sécurité Multi-Niveaux

### 🛡️ **Niveau 1 : Authentification**
```javascript
// Middleware obligatoire sur tous les endpoints
app.use('/api/admin/patients', authenticateToken);
app.use('/api/documents', authenticateToken);
```

### 🛡️ **Niveau 2 : Autorisation par Rôle**
```javascript
// Vérification des rôles autorisés
requireRoles(['hospital_admin', 'lab_admin', 'super_admin'])
```

### 🛡️ **Niveau 3 : Permissions par Établissement**
```javascript
// Vérification que l'admin peut accéder à ce patient/document
if (adminRole === 'hospital_admin' && patient.hospital_id !== adminHospitalId) {
  return res.status(403).json({ message: 'Accès non autorisé' });
}
```

### 🛡️ **Niveau 4 : Validation des Données**
```javascript
// Express-validator sur tous les inputs
body('email').isEmail().normalizeEmail(),
param('id').isInt({ min: 1 }),
query('page').optional().isInt({ min: 1 })
```

## 📊 Cas d'Usage Réels

### 🏥 **Scénario 1 : Admin Hôpital CHU Paris**

```
Marie Dubois (admin.chu-paris@sante-app.fr)
├── Peut voir : Patients du CHU Paris uniquement
├── Peut créer : Nouveaux patients → assignés automatiquement au CHU Paris
├── Peut modifier : Patients existants du CHU Paris
├── Documents : Seulement ceux uploadés par/pour le CHU Paris
└── Statistiques : Limitées au CHU Paris
```

### 🧪 **Scénario 2 : Technicien Labo Cerba**

```
Michel Dupont (tech.dupont@cerba.fr)
├── Peut voir : Documents de tous les patients (pour upload résultats)
├── Ne peut pas : Gérer les patients (pas admin)
├── Peut uploader : Résultats d'analyses pour n'importe quel patient
├── Documents : Seulement ceux du Laboratoire Cerba
└── Permissions : Limitées à son laboratoire
```

### 👤 **Scénario 3 : Patient Jean Dupont**

```
Jean Dupont (jean.dupont@email.fr)
├── Peut voir : Ses documents uniquement
├── Ne peut pas : Voir d'autres patients
├── Peut uploader : Documents pour lui-même
├── Fonctionnalités spéciales : Explications IA
└── Sécurité : Visualisation seulement (pas de téléchargement direct)
```

## 🔄 Flux de Données Complet

### 📤 **Upload de Document par un Laboratoire**

```
1. Lab Staff se connecte
   ↓
2. POST /api/documents/upload
   ├── patient_id: 123
   ├── document_type: "lab_result"
   └── file: analyse.pdf
   ↓
3. Vérifications :
   ├── ✅ Utilisateur authentifié
   ├── ✅ Rôle lab_staff autorisé
   ├── ✅ Fichier valide (PDF, <25MB)
   └── ✅ Patient existe
   ↓
4. Traitement sécurisé :
   ├── Stockage temporaire avec nom chiffré
   ├── Création enregistrement DB
   ├── Déplacement vers stockage sécurisé
   └── Assignation laboratory_id automatique
   ↓
5. Réponse avec URL sécurisée
```

### 👁️ **Consultation par le Patient**

```
1. Patient se connecte
   ↓
2. GET /api/documents/patient/123
   ↓
3. Vérifications :
   ├── ✅ patient_id = user_id (ses docs uniquement)
   ├── ✅ Filtrage automatique
   └── ✅ URLs sécurisées générées
   ↓
4. Patient clique sur un document
   ↓
5. GET /api/documents/456/view
   ├── ✅ Vérification propriété
   ├── 📊 Log de l'accès
   ├── 🔒 Headers sécurisés
   └── 📄 Stream du fichier
```

## 🚀 Points Clés à Retenir

### ✅ **Sécurité Renforcée**
- **4 niveaux de vérification** sur chaque endpoint
- **Permissions granulaires** par établissement
- **Audit complet** de tous les accès
- **Stockage chiffré** des fichiers sensibles

### 🏗️ **Architecture Modulaire**
- **Séparation claire** entre gestion admin et consultation patient
- **Middleware réutilisable** pour les permissions
- **Validation centralisée** avec express-validator
- **Gestion d'erreurs uniforme**

### 🔄 **Flexibilité Multi-Établissements**
- **Support natif** hôpitaux + laboratoires
- **Assignation automatique** selon le rôle
- **Permissions héritées** de l'établissement
- **Statistiques isolées** par établissement

Cette architecture garantit une sécurité maximale tout en offrant une expérience utilisateur fluide pour chaque type d'utilisateur ! 🏥✨