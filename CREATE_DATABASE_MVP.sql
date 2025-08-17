-- ============================================================================
-- CRÉATION COMPLÈTE BASE DE DONNÉES MVP - ARCHITECTURE SANTÉ
-- 📅 Créé le : 11 Août 2025
-- 🎯 À exécuter dans phpMyAdmin pour créer une nouvelle DB
-- ============================================================================

-- 1. CRÉER LA BASE DE DONNÉES
CREATE DATABASE IF NOT EXISTS `labresult_mvp` 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `labresult_mvp`;

-- ============================================================================
-- 2. CRÉER LES TABLES
-- ============================================================================

-- Table utilisateurs unifiée
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(191) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `role` enum('patient','hospital_staff','hospital_admin','lab_staff','lab_admin','super_admin') NOT NULL DEFAULT 'patient',
  `hospital_id` int(11) DEFAULT NULL,
  `laboratory_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_seen` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_email_idx` (`email`),
  KEY `users_role_idx` (`role`),
  KEY `users_hospital_id_idx` (`hospital_id`),
  KEY `users_laboratory_id_idx` (`laboratory_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table patients
CREATE TABLE `patients` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `date_of_birth` datetime DEFAULT NULL,
  `gender` enum('M','F','Other') DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `patients_user_id_unique` (`user_id`),
  CONSTRAINT `patients_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table hôpitaux
CREATE TABLE `hospitals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `hospitals_city_idx` (`city`),
  KEY `hospitals_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table laboratoires
CREATE TABLE `laboratories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(191) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `latitude` float DEFAULT NULL,
  `longitude` float DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `laboratories_city_idx` (`city`),
  KEY `laboratories_is_active_idx` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table documents
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `patient_id` int(11) NOT NULL,
  `uploaded_by` int(11) NOT NULL,
  `hospital_id` int(11) DEFAULT NULL,
  `laboratory_id` int(11) DEFAULT NULL,
  `filename` varchar(191) NOT NULL,
  `file_path` varchar(500) NOT NULL,
  `file_size` int(11) NOT NULL,
  `document_type` enum('lab_result','prescription','medical_report','other') NOT NULL DEFAULT 'other',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `documents_patient_id_idx` (`patient_id`),
  KEY `documents_document_type_idx` (`document_type`),
  CONSTRAINT `documents_patient_id_fkey` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `documents_uploaded_by_fkey` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `documents_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `documents_laboratory_id_fkey` FOREIGN KEY (`laboratory_id`) REFERENCES `laboratories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table conversations
CREATE TABLE `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(191) DEFAULT NULL,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table participants conversations
CREATE TABLE `conversation_participants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_participants_conversation_id_user_id_unique` (`conversation_id`,`user_id`),
  CONSTRAINT `conversation_participants_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `conversation_participants_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table messages
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `messages_conversation_id_created_at_idx` (`conversation_id`,`created_at`),
  CONSTRAINT `messages_conversation_id_fkey` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `messages_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter les contraintes de clés étrangères pour users
ALTER TABLE `users` 
ADD CONSTRAINT `users_hospital_id_fkey` FOREIGN KEY (`hospital_id`) REFERENCES `hospitals` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
ADD CONSTRAINT `users_laboratory_id_fkey` FOREIGN KEY (`laboratory_id`) REFERENCES `laboratories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- 3. INSÉRER LES DONNÉES DE TEST
-- ============================================================================

-- Insérer les établissements d'abord
INSERT INTO `hospitals` (`name`, `address`, `city`, `phone`, `email`, `latitude`, `longitude`, `is_active`, `created_at`) VALUES
('Hôpital Central', '123 Rue de la Santé', 'Paris', '01.23.45.67.89', 'contact@hopital-central.fr', 48.8566, 2.3522, 1, NOW()),
('Clinique Saint-Martin', '456 Avenue des Soins', 'Lyon', '04.12.34.56.78', 'contact@clinique-martin.fr', 45.7640, 4.8357, 1, NOW()),
('Centre Hospitalier Nord', '789 Boulevard Médical', 'Lille', '03.20.12.34.56', 'contact@ch-nord.fr', 50.6292, 3.0573, 1, NOW());

INSERT INTO `laboratories` (`name`, `address`, `city`, `phone`, `email`, `latitude`, `longitude`, `is_active`, `created_at`) VALUES
('Laboratoire BioTest', '789 Boulevard des Analyses', 'Marseille', '04.91.23.45.67', 'contact@biotest.fr', 43.2965, 5.3698, 1, NOW()),
('Lab Santé Plus', '321 Rue des Examens', 'Toulouse', '05.61.12.34.56', 'contact@sante-plus.fr', 43.6047, 1.4442, 1, NOW()),
('Laboratoire Médical Sud', '654 Avenue des Sciences', 'Nice', '04.93.12.34.56', 'contact@lab-sud.fr', 43.7102, 7.2620, 1, NOW());

-- Insérer les utilisateurs
-- Super Admin
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `is_active`, `created_at`) VALUES
('admin@labresult.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Super', 'Admin', 'super_admin', 1, NOW());

-- Utilisateurs Hôpital Central (ID=1)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `hospital_id`, `is_active`, `created_at`) VALUES
('admin@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Jean', 'Dupont', 'hospital_admin', 1, 1, NOW()),
('dr.martin@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Pierre', 'Martin', 'hospital_staff', 1, 1, NOW()),
('dr.durand@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Durand', 'hospital_staff', 1, 1, NOW()),
('infirmiere@hopital-central.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Sophie', 'Leroy', 'hospital_staff', 1, 1, NOW());

-- Utilisateurs Clinique Saint-Martin (ID=2)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `hospital_id`, `is_active`, `created_at`) VALUES
('admin@clinique-martin.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Paul', 'Moreau', 'hospital_admin', 2, 1, NOW()),
('dr.bernard@clinique-martin.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thomas', 'Bernard', 'hospital_staff', 2, 1, NOW());

-- Utilisateurs Laboratoire BioTest (ID=1)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `laboratory_id`, `is_active`, `created_at`) VALUES
('admin@biotest.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Marie', 'Dubois', 'lab_admin', 1, 1, NOW()),
('tech1@biotest.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Paul', 'Petit', 'lab_staff', 1, 1, NOW()),
('tech2@biotest.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire', 'Rousseau', 'lab_staff', 1, 1, NOW());

-- Utilisateurs Lab Santé Plus (ID=2)
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `role`, `laboratory_id`, `is_active`, `created_at`) VALUES
('admin@sante-plus.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Garcia', 'lab_admin', 2, 1, NOW()),
('tech@sante-plus.fr', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Lucas', 'Roux', 'lab_staff', 2, 1, NOW());

-- Patients
INSERT INTO `users` (`email`, `password_hash`, `first_name`, `last_name`, `phone`, `role`, `is_active`, `created_at`) VALUES
('patient1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Emma', 'Rousseau', '06.55.66.77.88', 'patient', 1, NOW()),
('patient2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Thomas', 'Bernard', '06.99.88.77.66', 'patient', 1, NOW()),
('patient3@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Claire', 'Petit', '06.44.33.22.11', 'patient', 1, NOW()),
('patient4@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Antoine', 'Moreau', '06.12.34.56.78', 'patient', 1, NOW()),
('patient5@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Julie', 'Lefevre', '06.87.65.43.21', 'patient', 1, NOW());

-- Profils patients
INSERT INTO `patients` (`user_id`, `date_of_birth`, `gender`, `phone`) VALUES
((SELECT id FROM users WHERE email = 'patient1@example.com'), '1985-03-15 00:00:00', 'F', '06.55.66.77.88'),
((SELECT id FROM users WHERE email = 'patient2@example.com'), '1990-07-22 00:00:00', 'M', '06.99.88.77.66'),
((SELECT id FROM users WHERE email = 'patient3@example.com'), '1978-11-08 00:00:00', 'F', '06.44.33.22.11'),
((SELECT id FROM users WHERE email = 'patient4@example.com'), '1992-01-30 00:00:00', 'M', '06.12.34.56.78'),
((SELECT id FROM users WHERE email = 'patient5@example.com'), '1988-09-12 00:00:00', 'F', '06.87.65.43.21');

-- Conversations de test
INSERT INTO `conversations` (`title`, `created_by`, `created_at`) VALUES
('Consultation Dr. Martin - Emma Rousseau', (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), NOW()),
('Résultats analyses - Thomas Bernard', (SELECT id FROM users WHERE email = 'tech1@biotest.fr'), NOW()),
('Suivi post-opératoire - Claire Petit', (SELECT id FROM users WHERE email = 'dr.durand@hopital-central.fr'), NOW()),
('Questions analyses - Antoine Moreau', (SELECT id FROM users WHERE email = 'tech@sante-plus.fr'), NOW());

-- Participants aux conversations
INSERT INTO `conversation_participants` (`conversation_id`, `user_id`, `joined_at`) VALUES
-- Conversation 1: Dr. Martin + Emma
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), NOW()),
(1, (SELECT id FROM users WHERE email = 'patient1@example.com'), NOW()),
-- Conversation 2: Tech BioTest + Thomas
(2, (SELECT id FROM users WHERE email = 'tech1@biotest.fr'), NOW()),
(2, (SELECT id FROM users WHERE email = 'patient2@example.com'), NOW()),
-- Conversation 3: Dr. Durand + Claire
(3, (SELECT id FROM users WHERE email = 'dr.durand@hopital-central.fr'), NOW()),
(3, (SELECT id FROM users WHERE email = 'patient3@example.com'), NOW()),
-- Conversation 4: Tech Santé Plus + Antoine
(4, (SELECT id FROM users WHERE email = 'tech@sante-plus.fr'), NOW()),
(4, (SELECT id FROM users WHERE email = 'patient4@example.com'), NOW());

-- Messages de test
INSERT INTO `messages` (`conversation_id`, `sender_id`, `content`, `created_at`) VALUES
-- Conversation 1
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), 'Bonjour Emma, comment vous sentez-vous aujourd''hui ?', NOW()),
(1, (SELECT id FROM users WHERE email = 'patient1@example.com'), 'Bonjour Docteur, je me sens mieux, merci !', NOW()),
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), 'Parfait ! Continuez votre traitement et revenez me voir dans 15 jours.', NOW()),
-- Conversation 2
(2, (SELECT id FROM users WHERE email = 'tech1@biotest.fr'), 'Bonjour Thomas, vos résultats d''analyses sont disponibles.', NOW()),
(2, (SELECT id FROM users WHERE email = 'patient2@example.com'), 'Merci ! Tout va bien ?', NOW()),
(2, (SELECT id FROM users WHERE email = 'tech1@biotest.fr'), 'Oui, tous les paramètres sont dans les normes. Votre médecin recevra le rapport complet.', NOW()),
-- Conversation 3
(3, (SELECT id FROM users WHERE email = 'dr.durand@hopital-central.fr'), 'Bonjour Claire, comment se passe votre récupération ?', NOW()),
(3, (SELECT id FROM users WHERE email = 'patient3@example.com'), 'Bonjour Docteur, ça va mieux chaque jour. Quelques douleurs encore.', NOW()),
-- Conversation 4
(4, (SELECT id FROM users WHERE email = 'tech@sante-plus.fr'), 'Bonjour Antoine, nous avons reçu votre prescription pour les analyses.', NOW()),
(4, (SELECT id FROM users WHERE email = 'patient4@example.com'), 'Parfait ! Quand puis-je venir ?', NOW());

-- Documents de test
INSERT INTO `documents` (`patient_id`, `uploaded_by`, `hospital_id`, `laboratory_id`, `filename`, `file_path`, `file_size`, `document_type`, `created_at`) VALUES
-- Documents hôpital
(1, (SELECT id FROM users WHERE email = 'dr.martin@hopital-central.fr'), 1, NULL, 'consultation_emma_15032024.pdf', '/uploads/docs/consultation_emma_15032024.pdf', 245760, 'medical_report', NOW()),
(3, (SELECT id FROM users WHERE email = 'dr.durand@hopital-central.fr'), 1, NULL, 'rapport_operation_claire.pdf', '/uploads/docs/rapport_operation_claire.pdf', 512000, 'medical_report', NOW()),
(4, (SELECT id FROM users WHERE email = 'dr.bernard@clinique-martin.fr'), 2, NULL, 'prescription_antoine.pdf', '/uploads/docs/prescription_antoine.pdf', 128000, 'prescription', NOW()),
-- Documents laboratoire
(2, (SELECT id FROM users WHERE email = 'tech1@biotest.fr'), NULL, 1, 'analyse_sang_thomas_16032024.pdf', '/uploads/docs/analyse_sang_thomas_16032024.pdf', 189440, 'lab_result', NOW()),
(1, (SELECT id FROM users WHERE email = 'tech2@biotest.fr'), NULL, 1, 'analyse_urine_emma.pdf', '/uploads/docs/analyse_urine_emma.pdf', 156000, 'lab_result', NOW()),
(4, (SELECT id FROM users WHERE email = 'tech@sante-plus.fr'), NULL, 2, 'bilan_complet_antoine.pdf', '/uploads/docs/bilan_complet_antoine.pdf', 298000, 'lab_result', NOW());

-- ============================================================================
-- 4. VÉRIFICATIONS FINALES
-- ============================================================================

-- Vérifier les données insérées
SELECT 'UTILISATEURS' as 'TABLE', role, COUNT(*) as 'COUNT' FROM users GROUP BY role
UNION ALL
SELECT 'PATIENTS', 'total', COUNT(*) FROM patients
UNION ALL
SELECT 'HÔPITAUX', 'total', COUNT(*) FROM hospitals
UNION ALL
SELECT 'LABORATOIRES', 'total', COUNT(*) FROM laboratories
UNION ALL
SELECT 'CONVERSATIONS', 'total', COUNT(*) FROM conversations
UNION ALL
SELECT 'MESSAGES', 'total', COUNT(*) FROM messages
UNION ALL
SELECT 'DOCUMENTS', 'total', COUNT(*) FROM documents;

-- ============================================================================
-- 5. INFORMATIONS DE CONNEXION
-- ============================================================================

/*
🔑 COMPTES DE TEST CRÉÉS (mot de passe: "password" pour tous)

SUPER ADMIN:
- admin@labresult.com

HÔPITAL CENTRAL:
- admin@hopital-central.fr (Admin)
- dr.martin@hopital-central.fr (Médecin)
- dr.durand@hopital-central.fr (Médecin)
- infirmiere@hopital-central.fr (Infirmière)

CLINIQUE SAINT-MARTIN:
- admin@clinique-martin.fr (Admin)
- dr.bernard@clinique-martin.fr (Médecin)

LABORATOIRE BIOTEST:
- admin@biotest.fr (Admin)
- tech1@biotest.fr (Technicien)
- tech2@biotest.fr (Technicien)

LAB SANTÉ PLUS:
- admin@sante-plus.fr (Admin)
- tech@sante-plus.fr (Technicien)

PATIENTS:
- patient1@example.com (Emma Rousseau)
- patient2@example.com (Thomas Bernard)
- patient3@example.com (Claire Petit)
- patient4@example.com (Antoine Moreau)
- patient5@example.com (Julie Lefevre)

📊 DONNÉES CRÉÉES:
- 3 Hôpitaux avec géolocalisation
- 3 Laboratoires avec géolocalisation
- 17 Utilisateurs (1 super admin, 6 staff hôpital, 4 staff labo, 5 patients)
- 5 Profils patients complets
- 4 Conversations de test
- 10 Messages d'exemple
- 6 Documents médicaux

🎯 PRÊT POUR LES TESTS MVP !
*/