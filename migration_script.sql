-- Script de migration pour passer de l'ancienne structure à la nouvelle
-- ⚠️ ATTENTION: Sauvegardez votre base de données avant d'exécuter ce script

-- 1. Créer les nouvelles tables selon la nouvelle structure

-- Table patients
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

-- Table hospitals
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

-- Table hospital_admins
CREATE TABLE hospital_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    hospital_id INT,
    email VARCHAR(255) UNIQUE,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Table hospital_staff
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
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id)
);

-- Table laboratories
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

-- Table lab_admins
CREATE TABLE lab_admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_id INT,
    email VARCHAR(255) UNIQUE,
    mot_de_passe VARCHAR(255),
    nom VARCHAR(100),
    prenom VARCHAR(100),
    FOREIGN KEY (lab_id) REFERENCES laboratories(id)
);

-- Table lab_staff
CREATE TABLE lab_staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_id INT,
    nom VARCHAR(100),
    prenom VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    telephone VARCHAR(20),
    mot_de_passe VARCHAR(255),
    poste ENUM('technicien', 'responsable', 'autre') DEFAULT 'technicien',
    FOREIGN KEY (lab_id) REFERENCES laboratories(id)
);

-- 2. Migration des données existantes (si nécessaire)
-- Migrer les patients de l'ancienne table users
INSERT INTO patients (nom, prenom, email, telephone, mot_de_passe, created_at)
SELECT 
    COALESCE(lastName, ''), 
    COALESCE(firstName, ''), 
    email, 
    phone, 
    password, 
    createdAt
FROM users 
WHERE role = 'PATIENT' AND isActive = 1;

-- Créer des hôpitaux à partir des utilisateurs HOPITAL
INSERT INTO hospitals (nom, adresse, telephone, email, created_at)
SELECT DISTINCT
    COALESCE(hospitalName, 'Hôpital sans nom'),
    hospitalAddress,
    phone,
    email,
    createdAt
FROM users 
WHERE role = 'HOPITAL' AND isActive = 1;

-- Créer des administrateurs d'hôpitaux
INSERT INTO hospital_admins (hospital_id, email, mot_de_passe, nom, prenom)
SELECT 
    h.id,
    u.email,
    u.password,
    COALESCE(u.lastName, ''),
    COALESCE(u.firstName, '')
FROM users u
JOIN hospitals h ON h.email = u.email
WHERE u.role = 'HOPITAL' AND u.isActive = 1;

-- Créer des laboratoires à partir des utilisateurs LABO
INSERT INTO laboratories (nom, adresse, telephone, email, created_at)
SELECT DISTINCT
    COALESCE(labName, 'Laboratoire sans nom'),
    labAddress,
    phone,
    email,
    createdAt
FROM users 
WHERE role = 'LABO' AND isActive = 1;

-- Créer des administrateurs de laboratoires
INSERT INTO lab_admins (lab_id, email, mot_de_passe, nom, prenom)
SELECT 
    l.id,
    u.email,
    u.password,
    COALESCE(u.lastName, ''),
    COALESCE(u.firstName, '')
FROM users u
JOIN laboratories l ON l.email = u.email
WHERE u.role = 'LABO' AND u.isActive = 1;

-- 3. Supprimer l'ancienne table users (ATTENTION: Décommentez seulement après vérification)
-- DROP TABLE users;

-- 4. Créer des index pour optimiser les performances
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_hospital_admins_email ON hospital_admins(email);
CREATE INDEX idx_hospital_staff_email ON hospital_staff(email);
CREATE INDEX idx_lab_admins_email ON lab_admins(email);
CREATE INDEX idx_lab_staff_email ON lab_staff(email);
CREATE INDEX idx_hospitals_email ON hospitals(email);
CREATE INDEX idx_laboratories_email ON laboratories(email);