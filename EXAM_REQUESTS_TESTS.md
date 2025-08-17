# 🧪 Tests Postman - Demandes d'Examens de Laboratoire

## 🎯 Vue d'ensemble

Cette nouvelle fonctionnalité permet au personnel hospitalier de demander des examens de laboratoire pour leurs patients. Voici les tests complets pour valider cette fonctionnalité.

## 🔑 Prérequis

1. **Serveur démarré** : `cd backend/src && node app.js`
2. **Base de données mise à jour** : `npm run db:push`
3. **Données de test** : `npm run db:seed`
4. **Tokens d'authentification** récupérés via les tests de login

## 🧪 Tests des Demandes d'Examens

### 1. 📊 **Statistiques des Demandes d'Examens**

#### 1.1 Statistiques (Personnel Hospitalier)
```
GET {{baseUrl}}/exam-requests/stats
Authorization: Bearer {{doctorToken}}
```
**Réponse attendue :** Statistiques filtrées par hôpital

#### 1.2 Statistiques (Personnel Laboratoire)
```
GET {{baseUrl}}/exam-requests/stats
Authorization: Bearer {{labStaffToken}}
```
**Réponse attendue :** Statistiques filtrées par laboratoire

#### 1.3 🚫 Statistiques Interdites (Patient)
```
GET {{baseUrl}}/exam-requests/stats
Authorization: Bearer {{patientToken}}
```
**Réponse attendue :** Status 403 (Forbidden)

### 2. 📋 **Liste des Demandes d'Examens**

#### 2.1 Liste Complète (Médecin)
```
GET {{baseUrl}}/exam-requests?page=1&limit=10
Authorization: Bearer {{doctorToken}}
```

#### 2.2 Liste avec Filtres
```
GET {{baseUrl}}/exam-requests?status=pending&priority=urgent&exam_type=blood_test
Authorization: Bearer {{doctorToken}}
```

#### 2.3 Recherche par Patient
```
GET {{baseUrl}}/exam-requests?patient_search=dupont
Authorization: Bearer {{doctorToken}}
```

#### 2.4 Filtrage par Dates
```
GET {{baseUrl}}/exam-requests?date_from=2025-01-01&date_to=2025-12-31
Authorization: Bearer {{doctorToken}}
```

### 3. 📝 **Création de Demandes d'Examens**

#### 3.1 Demande d'Analyses Sanguines (Médecin)
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "patient_id": 1,
  "laboratory_id": 1,
  "exam_type": "blood_test",
  "priority": "high",
  "clinical_info": "Patient présente des symptômes de fatigue chronique et pâleur. Suspicion d'anémie ferriprive. Demande bilan hématologique complet pour diagnostic différentiel.",
  "requested_tests": [
    "Hémogramme complet (NFS)",
    "Fer sérique",
    "Ferritine",
    "Transferrine",
    "Coefficient de saturation",
    "Vitamine B12",
    "Folates",
    "Réticulocytes"
  ],
  "notes": "Patient anxieux, prévoir prise de sang en douceur. Jeûne de 12h respecté.",
  "scheduled_at": "2025-08-15T09:00:00Z"
}
```

#### 3.2 Demande d'Analyses d'Urine (Médecin)
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "patient_id": 2,
  "laboratory_id": 2,
  "exam_type": "urine_test",
  "priority": "normal",
  "clinical_info": "Contrôle de routine dans le cadre du suivi de grossesse au 2ème trimestre. Recherche d'infection urinaire asymptomatique et surveillance de la protéinurie.",
  "requested_tests": [
    "ECBU (Examen cytobactériologique des urines)",
    "Protéinurie des 24h",
    "Glycosurie",
    "Cétonurie",
    "Microalbuminurie"
  ],
  "notes": "Patiente enceinte de 24 semaines. Antécédents d'infections urinaires récidivantes."
}
```

#### 3.3 Demande Urgente (Médecin)
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "patient_id": 3,
  "laboratory_id": 1,
  "exam_type": "biochemistry",
  "priority": "urgent",
  "clinical_info": "Patient admis aux urgences pour douleurs thoraciques. Suspicion d'infarctus du myocarde. Demande dosage des marqueurs cardiaques en urgence.",
  "requested_tests": [
    "Troponine I",
    "CK-MB",
    "Myoglobine",
    "LDH",
    "ASAT",
    "ALAT"
  ],
  "notes": "URGENCE VITALE - Résultats demandés dans l'heure"
}
```

#### 3.4 🚫 Création Interdite (Patient)
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{patientToken}}
Content-Type: application/json

{
  "patient_id": 1,
  "laboratory_id": 1,
  "exam_type": "blood_test",
  "priority": "normal",
  "clinical_info": "Je voudrais des analyses",
  "requested_tests": ["Hémogramme"]
}
```
**Réponse attendue :** Status 403 (Seul le personnel hospitalier peut demander)

### 4. 👁️ **Consultation de Demandes Spécifiques**

#### 4.1 Détails d'une Demande (Médecin)
```
GET {{baseUrl}}/exam-requests/1
Authorization: Bearer {{doctorToken}}
```

#### 4.2 Détails d'une Demande (Personnel Labo)
```
GET {{baseUrl}}/exam-requests/1
Authorization: Bearer {{labStaffToken}}
```

#### 4.3 🚫 Accès Interdit (Autre Hôpital)
```
GET {{baseUrl}}/exam-requests/999
Authorization: Bearer {{doctorToken}}
```
**Réponse attendue :** Status 403 ou 404

### 5. ✏️ **Mise à Jour des Statuts (Personnel Labo)**

#### 5.1 Accepter une Demande
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Demande acceptée. Programmation prévue pour demain matin 8h.",
  "scheduled_at": "2025-08-13T08:00:00Z"
}
```

#### 5.2 Programmer un Examen
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "scheduled",
  "notes": "Examen programmé. Patient contacté et confirmé.",
  "scheduled_at": "2025-08-13T08:00:00Z"
}
```

#### 5.3 Marquer en Cours
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Prélèvements effectués. Analyses en cours au laboratoire."
}
```

#### 5.4 Marquer Terminé
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "completed",
  "notes": "Analyses terminées. Résultats en cours de validation.",
  "completed_at": "2025-08-13T14:30:00Z"
}
```

#### 5.5 Résultats Prêts
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "results_ready",
  "notes": "Résultats validés et disponibles. Rapport envoyé au médecin demandeur.",
  "results_ready_at": "2025-08-13T16:00:00Z"
}
```

#### 5.6 Rejeter une Demande
```
PUT {{baseUrl}}/exam-requests/2/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "rejected",
  "notes": "Demande rejetée : informations cliniques insuffisantes. Merci de préciser les symptômes et l'indication médicale."
}
```

#### 5.7 🚫 Mise à Jour Interdite (Médecin)
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "status": "accepted",
  "notes": "Tentative de modification par médecin"
}
```
**Réponse attendue :** Status 403 (Seul le personnel labo peut modifier)

### 6. 📋 **Routes Spécialisées**

#### 6.1 Demandes pour un Patient Spécifique
```
GET {{baseUrl}}/exam-requests/patient/1
Authorization: Bearer {{doctorToken}}
```

#### 6.2 Demandes Urgentes
```
GET {{baseUrl}}/exam-requests/urgent
Authorization: Bearer {{labStaffToken}}
```

#### 6.3 Historique des Changements
```
GET {{baseUrl}}/exam-requests/1/history
Authorization: Bearer {{doctorToken}}
```

### 7. 🔍 **Tests de Validation**

#### 7.1 Données Manquantes
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "patient_id": 1,
  "laboratory_id": 1
  // Manque exam_type, clinical_info, requested_tests
}
```
**Réponse attendue :** Status 400 (Données manquantes)

#### 7.2 Type d'Examen Invalide
```
POST {{baseUrl}}/exam-requests
Authorization: Bearer {{doctorToken}}
Content-Type: application/json

{
  "patient_id": 1,
  "laboratory_id": 1,
  "exam_type": "invalid_type",
  "clinical_info": "Test",
  "requested_tests": ["Test"]
}
```
**Réponse attendue :** Status 400 (Type d'examen invalide)

#### 7.3 Transition de Statut Invalide
```
PUT {{baseUrl}}/exam-requests/1/status
Authorization: Bearer {{labStaffToken}}
Content-Type: application/json

{
  "status": "results_ready"
  // Transition directe de 'pending' à 'results_ready' invalide
}
```
**Réponse attendue :** Status 400 (Transition invalide)

## 📊 Scénarios de Test Complets

### 🎯 **Scénario 1 : Workflow Complet d'une Demande**

1. **Médecin crée une demande** → Status 201
2. **Labo consulte les demandes** → Voit la nouvelle demande
3. **Labo accepte la demande** → Status 200, statut = 'accepted'
4. **Labo programme l'examen** → Status 200, statut = 'scheduled'
5. **Labo marque en cours** → Status 200, statut = 'in_progress'
6. **Labo marque terminé** → Status 200, statut = 'completed'
7. **Labo marque résultats prêts** → Status 200, statut = 'results_ready'
8. **Médecin consulte l'historique** → Voit toutes les étapes

### 🎯 **Scénario 2 : Demande Urgente**

1. **Médecin crée demande urgente** → Priority = 'urgent'
2. **Labo consulte demandes urgentes** → Voit la demande en priorité
3. **Traitement accéléré** → Transitions rapides des statuts

### 🎯 **Scénario 3 : Demande Rejetée**

1. **Médecin crée demande incomplète** → Status 201
2. **Labo rejette la demande** → Status 200, statut = 'rejected'
3. **Médecin consulte et voit le rejet** → Avec notes explicatives

## 🔧 Variables Postman Nécessaires

```json
{
  "baseUrl": "http://localhost:3000/api",
  "doctorToken": "", // Token du médecin
  "labStaffToken": "", // Token du personnel labo
  "patientToken": "", // Token du patient
  "testExamRequestId": "" // ID d'une demande de test
}
```

## ✅ Checklist de Validation

### 📝 **Création de Demandes**
- [ ] Médecin peut créer une demande
- [ ] Admin hôpital peut créer une demande
- [ ] Patient ne peut pas créer de demande
- [ ] Validation des données obligatoires
- [ ] Types d'examens valides uniquement

### 🔄 **Gestion des Statuts**
- [ ] Personnel labo peut modifier les statuts
- [ ] Médecin ne peut pas modifier les statuts
- [ ] Transitions de statuts valides uniquement
- [ ] Historique créé à chaque changement

### 🔍 **Consultation**
- [ ] Médecin voit les demandes de son hôpital
- [ ] Personnel labo voit les demandes de son labo
- [ ] Filtrage par statut, type, priorité
- [ ] Recherche par patient fonctionnelle

### 🛡️ **Sécurité**
- [ ] Permissions respectées par rôle
- [ ] Accès limité par établissement
- [ ] Validation des données d'entrée
- [ ] Gestion des erreurs appropriée

Cette nouvelle fonctionnalité enrichit considérablement l'application en permettant une collaboration fluide entre hôpitaux et laboratoires ! 🚀