# 🛠️ MIGRATION MANUELLE VERS ARCHITECTURE MVP

## 📋 Étapes à Suivre (Dans l'ordre)

### 1. 📁 Préparation
```bash
# Se placer dans le dossier backend
cd backend

# Sauvegarder l'ancien schéma
copy prisma\schema.prisma prisma\schema_backup.prisma
```

### 2. 🔄 Remplacer le Schéma Prisma
```bash
# Remplacer le schéma principal par le schéma MVP
copy prisma\schema_mvp.prisma prisma\schema.prisma
```

### 3. 🗄️ Réinitialiser la Base de Données
```bash
# Générer le nouveau client Prisma
npx prisma generate

# Réinitialiser la base de données avec le nouveau schéma
npx prisma db push --force-reset
```

### 4. 📊 Créer les Données de Test
Copier-coller ce script SQL dans votre interface MySQL (phpMyAdmin, MySQL Workbench, etc.) :

```sql
-- ============================================================================
-- DONNÉES DE TEST POUR ARCHITECTURE MVP
-- ============================================================================

-- 1. Créer un super admin
INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at) VALUES
('admin@labresult.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', 'super_admin', 1, NOW());

-- 2. Créer des établissements
INSERT INTO hospitals (name, address, city, phone, email, latitude, longitude, is_active, created_at) VALUES
('Hôpital Central', '123 Rue de la Santé', 'Paris', '01.23.45.67.89', 'contact@hopital-central.fr', 48.8566, 2.3522, 1, NOW()),
('Clinique Saint-Martin', '456 Avenue des Soins', 'Lyon', '04.12.34.56.78', 'contact@clinique-martin.fr', 45.7640, 4.8357, 1, NOW());

INSERT INTO laboratories (name, address, city, phone, email, latitude, longitude, is_active, created_at) VALUES
('Laboratoire BioTest', '789 Boulevard des Analyses', 'Marseille', '04.91.23.45.67', 'contact@biotest.fr', 43.2965, 5.3698, 1, NOW()),
('Lab Santé Plus', '321 Rue des Examens', 'Toulouse', '05.61.12.34.56', 'contact@sante-plus.fr', 43.6047, 1.4442, 1, NOW());

-- 3. Créer des utilisateurs liés aux établissements
-- Admin hôpital 1
INSERT INTO users (email, password_hash, first_name, last_name, role, hospital_id, is_active, created_at) VALUES
('admin@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', 'hospital_admin', 1, 1, NOW());

-- Médecin hôpital 1
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, hospital_id, is_active, created_at) VALUES
('dr.martin@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Martin', '06.12.34.56.78', 'hospital_staff', 1, 1, NOW());

-- Infirmière hôpital 1
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, hospital_id, is_active, created_at) VALUES
('infirmiere@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie', 'Leroy', '06.98.76.54.32', 'hospital_staff', 1, 1, NOW());

-- Admin laboratoire 1
INSERT INTO users (email, password_hash, first_name, last_name, role, laboratory_id, is_active, created_at) VALUES
('admin@biotest.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Dubois', 'lab_admin', 1, 1, NOW());

-- Technicien laboratoire 1
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, laboratory_id, is_active, created_at) VALUES
('tech@biotest.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Paul', 'Moreau', '06.11.22.33.44', 'lab_staff', 1, 1, NOW());

-- 4. Créer des patients
INSERT INTO users (email, password_hash, first_name, last_name, phone, role, is_active, created_at) VALUES
('patient1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Rousseau', '06.55.66.77.88', 'patient', 1, NOW()),
('patient2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thomas', 'Bernard', '06.99.88.77.66', 'patient', 1, NOW()),
('patient3@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire', 'Petit', '06.44.33.22.11', 'patient', 1, NOW());

-- 5. Créer les profils patients
INSERT INTO patients (user_id, date_of_birth, gender, phone) VALUES
((SELECT id FROM users WHERE email = 'patient1@example.com'), '1985-03-15', 'F', '06.55.66.77.88'),
((SELECT id FROM users WHERE email = 'patient2@example.com'), '1990-07-22', 'M', '06.99.88.77.66'),
((SELECT id FROM users WHERE email = 'patient3@example.com'), '1978-11-08', 'F', '06.44.33.22.11');

-- 6. Créer des conversations de test
INSERT INTO conversations (title, created_by, created_at) VALUES
('Consultation Dr. Martin - Emma Rousseau', (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), NOW()),
('Résultats analyses - Thomas Bernard', (SELECT id FROM users WHERE email = 'tech@biotest.fr'), NOW());

-- 7. Ajouter les participants aux conversations
INSERT INTO conversation_participants (conversation_id, user_id, joined_at) VALUES
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), NOW()),
(1, (SELECT id FROM users WHERE email = 'patient1@example.com'), NOW()),
(2, (SELECT id FROM users WHERE email = 'tech@biotest.fr'), NOW()),
(2, (SELECT id FROM users WHERE email = 'patient2@example.com'), NOW());

-- 8. Ajouter des messages de test
INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), 'Bonjour Emma, comment vous sentez-vous aujourd''hui ?', NOW()),
(1, (SELECT id FROM users WHERE email = 'patient1@example.com'), 'Bonjour Docteur, je me sens mieux, merci !', NOW()),
(2, (SELECT id FROM users WHERE email = 'tech@biotest.fr'), 'Bonjour Thomas, vos résultats d''analyses sont disponibles.', NOW()),
(2, (SELECT id FROM users WHERE email = 'patient2@example.com'), 'Merci ! Tout va bien ?', NOW());

-- 9. Créer des documents de test
INSERT INTO documents (patient_id, uploaded_by, hospital_id, filename, file_path, file_size, document_type, created_at) VALUES
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), 1, 'consultation_emma_15032024.pdf', '/uploads/docs/consultation_emma_15032024.pdf', 245760, 'medical_report', NOW()),
(2, (SELECT id FROM users WHERE email = 'tech@biotest.fr'), NULL, 'analyse_sang_thomas_16032024.pdf', '/uploads/docs/analyse_sang_thomas_16032024.pdf', 189440, 'lab_result', NOW());
```

### 5. ✅ Vérification
```bash
# Vérifier que tout fonctionne
npx prisma studio
```

## 🔑 Comptes de Test Créés

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| **Super Admin** | admin@labresult.com | password | Admin système |
| **Admin Hôpital** | admin@hopital-central.fr | password | Admin Hôpital Central |
| **Médecin** | dr.martin@hopital-central.fr | password | Dr. Pierre Martin |
| **Infirmière** | infirmiere@hopital-central.fr | password | Sophie Leroy |
| **Admin Labo** | admin@biotest.fr | password | Admin BioTest |
| **Technicien** | tech@biotest.fr | password | Paul Moreau |
| **Patient 1** | patient1@example.com | password | Emma Rousseau |
| **Patient 2** | patient2@example.com | password | Thomas Bernard |
| **Patient 3** | patient3@example.com | password | Claire Petit |

## 📊 Données Créées

- ✅ **2 Hôpitaux** avec géolocalisation
- ✅ **2 Laboratoires** avec géolocalisation  
- ✅ **9 Utilisateurs** avec rôles différents
- ✅ **3 Patients** avec profils complets
- ✅ **2 Conversations** de test
- ✅ **4 Messages** d'exemple
- ✅ **2 Documents** médicaux

## 🚨 En Cas de Problème

### Rollback (Retour en arrière)
```bash
# Restaurer l'ancien schéma
copy prisma\schema_backup.prisma prisma\schema.prisma

# Régénérer le client
npx prisma generate

# Remettre l'ancienne structure
npx prisma db push
```

### Vérifier la Base de Données
```bash
# Ouvrir Prisma Studio pour voir les données
npx prisma studio

# Ou vérifier via MySQL
mysql -u root -p
USE labresult_db;
SHOW TABLES;
SELECT COUNT(*) FROM users;
```

## 🎯 Prochaines Étapes

Une fois la migration terminée :

1. **Tester l'authentification** avec les comptes créés
2. **Vérifier les relations** entre tables
3. **Adapter les controllers** si nécessaire
4. **Tester les fonctionnalités** existantes
5. **Développer les nouvelles fonctionnalités** MVP

---

**🎉 Migration MVP Prête !**  
**Architecture simplifiée et données de test disponibles**