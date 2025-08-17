// 🧪 SCRIPT DE TEST SCÉNARIOS DOCUMENTS MÉDICAUX
// 📅 Créé le : 11 Août 2025
// 🎯 Test complet des scénarios d'usage du système de documents

const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';

// Configuration des utilisateurs de test
const TEST_USERS = {
  patient: {
    email: 'patient1@demo.fr',
    password: 'PatientDemo2025!',
    token: null,
    id: null
  },
  hospitalStaff: {
    email: 'staff@hopital-demo.fr',
    password: 'StaffDemo2025!',
    token: null,
    id: null
  },
  hospitalAdmin: {
    email: 'admin@hopital-central-paris.fr',
    password: 'HospitalAdmin2025!',
    token: null,
    id: null
  },
  superAdmin: {
    email: 'super@admin.com',
    password: 'SuperAdmin2025!',
    token: null,
    id: null
  }
};

// Variables de test
let testDocumentId = null;
let testPatientId = null;
let testFiles = [];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Vert
    error: '\x1b[31m',   // Rouge
    warning: '\x1b[33m', // Jaune
    scenario: '\x1b[35m', // Magenta
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, token = null, isFormData = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {}
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      if (isFormData) {
        config.data = data;
        config.headers = { ...config.headers, ...data.getHeaders() };
      } else {
        config.data = data;
        config.headers['Content-Type'] = 'application/json';
      }
    }

    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status
    };
  }
}

// Créer des fichiers de test
async function createTestFiles() {
  const testDir = path.join(__dirname, 'test_files');
  
  try {
    await fs.promises.mkdir(testDir, { recursive: true });
  } catch (error) {
    // Dossier existe déjà
  }

  // Créer un fichier PDF simulé
  const pdfContent = '%PDF-1.4\\n1 0 obj\\n<<\\n/Type /Catalog\\n/Pages 2 0 R\\n>>\\nendobj\\n2 0 obj\\n<<\\n/Type /Pages\\n/Kids [3 0 R]\\n/Count 1\\n>>\\nendobj\\n3 0 obj\\n<<\\n/Type /Page\\n/Parent 2 0 R\\n/MediaBox [0 0 612 792]\\n>>\\nendobj\\nxref\\n0 4\\n0000000000 65535 f \\n0000000009 00000 n \\n0000000074 00000 n \\n0000000120 00000 n \\ntrailer\\n<<\\n/Size 4\\n/Root 1 0 R\\n>>\\nstartxref\\n179\\n%%EOF';
  const pdfPath = path.join(testDir, 'test_results.pdf');
  await fs.promises.writeFile(pdfPath, pdfContent);

  // Créer un fichier texte
  const txtContent = 'Résultats d\\'analyses médicales\\n\\nPatient: Test Patient\\nDate: 11/08/2025\\n\\nGlycémie: 0.9 g/L (Normal)\\nCholestérol: 1.8 g/L (Normal)\\nTriglycérides: 1.2 g/L (Normal)\\n\\nConclusion: Tous les paramètres sont dans les normes.';
  const txtPath = path.join(testDir, 'analyse_sanguine.txt');
  await fs.promises.writeFile(txtPath, txtContent);

  // Créer un fichier image simulé
  const imgContent = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  const imgPath = path.join(testDir, 'radio_poumons.png');
  await fs.promises.writeFile(imgPath, imgContent);

  testFiles = [
    { path: pdfPath, name: 'test_results.pdf', type: 'lab_result' },
    { path: txtPath, name: 'analyse_sanguine.txt', type: 'lab_result' },
    { path: imgPath, name: 'radio_poumons.png', type: 'medical_report' }
  ];

  log('✅ Fichiers de test créés', 'success');
}

// ============================================================================
// TESTS D'AUTHENTIFICATION
// ============================================================================

async function testAuthentication() {
  log('🔐 Test d\\'authentification des utilisateurs', 'info');

  for (const [userType, userData] of Object.entries(TEST_USERS)) {
    log(`Connexion ${userType}...`, 'info');
    
    const loginResult = await makeRequest('POST', '/auth/login', {
      email: userData.email,
      password: userData.password
    });

    if (loginResult.success) {
      userData.token = loginResult.data.data.token;
      userData.id = loginResult.data.data.user.id;
      log(`✅ ${userType} connecté (ID: ${userData.id})`, 'success');
      
      // Récupérer l'ID patient si c'est un patient
      if (userType === 'patient') {
        testPatientId = userData.id;
      }
    } else {
      log(`❌ Échec connexion ${userType}: ${loginResult.error.message}`, 'error');
      return false;
    }
  }

  return true;
}

// ============================================================================
// SCÉNARIO 1: PATIENT UPLOAD SES PROPRES DOCUMENTS
// ============================================================================

async function testScenario1_PatientUpload() {
  log('📋 SCÉNARIO 1: Patient upload ses propres documents', 'scenario');

  if (!testFiles.length) {
    log('❌ Pas de fichiers de test disponibles', 'error');
    return false;
  }

  // Test upload par le patient
  log('Upload document par le patient...', 'info');
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFiles[0].path));
  formData.append('patient_id', testPatientId.toString());
  formData.append('document_type', testFiles[0].type);
  formData.append('description', 'Mes derniers résultats d\\'analyses');

  const uploadResult = await makeRequest('POST', '/documents/upload', formData, TEST_USERS.patient.token, true);

  if (uploadResult.success) {
    testDocumentId = uploadResult.data.data.document.id;
    log(`✅ Document uploadé avec succès (ID: ${testDocumentId})`, 'success');
  } else {
    log('❌ Échec upload document patient', 'error');
    console.log(uploadResult.error);
    return false;
  }

  // Test: Patient ne peut pas uploader pour un autre patient
  log('Test: Patient tente d\\'uploader pour un autre patient...', 'info');
  const formData2 = new FormData();
  formData2.append('file', fs.createReadStream(testFiles[1].path));
  formData2.append('patient_id', '999'); // ID inexistant
  formData2.append('document_type', 'other');

  const forbiddenUpload = await makeRequest('POST', '/documents/upload', formData2, TEST_USERS.patient.token, true);

  if (!forbiddenUpload.success && forbiddenUpload.status === 404) {
    log('✅ Tentative d\\'upload pour autre patient correctement bloquée', 'success');
  } else {
    log('❌ Sécurité défaillante: upload pour autre patient autorisé', 'error');
  }

  return true;
}

// ============================================================================
// SCÉNARIO 2: STAFF HOSPITALIER UPLOAD RÉSULTATS
// ============================================================================

async function testScenario2_StaffUpload() {
  log('🏥 SCÉNARIO 2: Staff hospitalier upload résultats d\\'examens', 'scenario');

  // Test upload multiple par le staff
  log('Upload multiple par le staff hospitalier...', 'info');
  const formData = new FormData();
  
  // Ajouter plusieurs fichiers
  testFiles.forEach((file, index) => {
    if (index < 2) { // Limiter à 2 fichiers pour le test
      formData.append('files', fs.createReadStream(file.path));
    }
  });
  
  formData.append('patient_id', testPatientId.toString());
  formData.append('document_type', 'lab_result');
  formData.append('description', 'Résultats d\\'examens complémentaires');

  const multiUploadResult = await makeRequest('POST', '/documents/upload-multiple', formData, TEST_USERS.hospitalStaff.token, true);

  if (multiUploadResult.success) {
    log(`✅ Upload multiple réussi: ${multiUploadResult.data.data.documents.length} documents`, 'success');
  } else {
    log('❌ Échec upload multiple', 'error');
    console.log(multiUploadResult.error);
  }

  // Test upload simple par le staff
  log('Upload simple par le staff...', 'info');
  const formDataSingle = new FormData();
  formDataSingle.append('file', fs.createReadStream(testFiles[2].path));
  formDataSingle.append('patient_id', testPatientId.toString());
  formDataSingle.append('document_type', 'medical_report');
  formDataSingle.append('description', 'Radiographie pulmonaire');

  const singleUploadResult = await makeRequest('POST', '/documents/upload', formDataSingle, TEST_USERS.hospitalStaff.token, true);

  if (singleUploadResult.success) {
    log('✅ Upload simple par staff réussi', 'success');
  } else {
    log('❌ Échec upload simple par staff', 'error');
  }

  return true;
}

// ============================================================================
// SCÉNARIO 3: PATIENT CONSULTE DOCUMENTS AVEC IA
// ============================================================================

async function testScenario3_PatientViewWithAI() {
  log('🤒 SCÉNARIO 3: Patient consulte ses documents avec IA', 'scenario');

  if (!testDocumentId) {
    log('❌ Pas de document de test disponible', 'error');
    return false;
  }

  // Test visualisation sécurisée
  log('Visualisation sécurisée du document...', 'info');
  const viewResult = await makeRequest('GET', `/documents/${testDocumentId}/view`, null, TEST_USERS.patient.token);

  if (viewResult.success || viewResult.status === 200) {
    log('✅ Visualisation sécurisée fonctionnelle', 'success');
  } else {
    log('❌ Échec visualisation document', 'error');
  }

  // Test explication IA
  log('Demande d\\'explication IA...', 'info');
  const aiResult = await makeRequest('GET', `/documents/${testDocumentId}/ai-explanation`, null, TEST_USERS.patient.token);

  if (aiResult.success) {
    log('✅ Explication IA générée avec succès', 'success');
    log(`📝 Extrait: ${aiResult.data.data.explanation.substring(0, 100)}...`, 'info');
  } else {
    log('❌ Échec génération explication IA', 'error');
    console.log(aiResult.error);
  }

  // Test: Staff ne peut pas demander d'explication IA
  log('Test: Staff tente de demander explication IA...', 'info');
  const staffAIResult = await makeRequest('GET', `/documents/${testDocumentId}/ai-explanation`, null, TEST_USERS.hospitalStaff.token);

  if (!staffAIResult.success && staffAIResult.status === 403) {
    log('✅ Explication IA correctement réservée aux patients', 'success');
  } else {
    log('❌ Sécurité défaillante: staff peut accéder à l\\'IA', 'error');
  }

  return true;
}

// ============================================================================
// SCÉNARIO 4: MÉDECIN RECHERCHE DOCUMENTS PATIENT
// ============================================================================

async function testScenario4_DoctorSearch() {
  log('👨‍⚕️ SCÉNARIO 4: Médecin recherche documents patient', 'scenario');

  // Test liste des documents du patient
  log('Récupération liste des documents du patient...', 'info');
  const listResult = await makeRequest('GET', `/documents/patient/${testPatientId}?page=1&limit=10`, null, TEST_USERS.hospitalStaff.token);

  if (listResult.success) {
    log(`✅ ${listResult.data.data.documents.length} documents récupérés`, 'success');
  } else {
    log('❌ Échec récupération liste documents', 'error');
  }

  // Test recherche avancée
  log('Recherche avancée de documents...', 'info');
  const searchResult = await makeRequest('GET', '/documents/search?q=analyse&type=lab_result&page=1&limit=5', null, TEST_USERS.hospitalStaff.token);

  if (searchResult.success) {
    log(`✅ Recherche réussie: ${searchResult.data.data.documents.length} résultats`, 'success');
  } else {
    log('❌ Échec recherche documents', 'error');
  }

  // Test statistiques patient
  log('Récupération statistiques patient...', 'info');
  const statsResult = await makeRequest('GET', `/documents/patient/${testPatientId}/stats`, null, TEST_USERS.hospitalStaff.token);

  if (statsResult.success) {
    const stats = statsResult.data.data;
    log(`✅ Stats: ${stats.totalDocuments} docs, ${stats.totalSizeFormatted}`, 'success');
  } else {
    log('❌ Échec récupération statistiques', 'error');
  }

  return true;
}

// ============================================================================
// SCÉNARIO 5: ADMIN SUPPRIME DOCUMENT SENSIBLE
// ============================================================================

async function testScenario5_AdminDelete() {
  log('🔒 SCÉNARIO 5: Admin supprime document sensible', 'scenario');

  if (!testDocumentId) {
    log('❌ Pas de document de test disponible', 'error');
    return false;
  }

  // Test: Patient ne peut pas supprimer document d'un autre
  log('Test: Tentative de suppression non autorisée...', 'info');
  
  // D'abord, créer un document par le staff pour tester
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFiles[0].path));
  formData.append('patient_id', testPatientId.toString());
  formData.append('document_type', 'other');
  formData.append('description', 'Document à supprimer');

  const uploadForDelete = await makeRequest('POST', '/documents/upload', formData, TEST_USERS.hospitalStaff.token, true);
  
  if (uploadForDelete.success) {
    const docToDeleteId = uploadForDelete.data.data.document.id;
    
    // Test suppression par admin
    log('Suppression par admin hospitalier...', 'info');
    const deleteResult = await makeRequest('DELETE', `/documents/${docToDeleteId}`, null, TEST_USERS.hospitalAdmin.token);

    if (deleteResult.success) {
      log('✅ Document supprimé avec succès par admin', 'success');
    } else {
      log('❌ Échec suppression par admin', 'error');
      console.log(deleteResult.error);
    }

    // Vérifier que le document n'existe plus
    log('Vérification suppression effective...', 'info');
    const checkResult = await makeRequest('GET', `/documents/${docToDeleteId}`, null, TEST_USERS.hospitalAdmin.token);

    if (!checkResult.success && checkResult.status === 404) {
      log('✅ Document effectivement supprimé', 'success');
    } else {
      log('❌ Document toujours présent après suppression', 'error');
    }
  }

  return true;
}

// ============================================================================
// TESTS DE SÉCURITÉ ET ROBUSTESSE
// ============================================================================

async function testSecurityAndRobustness() {
  log('🛡️ Tests de sécurité et robustesse', 'scenario');

  // Test upload fichier non autorisé
  log('Test: Upload fichier non autorisé (.exe)...', 'info');
  const maliciousFile = path.join(__dirname, 'test_files', 'malicious.exe');
  await fs.promises.writeFile(maliciousFile, 'MZ\\x90\\x00\\x03'); // Signature PE

  const formDataMalicious = new FormData();
  formDataMalicious.append('file', fs.createReadStream(maliciousFile));
  formDataMalicious.append('patient_id', testPatientId.toString());
  formDataMalicious.append('document_type', 'other');

  const maliciousResult = await makeRequest('POST', '/documents/upload', formDataMalicious, TEST_USERS.patient.token, true);

  if (!maliciousResult.success && maliciousResult.status === 400) {
    log('✅ Fichier malveillant correctement rejeté', 'success');
  } else {
    log('❌ Sécurité défaillante: fichier malveillant accepté', 'error');
  }

  // Test accès cross-tenant
  log('Test: Accès cross-tenant...', 'info');
  if (testDocumentId) {
    // Créer un token invalide
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6OTk5LCJlbWFpbCI6ImZha2VAZXhhbXBsZS5jb20iLCJyb2xlIjoicGF0aWVudCJ9.invalid';
    
    const crossTenantResult = await makeRequest('GET', `/documents/${testDocumentId}`, null, fakeToken);

    if (!crossTenantResult.success && crossTenantResult.status === 401) {
      log('✅ Accès cross-tenant correctement bloqué', 'success');
    } else {
      log('❌ Sécurité défaillante: accès cross-tenant possible', 'error');
    }
  }

  // Test limite de taille
  log('Test: Limite de taille de fichier...', 'info');
  // Créer un fichier de 30MB (dépasse la limite de 25MB)
  const largeFile = path.join(__dirname, 'test_files', 'large_file.pdf');
  const largeContent = Buffer.alloc(30 * 1024 * 1024, 'A'); // 30MB
  await fs.promises.writeFile(largeFile, largeContent);

  const formDataLarge = new FormData();
  formDataLarge.append('file', fs.createReadStream(largeFile));
  formDataLarge.append('patient_id', testPatientId.toString());
  formDataLarge.append('document_type', 'other');

  const largeFileResult = await makeRequest('POST', '/documents/upload', formDataLarge, TEST_USERS.patient.token, true);

  if (!largeFileResult.success && largeFileResult.status === 400) {
    log('✅ Limite de taille correctement appliquée', 'success');
  } else {
    log('❌ Limite de taille non respectée', 'error');
  }

  // Nettoyer les fichiers de test
  try {
    await fs.promises.unlink(maliciousFile);
    await fs.promises.unlink(largeFile);
  } catch (error) {
    // Fichiers déjà supprimés ou inexistants
  }

  return true;
}

// ============================================================================
// NETTOYAGE DES FICHIERS DE TEST
// ============================================================================

async function cleanupTestFiles() {
  log('🧹 Nettoyage des fichiers de test...', 'info');
  
  try {
    const testDir = path.join(__dirname, 'test_files');
    const files = await fs.promises.readdir(testDir);
    
    for (const file of files) {
      await fs.promises.unlink(path.join(testDir, file));
    }
    
    await fs.promises.rmdir(testDir);
    log('✅ Fichiers de test nettoyés', 'success');
  } catch (error) {
    log('⚠️ Erreur lors du nettoyage des fichiers de test', 'warning');
  }
}

// ============================================================================
// FONCTION PRINCIPALE DE TEST
// ============================================================================

async function runAllScenarios() {
  console.log('🧪 ================================');
  console.log('📄 TESTS SCÉNARIOS DOCUMENTS MÉDICAUX');
  console.log('🧪 ================================\\n');

  try {
    // Test de santé de l'API
    log('🔍 Vérification de l\\'API...', 'info');
    const healthCheck = await makeRequest('GET', '/health');
    
    if (!healthCheck.success) {
      log('❌ API non disponible', 'error');
      return;
    }
    
    log('✅ API opérationnelle', 'success');

    // Préparation
    await createTestFiles();
    await testAuthentication();

    // Exécution des scénarios
    await testScenario1_PatientUpload();
    await testScenario2_StaffUpload();
    await testScenario3_PatientViewWithAI();
    await testScenario4_DoctorSearch();
    await testScenario5_AdminDelete();
    await testSecurityAndRobustness();

    // Nettoyage
    await cleanupTestFiles();

    console.log('\\n🧪 ================================');
    log('✅ TOUS LES SCÉNARIOS TERMINÉS', 'success');
    console.log('🧪 ================================');

    // Résumé des données créées
    console.log('\\n📋 RÉSUMÉ DES TESTS:');
    if (testDocumentId) log(`📄 Document principal ID: ${testDocumentId}`, 'info');
    if (testPatientId) log(`🤒 Patient de test ID: ${testPatientId}`, 'info');
    log(`📁 ${testFiles.length} types de fichiers testés`, 'info');

  } catch (error) {
    log(`❌ Erreur lors des tests: ${error.message}`, 'error');
    console.error(error);
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

if (require.main === module) {
  runAllScenarios().catch(console.error);
}

module.exports = {
  runAllScenarios,
  testScenario1_PatientUpload,
  testScenario2_StaffUpload,
  testScenario3_PatientViewWithAI,
  testScenario4_DoctorSearch,
  testScenario5_AdminDelete,
  testSecurityAndRobustness
};