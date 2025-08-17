// ============================================================================
// TEST CHAT MÉDICAL - VALIDATION COMPLÈTE
// ============================================================================
// 🎯 Script de test pour valider le chat médical avec bot IA
// 📅 Créé le : 12 Août 2025

const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3002/api';

// Configuration des couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Variables globales pour les tests
let patientToken = null;
let sessionId = null;

async function testMedicalChat() {
  log('\n🤖 ============================================', 'cyan');
  log('🏥 TEST CHAT MÉDICAL AVEC BOT IA', 'cyan');
  log('🤖 ============================================\n', 'cyan');

  try {
    // 1. Connexion en tant que patient
    await loginAsPatient();
    
    // 2. Vérification de la santé du service
    await checkServiceHealth();
    
    // 3. Création d'une nouvelle session de chat
    await createChatSession();
    
    // 4. Envoi de messages dans la session
    await sendMessages();
    
    // 5. Récupération de l'historique
    await getChatHistory();
    
    // 6. Récupération de toutes les sessions
    await getAllSessions();
    
    // 7. Statistiques d'utilisation
    await getChatStatistics();
    
    // 8. Fin de session
    await endChatSession();
    
    log('\n✅ ============================================', 'green');
    log('✅ TOUS LES TESTS CHAT MÉDICAL RÉUSSIS !', 'green');
    log('✅ ============================================\n', 'green');

  } catch (error) {
    log(`\n❌ ERREUR DANS LES TESTS: ${error.message}`, 'red');
    console.error(error);
    process.exit(1);
  }
}

async function loginAsPatient() {
  log('🔐 Test 1: Connexion patient...', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'marie.martin@email.com', // Patient de test
      password: 'password123'
    });

    if (response.data.success) {
      patientToken = response.data.data.token;
      log('✅ Connexion patient réussie', 'green');
      log(`   Token: ${patientToken.substring(0, 20)}...`, 'yellow');
    } else {
      throw new Error('Échec de la connexion patient');
    }
  } catch (error) {
    log('❌ Erreur connexion patient', 'red');
    throw error;
  }
}

async function checkServiceHealth() {
  log('\n🏥 Test 2: Vérification santé du service...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/medical-chat/health`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      log('✅ Service de chat médical opérationnel', 'green');
      log(`   Status OpenRouter: ${response.data.openrouter_status}`, 'yellow');
      log(`   Modèles disponibles: ${response.data.models_available}`, 'yellow');
    } else {
      log('⚠️  Service partiellement disponible', 'yellow');
    }
  } catch (error) {
    log('❌ Erreur vérification santé', 'red');
    throw error;
  }
}

async function createChatSession() {
  log('\n💬 Test 3: Création session de chat...', 'blue');
  
  try {
    const response = await axios.post(`${BASE_URL}/medical-chat/sessions`, {
      message: "Bonjour, j'ai des maux de tête depuis quelques jours et je m'inquiète. Pouvez-vous m'aider à comprendre ce que cela pourrait être ?"
    }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      sessionId = response.data.data.session.id;
      log('✅ Session de chat créée avec succès', 'green');
      log(`   ID Session: ${sessionId}`, 'yellow');
      log(`   Titre: ${response.data.data.session.title}`, 'yellow');
      log(`   Messages échangés: ${response.data.data.messages.length}`, 'yellow');
      
      // Affichage des premiers messages
      response.data.data.messages.forEach((msg, index) => {
        const sender = msg.sender_type === 'patient' ? '👤 Patient' : '🤖 Bot';
        log(`   ${sender}: ${msg.content.substring(0, 100)}...`, 'cyan');
      });
    } else {
      throw new Error('Échec création session');
    }
  } catch (error) {
    log('❌ Erreur création session', 'red');
    throw error;
  }
}

async function sendMessages() {
  log('\n📝 Test 4: Envoi de messages...', 'blue');
  
  const messages = [
    "Les maux de tête sont-ils accompagnés de nausées ?",
    "J'ai aussi remarqué que j'ai du mal à me concentrer au travail. Est-ce que cela peut être lié ?",
    "Quand devrais-je consulter un médecin pour ces symptômes ?"
  ];

  for (let i = 0; i < messages.length; i++) {
    try {
      log(`   Envoi message ${i + 1}/3...`, 'yellow');
      
      const response = await axios.post(`${BASE_URL}/medical-chat/sessions/${sessionId}/messages`, {
        message: messages[i]
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });

      if (response.data.success) {
        log(`   ✅ Message ${i + 1} envoyé et réponse reçue`, 'green');
        
        // Affichage de la réponse du bot
        const botMessage = response.data.data.messages.find(msg => msg.sender_type === 'bot');
        if (botMessage) {
          log(`   🤖 Réponse: ${botMessage.content.substring(0, 150)}...`, 'cyan');
          log(`   📊 Score confiance: ${botMessage.confidence_score}`, 'magenta');
        }
      }
      
      // Pause entre les messages pour simuler une conversation réelle
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      log(`   ❌ Erreur message ${i + 1}`, 'red');
      throw error;
    }
  }
  
  log('✅ Tous les messages envoyés avec succès', 'green');
}

async function getChatHistory() {
  log('\n📚 Test 5: Récupération historique...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/medical-chat/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      const session = response.data.data.session;
      log('✅ Historique récupéré avec succès', 'green');
      log(`   Titre: ${session.title}`, 'yellow');
      log(`   Messages: ${session.messages.length}`, 'yellow');
      log(`   Statut: ${session.is_active ? 'Active' : 'Terminée'}`, 'yellow');
      
      // Comptage des messages par type
      const patientMessages = session.messages.filter(m => m.sender_type === 'patient').length;
      const botMessages = session.messages.filter(m => m.sender_type === 'bot').length;
      log(`   👤 Messages patient: ${patientMessages}`, 'cyan');
      log(`   🤖 Messages bot: ${botMessages}`, 'cyan');
    } else {
      throw new Error('Échec récupération historique');
    }
  } catch (error) {
    log('❌ Erreur récupération historique', 'red');
    throw error;
  }
}

async function getAllSessions() {
  log('\n📋 Test 6: Récupération toutes sessions...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/medical-chat/sessions`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      const sessions = response.data.data.sessions;
      log('✅ Sessions récupérées avec succès', 'green');
      log(`   Nombre total: ${sessions.length}`, 'yellow');
      
      sessions.forEach((session, index) => {
        log(`   ${index + 1}. ${session.title} (${session.message_count} messages)`, 'cyan');
      });
    } else {
      throw new Error('Échec récupération sessions');
    }
  } catch (error) {
    log('❌ Erreur récupération sessions', 'red');
    throw error;
  }
}

async function getChatStatistics() {
  log('\n📊 Test 7: Statistiques d\'utilisation...', 'blue');
  
  try {
    const response = await axios.get(`${BASE_URL}/medical-chat/statistics`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      const stats = response.data.data.statistics;
      log('✅ Statistiques récupérées avec succès', 'green');
      log(`   Sessions totales: ${stats.total_sessions}`, 'yellow');
      log(`   Messages totaux: ${stats.total_messages}`, 'yellow');
      log(`   Sessions actives: ${stats.active_sessions}`, 'yellow');
    } else {
      throw new Error('Échec récupération statistiques');
    }
  } catch (error) {
    log('❌ Erreur récupération statistiques', 'red');
    throw error;
  }
}

async function endChatSession() {
  log('\n🔚 Test 8: Fin de session...', 'blue');
  
  try {
    const response = await axios.put(`${BASE_URL}/medical-chat/sessions/${sessionId}/end`, {}, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });

    if (response.data.success) {
      log('✅ Session terminée avec succès', 'green');
      log(`   Message: ${response.data.message}`, 'yellow');
    } else {
      throw new Error('Échec fin de session');
    }
  } catch (error) {
    log('❌ Erreur fin de session', 'red');
    throw error;
  }
}

// Fonction utilitaire pour attendre
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
  log('❌ Erreur non gérée:', 'red');
  console.error(reason);
  process.exit(1);
});

// Démarrage des tests
if (require.main === module) {
  testMedicalChat();
}

module.exports = { testMedicalChat };