// Script de migration vers l'architecture MVP simplifiée
// 📅 Créé le : 11 Août 2025

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrateToMVP() {
  console.log('🚀 Début de la migration vers l\'architecture MVP...');
  
  try {
    // 1. Créer la nouvelle table users unifiée
    console.log('📝 Création de la table users unifiée...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS users_new (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(191) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(100),
        last_name VARCHAR(100),
        phone VARCHAR(20),
        role ENUM('patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin') DEFAULT 'patient',
        hospital_id INT NULL,
        laboratory_id INT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        last_seen TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_hospital (hospital_id),
        INDEX idx_laboratory (laboratory_id)
      )
    `;

    // 2. Migrer les données des 6 tables existantes
    console.log('📊 Migration des données utilisateurs...');
    
    // Migrer les super admins
    const admins = await prisma.$queryRaw`SELECT * FROM admins WHERE is_active = 1`;
    for (const admin of admins) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, phone, role, is_active, created_at)
        VALUES (${admin.email}, ${admin.mot_de_passe}, ${admin.prenom}, ${admin.nom}, ${admin.telephone}, 'super_admin', ${admin.is_active}, ${admin.created_at})
      `;
    }
    console.log(`✅ ${admins.length} super admins migrés`);

    // Migrer les patients
    const patients = await prisma.$queryRaw`SELECT * FROM patients`;
    for (const patient of patients) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, phone, role, is_active, created_at)
        VALUES (${patient.email}, ${patient.mot_de_passe}, ${patient.prenom}, ${patient.nom}, ${patient.telephone}, 'patient', 1, ${patient.created_at})
      `;
    }
    console.log(`✅ ${patients.length} patients migrés`);

    // Migrer les admins d'hôpitaux
    const hospitalAdmins = await prisma.$queryRaw`SELECT * FROM hospital_admins`;
    for (const admin of hospitalAdmins) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, role, hospital_id, is_active, created_at)
        VALUES (${admin.email}, ${admin.mot_de_passe}, ${admin.prenom}, ${admin.nom}, 'hospital_admin', ${admin.hospital_id}, 1, ${admin.created_at})
      `;
    }
    console.log(`✅ ${hospitalAdmins.length} admins d'hôpitaux migrés`);

    // Migrer le staff d'hôpitaux
    const hospitalStaff = await prisma.$queryRaw`SELECT * FROM hospital_staff`;
    for (const staff of hospitalStaff) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, phone, role, hospital_id, is_active, created_at)
        VALUES (${staff.email}, ${staff.mot_de_passe}, ${staff.prenom}, ${staff.nom}, ${staff.telephone}, 'hospital_staff', ${staff.hospital_id}, 1, ${staff.created_at})
      `;
    }
    console.log(`✅ ${hospitalStaff.length} staff d'hôpitaux migrés`);

    // Migrer les admins de laboratoires
    const labAdmins = await prisma.$queryRaw`SELECT * FROM lab_admins`;
    for (const admin of labAdmins) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, role, laboratory_id, is_active, created_at)
        VALUES (${admin.email}, ${admin.mot_de_passe}, ${admin.prenom}, ${admin.nom}, 'lab_admin', ${admin.lab_id}, 1, ${admin.created_at})
      `;
    }
    console.log(`✅ ${labAdmins.length} admins de laboratoires migrés`);

    // Migrer le staff de laboratoires
    const labStaff = await prisma.$queryRaw`SELECT * FROM lab_staff`;
    for (const staff of labStaff) {
      await prisma.$executeRaw`
        INSERT INTO users_new (email, password_hash, first_name, last_name, phone, role, laboratory_id, is_active, created_at)
        VALUES (${staff.email}, ${staff.mot_de_passe}, ${staff.prenom}, ${staff.nom}, ${staff.telephone}, 'lab_staff', ${staff.lab_id}, 1, ${staff.created_at})
      `;
    }
    console.log(`✅ ${labStaff.length} staff de laboratoires migrés`);

    // 3. Créer la nouvelle table patients simplifiée
    console.log('👥 Création de la table patients simplifiée...');
    
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS patients_new (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        date_of_birth DATETIME NULL,
        gender ENUM('M', 'F', 'Other') NULL,
        phone VARCHAR(20) NULL,
        
        FOREIGN KEY (user_id) REFERENCES users_new(id) ON DELETE CASCADE
      )
    `;

    // Migrer les données patients vers la nouvelle structure
    const patientsData = await prisma.$queryRaw`
      SELECT u.id as user_id, p.telephone as phone
      FROM users_new u 
      JOIN patients p ON u.email = p.email 
      WHERE u.role = 'patient'
    `;
    
    for (const patient of patientsData) {
      await prisma.$executeRaw`
        INSERT INTO patients_new (user_id, phone)
        VALUES (${patient.user_id}, ${patient.phone})
      `;
    }
    console.log(`✅ ${patientsData.length} profils patients créés`);

    // 4. Mettre à jour les tables hospitals et laboratories
    console.log('🏥 Mise à jour des établissements...');
    
    // Ajouter les colonnes de géolocalisation si elles n'existent pas
    try {
      await prisma.$executeRaw`ALTER TABLE hospitals ADD COLUMN latitude FLOAT NULL`;
      await prisma.$executeRaw`ALTER TABLE hospitals ADD COLUMN longitude FLOAT NULL`;
    } catch (e) {
      console.log('Colonnes latitude/longitude déjà présentes pour hospitals');
    }
    
    try {
      await prisma.$executeRaw`ALTER TABLE laboratories ADD COLUMN latitude FLOAT NULL`;
      await prisma.$executeRaw`ALTER TABLE laboratories ADD COLUMN longitude FLOAT NULL`;
    } catch (e) {
      console.log('Colonnes latitude/longitude déjà présentes pour laboratories');
    }

    // 5. Renommer les tables (sauvegarde puis remplacement)
    console.log('🔄 Finalisation de la migration...');
    
    // Sauvegarder les anciennes tables
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await prisma.$executeRaw`RENAME TABLE users TO users_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE patients TO patients_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE admins TO admins_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE hospital_admins TO hospital_admins_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE hospital_staff TO hospital_staff_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE lab_admins TO lab_admins_backup_${timestamp}`;
    await prisma.$executeRaw`RENAME TABLE lab_staff TO lab_staff_backup_${timestamp}`;
    
    // Activer les nouvelles tables
    await prisma.$executeRaw`RENAME TABLE users_new TO users`;
    await prisma.$executeRaw`RENAME TABLE patients_new TO patients`;
    
    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Résumé :');
    console.log('   - 6 tables utilisateurs → 1 table users unifiée');
    console.log('   - Table patients simplifiée créée');
    console.log('   - Géolocalisation ajoutée aux établissements');
    console.log('   - Anciennes tables sauvegardées avec timestamp');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    console.log('🔄 Tentative de rollback...');
    
    // Rollback en cas d'erreur
    try {
      await prisma.$executeRaw`DROP TABLE IF EXISTS users_new`;
      await prisma.$executeRaw`DROP TABLE IF EXISTS patients_new`;
      console.log('✅ Rollback effectué');
    } catch (rollbackError) {
      console.error('❌ Erreur lors du rollback :', rollbackError);
    }
    
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction de validation post-migration
async function validateMigration() {
  console.log('🔍 Validation de la migration...');
  
  try {
    const userCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const patientCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM patients`;
    const hospitalCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM hospitals`;
    const labCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM laboratories`;
    
    console.log(`📊 Statistiques post-migration :`);
    console.log(`   - Utilisateurs : ${userCount[0].count}`);
    console.log(`   - Patients : ${patientCount[0].count}`);
    console.log(`   - Hôpitaux : ${hospitalCount[0].count}`);
    console.log(`   - Laboratoires : ${labCount[0].count}`);
    
    // Vérifier l'intégrité des données
    const roleDistribution = await prisma.$queryRaw`
      SELECT role, COUNT(*) as count 
      FROM users 
      GROUP BY role
    `;
    
    console.log('👥 Répartition des rôles :');
    roleDistribution.forEach(role => {
      console.log(`   - ${role.role} : ${role.count}`);
    });
    
    console.log('✅ Validation terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation :', error);
  }
}

// Exécution du script
if (require.main === module) {
  migrateToMVP()
    .then(() => validateMigration())
    .then(() => {
      console.log('🎉 Migration MVP terminée avec succès !');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Échec de la migration :', error);
      process.exit(1);
    });
}

module.exports = { migrateToMVP, validateMigration };