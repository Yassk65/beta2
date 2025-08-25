// 🧪 TEST DU NOUVEAU SYSTÈME DE DOCUMENTS SÉCURISÉ
// 📅 Créé le : 21 Août 2025
// 🎯 Vérifier que les patients ne peuvent plus accéder aux documents hors ligne

const axios = require('axios');
const colors = require('colors');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let testDocumentId = null;

// Configuration des couleurs
colors.setTheme({
  info: 'blue',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  header: 'cyan'
});

function log(message, color = 'white') {
  console.log(message[color]);
}

function separator() {
  console.log('='.repeat(80).header);
}

// Fonction utilitaire pour attendre
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: Connexion en tant que patient
async function testPatientLogin() {
  try {
    separator();
    log('🔐 Test 1: Connexion patient', 'header');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient1@example.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      log('✅ Connexion patient réussie', 'success');
      log(`   Token reçu: ${authToken.substring(0, 20)}...`, 'info');
      return true;
    } else {
      log('❌ Échec de la connexion patient', 'error');
      return false;
    }
    
  } catch (error) {
    log(`❌ Erreur connexion patient: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 2: Récupérer les documents du patient
async function testGetPatientDocuments() {
  try {
    separator();
    log('📋 Test 2: Récupération des documents patient', 'header');
    
    const response = await axios.get(`${API_BASE}/documents/my-documents`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success && response.data.data.documents.length > 0) {
      testDocumentId = response.data.data.documents[0].id;
      log('✅ Documents récupérés avec succès', 'success');
      log(`   Nombre de documents: ${response.data.data.documents.length}`, 'info');
      log(`   Premier document ID: ${testDocumentId}`, 'info');
      return true;
    } else {
      log('⚠️  Aucun document trouvé', 'warning');
      return false;
    }
    
  } catch (error) {
    log(`❌ Erreur récupération documents: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 3: Tentative de visualisation en ligne (DOIT FONCTIONNER)
async function testOnlineDocumentView() {
  if (!testDocumentId) {
    log('⚠️  Test 3: Pas de document pour la visualisation', 'warning');
    return false;
  }

  try {
    separator();
    log('👁️  Test 3: Visualisation document en ligne', 'header');
    
    const response = await axios.get(`${API_BASE}/documents/${testDocumentId}/view`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'stream'
    });

    if (response.status === 200) {
      log('✅ Visualisation en ligne réussie', 'success');
      log(`   Type de contenu: ${response.headers['content-type']}`, 'info');
      log(`   Headers de sécurité présents: ${response.headers['cache-control'] ? 'Oui' : 'Non'}`, 'info');
      return true;
    } else {
      log('❌ Échec de la visualisation en ligne', 'error');
      return false;
    }
    
  } catch (error) {
    log(`❌ Erreur visualisation en ligne: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 4: Tentative de téléchargement (DOIT ÊTRE BLOQUÉ)
async function testDownloadBlocked() {
  if (!testDocumentId) {
    log('⚠️  Test 4: Pas de document pour le téléchargement', 'warning');
    return false;
  }

  try {
    separator();
    log('🚫 Test 4: Tentative de téléchargement (doit être bloqué)', 'header');
    
    const response = await axios.get(`${API_BASE}/documents/${testDocumentId}/view?download=true`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Si on arrive ici, c'est que le téléchargement n'a pas été bloqué
    log('❌ PROBLÈME: Le téléchargement n\'a pas été bloqué!', 'error');
    return false;
    
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Téléchargement correctement bloqué', 'success');
      log(`   Message: ${error.response.data.message}`, 'info');
      return true;
    } else {
      log(`❌ Erreur inattendue: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }
}

// Test 5: Tentative d'accès aux données hors ligne (DOIT ÊTRE BLOQUÉ)
async function testOfflineDataBlocked() {
  if (!testDocumentId) {
    log('⚠️  Test 5: Pas de document pour les données hors ligne', 'warning');
    return false;
  }

  try {
    separator();
    log('📱 Test 5: Tentative d\'accès aux données hors ligne (doit être bloqué)', 'header');
    
    const response = await axios.get(`${API_BASE}/documents/${testDocumentId}/offline-data`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    // Si on arrive ici, c'est que l'accès n'a pas été bloqué
    log('❌ PROBLÈME: L\'accès hors ligne n\'a pas été bloqué!', 'error');
    return false;
    
  } catch (error) {
    if (error.response?.status === 403) {
      log('✅ Accès hors ligne correctement bloqué', 'success');
      log(`   Message: ${error.response.data.message}`, 'info');
      log(`   Code d\'erreur: ${error.response.data.error_code}`, 'info');
      return true;
    } else {
      log(`❌ Erreur inattendue: ${error.response?.data?.message || error.message}`, 'error');
      return false;
    }
  }
}

// Test 6: Vérification d'accès en temps réel
async function testAccessVerification() {
  if (!testDocumentId) {
    log('⚠️  Test 6: Pas de document pour la vérification d\'accès', 'warning');
    return false;
  }

  try {
    separator();
    log('🔐 Test 6: Vérification d\'accès en temps réel', 'header');
    
    const response = await axios.post(`${API_BASE}/documents/${testDocumentId}/verify-access`, {
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success && response.data.access_granted) {
      log('✅ Vérification d\'accès réussie', 'success');
      log(`   Accès accordé: ${response.data.access_granted}`, 'info');
      log(`   Session valide: ${response.data.session_valid}`, 'info');
      log(`   Expire dans: ${response.data.expires_in} secondes`, 'info');
      return true;
    } else {
      log('❌ Vérification d\'accès échouée', 'error');
      return false;
    }
    
  } catch (error) {
    log(`❌ Erreur vérification d\'accès: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test complet du système sécurisé
async function runSecurityTests() {
  separator();
  log('🔒 DÉBUT DES TESTS DE SÉCURITÉ DOCUMENTS', 'header');
  log('📅 Test effectué le: ' + new Date().toLocaleString(), 'info');
  separator();

  const results = {
    login: false,
    getDocuments: false,
    onlineView: false,
    downloadBlocked: false,
    offlineBlocked: false,
    accessVerification: false
  };

  // Exécuter tous les tests
  results.login = await testPatientLogin();
  await sleep(1000);

  if (results.login) {
    results.getDocuments = await testGetPatientDocuments();
    await sleep(1000);

    if (results.getDocuments) {
      results.onlineView = await testOnlineDocumentView();
      await sleep(1000);

      results.downloadBlocked = await testDownloadBlocked();
      await sleep(1000);

      results.offlineBlocked = await testOfflineDataBlocked();
      await sleep(1000);

      results.accessVerification = await testAccessVerification();
    }
  }

  // Résumé des résultats
  separator();
  log('📊 RÉSUMÉ DES TESTS DE SÉCURITÉ', 'header');
  separator();

  log(`🔐 Connexion patient:           ${results.login ? '✅ PASS' : '❌ FAIL'}`, results.login ? 'success' : 'error');
  log(`📋 Récupération documents:      ${results.getDocuments ? '✅ PASS' : '❌ FAIL'}`, results.getDocuments ? 'success' : 'error');
  log(`👁️  Visualisation en ligne:      ${results.onlineView ? '✅ PASS' : '❌ FAIL'}`, results.onlineView ? 'success' : 'error');
  log(`🚫 Téléchargement bloqué:       ${results.downloadBlocked ? '✅ PASS' : '❌ FAIL'}`, results.downloadBlocked ? 'success' : 'error');
  log(`📱 Accès hors ligne bloqué:     ${results.offlineBlocked ? '✅ PASS' : '❌ FAIL'}`, results.offlineBlocked ? 'success' : 'error');
  log(`🔐 Vérification d\'accès:        ${results.accessVerification ? '✅ PASS' : '❌ FAIL'}`, results.accessVerification ? 'success' : 'error');

  separator();

  const passedTests = Object.values(results).filter(result => result).length;
  const totalTests = Object.keys(results).length;

  if (passedTests === totalTests) {
    log(`🎉 TOUS LES TESTS RÉUSSIS (${passedTests}/${totalTests})`, 'success');
    log('🔒 Le système de sécurité fonctionne correctement!', 'success');
  } else {
    log(`⚠️  TESTS PARTIELLEMENT RÉUSSIS (${passedTests}/${totalTests})`, 'warning');
    log('🔧 Certains aspects de la sécurité nécessitent des corrections.', 'warning');
  }

  separator();
}

// Exécution des tests si le fichier est appelé directement
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
}

module.exports = {
  runSecurityTests
};