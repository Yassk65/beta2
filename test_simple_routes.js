const axios = require('axios');

// Configuration
const API_BASE = 'http://localhost:3000/api';

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testSimpleRoutes() {
  log('🧪 TEST SIMPLE DES ROUTES', 'blue');
  log('==========================', 'blue');

  let authToken = '';
  let patientId = 1;

  // 1. Test de santé
  try {
    log('\n1. 🏥 Test de santé de l\'API...', 'blue');
    const response = await axios.get(`${API_BASE}/health`);
    log(`✅ API opérationnelle: ${response.data.message}`, 'green');
  } catch (error) {
    log(`❌ API non accessible: ${error.message}`, 'red');
    log('   Assurez-vous que le serveur backend est démarré avec: npm start', 'yellow');
    return;
  }

  // 2. Connexion
  try {
    log('\n2. 🔐 Test de connexion...', 'blue');
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient@test.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      const user = response.data.data.user;
      log(`✅ Connexion réussie: ${user.email} (${user.role})`, 'green');
      
      // Récupérer l'ID du patient
      if (user.role === 'patient') {
        // L'ID du patient pourrait être dans user.patient_id ou nous devons le chercher
        patientId = user.id; // Utilisons l'ID utilisateur pour commencer
      }
    } else {
      log('❌ Échec de la connexion', 'red');
      return;
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.response?.data?.message || error.message}`, 'red');
    log('   Exécutez: node check_test_data.js pour créer des utilisateurs de test', 'yellow');
    return;
  }

  // 3. Test route documents
  try {
    log(`\n3. 📄 Test récupération documents (Patient ID: ${patientId})...`, 'blue');
    const response = await axios.get(`${API_BASE}/documents/patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const documents = response.data.data.documents;
      log(`✅ Documents récupérés: ${documents.length} document(s)`, 'green');
      
      if (documents.length > 0) {
        documents.forEach((doc, index) => {
          log(`   ${index + 1}. ${doc.filename} (${doc.document_type})`, 'cyan');
        });
      } else {
        log('   ℹ️  Aucun document trouvé - c\'est normal pour un nouveau patient', 'yellow');
      }
    } else {
      log(`❌ Erreur récupération documents: ${response.data.message}`, 'red');
    }
  } catch (error) {
    if (error.response) {
      log(`❌ Erreur documents: ${error.response.status} - ${error.response.data?.message || 'Erreur inconnue'}`, 'red');
      
      if (error.response.status === 404) {
        log('   🔍 Route non trouvée - vérifiez la configuration des routes', 'red');
      } else if (error.response.status === 403) {
        log('   🚫 Accès refusé - vérifiez les permissions', 'red');
      } else if (error.response.status === 500) {
        log('   💥 Erreur serveur - vérifiez les logs du backend', 'red');
      }
    } else {
      log(`❌ Erreur réseau: ${error.message}`, 'red');
    }
  }

  // 4. Test route destinataires (si connecté)
  if (authToken) {
    try {
      log('\n4. 👥 Test récupération destinataires...', 'blue');
      const response = await axios.get(`${API_BASE}/documents/transfer-recipients?type=doctor`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.data.success) {
        const recipients = response.data.data.recipients;
        log(`✅ Destinataires trouvés: ${recipients.length}`, 'green');
        
        recipients.slice(0, 3).forEach((recipient, index) => {
          log(`   ${index + 1}. ${recipient.first_name} ${recipient.last_name}`, 'cyan');
        });
      }
    } catch (error) {
      log(`❌ Erreur destinataires: ${error.response?.status} - ${error.response?.data?.message || error.message}`, 'red');
    }
  }

  log('\n🏁 Tests terminés', 'blue');
  log('\n💡 Si vous voyez des erreurs 404:', 'yellow');
  log('   1. Vérifiez que le serveur backend est démarré', 'yellow');
  log('   2. Vérifiez les routes dans backend/src/routes/documents.js', 'yellow');
  log('   3. Vérifiez que les routes sont bien enregistrées dans app.js', 'yellow');
  log('   4. Redémarrez le serveur backend', 'yellow');
}

// Exécuter les tests
if (require.main === module) {
  testSimpleRoutes().catch(error => {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testSimpleRoutes };