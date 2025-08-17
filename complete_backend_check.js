// 🔍 VÉRIFICATION COMPLÈTE DU BACKEND
// 📅 Créé le : 11 Août 2025
// 🎯 Vérifier tous les aspects de la logique backend

const { PrismaClient } = require('@prisma/client');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();

async function checkBackend() {
  console.log('🔍 VÉRIFICATION COMPLÈTE DU BACKEND\n');
  console.log('=' .repeat(50));

  let checks = {
    database: { passed: 0, total: 0 },
    files: { passed: 0, total: 0 },
    data: { passed: 0, total: 0 },
    permissions: { passed: 0, total: 0 }
  };

  try {
    // ============================================================================
    // 1. VÉRIFICATION DE LA BASE DE DONNÉES
    // ============================================================================
    
    console.log('\n📊 1. VÉRIFICATION BASE DE DONNÉES');
    console.log('-'.repeat(40));

    // Test connexion
    checks.database.total++;
    try {
      await prisma.$connect();
      console.log('✅ Connexion à la base de données');
      checks.database.passed++;
    } catch (error) {
      console.log('❌ Connexion à la base de données');
    }

    // Vérifier les tables principales
    const tables = [
      'users', 'patients', 'hospitals', 'laboratories', 
      'documents', 'exam_requests', 'notifications', 
      'conversations', 'messages'
    ];

    for (const table of tables) {
      checks.database.total++;
      try {
        const count = await prisma[table.slice(0, -1) === 'users' ? 'user' : 
                                table.slice(0, -1) === 'laboratories' ? 'laboratory' :
                                table.slice(0, -1)].count();
        console.log(`✅ Table ${table}: ${count} enregistrements`);
        checks.database.passed++;
      } catch (error) {
        console.log(`❌ Table ${table}: Erreur`);
      }
    }

    // ============================================================================
    // 2. VÉRIFICATION DES FICHIERS
    // ============================================================================
    
    console.log('\n📁 2. VÉRIFICATION FICHIERS');
    console.log('-'.repeat(40));

    const requiredFiles = [
      // Contrôleurs
      'src/controllers/authController.js',
      'src/controllers/userController.js',
      'src/controllers/patientAdminController.js',
      'src/controllers/documentController.js',
      'src/controllers/examRequestController.js',
      'src/controllers/messageController.js',
      'src/controllers/notificationController.js',
      
      // Routes
      'src/routes/auth.js',
      'src/routes/users.js',
      'src/routes/adminPatients.js',
      'src/routes/documents.js',
      'src/routes/examRequests.js',
      'src/routes/messages.js',
      'src/routes/notifications.js',
      
      // Services
      'src/services/notificationService.js',
      
      // Middleware
      'src/middleware/auth.js',
      
      // Configuration
      'src/app.js',
      'prisma/schema.prisma',
      'prisma/seed.js'
    ];

    for (const file of requiredFiles) {
      checks.files.total++;
      try {
        await fs.access(path.join(__dirname, file));
        console.log(`✅ ${file}`);
        checks.files.passed++;
      } catch (error) {
        console.log(`❌ ${file} - MANQUANT`);
      }
    }

    // ============================================================================
    // 3. VÉRIFICATION DES DONNÉES
    // ============================================================================
    
    console.log('\n📊 3. VÉRIFICATION DONNÉES');
    console.log('-'.repeat(40));

    // Vérifier les utilisateurs par rôle
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    const expectedRoles = ['super_admin', 'hospital_admin', 'lab_admin', 'hospital_staff', 'lab_staff', 'patient'];
    for (const role of expectedRoles) {
      checks.data.total++;
      const roleData = usersByRole.find(r => r.role === role);
      if (roleData && roleData._count.role > 0) {
        console.log(`✅ Rôle ${role}: ${roleData._count.role} utilisateurs`);
        checks.data.passed++;
      } else {
        console.log(`❌ Rôle ${role}: Aucun utilisateur`);
      }
    }

    // Vérifier les établissements
    checks.data.total++;
    const hospitalCount = await prisma.hospital.count();
    if (hospitalCount >= 3) {
      console.log(`✅ Hôpitaux: ${hospitalCount}`);
      checks.data.passed++;
    } else {
      console.log(`❌ Hôpitaux: ${hospitalCount} (minimum 3 attendu)`);
    }

    checks.data.total++;
    const labCount = await prisma.laboratory.count();
    if (labCount >= 3) {
      console.log(`✅ Laboratoires: ${labCount}`);
      checks.data.passed++;
    } else {
      console.log(`❌ Laboratoires: ${labCount} (minimum 3 attendu)`);
    }

    // Vérifier les documents
    checks.data.total++;
    const documentCount = await prisma.document.count();
    if (documentCount >= 5) {
      console.log(`✅ Documents: ${documentCount}`);
      checks.data.passed++;
    } else {
      console.log(`❌ Documents: ${documentCount} (minimum 5 attendu)`);
    }

    // Vérifier les demandes d'examens
    checks.data.total++;
    const examCount = await prisma.examRequest.count();
    if (examCount >= 3) {
      console.log(`✅ Demandes d'examens: ${examCount}`);
      checks.data.passed++;
    } else {
      console.log(`❌ Demandes d'examens: ${examCount} (minimum 3 attendu)`);
    }

    // Vérifier les notifications
    checks.data.total++;
    const notificationCount = await prisma.notification.count();
    if (notificationCount >= 3) {
      console.log(`✅ Notifications: ${notificationCount}`);
      checks.data.passed++;
    } else {
      console.log(`❌ Notifications: ${notificationCount} (minimum 3 attendu)`);
    }

    // ============================================================================
    // 4. VÉRIFICATION DES PERMISSIONS
    // ============================================================================
    
    console.log('\n🔐 4. VÉRIFICATION PERMISSIONS');
    console.log('-'.repeat(40));

    // Vérifier qu'il y a des utilisateurs de chaque rôle avec des établissements
    checks.permissions.total++;
    const hospitalStaff = await prisma.user.findFirst({
      where: { role: 'hospital_staff', hospital_id: { not: null } }
    });
    if (hospitalStaff) {
      console.log(`✅ Personnel hospitalier avec établissement assigné`);
      checks.permissions.passed++;
    } else {
      console.log(`❌ Aucun personnel hospitalier avec établissement`);
    }

    checks.permissions.total++;
    const labStaff = await prisma.user.findFirst({
      where: { role: 'lab_staff', laboratory_id: { not: null } }
    });
    if (labStaff) {
      console.log(`✅ Personnel laboratoire avec établissement assigné`);
      checks.permissions.passed++;
    } else {
      console.log(`❌ Aucun personnel laboratoire avec établissement`);
    }

    checks.permissions.total++;
    const patientsWithEstablishments = await prisma.user.count({
      where: { 
        role: 'patient', 
        OR: [
          { hospital_id: { not: null } },
          { laboratory_id: { not: null } }
        ]
      }
    });
    if (patientsWithEstablishments >= 3) {
      console.log(`✅ ${patientsWithEstablishments} patients avec établissements assignés`);
      checks.permissions.passed++;
    } else {
      console.log(`❌ ${patientsWithEstablishments} patients avec établissements (minimum 3 attendu)`);
    }

    // Vérifier les relations documents-patients
    checks.permissions.total++;
    const documentsWithPatients = await prisma.document.count({
      where: { patient_id: { not: null } }
    });
    const totalDocuments = await prisma.document.count();
    if (documentsWithPatients === totalDocuments && totalDocuments > 0) {
      console.log(`✅ Tous les documents ont un patient assigné`);
      checks.permissions.passed++;
    } else {
      console.log(`❌ ${documentsWithPatients}/${totalDocuments} documents avec patient`);
    }

    // ============================================================================
    // 5. RÉSUMÉ FINAL
    // ============================================================================
    
    console.log('\n📋 RÉSUMÉ DE LA VÉRIFICATION');
    console.log('=' .repeat(50));

    const totalChecks = Object.values(checks).reduce((sum, category) => sum + category.total, 0);
    const passedChecks = Object.values(checks).reduce((sum, category) => sum + category.passed, 0);
    const successRate = Math.round((passedChecks / totalChecks) * 100);

    console.log(`📊 Base de données: ${checks.database.passed}/${checks.database.total} ✅`);
    console.log(`📁 Fichiers: ${checks.files.passed}/${checks.files.total} ✅`);
    console.log(`📊 Données: ${checks.data.passed}/${checks.data.total} ✅`);
    console.log(`🔐 Permissions: ${checks.permissions.passed}/${checks.permissions.total} ✅`);
    
    console.log('\n' + '='.repeat(50));
    console.log(`🎯 RÉSULTAT GLOBAL: ${passedChecks}/${totalChecks} (${successRate}%)`);
    
    if (successRate >= 95) {
      console.log('🎉 BACKEND VALIDÉ - PRÊT POUR LA PRODUCTION ! 🚀');
    } else if (successRate >= 80) {
      console.log('⚠️ BACKEND FONCTIONNEL - Quelques améliorations recommandées');
    } else {
      console.log('❌ BACKEND INCOMPLET - Corrections nécessaires');
    }

    // Recommandations
    console.log('\n💡 RECOMMANDATIONS:');
    if (checks.files.passed < checks.files.total) {
      console.log('   📁 Vérifier les fichiers manquants');
    }
    if (checks.data.passed < checks.data.total) {
      console.log('   📊 Exécuter: npm run db:seed');
    }
    if (checks.permissions.passed < checks.permissions.total) {
      console.log('   🔐 Vérifier les assignations d\'établissements');
    }

    console.log('\n🚀 COMMANDES UTILES:');
    console.log('   npm run db:push      # Mettre à jour la base');
    console.log('   npm run db:seed      # Ajouter les données de test');
    console.log('   npm run test:api     # Tester l\'API complète');
    console.log('   cd src && node app.js # Démarrer le serveur');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBackend();