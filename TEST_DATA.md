# 🧪 Données de Test - Application Santé MVP

## 📋 Vue d'ensemble

Ce document décrit les données de test créées pour l'application de santé MVP. Ces données permettent de tester toutes les fonctionnalités de l'application avec des comptes réalistes.

## 🚀 Installation des données de test

```bash
# Installer les données de test
npm run db:seed

# Vérifier les données installées
npm run verify:data

# Tester l'API avec les données
npm run test:api

# Nettoyer les données (si besoin)
npm run clear:data
```

## 👥 Comptes de test créés

### 👑 Super Administrateur
- **Email**: `admin@sante-app.fr`
- **Mot de passe**: `admin123`
- **Rôle**: `super_admin`
- **Permissions**: Accès total à toutes les fonctionnalités

### 🏥 Administrateurs d'Hôpitaux

#### CHU de Paris
- **Email**: `admin.chu-paris@sante-app.fr`
- **Mot de passe**: `hospital123`
- **Rôle**: `hospital_admin`
- **Établissement**: CHU de Paris

#### Hôpital Saint-Louis
- **Email**: `admin.saint-louis@sante-app.fr`
- **Mot de passe**: `hospital123`
- **Rôle**: `hospital_admin`
- **Établissement**: Hôpital Saint-Louis

### 🧪 Administrateurs de Laboratoires

#### Laboratoire Cerba
- **Email**: `admin.cerba@sante-app.fr`
- **Mot de passe**: `lab123`
- **Rôle**: `lab_admin`
- **Établissement**: Laboratoire Cerba

#### Laboratoire Biogroup
- **Email**: `admin.biogroup@sante-app.fr`
- **Mot de passe**: `lab123`
- **Rôle**: `lab_admin`
- **Établissement**: Laboratoire Biogroup

### 👩‍⚕️ Personnel Médical

#### Médecins CHU Paris
- **Email**: `dr.bernard@chu-paris.fr`
- **Mot de passe**: `staff123`
- **Rôle**: `hospital_staff`
- **Nom**: Dr. Jean Bernard

- **Email**: `dr.moreau@chu-paris.fr`
- **Mot de passe**: `staff123`
- **Rôle**: `hospital_staff`
- **Nom**: Dr. Claire Moreau

#### Technicien Laboratoire
- **Email**: `tech.dupont@cerba.fr`
- **Mot de passe**: `staff123`
- **Rôle**: `lab_staff`
- **Nom**: Michel Dupont

### 👥 Patients

#### Patient 1
- **Email**: `jean.dupont@email.fr`
- **Mot de passe**: `patient123`
- **Nom**: Jean Dupont
- **Établissement**: CHU de Paris
- **Âge**: 39 ans (né en 1985)

#### Patient 2
- **Email**: `marie.martin@email.fr`
- **Mot de passe**: `patient123`
- **Nom**: Marie Martin
- **Établissement**: Laboratoire Cerba
- **Âge**: 32 ans (née en 1992)

#### Patient 3
- **Email**: `pierre.bernard@email.fr`
- **Mot de passe**: `patient123`
- **Nom**: Pierre Bernard
- **Établissement**: Hôpital Saint-Louis
- **Âge**: 46 ans (né en 1978)

#### Patient 4
- **Email**: `sophie.leroy@email.fr`
- **Mot de passe**: `patient123`
- **Nom**: Sophie Leroy
- **Établissement**: Laboratoire Biogroup
- **Âge**: 34 ans (née en 1990)

#### Patient 5
- **Email**: `lucas.moreau@email.fr`
- **Mot de passe**: `patient123`
- **Nom**: Lucas Moreau
- **Établissement**: CHU de Paris
- **Âge**: 29 ans (né en 1995)

## 🏢 Établissements créés

### 🏥 Hôpitaux

1. **CHU de Paris**
   - Adresse: 47-83 Boulevard de l'Hôpital, Paris
   - Téléphone: 01 42 16 00 00
   - Email: contact@chu-paris.fr

2. **Hôpital Saint-Louis**
   - Adresse: 1 Avenue Claude Vellefaux, Paris
   - Téléphone: 01 42 49 49 49
   - Email: contact@hopital-saintlouis.fr

3. **CHU de Lyon**
   - Adresse: 103 Grande Rue de la Croix-Rousse, Lyon
   - Téléphone: 04 72 07 17 17
   - Email: contact@chu-lyon.fr

### 🧪 Laboratoires

1. **Laboratoire Cerba**
   - Adresse: 95066 Cergy Pontoise Cedex, Cergy
   - Téléphone: 01 34 40 15 15
   - Email: contact@cerba.fr

2. **Laboratoire Biogroup**
   - Adresse: 12 Rue de la Paix, Paris
   - Téléphone: 01 45 67 89 12
   - Email: contact@biogroup.fr

3. **Laboratoire Synlab**
   - Adresse: 25 Avenue de la République, Lyon
   - Téléphone: 04 78 95 12 34
   - Email: contact@synlab-lyon.fr

## 📄 Documents de test

- **8 documents** créés au total
- **5 résultats de laboratoire** (lab_result)
- **3 rapports médicaux** (medical_report)
- Chaque patient a au moins un document
- Documents associés aux établissements appropriés

## 💬 Conversations de test

### Conversation 1: Patient - Médecin
- **Participants**: Jean Dupont + Dr. Bernard
- **Sujet**: Consultation et résultats d'analyses
- **Messages**: 2 messages d'exemple

### Conversation 2: Patient - Laboratoire
- **Participants**: Marie Martin + Michel Dupont (technicien)
- **Sujet**: Disponibilité des résultats
- **Messages**: 1 message d'exemple

## 🧪 Tests disponibles

### Test de l'API
```bash
npm run test:api
```
Ce script teste :
- ✅ Santé de l'API
- ✅ Authentification (tous les rôles)
- ✅ Récupération des profils
- ✅ Statistiques générales
- ✅ Gestion des patients
- ✅ Liste des établissements

### Vérification des données
```bash
npm run verify:data
```
Affiche un résumé complet des données créées.

## 🔧 Gestion des données

### Recréer les données
```bash
npm run clear:data  # Nettoyer
npm run db:seed     # Recréer
```

### Réinitialiser complètement
```bash
npm run clear:data
npm run db:push     # Recréer les tables
npm run db:seed     # Ajouter les données
```

## 📊 Statistiques des données

- **13 utilisateurs** au total
  - 1 super admin
  - 4 admins (2 hôpitaux + 2 labos)
  - 3 personnel médical
  - 5 patients

- **6 établissements**
  - 3 hôpitaux
  - 3 laboratoires

- **8 documents médicaux**
- **2 conversations** avec 3 messages
- **Logs d'accès** pour traçabilité

## 🚀 Utilisation pour le développement

Ces données permettent de tester :

1. **Authentification multi-rôles**
2. **Gestion des permissions par établissement**
3. **Upload et consultation de documents**
4. **Messagerie entre utilisateurs**
5. **Tableaux de bord administratifs**
6. **API REST complète**

## 🔒 Sécurité

- Tous les mots de passe sont hachés avec bcrypt
- Tokens JWT pour l'authentification
- Permissions strictes par rôle et établissement
- Logs d'accès aux documents sensibles

---

**Note**: Ces données sont uniquement pour le développement et les tests. Ne jamais utiliser en production !