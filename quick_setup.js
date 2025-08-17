const { checkTestData, createTestUsers } = require('./check_test_data');
const { diagnose404 } = require('./diagnose_404');
const { testSimpleRoutes } = require('./test_simple_routes');

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function quickSetup() {
  log('🚀 CONFIGURATION RAPIDE DU SYSTÈME', 'magenta');
  log('==================================', 'magenta');

  try {
    // 1. Vérifier et créer les données de test
    log('\n📊 Étape 1: Vérification des données...', 'blue');
    await checkTestData();

    // 2. Diagnostic des problèmes
    log('\n🔍 Étape 2: Diagnostic des erreurs...', 'blue');
    await diagnose404();

    // 3. Test des routes
    log('\n🧪 Étape 3: Test des routes...', 'blue');
    await testSimpleRoutes();

    log('\n✅ Configuration terminée!', 'green');
    log('\n📋 Résumé des comptes de test:', 'cyan');
    log('   Email: patient@test.com', 'cyan');
    log('   Email: doctor@test.com', 'cyan');
    log('   Email: lab@test.com', 'cyan');
    log('   Mot de passe: password123', 'cyan');

    log('\n🌐 URLs importantes:', 'cyan');
    log('   Backend API: http://localhost:3000/api', 'cyan');
    log('   Frontend: http://localhost:8100', 'cyan');
    log('   API Health: http://localhost:3000/api/health', 'cyan');

    log('\n🔧 Commandes utiles:', 'yellow');
    log('   Démarrer backend: npm start', 'yellow');
    log('   Tester routes: node test_simple_routes.js', 'yellow');
    log('   Diagnostic: node diagnose_404.js', 'yellow');
    log('   Vérifier données: node check_test_data.js', 'yellow');

  } catch (error) {
    log(`❌ Erreur lors de la configuration: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Exécuter la configuration
if (require.main === module) {
  quickSetup().catch(error => {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { quickSetup };