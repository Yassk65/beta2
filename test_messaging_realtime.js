// 🧪 TEST MESSAGERIE TEMPS RÉEL
// 📅 Créé le : 22 Août 2025
// 🎯 Tester la fonctionnalité de messagerie avec WebSocket

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const io = require('socket.io-client');

const prisma = new PrismaClient();
const API_BASE = 'http://localhost:3000/api';
const WS_BASE = 'http://localhost:3000';

let testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

// Fonction pour logger les résultats
function logTest(name, passed, message) {
  const result = { name, passed, message, timestamp: new Date().toISOString() };
  testResults.tests.push(result);
  
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${name}: ${message}`);
  } else {
    testResults.failed++;
    console.log(`❌ ${name}: ${message}`);
  }
}

// Fonction pour attendre
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runMessagingTests() {
  console.log('🧪 DÉMARRAGE DES TESTS DE MESSAGERIE TEMPS RÉEL\n');

  let patientToken = null;
  let doctorToken = null;
  let conversationId = null;
  let patientSocket = null;
  let doctorSocket = null;

  try {
    // =================================================================
    // TEST 1: Connexion des utilisateurs
    // =================================================================
    console.log('📡 TEST 1: Connexion des utilisateurs...');
    
    // Connexion patient
    try {
      const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'patient.test@example.com',
        password: 'Patient123!'
      });
      
      if (patientLogin.data.success) {
        patientToken = patientLogin.data.data.token;
        logTest('Patient Login', true, 'Patient connecté avec succès');
      } else {
        throw new Error(patientLogin.data.message);
      }
    } catch (error) {
      logTest('Patient Login', false, `Erreur connexion patient: ${error.message}`);
      return;
    }

    // Connexion médecin (ou utilisateur staff)
    try {
      const doctorLogin = await axios.post(`${API_BASE}/auth/login`, {
        email: 'hospital.admin@chu-ouaga.bf',
        password: 'Admin123!'
      });
      
      if (doctorLogin.data.success) {
        doctorToken = doctorLogin.data.data.token;
        logTest('Doctor Login', true, 'Médecin connecté avec succès');
      } else {
        throw new Error(doctorLogin.data.message);
      }
    } catch (error) {
      logTest('Doctor Login', false, `Erreur connexion médecin: ${error.message}`);
      return;
    }

    // =================================================================
    // TEST 2: Connexion WebSocket
    // =================================================================
    console.log('\n🔌 TEST 2: Connexion WebSocket...');
    
    // Connexion patient WebSocket
    patientSocket = io(WS_BASE, {
      auth: { token: patientToken },
      transports: ['websocket', 'polling']
    });

    // Connexion médecin WebSocket
    doctorSocket = io(WS_BASE, {
      auth: { token: doctorToken },
      transports: ['websocket', 'polling']
    });

    // Attendre les connexions
    await new Promise((resolve, reject) => {
      let connectionsCount = 0;
      const timeout = setTimeout(() => reject(new Error('Timeout connexion WebSocket')), 5000);

      patientSocket.on('connect', () => {
        connectionsCount++;
        logTest('Patient WebSocket', true, 'Patient connecté au WebSocket');
        if (connectionsCount === 2) {
          clearTimeout(timeout);
          resolve();
        }
      });

      doctorSocket.on('connect', () => {
        connectionsCount++;
        logTest('Doctor WebSocket', true, 'Médecin connecté au WebSocket');
        if (connectionsCount === 2) {
          clearTimeout(timeout);
          resolve();
        }
      });

      patientSocket.on('connect_error', (error) => {
        logTest('Patient WebSocket', false, `Erreur connexion: ${error.message}`);
        clearTimeout(timeout);
        reject(error);
      });

      doctorSocket.on('connect_error', (error) => {
        logTest('Doctor WebSocket', false, `Erreur connexion: ${error.message}`);
        clearTimeout(timeout);
        reject(error);
      });
    });

    // =================================================================
    // TEST 3: Recherche de contacts
    // =================================================================
    console.log('\n🔍 TEST 3: Recherche de contacts...');
    
    try {
      const contactsSearch = await axios.get(`${API_BASE}/messages/contacts?search=admin`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      if (contactsSearch.data.success && contactsSearch.data.data.contacts.length > 0) {
        logTest('Contact Search', true, `${contactsSearch.data.data.contacts.length} contacts trouvés`);
      } else {
        logTest('Contact Search', false, 'Aucun contact trouvé');
      }
    } catch (error) {
      logTest('Contact Search', false, `Erreur recherche contacts: ${error.message}`);
    }

    // =================================================================
    // TEST 4: Création de conversation
    // =================================================================
    console.log('\n💬 TEST 4: Création de conversation...');
    
    try {
      // Récupérer l'ID du médecin
      const doctorProfile = await axios.get(`${API_BASE}/auth/profile`, {
        headers: { Authorization: `Bearer ${doctorToken}` }
      });
      
      const doctorId = doctorProfile.data.data.user.id;
      
      const conversationCreate = await axios.post(`${API_BASE}/messages/conversations`, {
        participant_ids: [doctorId],
        title: 'Test Conversation - Messagerie Temps Réel',
        initial_message: 'Bonjour, ceci est un test de la messagerie temps réel !'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      if (conversationCreate.data.success) {
        conversationId = conversationCreate.data.data.conversation.id;
        logTest('Create Conversation', true, `Conversation créée avec ID: ${conversationId}`);
      } else {
        throw new Error(conversationCreate.data.message);
      }
    } catch (error) {
      logTest('Create Conversation', false, `Erreur création conversation: ${error.message}`);
      return;
    }

    // =================================================================
    // TEST 5: Rejoindre la conversation (WebSocket)
    // =================================================================
    console.log('\n🏠 TEST 5: Rejoindre la conversation...');
    
    // Les deux utilisateurs rejoignent la conversation
    patientSocket.emit('join_conversation', conversationId);
    doctorSocket.emit('join_conversation', conversationId);
    
    await delay(1000);
    logTest('Join Conversation', true, 'Utilisateurs ont rejoint la conversation');

    // =================================================================
    // TEST 6: Test de messagerie temps réel
    // =================================================================
    console.log('\n📨 TEST 6: Test de messagerie temps réel...');
    
    let messageReceived = false;
    let notificationReceived = false;

    // Écouter les nouveaux messages
    doctorSocket.on('new_message', (message) => {
      if (message.conversation_id === conversationId) {
        messageReceived = true;
        logTest('Real-time Message', true, `Message reçu: "${message.content}"`);
      }
    });

    // Écouter les notifications
    doctorSocket.on('new_notification', (notification) => {
      if (notification.type === 'new_message') {
        notificationReceived = true;
        logTest('Real-time Notification', true, `Notification reçue: "${notification.title}"`);
      }
    });

    // Envoyer un message
    try {
      const messageResponse = await axios.post(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
        content: 'Test de message temps réel ! 🚀'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      if (messageResponse.data.success) {
        logTest('Send Message', true, 'Message envoyé avec succès');
        
        // Attendre la réception temps réel
        await delay(2000);
        
        if (!messageReceived) {
          logTest('Real-time Message', false, 'Message temps réel non reçu');
        }
        
        if (!notificationReceived) {
          logTest('Real-time Notification', false, 'Notification temps réel non reçue');
        }
      } else {
        throw new Error(messageResponse.data.message);
      }
    } catch (error) {
      logTest('Send Message', false, `Erreur envoi message: ${error.message}`);
    }

    // =================================================================
    // TEST 7: Test de l'indicateur "en train d'écrire"
    // =================================================================
    console.log('\n⌨️ TEST 7: Test indicateur "en train d\'écrire"...');
    
    let typingReceived = false;

    doctorSocket.on('typing_status', (status) => {
      if (status.conversation_id === conversationId && status.is_typing) {
        typingReceived = true;
        logTest('Typing Indicator', true, 'Indicateur "en train d\'écrire" reçu');
      }
    });

    // Envoyer l'indicateur de frappe
    patientSocket.emit('typing_status', {
      conversation_id: conversationId,
      is_typing: true
    });

    await delay(1000);

    if (!typingReceived) {
      logTest('Typing Indicator', false, 'Indicateur "en train d\'écrire" non reçu');
    }

    // =================================================================
    // TEST 8: Récupération des conversations
    // =================================================================
    console.log('\n📋 TEST 8: Récupération des conversations...');
    
    try {
      const conversationsResponse = await axios.get(`${API_BASE}/messages/conversations`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      if (conversationsResponse.data.success) {
        const conversations = conversationsResponse.data.data.conversations;
        const testConv = conversations.find(c => c.id === conversationId);
        
        if (testConv) {
          logTest('Get Conversations', true, `Conversation trouvée avec ${testConv.messageCount} messages`);
        } else {
          logTest('Get Conversations', false, 'Conversation de test non trouvée');
        }
      } else {
        throw new Error(conversationsResponse.data.message);
      }
    } catch (error) {
      logTest('Get Conversations', false, `Erreur récupération conversations: ${error.message}`);
    }

    // =================================================================
    // TEST 9: Récupération des messages
    // =================================================================
    console.log('\n📖 TEST 9: Récupération des messages...');
    
    try {
      const messagesResponse = await axios.get(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      if (messagesResponse.data.success) {
        const messages = messagesResponse.data.data.messages;
        logTest('Get Messages', true, `${messages.length} messages récupérés`);
      } else {
        throw new Error(messagesResponse.data.message);
      }
    } catch (error) {
      logTest('Get Messages', false, `Erreur récupération messages: ${error.message}`);
    }

    // =================================================================
    // NETTOYAGE
    // =================================================================
    console.log('\n🧹 Nettoyage...');
    
    if (patientSocket) {
      patientSocket.disconnect();
    }
    
    if (doctorSocket) {
      doctorSocket.disconnect();
    }

    // Supprimer la conversation de test
    if (conversationId) {
      try {
        await prisma.message.deleteMany({
          where: { conversation_id: conversationId }
        });
        
        await prisma.conversationParticipant.deleteMany({
          where: { conversation_id: conversationId }
        });
        
        await prisma.conversation.delete({
          where: { id: conversationId }
        });
        
        console.log('🗑️ Conversation de test supprimée');
      } catch (error) {
        console.log(`⚠️ Erreur nettoyage: ${error.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Erreur générale des tests:', error.message);
    logTest('General Error', false, error.message);
  } finally {
    await prisma.$disconnect();
  }

  // =================================================================
  // RÉSUMÉ DES TESTS
  // =================================================================
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS DE MESSAGERIE TEMPS RÉEL');
  console.log('='.repeat(60));
  console.log(`✅ Tests réussis: ${testResults.passed}`);
  console.log(`❌ Tests échoués: ${testResults.failed}`);
  console.log(`📈 Taux de réussite: ${((testResults.passed / (testResults.passed + testResults.failed)) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ Tests échoués:');
    testResults.tests
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`  - ${test.name}: ${test.message}`);
      });
  }
  
  console.log('\n🎯 Tests terminés !');
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Exécuter les tests
if (require.main === module) {
  runMessagingTests().catch(error => {
    console.error('💥 Erreur fatale:', error);
    process.exit(1);
  });
}

module.exports = { runMessagingTests };