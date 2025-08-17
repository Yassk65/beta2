-- Script de migration vers la nouvelle structure
-- 📅 Créé le : 8 Août 2025
-- 🎯 Objectif : Migrer de la structure User unique vers une structure multi-tables

-- 1. Créer les nouvelles tables
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255),
    photo_profil TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospitals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE hospital_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    email VARCHAR(255) UNIQUE,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE hospital_staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255),
    role ENUM('medecin', 'infirmier', 'autre') DEFAULT 'medecin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE
);

CREATE TABLE laboratories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(255),
    adresse TEXT,
    ville VARCHAR(100),
    pays VARCHAR(100),
    telephone VARCHAR(20),
    email VARCHAR(255),
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE lab_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_id INT,
    email VARCHAR(255) UNIQUE,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES laboratories(id) ON DELETE CASCADE
);

CREATE TABLE lab_staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_id INT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255),
    poste ENUM('technicien', 'responsable', 'autre') DEFAULT 'technicien',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_id) REFERENCES laboratories(id) ON DELETE CASCADE
);

-- 2. Migrer les données existantes de la table User
-- Patients
INSERT INTO patients (nom, prenom, email, telephone, mot_de_passe, created_at)
SELECT lastName, firstName, email, phone, password, createdAt
FROM User 
WHERE role = 'PATIENT' AND isActive = true;

-- Hôpitaux (créer d'abord l'hôpital puis l'admin)
INSERT INTO hospitals (nom, adresse, telephone, email, created_at)
SELECT DISTINCT hospitalName, hospitalAddress, phone, email, createdAt
FROM User 
WHERE role = 'HOPITAL' AND isActive = true AND hospitalName IS NOT NULL;

-- Admins d'hôpitaux
INSERT INTO hospital_admins (hospital_id, email, mot_de_passe, nom, prenom, created_at)
SELECT h.id, u.email, u.password, u.lastName, u.firstName, u.createdAt
FROM User u
JOIN hospitals h ON h.email = u.email
WHERE u.role = 'HOPITAL' AND u.isActive = true;

-- Laboratoires (créer d'abord le labo puis l'admin)
INSERT INTO laboratories (nom, adresse, telephone, email, created_at)
SELECT DISTINCT labName, labAddress, phone, email, createdAt
FROM User 
WHERE role = 'LABO' AND isActive = true AND labName IS NOT NULL;

-- Admins de laboratoires
INSERT INTO lab_admins (lab_id, email, mot_de_passe, nom, prenom, created_at)
SELECT l.id, u.email, u.password, u.lastName, u.firstName, u.createdAt
FROM User u
JOIN laboratories l ON l.email = u.email
WHERE u.role = 'LABO' AND u.isActive = true;

-- 3. Créer une table de sauvegarde avant suppression (optionnel)
CREATE TABLE User_backup AS SELECT * FROM User;

-- 4. Supprimer l'ancienne table User (décommenter si vous êtes sûr)
-- DROP TABLE User;

-- 5. Créer des index pour optimiser les performances
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_hospital_admins_email ON hospital_admins(email);
CREATE INDEX idx_hospital_staff_email ON hospital_staff(email);
CREATE INDEX idx_lab_admins_email ON lab_admins(email);
CREATE INDEX idx_lab_staff_email ON lab_staff(email);