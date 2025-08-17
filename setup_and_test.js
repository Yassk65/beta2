const fs = require('fs');
const path = require('path');
const { checkDatabaseSchema, createMissingTables } = require('./check_database_schema');
const { runTests } = require('./test_documents_endpoints');

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

// Vérifier les variables d'environnement
function checkEnvironmentVariables() {
  log('\n🔧 Vérification des variables d\'environnement...', 'blue');
  
  const envPath = path.join(__dirname, '.env');
  const envExamplePath = path.join(__dirname, '.env.example');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  Fichier .env manquant', 'yellow');
    
    if (fs.existsSync(envExamplePath)) {
      log('📋 Copie du fichier .env.example vers .env...', 'cyan');
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ Fichier .env créé', 'green');
      log('⚠️  Pensez à configurer vos clés API dans le fichier .env', 'yellow');
    } else {
      log('❌ Fichier .env.example manquant', 'red');
      return false;
    }
  } else {
    log('✅ Fichier .env trouvé', 'green');
  }

  // Charger les variables d'environnement
  require('dotenv').config();

  // Vérifier les variables critiques
  const requiredVars = [
    'JWT_SECRET',
    'DATABASE_URL'
  ];

  const optionalVars = [
    'OPENAI_API_KEY',
    'FRONTEND_URL',
    'PORT'
  ];

  let allRequired = true;

  log('\n📋 Variables d\'environnement requises:', 'blue');
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: configuré`, 'green');
    } else {
      log(`❌ ${varName}: manquant`, 'red');
      allRequired = false;
    }
  });

  log('\n📋 Variables d\'environnement optionnelles:', 'blue');
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      log(`✅ ${varName}: configuré`, 'green');
    } else {
      log(`⚠️  ${varName}: non configuré`, 'yellow');
    }
  });

  if (!allRequired) {
    log('\n❌ Certaines variables requises sont manquantes', 'red');
    log('Éditez le fichier .env et relancez le script', 'red');
    return false;
  }

  return true;
}

// Vérifier les dossiers nécessaires
function checkDirectories() {
  log('\n📁 Vérification des dossiers...', 'blue');
  
  const directories = [
    './secure_uploads',
    './temp_uploads',
    './logs',
    './secure_uploads/documents',
    './secure_uploads/thumbnails',
    './secure_uploads/processed'
  ];

  directories.forEach(dir => {
    const fullPath = path.join(__dirname, dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
      log(`✅ Dossier créé: ${dir}`, 'green');
    } else {
      log(`✅ Dossier existe: ${dir}`, 'green');
    }
  });
}

// Vérifier les dépendances npm
function checkDependencies() {
  log('\n📦 Vérification des dépendances...', 'blue');
  
  const packageJsonPath = path.join(__dirname, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    log('❌ package.json manquant', 'red');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const requiredDeps = [
    '@prisma/client',
    'express',
    'jsonwebtoken',
    'bcryptjs',
    'multer',
    'axios',
    'dotenv'
  ];

  let allDepsInstalled = true;
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies && packageJson.dependencies[dep]) {
      log(`✅ ${dep}: installé`, 'green');
    } else {
      log(`❌ ${dep}: manquant`, 'red');
      allDepsInstalled = false;
    }
  });

  if (!allDepsInstalled) {
    log('\n💡 Pour installer les dépendances manquantes:', 'cyan');
    log('npm install', 'cyan');
    return false;
  }

  return true;
}

// Afficher les informations de configuration
function displayConfiguration() {
  log('\n⚙️  Configuration actuelle:', 'blue');
  log('================================', 'blue');
  log(`Port: ${process.env.PORT || 3000}`, 'cyan');
  log(`Base de données: ${process.env.DATABASE_URL || 'Non configuré'}`, 'cyan');
  log(`Frontend URL: ${process.env.FRONTEND_URL || 'Non configuré'}`, 'cyan');
  log(`OpenAI API: ${process.env.OPENAI_API_KEY ? 'Configuré' : 'Non configuré'}`, 'cyan');
  log(`JWT Secret: ${process.env.JWT_SECRET ? 'Configuré' : 'Non configuré'}`, 'cyan');
}

// Afficher les instructions de démarrage
function displayStartupInstructions() {
  log('\n🚀 Instructions de démarrage:', 'blue');
  log('================================', 'blue');
  log('1. Démarrer le serveur backend:', 'cyan');
  log('   npm start', 'cyan');
  log('', 'reset');
  log('2. Démarrer le frontend (dans un autre terminal):', 'cyan');
  log('   cd ../frontend/labresultat', 'cyan');
  log('   ionic serve', 'cyan');
  log('', 'reset');
  log('3. Tester les endpoints:', 'cyan');
  log('   node test_documents_endpoints.js', 'cyan');
  log('', 'reset');
  log('📱 L\'application sera disponible sur:', 'green');
  log(`   Frontend: ${process.env.FRONTEND_URL || 'http://localhost:8100'}`, 'green');
  log(`   Backend API: ${process.env.BACKEND_URL || 'http://localhost:3000'}`, 'green');
}

// Fonction principale
async function main() {
  log('🔧 CONFIGURATION ET VÉRIFICATION DU SYSTÈME', 'blue');
  log('===========================================', 'blue');

  // 1. Vérifier les variables d'environnement
  if (!checkEnvironmentVariables()) {
    process.exit(1);
  }

  // 2. Vérifier les dépendances
  if (!checkDependencies()) {
    process.exit(1);
  }

  // 3. Créer les dossiers nécessaires
  checkDirectories();

  // 4. Vérifier et configurer la base de données
  await checkDatabaseSchema();
  await createMissingTables();

  // 5. Afficher la configuration
  displayConfiguration();

  // 6. Afficher les instructions
  displayStartupInstructions();

  log('\n✅ Configuration terminée avec succès!', 'green');
  log('Le système est prêt à être utilisé.', 'green');

  // Demander si on veut tester les endpoints
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('\n🧪 Voulez-vous tester les endpoints maintenant? (y/N): ', async (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      log('\n🧪 Lancement des tests...', 'blue');
      try {
        await runTests();
      } catch (error) {
        log(`❌ Erreur lors des tests: ${error.message}`, 'red');
      }
    }
    rl.close();
  });
}

// Exécuter le script
if (require.main === module) {
  main().catch(error => {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { main };