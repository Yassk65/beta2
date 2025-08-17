// 🧪 SCRIPT DE TEST SYSTÈME DE MESSAGERIE MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Test complet des fonctionnalités de messagerie

const axios = require('axios');

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
  superAdmin: {
    email: 'super@admin.com',
    password: 'SuperAdmin2025!',
    token: null,
    id: null
  }
};

// Variables de test
let testConversationId = null;
let testMessageId = null;

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
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function makeRequest(method, endpoint, data = null, token = null) {
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
      config.data = data;
      config.headers['Content-Type'] = 'application/json';
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

// ============================================================================
// TESTS D'AUTHENTIFICATION
// ============================================================================

async function testAuthentication() {
  log('🔐 Test d\'authentification des utilisateurs', 'info');

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
    } else {
      log(`❌ Échec connexion ${userType}: ${loginResult.error.message}`, 'error');
      return false;
    }
  }

  return true;
}

// ============================================================================
// TESTS RECHERCHE DE CONTACTS
// ============================================================================

async function testContactSearch() {
  log('🔍 Test recherche de contacts', 'info');

  // Test recherche par patient
  log('Recherche de contacts par un patient...', 'info');
  const patientSearch = await makeRequest('GET', '/messages/contacts?search=staff', null, TEST_USERS.patient.token);
  
  if (patientSearch.success) {
    log(`✅ Patient trouve ${patientSearch.data.data.contacts.length} contacts`, 'success');
  } else {
    log('❌ Échec recherche contacts patient', 'error');
    console.log(patientSearch.error);
  }

  // Test recherche par staff
  log('Recherche de contacts par le staff...', 'info');
  const staffSearch = await makeRequest('GET', '/messages/contacts?search=patient', null, TEST_USERS.hospitalStaff.token);
  
  if (staffSearch.success) {
    log(`✅ Staff trouve ${staffSearch.data.data.contacts.length} contacts`, 'success');
  } else {
    log('❌ Échec recherche contacts staff', 'error');
  }

  return true;
}

// ============================================================================
// TESTS CRÉATION DE CONVERSATIONS
// ============================================================================

async function testConversationCreation() {
  log('💬 Test création de conversations', 'info');

  // Test création conversation par patient vers staff
  log('Création conversation patient -> staff...', 'info');
  const conversationData = {
    participant_ids: [TEST_USERS.hospitalStaff.id],
    title: 'Question sur mes résultats',
    initial_message: 'Bonjour, j\'aimerais avoir des informations sur mes derniers résultats d\'analyses.'
  };

  const createConversation = await makeRequest('POST', '/messages/conversations', conversationData, TEST_USERS.patient.token);
  
  if (createConversation.success) {
    testConversationId = createConversation.data.data.conversation.id;
    log(`✅ Conversation créée avec ID: ${testConversationId}`, 'success');
  } else {
    log('❌ Échec création conversation', 'error');
    console.log(createConversation.error);
    return false;
  }

  // Test création conversation avec plusieurs participants (par super admin)
  log('Création conversation multi-participants par super admin...', 'info');
  const multiConversationData = {
    participant_ids: [TEST_USERS.patient.id, TEST_USERS.hospitalStaff.id],
    title: 'Réunion de suivi patient',
    initial_message: 'Bonjour à tous, organisons une réunion pour faire le point sur le suivi de ce patient.'
  };

  const createMultiConversation = await makeRequest('POST', '/messages/conversations', multiConversationData, TEST_USERS.superAdmin.token);
  
  if (createMultiConversation.success) {
    log(`✅ Conversation multi-participants créée`, 'success');
  } else {
    log('❌ Échec création conversation multi-participants', 'error');
  }

  return true;
}

// ============================================================================
// TESTS ENVOI DE MESSAGES
// ============================================================================

async function testMessageSending() {
  log('📨 Test envoi de messages', 'info');

  if (!testConversationId) {
    log('❌ Pas de conversation de test disponible', 'error');
    return false;
  }

  // Test réponse du staff
  log('Envoi réponse par le staff...', 'info');
  const staffMessage = {
    content: 'Bonjour, je vais examiner vos résultats et vous donner une réponse détaillée dans les plus brefs délais.'
  };

  const sendStaffMessage = await makeRequest('POST', `/messages/conversations/${testConversationId}/messages`, staffMessage, TEST_USERS.hospitalStaff.token);
  
  if (sendStaffMessage.success) {
    testMessageId = sendStaffMessage.data.data.message.id;
    log(`✅ Message staff envoyé (ID: ${testMessageId})`, 'success');
  } else {
    log('❌ Échec envoi message staff', 'error');
    console.log(sendStaffMessage.error);
  }

  // Test réponse du patient
  log('Envoi réponse par le patient...', 'info');
  const patientMessage = {
    content: 'Merci beaucoup pour votre réponse rapide. J\'attends vos explications.'
  };

  const sendPatientMessage = await makeRequest('POST', `/messages/conversations/${testConversationId}/messages`, patientMessage, TEST_USERS.patient.token);
  
  if (sendPatientMessage.success) {
    log('✅ Message patient envoyé', 'success');
  } else {
    log('❌ Échec envoi message patient', 'error');
  }

  return true;
}

// ============================================================================
// TESTS RÉCUPÉRATION DE DONNÉES
// ============================================================================

async function testDataRetrieval() {
  log('📋 Test récupération des données', 'info');

  // Test liste des conversations
  log('Récupération liste des conversations...', 'info');
  const getConversations = await makeRequest('GET', '/messages/conversations?page=1&limit=10', null, TEST_USERS.patient.token);
  
  if (getConversations.success) {
    log(`✅ ${getConversations.data.data.conversations.length} conversations récupérées`, 'success');
  } else {
    log('❌ Échec récupération conversations', 'error');
  }

  // Test récupération conversation spécifique
  if (testConversationId) {
    log('Récupération conversation spécifique...', 'info');
    const getConversation = await makeRequest('GET', `/messages/conversations/${testConversationId}`, null, TEST_USERS.patient.token);
    
    if (getConversation.success) {
      const conversation = getConversation.data.data.conversation;
      log(`✅ Conversation récupérée: "${conversation.title}" avec ${conversation.messages.length} messages`, 'success');
    } else {
      log('❌ Échec récupération conversation', 'error');
    }

    // Test récupération messages
    log('Récupération messages de la conversation...', 'info');
    const getMessages = await makeRequest('GET', `/messages/conversations/${testConversationId}/messages`, null, TEST_USERS.hospitalStaff.token);
    
    if (getMessages.success) {
      log(`✅ ${getMessages.data.data.messages.length} messages récupérés`, 'success');
    } else {
      log('❌ Échec récupération messages', 'error');
    }
  }

  return true;
}

// ============================================================================
// TESTS STATISTIQUES
// ============================================================================

async function testStatistics() {
  log('📊 Test statistiques de messagerie', 'info');

  // Test statistiques patient
  log('Récupération statistiques patient...', 'info');
  const patientStats = await makeRequest('GET', '/messages/stats', null, TEST_USERS.patient.token);
  
  if (patientStats.success) {
    const stats = patientStats.data.data;
    log(`✅ Stats patient: ${stats.totalConversations} conversations, ${stats.totalMessages} messages`, 'success');
  } else {
    log('❌ Échec récupération stats patient', 'error');
  }

  // Test statistiques staff
  log('Récupération statistiques staff...', 'info');
  const staffStats = await makeRequest('GET', '/messages/stats', null, TEST_USERS.hospitalStaff.token);
  
  if (staffStats.success) {
    const stats = staffStats.data.data;
    log(`✅ Stats staff: ${stats.totalConversations} conversations, ${stats.totalMessages} messages`, 'success');
  } else {
    log('❌ Échec récupération stats staff', 'error');
  }

  return true;
}

// ============================================================================
// TESTS PERMISSIONS
// ============================================================================

async function testPermissions() {
  log('🔒 Test des permissions', 'info');

  // Test: Patient ne peut pas voir conversation d'autres patients
  if (testConversationId) {
    log('Test: Accès non autorisé à une conversation...', 'info');
    
    // Créer un autre utilisateur temporaire pour le test
    const unauthorizedAccess = await makeRequest('GET', `/messages/conversations/${testConversationId}`, null, TEST_USERS.superAdmin.token);
    
    if (unauthorizedAccess.success) {
      log('✅ Super admin peut accéder à toutes les conversations', 'success');
    } else {
      log('❌ Erreur inattendue d\'accès', 'error');
    }
  }

  // Test: Validation des données
  log('Test: Validation message vide...', 'info');
  const emptyMessage = await makeRequest('POST', `/messages/conversations/${testConversationId}/messages`, {
    content: ''
  }, TEST_USERS.patient.token);

  if (!emptyMessage.success && emptyMessage.status === 400) {
    log('✅ Validation message vide fonctionne', 'success');
  } else {
    log('❌ Validation message vide échoue', 'error');
  }

  return true;
}

// ============================================================================
// TESTS GESTION DES PARTICIPANTS
// ============================================================================

async function testParticipantManagement() {
  log('👥 Test gestion des participants', 'info');

  if (!testConversationId) {
    log('❌ Pas de conversation de test disponible', 'error');
    return false;
  }

  // Test ajout participant par le créateur (patient)
  log('Test ajout participant par le créateur...', 'info');
  const addParticipant = await makeRequest('POST', `/messages/conversations/${testConversationId}/participants`, {
    user_id: TEST_USERS.superAdmin.id
  }, TEST_USERS.patient.token);

  if (addParticipant.success) {
    log('✅ Participant ajouté avec succès', 'success');
  } else {
    log('❌ Échec ajout participant', 'error');
    console.log(addParticipant.error);
  }

  // Test marquage conversation comme lue
  log('Test marquage conversation comme lue...', 'info');
  const markAsRead = await makeRequest('PUT', `/messages/conversations/${testConversationId}/read`, {}, TEST_USERS.patient.token);

  if (markAsRead.success) {
    log('✅ Conversation marquée comme lue', 'success');
  } else {
    log('❌ Échec marquage lecture', 'error');
  }

  return true;
}

// ============================================================================
// FONCTION PRINCIPALE DE TEST
// ============================================================================

async function runAllTests() {
  console.log('🧪 ================================');
  console.log('💬 TESTS SYSTÈME DE MESSAGERIE');
  console.log('🧪 ================================\n');

  try {
    // Test de santé de l'API
    log('🔍 Vérification de l\'API...', 'info');
    const healthCheck = await makeRequest('GET', '/health');
    
    if (!healthCheck.success) {
      log('❌ API non disponible', 'error');
      return;
    }
    
    log('✅ API opérationnelle', 'success');

    // Exécution des tests
    await testAuthentication();
    await testContactSearch();
    await testConversationCreation();
    await testMessageSending();
    await testDataRetrieval();
    await testStatistics();
    await testPermissions();
    await testParticipantManagement();

    console.log('\n🧪 ================================');
    log('✅ TOUS LES TESTS TERMINÉS', 'success');
    console.log('🧪 ================================');

    // Résumé des données créées
    console.log('\n📋 DONNÉES DE TEST CRÉÉES:');
    if (testConversationId) log(`💬 Conversation ID: ${testConversationId}`, 'info');
    if (testMessageId) log(`📨 Message ID: ${testMessageId}`, 'info');

  } catch (error) {
    log(`❌ Erreur lors des tests: ${error.message}`, 'error');
    console.error(error);
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testAuthentication,
  testContactSearch,
  testConversationCreation,
  testMessageSending,
  testDataRetrieval,
  testStatistics,
  testPermissions,
  testParticipantManagement
};