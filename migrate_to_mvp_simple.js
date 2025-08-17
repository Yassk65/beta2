// Script de migration vers l'architecture MVP simplifiée - VERSION CORRIGÉE
// 📅 Créé le : 11 Août 2025

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function migrateToMVPSimple() {
  console.log('🚀 Début de la migration vers l\'architecture MVP (version simplifiée)...');
  
  try {
    // 1. Utiliser Prisma pour créer les nouvelles tables directement
    console.log('📝 Génération du nouveau schéma Prisma...');
    
    // Copier le schéma MVP vers le schéma principal
    const fs = require('fs');
    const path = require('path');
    
    const mvpSchemaPath = path.join(__dirname, 'prisma', 'schema_mvp.prisma');
    const mainSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
    const backupSchemaPath = path.join(__dirname, 'prisma', 'schema_backup.prisma');
    
    // Sauvegarder l'ancien schéma
    if (fs.existsSync(mainSchemaPath)) {
      fs.copyFileSync(mainSchemaPath, backupSchemaPath);
      console.log('✅ Ancien schéma sauvegardé');
    }
    
    // Copier le nouveau schéma
    fs.copyFileSync(mvpSchemaPath, mainSchemaPath);
    console.log('✅ Nouveau schéma MVP activé');
    
    // 2. Générer le client Prisma
    console.log('🔧 Génération du client Prisma...');
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    await execPromise('npx prisma generate', { cwd: __dirname });
    console.log('✅ Client Prisma généré');
    
    // 3. Appliquer les changements à la base de données
    console.log('🗄️ Application des changements à la base de données...');
    await execPromise('npx prisma db push --force-reset', { cwd: __dirname });
    console.log('✅ Base de données mise à jour');
    
    // 4. Créer des données de test
    console.log('📊 Création des données de test...');
    
    // Créer un super admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const superAdmin = await prisma.user.create({
      data: {
        email: 'admin@labresult.com',
        password_hash: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        role: 'super_admin',
        is_active: true
      }
    });
    console.log('✅ Super admin créé');
    
    // Créer un hôpital
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Hôpital Central',
        address: '123 Rue de la Santé',
        city: 'Paris',
        phone: '01.23.45.67.89',
        email: 'contact@hopital-central.fr',
        latitude: 48.8566,
        longitude: 2.3522,
        is_active: true
      }
    });
    console.log('✅ Hôpital créé');
    
    // Créer un laboratoire
    const laboratory = await prisma.laboratory.create({
      data: {
        name: 'Laboratoire BioTest',
        address: '456 Avenue des Analyses',
        city: 'Lyon',
        phone: '04.12.34.56.78',
        email: 'contact@biotest.fr',
        latitude: 45.7640,
        longitude: 4.8357,
        is_active: true
      }
    });
    console.log('✅ Laboratoire créé');
    
    // Créer un admin d'hôpital
    const hospitalAdmin = await prisma.user.create({
      data: {
        email: 'admin@hopital-central.fr',
        password_hash: hashedPassword,
        first_name: 'Jean',
        last_name: 'Dupont',
        role: 'hospital_admin',
        hospital_id: hospital.id,
        is_active: true
      }
    });
    console.log('✅ Admin hôpital créé');
    
    // Créer un médecin
    const doctor = await prisma.user.create({
      data: {
        email: 'dr.martin@hopital-central.fr',
        password_hash: hashedPassword,
        first_name: 'Pierre',
        last_name: 'Martin',
        phone: '06.12.34.56.78',
        role: 'hospital_staff',
        hospital_id: hospital.id,
        is_active: true
      }
    });
    console.log('✅ Médecin créé');
    
    // Créer un admin de laboratoire
    const labAdmin = await prisma.user.create({
      data: {
        email: 'admin@biotest.fr',
        password_hash: hashedPassword,
        first_name: 'Marie',
        last_name: 'Dubois',
        role: 'lab_admin',
        laboratory_id: laboratory.id,
        is_active: true
      }
    });
    console.log('✅ Admin laboratoire créé');
    
    // Créer un technicien
    const technician = await prisma.user.create({
      data: {
        email: 'tech@biotest.fr',
        password_hash: hashedPassword,
        first_name: 'Paul',
        last_name: 'Leroy',
        phone: '06.98.76.54.32',
        role: 'lab_staff',
        laboratory_id: laboratory.id,
        is_active: true
      }
    });
    console.log('✅ Technicien créé');
    
    // Créer un patient
    const patientUser = await prisma.user.create({
      data: {
        email: 'patient@example.com',
        password_hash: hashedPassword,
        first_name: 'Sophie',
        last_name: 'Moreau',
        phone: '06.11.22.33.44',
        role: 'patient',
        is_active: true
      }
    });
    
    // Créer le profil patient
    const patient = await prisma.patient.create({
      data: {
        user_id: patientUser.id,
        date_of_birth: new Date('1985-03-15'),
        gender: 'F',
        phone: '06.11.22.33.44'
      }
    });
    console.log('✅ Patient créé');
    
    // 5. Créer une conversation de test
    const conversation = await prisma.conversation.create({
      data: {
        title: 'Consultation Dr. Martin - Sophie Moreau',
        created_by: doctor.id
      }
    });
    
    // Ajouter les participants
    await prisma.conversationParticipant.createMany({
      data: [
        { conversation_id: conversation.id, user_id: doctor.id },
        { conversation_id: conversation.id, user_id: patientUser.id }
      ]
    });
    
    // Ajouter un message de test
    await prisma.message.create({
      data: {
        conversation_id: conversation.id,
        sender_id: doctor.id,
        content: 'Bonjour Sophie, comment vous sentez-vous aujourd\'hui ?'
      }
    });
    
    console.log('✅ Conversation de test créée');
    
    console.log('✅ Migration terminée avec succès !');
    console.log('📋 Résumé :');
    console.log('   - Architecture MVP activée');
    console.log('   - Base de données restructurée');
    console.log('   - Données de test créées');
    console.log('   - Ancien schéma sauvegardé');
    
    // Afficher les comptes créés
    console.log('\n👥 Comptes créés :');
    console.log('   - Super Admin: admin@labresult.com / admin123');
    console.log('   - Admin Hôpital: admin@hopital-central.fr / admin123');
    console.log('   - Médecin: dr.martin@hopital-central.fr / admin123');
    console.log('   - Admin Labo: admin@biotest.fr / admin123');
    console.log('   - Technicien: tech@biotest.fr / admin123');
    console.log('   - Patient: patient@example.com / admin123');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration :', error);
    
    // Rollback en cas d'erreur
    console.log('🔄 Tentative de rollback...');
    try {
      const fs = require('fs');
      const path = require('path');
      
      const mainSchemaPath = path.join(__dirname, 'prisma', 'schema.prisma');
      const backupSchemaPath = path.join(__dirname, 'prisma', 'schema_backup.prisma');
      
      if (fs.existsSync(backupSchemaPath)) {
        fs.copyFileSync(backupSchemaPath, mainSchemaPath);
        console.log('✅ Rollback effectué - ancien schéma restauré');
      }
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
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    const hospitalCount = await prisma.hospital.count();
    const labCount = await prisma.laboratory.count();
    const conversationCount = await prisma.conversation.count();
    const messageCount = await prisma.message.count();
    
    console.log(`📊 Statistiques post-migration :`);
    console.log(`   - Utilisateurs : ${userCount}`);
    console.log(`   - Patients : ${patientCount}`);
    console.log(`   - Hôpitaux : ${hospitalCount}`);
    console.log(`   - Laboratoires : ${labCount}`);
    console.log(`   - Conversations : ${conversationCount}`);
    console.log(`   - Messages : ${messageCount}`);
    
    // Vérifier l'intégrité des données
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    console.log('👥 Répartition des rôles :');
    roleDistribution.forEach(role => {
      console.log(`   - ${role.role} : ${role._count.role}`);
    });
    
    console.log('✅ Validation terminée');
    
  } catch (error) {
    console.error('❌ Erreur lors de la validation :', error);
  }
}

// Exécution du script
if (require.main === module) {
  migrateToMVPSimple()
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

module.exports = { migrateToMVPSimple, validateMigration };