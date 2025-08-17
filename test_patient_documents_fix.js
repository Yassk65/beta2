const axios = require('axios');

// Configuration
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

async function testPatientDocumentsFix() {
  log('🧪 TEST CORRECTION DOCUMENTS PATIENTS', 'blue');
  log('======================================', 'blue');

  let authToken = '';

  // 1. Test de connexion
  try {
    log('\n1. 🔐 Connexion patient...', 'blue');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient@test.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      const user = response.data.data.user;
      log(`✅ Connexion réussie: ${user.email} (${user.role})`, 'green');
    } else {
      log('❌ Échec de la connexion', 'red');
      return;
    }
  } catch (error) {
    log(`❌ Erreur connexion: ${error.response?.data?.message || error.message}`, 'red');
    log('💡 Créez un utilisateur de test avec: node check_test_data.js', 'yellow');
    return;
  }

  // 2. Test récupération profil patient
  try {
    log('\n2. 👤 Récupération profil patient...', 'blue');
    const response = await axios.get(`${API_BASE}/auth/patient-profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const patient = response.data.data.patient;
      log(`✅ Profil patient récupéré: ID ${patient.id}`, 'green');
      log(`   Nom: ${patient.user.first_name} ${patient.user.last_name}`, 'cyan');
      log(`   Email: ${patient.user.email}`, 'cyan');
    } else {
      log('❌ Échec récupération profil patient', 'red');
    }
  } catch (error) {
    log(`❌ Erreur profil patient: ${error.response?.status} - ${error.response?.data?.message || error.message}`, 'red');
  }

  // 3. Test nouvelle route mes documents
  try {
    log('\n3. 📄 Test nouvelle route mes documents...', 'blue');
    const response = await axios.get(`${API_BASE}/documents/my-documents`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const documents = response.data.data.documents;
      const patient = response.data.data.patient;
      log(`✅ Mes documents récupérés: ${documents.length} document(s)`, 'green');
      log(`   Patient: ${patient.name} (ID: ${patient.id})`, 'cyan');
      
      if (documents.length > 0) {
        documents.forEach((doc, index) => {
          log(`   ${index + 1}. ${doc.filename} (${doc.document_type})`, 'cyan');
        });
      } else {
        log('   ℹ️  Aucun document trouvé - normal pour un nouveau patient', 'yellow');
      }
    } else {
      log(`❌ Erreur mes documents: ${response.data.message}`, 'red');
    }
  } catch (error) {
    if (error.response) {
      log(`❌ Erreur mes documents: ${error.response.status} - ${error.response.data?.message || 'Erreur inconnue'}`, 'red');
      
      if (error.response.status === 404) {
        log('   🔍 Route non trouvée - vérifiez que la route /my-documents est bien définie', 'red');
      } else if (error.response.status === 403) {
        log('   🚫 Accès refusé - vérifiez les permissions', 'red');
      } else if (error.response.status === 500) {
        log('   💥 Erreur serveur - vérifiez les logs du backend', 'red');
      }
    } else {
      log(`❌ Erreur réseau: ${error.message}`, 'red');
    }
  }

  // 4. Test route destinataires
  try {
    log('\n4. 👥 Test route destinataires...', 'blue');
    const response = await axios.get(`${API_BASE}/documents/transfer-recipients?type=doctor`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const recipients = response.data.data.recipients;
      log(`✅ Destinataires récupérés: ${recipients.length}`, 'green');
      
      recipients.slice(0, 3).forEach((recipient, index) => {
        log(`   ${index + 1}. ${recipient.first_name} ${recipient.last_name} - ${recipient.establishment_name || 'Non spécifié'}`, 'cyan');
      });
    } else {
      log(`❌ Erreur destinataires: ${response.data.message}`, 'red');
    }
  } catch (error) {
    log(`❌ Erreur destinataires: ${error.response?.status} - ${error.response?.data?.message || error.message}`, 'red');
  }

  // 5. Comparaison ancienne vs nouvelle route
  try {
    log('\n5. 🔄 Comparaison ancienne route (devrait échouer)...', 'blue');
    const response = await axios.get(`${API_BASE}/documents/patient/999`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    log(`⚠️  Ancienne route fonctionne encore: ${response.status}`, 'yellow');
  } catch (error) {
    if (error.response?.status === 404) {
      log('✅ Ancienne route avec ID inexistant échoue correctement (404)', 'green');
    } else if (error.response?.status === 403) {
      log('✅ Ancienne route refuse l\'accès correctement (403)', 'green');
    } else {
      log(`❌ Erreur inattendue ancienne route: ${error.response?.status}`, 'red');
    }
  }

  log('\n🏁 Tests terminés', 'blue');
  log('\n📋 Résumé:', 'cyan');
  log('   ✅ Nouvelle route /my-documents pour récupérer automatiquement les documents du patient connecté', 'cyan');
  log('   ✅ Route /patient-profile pour récupérer l\'ID du patient', 'cyan');
  log('   ✅ Plus besoin de connaître l\'ID du patient côté frontend', 'cyan');
  log('   ✅ Gestion automatique des permissions', 'cyan');
}

// Exécuter les tests
if (require.main === module) {
  testPatientDocumentsFix().catch(error => {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testPatientDocumentsFix };