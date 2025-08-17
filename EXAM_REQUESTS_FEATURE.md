# 🧪 Nouvelle Fonctionnalité : Demandes d'Examens de Laboratoire

## 🎯 Vue d'ensemble

Cette nouvelle fonctionnalité permet au personnel hospitalier de demander des examens de laboratoire pour leurs patients, créant un workflow collaboratif entre hôpitaux et laboratoires.

## 🏗️ Architecture de la Fonctionnalité

### 📊 **Modèles de Données**

#### ExamRequest (Demande d'Examen)
```prisma
model ExamRequest {
  id              Int           @id @default(autoincrement())
  patient_id      Int           // Patient concerné
  requested_by    Int           // Médecin demandeur
  hospital_id     Int           // Hôpital demandeur
  laboratory_id   Int           // Laboratoire destinataire
  processed_by    Int?          // Personnel labo qui traite
  
  exam_type       ExamType      // Type d'examen
  priority        ExamPriority  // Priorité (urgent, high, normal, low)
  status          ExamStatus    // Statut actuel
  
  clinical_info   String        // Informations cliniques
  requested_tests String        // Tests demandés (JSON)
  notes           String?       // Notes additionnelles
  
  // Dates du workflow
  requested_at    DateTime      // Date de demande
  scheduled_at    DateTime?     // Date programmée
  completed_at    DateTime?     // Date de réalisation
  results_ready_at DateTime?    // Date des résultats
}
```

#### ExamStatusHistory (Historique des Statuts)
```prisma
model ExamStatusHistory {
  id              Int         @id @default(autoincrement())
  exam_request_id Int
  status          ExamStatus
  changed_by      Int
  notes           String?
  changed_at      DateTime    @default(now())
}
```

### 🔄 **Workflow des Statuts**

```
pending → accepted → scheduled → in_progress → completed → results_ready
   ↓         ↓           ↓            ↓
rejected  cancelled  cancelled   cancelled
```

## 🎭 **Rôles et Permissions**

### 🏥 **Personnel Hospitalier**
- **hospital_staff** / **hospital_admin**
- ✅ **Peut créer** des demandes d'examens
- ✅ **Peut consulter** les demandes de son hôpital
- ✅ **Peut voir l'historique** des demandes
- ❌ **Ne peut pas modifier** les statuts

### 🧪 **Personnel Laboratoire**
- **lab_staff** / **lab_admin**
- ✅ **Peut consulter** les demandes pour son laboratoire
- ✅ **Peut modifier** les statuts des demandes
- ✅ **Peut programmer** les examens
- ❌ **Ne peut pas créer** de demandes

### 👤 **Patients**
- ❌ **Aucun accès direct** aux demandes d'examens
- ℹ️ **Information via** leur médecin traitant

### 👑 **Super Admin**
- ✅ **Accès complet** à toutes les fonctionnalités
- ✅ **Peut créer** des demandes pour n'importe quel hôpital
- ✅ **Peut modifier** tous les statuts

## 🚀 **Endpoints Disponibles**

### 📊 **Statistiques**
```
GET /api/exam-requests/stats
```
- Nombre total de demandes
- Répartition par statut
- Répartition par type d'examen
- Répartition par priorité
- Demandes récentes (7 derniers jours)

### 📋 **Liste des Demandes**
```
GET /api/exam-requests
Query: ?page=1&limit=10&status=pending&exam_type=blood_test&priority=urgent&patient_search=dupont&date_from=2025-01-01&date_to=2025-12-31
```

### 📝 **Création de Demande**
```
POST /api/exam-requests
Body: {
  patient_id: number,
  laboratory_id: number,
  exam_type: ExamType,
  priority?: ExamPriority,
  clinical_info: string,
  requested_tests: string[],
  notes?: string,
  scheduled_at?: DateTime
}
```

### 👁️ **Détails d'une Demande**
```
GET /api/exam-requests/:id
```

### ✏️ **Mise à Jour du Statut**
```
PUT /api/exam-requests/:id/status
Body: {
  status: ExamStatus,
  notes?: string,
  scheduled_at?: DateTime,
  completed_at?: DateTime,
  results_ready_at?: DateTime
}
```

### 📋 **Routes Spécialisées**
```
GET /api/exam-requests/patient/:patientId  // Demandes pour un patient
GET /api/exam-requests/urgent              // Demandes urgentes
GET /api/exam-requests/:id/history         // Historique des changements
```

## 🧪 **Types d'Examens Supportés**

```typescript
enum ExamType {
  blood_test      // Analyses sanguines
  urine_test      // Analyses d'urine
  imaging         // Imagerie médicale
  biopsy          // Biopsies
  culture         // Cultures bactériennes
  serology        // Sérologie
  biochemistry    // Biochimie
  hematology      // Hématologie
  immunology      // Immunologie
  microbiology    // Microbiologie
  other           // Autres examens
}
```

## ⚡ **Niveaux de Priorité**

```typescript
enum ExamPriority {
  urgent    // Urgence vitale (< 1h)
  high      // Priorité élevée (< 4h)
  normal    // Priorité normale (< 24h)
  low       // Priorité basse (< 48h)
}
```

## 🔄 **Cas d'Usage Typiques**

### 🩸 **Cas 1 : Analyses Sanguines d'Urgence**

1. **Médecin** : Patient aux urgences, suspicion d'infarctus
2. **Création** : Demande urgente d'analyses cardiaques
3. **Laboratoire** : Accepte et programme immédiatement
4. **Réalisation** : Prélèvement et analyses en urgence
5. **Résultats** : Disponibles en moins d'1 heure

### 🤰 **Cas 2 : Suivi de Grossesse**

1. **Médecin** : Contrôle de routine au 2ème trimestre
2. **Création** : Demande normale d'analyses d'urine
3. **Laboratoire** : Accepte et programme dans 2 jours
4. **Réalisation** : Analyses de routine
5. **Résultats** : Disponibles le lendemain

### 🏥 **Cas 3 : Bilan Pré-Opératoire**

1. **Médecin** : Intervention chirurgicale programmée
2. **Création** : Demande prioritaire de bilan complet
3. **Laboratoire** : Accepte et programme rapidement
4. **Réalisation** : Bilan biochimique complet
5. **Résultats** : Validés avant l'intervention

## 📊 **Données de Test Créées**

Le script de seed crée automatiquement :

### 🧪 **3 Demandes d'Examens**

1. **Demande Urgente** (Jean Dupont)
   - Type : Analyses sanguines
   - Priorité : Urgent
   - Statut : Pending
   - Tests : Hémogramme, Fer, Ferritine, B12, Folates

2. **Demande Acceptée** (Marie Martin)
   - Type : Analyses d'urine
   - Priorité : Normal
   - Statut : Accepted
   - Tests : ECBU, Protéinurie, Glycosurie

3. **Demande Terminée** (Pierre Bernard)
   - Type : Biochimie
   - Priorité : High
   - Statut : Completed
   - Tests : Glycémie, HbA1c, Créatinine, Bilan lipidique

### 📋 **Historique des Statuts**
- Chaque demande a son historique complet
- Traçabilité de tous les changements
- Notes explicatives à chaque étape

## 🔧 **Installation et Configuration**

### 1. **Mise à Jour de la Base de Données**
```bash
# Appliquer les nouveaux modèles
npm run db:push

# Ou créer une migration
npx prisma migrate dev --name add-exam-requests
```

### 2. **Régénérer le Client Prisma**
```bash
npm run db:generate
```

### 3. **Ajouter les Données de Test**
```bash
npm run db:seed
```

### 4. **Tester l'API**
```bash
# Démarrer le serveur
cd src && node app.js

# Tester avec Postman ou curl
curl -X GET http://localhost:3000/api/exam-requests/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🧪 **Tests Automatisés**

### **Script de Test Rapide**
```bash
# Créer un script de test
node -e "
const axios = require('axios');
const baseUrl = 'http://localhost:3000/api';

async function testExamRequests() {
  try {
    // Test de santé
    const health = await axios.get(baseUrl + '/health');
    console.log('✅ API Health:', health.data.message);
    
    // Test des statistiques (nécessite un token)
    // const stats = await axios.get(baseUrl + '/exam-requests/stats', {
    //   headers: { Authorization: 'Bearer YOUR_TOKEN' }
    // });
    // console.log('✅ Exam Stats:', stats.data);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testExamRequests();
"
```

## 📈 **Métriques et Monitoring**

### **Statistiques Disponibles**
- Nombre total de demandes
- Demandes par statut (pending, accepted, completed, etc.)
- Demandes par type d'examen
- Demandes par priorité
- Demandes récentes (7 derniers jours)
- Temps moyen de traitement

### **Indicateurs de Performance**
- Temps de réponse des laboratoires
- Taux d'acceptation des demandes
- Délai moyen entre demande et résultats
- Répartition des priorités

## 🚀 **Évolutions Futures**

### **Phase 2 - Notifications**
- Notifications en temps réel
- Alertes par email/SMS
- Intégration avec systèmes externes

### **Phase 3 - Intégration Documents**
- Liaison automatique avec les résultats
- Upload des rapports d'analyses
- Signature électronique

### **Phase 4 - Analytics Avancées**
- Tableaux de bord interactifs
- Prédictions de charge
- Optimisation des plannings

Cette nouvelle fonctionnalité transforme l'application en une véritable plateforme collaborative entre établissements de santé ! 🏥✨