// 🧪 TEST DU FIX VÉRIFICATION ACCÈS DOCUMENTS
// 📅 Créé le : 21 Août 2025

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let testDocumentId = null;

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    'info': '📝',
    'success': '✅',
    'error': '❌',
    'warning': '⚠️'
  }[type] || '📝';
  
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

// Test 1: Connexion patient
async function testPatientLogin() {
  try {
    log('Test 1: Connexion patient...', 'info');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient1@example.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      log('Connexion patient réussie', 'success');
      return true;
    } else {
      log('Échec de la connexion patient', 'error');
      return false;
    }
    
  } catch (error) {
    log(`Erreur connexion: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 2: Récupérer un document pour le test
async function getTestDocument() {
  try {
    log('Test 2: Récupération d\'un document de test...', 'info');
    
    const response = await axios.get(`${API_BASE}/documents/my-documents`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.data.documents.length > 0) {
      testDocumentId = response.data.data.documents[0].id;
      log(`Document de test trouvé: ID ${testDocumentId}`, 'success');
      return true;
    } else {
      log('Aucun document trouvé pour le test', 'warning');
      return false;
    }
    
  } catch (error) {
    log(`Erreur récupération documents: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 3: Premier accès (doit réussir maintenant)
async function testFirstAccess() {
  if (!testDocumentId) {
    log('Pas de document pour le test d\'accès', 'warning');
    return false;
  }

  try {
    log('Test 3: Premier accès au document (doit créer une nouvelle session)...', 'info');
    
    const response = await axios.post(`${API_BASE}/documents/${testDocumentId}/verify-access`, {
      timestamp: new Date().toISOString()
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.access_granted) {
      log('✨ PREMIER ACCÈS RÉUSSI! ✨', 'success');
      log(`   Message: ${response.data.message}`, 'info');
      log(`   Nouvelle session: ${response.data.is_new_session}`, 'info');
      log(`   Expire dans: ${response.data.expires_in}s`, 'info');
      return true;
    } else {
      log('Premier accès échoué', 'error');
      log(`   Réponse: ${JSON.stringify(response.data)}`, 'error');
      return false;
    }
    
  } catch (error) {
    log(`Erreur premier accès: ${error.response?.data?.message || error.message}`, 'error');
    log(`   Status: ${error.response?.status}`, 'error');
    log(`   Data: ${JSON.stringify(error.response?.data)}`, 'error');
    return false;
  }
}

// Test 4: Accès répété (dans les 5 minutes)
async function testSubsequentAccess() {
  if (!testDocumentId) {
    log('Pas de document pour le test d\'accès répété', 'warning');
    return false;
  }

  try {
    log('Test 4: Accès répété (dans les 5 minutes)...', 'info');
    
    // Attendre 2 secondes puis refaire la vérification
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await axios.post(`${API_BASE}/documents/${testDocumentId}/verify-access`, {
      timestamp: new Date().toISOString()
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (response.data.success && response.data.access_granted) {
      log('Accès répété réussi', 'success');
      log(`   Message: ${response.data.message}`, 'info');
      log(`   Nouvelle session: ${response.data.is_new_session}`, 'info');
      log(`   Temps restant: ${response.data.expires_in}s`, 'info');
      return true;
    } else {
      log('Accès répété échoué', 'error');
      return false;
    }
    
  } catch (error) {
    log(`Erreur accès répété: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Test 5: Visualisation complète
async function testCompleteFlow() {
  if (!testDocumentId) {
    log('Pas de document pour le test de visualisation', 'warning');
    return false;
  }

  try {
    log('Test 5: Flux complet de visualisation...', 'info');
    
    // D'abord vérifier l'accès
    const verifyResponse = await axios.post(`${API_BASE}/documents/${testDocumentId}/verify-access`, {
      timestamp: new Date().toISOString()
    }, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    if (!verifyResponse.data.success || !verifyResponse.data.access_granted) {
      log('Vérification d\'accès échouée pour la visualisation', 'error');
      return false;
    }

    // Puis visualiser le document
    const viewResponse = await axios.get(`${API_BASE}/documents/${testDocumentId}/view`, {
      headers: { 'Authorization': `Bearer ${authToken}` },
      responseType: 'stream'
    });

    if (viewResponse.status === 200) {
      log('✨ VISUALISATION COMPLÈTE RÉUSSIE! ✨', 'success');
      log(`   Type de contenu: ${viewResponse.headers['content-type']}`, 'info');
      return true;
    } else {
      log('Visualisation échouée', 'error');
      return false;
    }
    
  } catch (error) {
    log(`Erreur flux complet: ${error.response?.data?.message || error.message}`, 'error');
    return false;
  }
}

// Exécuter tous les tests
async function runAllTests() {
  console.log('🚀 DÉBUT DES TESTS DE FIX VÉRIFICATION ACCÈS');
  console.log('='.repeat(60));
  
  const results = {};
  
  results.login = await testPatientLogin();
  if (!results.login) {
    log('Arrêt des tests - connexion impossible', 'error');
    return;
  }
  
  results.getDocument = await getTestDocument();
  if (!results.getDocument) {
    log('Arrêt des tests - aucun document disponible', 'error');
    return;
  }
  
  results.firstAccess = await testFirstAccess();
  results.subsequentAccess = await testSubsequentAccess();
  results.completeFlow = await testCompleteFlow();
  
  // Résumé
  console.log('\\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('='.repeat(60));
  
  const testNames = {
    login: 'Connexion patient',
    getDocument: 'Récupération document test',
    firstAccess: '🎯 PREMIER ACCÈS (FIX PRINCIPAL)',
    subsequentAccess: 'Accès répété',
    completeFlow: 'Flux complet visualisation'
  };
  
  Object.entries(results).forEach(([key, result]) => {
    const status = result ? '✅ PASS' : '❌ FAIL';
    const name = testNames[key] || key;
    console.log(`${status} ${name}`);
  });
  
  const passedTests = Object.values(results).filter(r => r).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\\n' + '='.repeat(60));
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS RÉUSSIS!');
    console.log('✅ Le fix de vérification d\'accès fonctionne parfaitement!');
    console.log('✅ Les patients peuvent maintenant accéder aux documents!');
  } else {
    console.log(`⚠️  ${passedTests}/${totalTests} tests réussis`);
    console.log('🔧 Certains aspects nécessitent encore des corrections.');
  }
  console.log('='.repeat(60));
}

// Exécuter si appelé directement
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Erreur lors de l\'exécution des tests:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests };