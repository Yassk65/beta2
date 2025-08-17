const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

// Configuration
const API_BASE = 'http://localhost:3000/api';
let authToken = '';
let testDocumentId = null;

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

// Fonction pour se connecter et obtenir un token
async function login() {
  try {
    log('🔐 Connexion en cours...', 'blue');
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient@test.com',
      password: 'password123'
    });

    if (response.data.success) {
      authToken = response.data.data.token;
      log('✅ Connexion réussie', 'green');
      return true;
    } else {
      log('❌ Échec de la connexion', 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur de connexion: ${error.message}`, 'red');
    return false;
  }
}

// Créer un fichier de test
function createTestFile() {
  const testContent = `RAPPORT MÉDICAL DE TEST
  
Patient: Test Patient
Date: ${new Date().toLocaleDateString()}
Type: Analyse sanguine

RÉSULTATS:
- Hémoglobine: 14.2 g/dL (Normal)
- Globules blancs: 7500/μL (Normal)
- Plaquettes: 250000/μL (Normal)

CONCLUSION:
Tous les paramètres sont dans les normes.
Aucune anomalie détectée.

Dr. Test Médecin
Service d'Hématologie`;

  const testFilePath = path.join(__dirname, 'test_document.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

// Test 1: Upload de document
async function testUploadDocument() {
  try {
    log('\n📤 Test 1: Upload de document', 'blue');
    
    const testFilePath = createTestFile();
    const formData = new FormData();
    
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('patient_id', '1');
    formData.append('document_type', 'blood_test');
    formData.append('description', 'Test d\'upload de document via API');

    const response = await axios.post(`${API_BASE}/documents/upload`, formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      testDocumentId = response.data.data.document.id;
      log(`✅ Document uploadé avec succès (ID: ${testDocumentId})`, 'green');
      log(`   Fichier: ${response.data.data.document.filename}`, 'green');
    } else {
      log('❌ Échec de l\'upload', 'red');
    }

    // Nettoyer le fichier de test
    fs.unlinkSync(testFilePath);
    
  } catch (error) {
    log(`❌ Erreur upload: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 2: Récupération des documents du patient
async function testGetPatientDocuments() {
  try {
    log('\n📋 Test 2: Récupération des documents du patient', 'blue');
    
    const response = await axios.get(`${API_BASE}/documents/patient/1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const documents = response.data.data.documents;
      log(`✅ ${documents.length} document(s) récupéré(s)`, 'green');
      
      documents.forEach((doc, index) => {
        log(`   ${index + 1}. ${doc.filename} (${doc.document_type})`, 'green');
      });
    } else {
      log('❌ Échec de la récupération', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur récupération: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 3: Visualisation d'un document
async function testViewDocument() {
  if (!testDocumentId) {
    log('\n⚠️  Test 3: Pas de document à visualiser', 'yellow');
    return;
  }

  try {
    log('\n👁️  Test 3: Visualisation d\'un document', 'blue');
    
    const response = await axios.get(`${API_BASE}/documents/${testDocumentId}/view`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      },
      responseType: 'stream'
    });

    if (response.status === 200) {
      log('✅ Document visualisé avec succès', 'green');
      log(`   Type de contenu: ${response.headers['content-type']}`, 'green');
    } else {
      log('❌ Échec de la visualisation', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur visualisation: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 4: Génération de résumé IA
async function testGenerateAISummary() {
  if (!testDocumentId) {
    log('\n⚠️  Test 4: Pas de document pour le résumé IA', 'yellow');
    return;
  }

  try {
    log('\n🤖 Test 4: Génération de résumé IA', 'blue');
    
    const response = await axios.post(`${API_BASE}/documents/${testDocumentId}/ai-summary`, {}, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log('✅ Résumé IA généré avec succès', 'green');
      log(`   Résumé: ${response.data.data.summary.substring(0, 200)}...`, 'green');
    } else {
      log('❌ Échec de la génération du résumé', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur résumé IA: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 5: Récupération des destinataires pour transfert
async function testGetTransferRecipients() {
  try {
    log('\n👥 Test 5: Récupération des destinataires (médecins)', 'blue');
    
    const response = await axios.get(`${API_BASE}/documents/transfer-recipients?type=doctor`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      const recipients = response.data.data.recipients;
      log(`✅ ${recipients.length} destinataire(s) trouvé(s)`, 'green');
      
      recipients.slice(0, 3).forEach((recipient, index) => {
        log(`   ${index + 1}. ${recipient.first_name} ${recipient.last_name} - ${recipient.establishment_name}`, 'green');
      });
    } else {
      log('❌ Échec de la récupération des destinataires', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur destinataires: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 6: Transfert de document
async function testTransferDocument() {
  if (!testDocumentId) {
    log('\n⚠️  Test 6: Pas de document à transférer', 'yellow');
    return;
  }

  try {
    log('\n📤 Test 6: Transfert de document', 'blue');
    
    // D'abord, récupérer un destinataire
    const recipientsResponse = await axios.get(`${API_BASE}/documents/transfer-recipients?type=doctor`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!recipientsResponse.data.success || recipientsResponse.data.data.recipients.length === 0) {
      log('⚠️  Aucun destinataire disponible pour le test', 'yellow');
      return;
    }

    const recipient = recipientsResponse.data.data.recipients[0];
    
    const response = await axios.post(`${API_BASE}/documents/${testDocumentId}/transfer`, {
      recipient_id: recipient.id,
      recipient_type: 'doctor',
      message: 'Document transféré pour avis médical - Test API'
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log('✅ Document transféré avec succès', 'green');
      log(`   Destinataire: ${response.data.data.recipient.name}`, 'green');
    } else {
      log('❌ Échec du transfert', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur transfert: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 7: Données hors ligne
async function testGetOfflineData() {
  if (!testDocumentId) {
    log('\n⚠️  Test 7: Pas de document pour les données hors ligne', 'yellow');
    return;
  }

  try {
    log('\n💾 Test 7: Récupération des données hors ligne', 'blue');
    
    const response = await axios.get(`${API_BASE}/documents/${testDocumentId}/offline-data`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log('✅ Données hors ligne récupérées avec succès', 'green');
      log(`   Fichier: ${response.data.data.filename}`, 'green');
      log(`   Type: ${response.data.data.document_type}`, 'green');
    } else {
      log('❌ Échec de la récupération des données hors ligne', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur données hors ligne: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Test 8: Suppression de document
async function testDeleteDocument() {
  if (!testDocumentId) {
    log('\n⚠️  Test 8: Pas de document à supprimer', 'yellow');
    return;
  }

  try {
    log('\n🗑️  Test 8: Suppression de document', 'blue');
    
    const response = await axios.delete(`${API_BASE}/documents/${testDocumentId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (response.data.success) {
      log('✅ Document supprimé avec succès', 'green');
    } else {
      log('❌ Échec de la suppression', 'red');
    }
    
  } catch (error) {
    log(`❌ Erreur suppression: ${error.response?.data?.message || error.message}`, 'red');
  }
}

// Fonction principale
async function runTests() {
  log('🧪 TESTS DES ENDPOINTS DOCUMENTS', 'blue');
  log('=====================================', 'blue');

  // Connexion
  const loginSuccess = await login();
  if (!loginSuccess) {
    log('\n❌ Impossible de continuer sans authentification', 'red');
    return;
  }

  // Exécuter tous les tests
  await testUploadDocument();
  await testGetPatientDocuments();
  await testViewDocument();
  await testGenerateAISummary();
  await testGetTransferRecipients();
  await testTransferDocument();
  await testGetOfflineData();
  await testDeleteDocument();

  log('\n🏁 Tests terminés', 'blue');
  log('=====================================', 'blue');
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(error => {
    log(`❌ Erreur générale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runTests };