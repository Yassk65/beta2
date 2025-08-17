const { PrismaClient } = require('@prisma/client');
const axios = require('axios');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function diagnose404() {
  log('🔍 DIAGNOSTIC ERREUR 404', 'blue');
  log('========================', 'blue');

  try {
    // 1. Vérifier la base de données
    log('\n1. 🗄️  Vérification base de données...', 'blue');
    
    const userCount = await prisma.user.count();
    const patientCount = await prisma.patient.count();
    
    log(`   Utilisateurs: ${userCount}`, userCount > 0 ? 'green' : 'red');
    log(`   Patients: ${patientCount}`, patientCount > 0 ? 'green' : 'red');

    // Vérifier si le patient ID 119 existe
    const patient119 = await prisma.patient.findUnique({
      where: { id: 119 },
      include: { user: true }
    });

    if (patient119) {
      log(`   ✅ Patient ID 119 existe: ${patient119.user.email}`, 'green');
    } else {
      log(`   ❌ Patient ID 119 n'existe pas`, 'red');
      
      // Lister les patients existants
      const existingPatients = await prisma.patient.findMany({
        include: { user: true },
        take: 5
      });
      
      if (existingPatients.length > 0) {
        log('   📋 Patients existants:', 'cyan');
        existingPatients.forEach(p => {
          log(`      - ID ${p.id}: ${p.user.email}`, 'cyan');
        });
      }
    }

    // 2. Tester la connexion API
    log('\n2. 🌐 Test connexion API...', 'blue');
    
    try {
      const healthResponse = await axios.get(`${API_BASE}/health`);
      log(`   ✅ API accessible: ${healthResponse.status}`, 'green');
    } catch (error) {
      log(`   ❌ API non accessible: ${error.message}`, 'red');
      log('   💡 Démarrez le serveur avec: npm start', 'yellow');
      return;
    }

    // 3. Tester l'authentification
    log('\n3. 🔐 Test authentification...', 'blue');
    
    let authToken = '';
    let currentUserId = null;
    
    try {
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'patient@test.com',
        password: 'password123'
      });

      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        currentUserId = loginResponse.data.data.user.id;
        log(`   ✅ Connexion réussie, User ID: ${currentUserId}`, 'green');
        
        // Trouver le patient correspondant à cet utilisateur
        const currentPatient = await prisma.patient.findFirst({
          where: { user_id: currentUserId }
        });
        
        if (currentPatient) {
          log(`   ✅ Patient trouvé: ID ${currentPatient.id}`, 'green');
        } else {
          log(`   ❌ Aucun patient trouvé pour l'utilisateur ${currentUserId}`, 'red');
        }
      }
    } catch (error) {
      log(`   ❌ Échec connexion: ${error.response?.data?.message || error.message}`, 'red');
      log('   💡 Créez des utilisateurs de test avec: node check_test_data.js', 'yellow');
      return;
    }

    // 4. Tester les routes documents avec différents IDs
    log('\n4. 📄 Test routes documents...', 'blue');
    
    const testPatientIds = [1, 119];
    if (currentUserId) {
      // Trouver le patient ID pour l'utilisateur connecté
      const userPatient = await prisma.patient.findFirst({
        where: { user_id: currentUserId }
      });
      if (userPatient) {
        testPatientIds.push(userPatient.id);
      }
    }

    for (const patientId of [...new Set(testPatientIds)]) {
      try {
        log(`   Test Patient ID ${patientId}...`, 'cyan');
        
        const response = await axios.get(`${API_BASE}/documents/patient/${patientId}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });

        if (response.data.success) {
          log(`   ✅ ID ${patientId}: ${response.data.data.documents.length} documents`, 'green');
        }
      } catch (error) {
        const status = error.response?.status;
        const message = error.response?.data?.message;
        
        if (status === 404) {
          log(`   ❌ ID ${patientId}: 404 - Route non trouvée`, 'red');
        } else if (status === 403) {
          log(`   ⚠️  ID ${patientId}: 403 - Accès refusé`, 'yellow');
        } else if (status === 500) {
          log(`   💥 ID ${patientId}: 500 - Erreur serveur`, 'red');
        } else {
          log(`   ❌ ID ${patientId}: ${status} - ${message || 'Erreur inconnue'}`, 'red');
        }
      }
    }

    // 5. Tester d'autres routes documents
    log('\n5. 🔗 Test autres routes documents...', 'blue');
    
    const otherRoutes = [
      { method: 'GET', path: '/documents/transfer-recipients?type=doctor', name: 'Destinataires' }
    ];

    for (const route of otherRoutes) {
      try {
        const response = await axios({
          method: route.method.toLowerCase(),
          url: `${API_BASE}${route.path}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        log(`   ✅ ${route.name}: ${response.status}`, 'green');
      } catch (error) {
        const status = error.response?.status;
        log(`   ❌ ${route.name}: ${status} - ${error.response?.data?.message || 'Erreur'}`, 'red');
      }
    }

    // 6. Recommandations
    log('\n6. 💡 Recommandations:', 'blue');
    
    if (!patient119) {
      log('   • Utilisez un ID de patient existant au lieu de 119', 'yellow');
      
      const firstPatient = await prisma.patient.findFirst();
      if (firstPatient) {
        log(`   • Essayez avec l'ID ${firstPatient.id}`, 'yellow');
      }
    }
    
    if (userCount === 0) {
      log('   • Créez des données de test: node check_test_data.js', 'yellow');
    }
    
    log('   • Redémarrez le serveur backend: npm start', 'yellow');
    log('   • Vérifiez les logs du serveur pour plus de détails', 'yellow');

  } catch (error) {
    log(`❌ Erreur diagnostic: ${error.message}`, 'red');
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
if (require.main === module) {
  diagnose404().catch(error => {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { diagnose404 };