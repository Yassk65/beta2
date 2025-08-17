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

async function debugRoutes() {
  log('🔍 DEBUG DES ROUTES API', 'blue');
  log('========================', 'blue');

  // Test 1: Santé de l'API
  try {
    log('\n1. Test de santé de l\'API...', 'blue');
    const response = await axios.get(`${API_BASE}/health`);
    log(`✅ API Health: ${response.status} - ${response.data.message}`, 'green');
  } catch (error) {
    log(`❌ API Health: ${error.message}`, 'red');
    log('   Le serveur backend n\'est probablement pas démarré', 'red');
    return;
  }

  // Test 2: Route documents de base
  try {
    log('\n2. Test route documents (sans auth)...', 'blue');
    const response = await axios.get(`${API_BASE}/documents/patient/1`);
    log(`✅ Documents route accessible: ${response.status}`, 'green');
  } catch (error) {
    if (error.response) {
      log(`⚠️  Documents route: ${error.response.status} - ${error.response.data?.message || 'Erreur'}`, 'yellow');
      if (error.response.status === 401) {
        log('   Authentification requise (normal)', 'yellow');
      } else if (error.response.status === 404) {
        log('   Route non trouvée - problème de configuration', 'red');
      }
    } else {
      log(`❌ Documents route: ${error.message}`, 'red');
    }
  }

  // Test 3: Login pour obtenir un token
  let authToken = '';
  try {
    log('\n3. Test de connexion...', 'blue');
    const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient@test.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      authToken = loginResponse.data.data.token;
      log('✅ Connexion réussie, token obtenu', 'green');
    } else {
      log('❌ Échec de la connexion', 'red');
    }
  } catch (error) {
    log(`❌ Connexion: ${error.response?.data?.message || error.message}`, 'red');
    log('   Créez un utilisateur de test avec:', 'yellow');
    log('   Email: patient@test.com', 'yellow');
    log('   Password: password123', 'yellow');
  }

  // Test 4: Route documents avec authentification
  if (authToken) {
    try {
      log('\n4. Test route documents avec auth...', 'blue');
      const response = await axios.get(`${API_BASE}/documents/patient/1`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      log(`✅ Documents avec auth: ${response.status}`, 'green');
      log(`   Nombre de documents: ${response.data.data?.documents?.length || 0}`, 'green');
    } catch (error) {
      if (error.response) {
        log(`❌ Documents avec auth: ${error.response.status} - ${error.response.data?.message || 'Erreur'}`, 'red');
        
        if (error.response.status === 404) {
          log('   🔍 Détails de l\'erreur 404:', 'red');
          log(`   URL appelée: ${error.config.url}`, 'red');
          log(`   Méthode: ${error.config.method}`, 'red');
          
          // Vérifier les routes disponibles
          if (error.response.data?.availableRoutes) {
            log('   Routes disponibles:', 'yellow');
            error.response.data.availableRoutes.forEach(route => {
              log(`     - ${route}`, 'yellow');
            });
          }
        }
      } else {
        log(`❌ Documents avec auth: ${error.message}`, 'red');
      }
    }
  }

  // Test 5: Vérifier toutes les routes documents
  if (authToken) {
    log('\n5. Test de toutes les routes documents...', 'blue');
    
    const routesToTest = [
      { method: 'GET', path: '/documents/patient/1', description: 'Liste documents patient' },
      { method: 'GET', path: '/documents/transfer-recipients?type=doctor', description: 'Destinataires transfert' },
    ];

    for (const route of routesToTest) {
      try {
        const config = {
          method: route.method.toLowerCase(),
          url: `${API_BASE}${route.path}`,
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        };

        const response = await axios(config);
        log(`✅ ${route.description}: ${response.status}`, 'green');
      } catch (error) {
        if (error.response) {
          log(`❌ ${route.description}: ${error.response.status} - ${error.response.data?.message || 'Erreur'}`, 'red');
        } else {
          log(`❌ ${route.description}: ${error.message}`, 'red');
        }
      }
    }
  }

  log('\n🏁 Debug terminé', 'blue');
}

// Exécuter le debug
if (require.main === module) {
  debugRoutes().catch(error => {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { debugRoutes };