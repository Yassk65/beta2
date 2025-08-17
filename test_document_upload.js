// 📄 TEST UPLOAD DE DOCUMENTS - LABORANTIN
// 📅 Créé le : 16 Août 2025
// 🎯 Tester l'upload et la gestion des documents par le personnel de laboratoire

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000/api';

// Couleurs pour les logs
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables globales pour les tests
let labStaffToken = null;
let patientId = null;
let documentId = null;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Créer un fichier de test
 */
function createTestFile() {
  const testContent = `
RAPPORT D'ANALYSE MÉDICALE
========================

Patient: Test Patient
Date: ${new Date().toLocaleDateString('fr-FR')}
Laboratoire: BioTest Lab

RÉSULTATS:
- Glycémie: 0.95 g/L (Normal: 0.70-1.10)
- Cholestérol total: 1.85 g/L (Normal: <2.00)
- HDL: 0.55 g/L (Normal: >0.40)
- LDL: 1.20 g/L (Normal: <1.60)

CONCLUSION:
Tous les paramètres sont dans les normes.
Aucune anomalie détectée.

Dr. Martin - Biologiste
  `;

  const testFilePath = path.join(__dirname, 'test_document.txt');
  fs.writeFileSync(testFilePath, testContent);
  return testFilePath;
}

/**
 * Supprimer le fichier de test
 */
function cleanupTestFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      log('✅ Fichier de test supprimé', 'green');
    }
  } catch (error) {
    log(`⚠️ Erreur suppression fichier: ${error.message}`, 'yellow');
  }
}

// ============================================================================
// TESTS D'AUTHENTIFICATION
// ============================================================================

async function loginAsLabStaff() {
  try {
    log('\n🔐 Connexion en tant que personnel de laboratoire...', 'cyan');
    
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'tech1@biotest.fr',
      password: 'tech123'
    });

    if (response.data.success) {
      labStaffToken = response.data.data.token;
      log(`✅ Connexion réussie: ${response.data.data.user.first_name} ${response.data.data.user.last_name}`, 'green');
      log(`   Rôle: ${response.data.data.user.role}`, 'blue');
      log(`   Laboratoire: ${response.data.data.user.laboratory?.name || 'Non défini'}`, 'blue');
      return true;
    } else {
      log(`❌ Échec connexion: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur connexion: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// TESTS GESTION DES PATIENTS
// ============================================================================

async function getLabPatients() {
  try {
    log('\n👥 Récupération des patients du laboratoire...', 'cyan');
    
    const response = await axios.get(`${BASE_URL}/patients/lab`, {
      headers: { Authorization: `Bearer ${labStaffToken}` }
    });

    if (response.data.success) {
      const patients = response.data.data.patients;
      log(`✅ ${patients.length} patients trouvés`, 'green');
      
      if (patients.length > 0) {
        patientId = patients[0].id;
        const patient = patients[0];
        log(`   Premier patient: ${patient.user.first_name} ${patient.user.last_name} (ID: ${patientId})`, 'blue');
        return true;
      } else {
        log('⚠️ Aucun patient trouvé', 'yellow');
        return false;
      }
    } else {
      log(`❌ Erreur récupération patients: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur récupération patients: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function searchPatients() {
  try {
    log('\n🔍 Recherche de patients...', 'cyan');
    
    const response = await axios.get(`${BASE_URL}/patients/search?q=patient`, {
      headers: { Authorization: `Bearer ${labStaffToken}` }
    });

    if (response.data.success) {
      const patients = response.data.data.patients;
      log(`✅ ${patients.length} patients trouvés avec la recherche "patient"`, 'green');
      
      patients.slice(0, 3).forEach(patient => {
        log(`   - ${patient.user.first_name} ${patient.user.last_name} (${patient.user.email})`, 'blue');
      });
      
      return true;
    } else {
      log(`❌ Erreur recherche patients: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur recherche patients: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// TESTS UPLOAD DE DOCUMENTS
// ============================================================================

async function uploadDocument() {
  try {
    log('\n📤 Upload d\'un document...', 'cyan');
    
    if (!patientId) {
      log('❌ Aucun patient disponible pour l\'upload', 'red');
      return false;
    }

    // Créer un fichier de test
    const testFilePath = createTestFile();
    
    // Préparer le FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(testFilePath));
    formData.append('patient_id', patientId.toString());
    formData.append('document_type', 'lab_result');
    formData.append('description', 'Résultats d\'analyses sanguines - Test automatisé');

    const response = await axios.post(`${BASE_URL}/documents/upload`, formData, {
      headers: {
        Authorization: `Bearer ${labStaffToken}`,
        ...formData.getHeaders()
      }
    });

    // Nettoyer le fichier de test
    cleanupTestFile(testFilePath);

    if (response.data.success) {
      documentId = response.data.data.document.id;
      const doc = response.data.data.document;
      log(`✅ Document uploadé avec succès (ID: ${documentId})`, 'green');
      log(`   Nom: ${doc.filename}`, 'blue');
      log(`   Type: ${doc.document_type}`, 'blue');
      log(`   Taille: ${(doc.file_size / 1024).toFixed(2)} KB`, 'blue');
      log(`   Patient: ${doc.patient.user.first_name} ${doc.patient.user.last_name}`, 'blue');
      return true;
    } else {
      log(`❌ Erreur upload: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur upload: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// TESTS RÉCUPÉRATION DE DOCUMENTS
// ============================================================================

async function getPatientDocuments() {
  try {
    log('\n📋 Récupération des documents du patient...', 'cyan');
    
    if (!patientId) {
      log('❌ Aucun patient disponible', 'red');
      return false;
    }

    const response = await axios.get(`${BASE_URL}/documents/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${labStaffToken}` }
    });

    if (response.data.success) {
      const documents = response.data.data.documents;
      const patient = response.data.data.patient;
      
      log(`✅ ${documents.length} documents trouvés pour ${patient.name}`, 'green');
      
      documents.forEach(doc => {
        log(`   - ${doc.filename} (${doc.document_type}) - ${new Date(doc.created_at).toLocaleDateString('fr-FR')}`, 'blue');
      });
      
      return true;
    } else {
      log(`❌ Erreur récupération documents: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur récupération documents: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

async function viewDocument() {
  try {
    log('\n👁️ Test de visualisation du document...', 'cyan');
    
    if (!documentId) {
      log('❌ Aucun document disponible', 'red');
      return false;
    }

    const response = await axios.get(`${BASE_URL}/documents/${documentId}/view`, {
      headers: { Authorization: `Bearer ${labStaffToken}` },
      responseType: 'stream'
    });

    if (response.status === 200) {
      log(`✅ Document accessible (Content-Type: ${response.headers['content-type']})`, 'green');
      log(`   Taille: ${response.headers['content-length']} bytes`, 'blue');
      return true;
    } else {
      log(`❌ Erreur visualisation: Status ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur visualisation: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// TESTS DE SUPPRESSION
// ============================================================================

async function deleteDocument() {
  try {
    log('\n🗑️ Suppression du document de test...', 'cyan');
    
    if (!documentId) {
      log('❌ Aucun document à supprimer', 'red');
      return false;
    }

    const response = await axios.delete(`${BASE_URL}/documents/${documentId}`, {
      headers: { Authorization: `Bearer ${labStaffToken}` }
    });

    if (response.data.success) {
      log(`✅ Document supprimé avec succès`, 'green');
      return true;
    } else {
      log(`❌ Erreur suppression: ${response.data.message}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Erreur suppression: ${error.response?.data?.message || error.message}`, 'red');
    return false;
  }
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

async function testDocumentManagement() {
  log('🧪 TESTS GESTION DES DOCUMENTS - PERSONNEL LABORATOIRE', 'bright');
  log('=' .repeat(60), 'bright');
  
  const startTime = Date.now();
  let successCount = 0;
  let totalTests = 0;

  const tests = [
    { name: 'Connexion personnel laboratoire', fn: loginAsLabStaff },
    { name: 'Récupération patients laboratoire', fn: getLabPatients },
    { name: 'Recherche de patients', fn: searchPatients },
    { name: 'Upload de document', fn: uploadDocument },
    { name: 'Récupération documents patient', fn: getPatientDocuments },
    { name: 'Visualisation de document', fn: viewDocument },
    { name: 'Suppression de document', fn: deleteDocument }
  ];

  for (const test of tests) {
    totalTests++;
    try {
      const success = await test.fn();
      if (success) {
        successCount++;
      }
    } catch (error) {
      log(`❌ Erreur inattendue dans ${test.name}: ${error.message}`, 'red');
    }
    
    // Pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  log('\n' + '=' .repeat(60), 'bright');
  log('📊 RÉSUMÉ DES TESTS', 'bright');
  log('=' .repeat(60), 'bright');
  log(`✅ Tests réussis: ${successCount}/${totalTests}`, successCount === totalTests ? 'green' : 'yellow');
  log(`⏱️ Durée totale: ${duration}s`, 'blue');
  
  if (successCount === totalTests) {
    log('\n🎉 TOUS LES TESTS SONT PASSÉS !', 'green');
    log('✅ La gestion des documents fonctionne parfaitement', 'green');
  } else {
    log(`\n⚠️ ${totalTests - successCount} test(s) ont échoué`, 'yellow');
    log('🔧 Vérifiez les erreurs ci-dessus', 'yellow');
  }
}

// Lancer les tests
if (require.main === module) {
  testDocumentManagement().catch(error => {
    log(`💥 Erreur fatale: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { testDocumentManagement };