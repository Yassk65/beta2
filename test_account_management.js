#!/usr/bin/env node

/**
 * 🧪 SCRIPT DE TEST - FONCTIONNALITÉS GESTION DE COMPTE
 * 
 * Ce script teste tous les endpoints de gestion de compte utilisateur
 */

const https = require('https');
const http = require('http');

const API_BASE = 'http://localhost:3000/api';

// Configuration du test
const testConfig = {
  email: 'test.patient@example.com',
  password: 'TestPassword123',
  newPassword: 'NewTestPassword123'
};

// Stockage du token pour les tests
let authToken = '';
let userId = null;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Faire une requête HTTP
 */
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.hostname === 'localhost' ? http : https;
    
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          resolve({ status: res.statusCode, data: response });
        } catch (error) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

/**
 * Créer les options de requête
 */
function createRequestOptions(method, path, requiresAuth = true) {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: `/api${path}`,
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };

  if (requiresAuth && authToken) {
    options.headers['Authorization'] = `Bearer ${authToken}`;
  }

  return options;
}

/**
 * Afficher le résultat d'un test
 */
function logTestResult(testName, success, message, data = null) {
  const icon = success ? '✅' : '❌';
  console.log(`${icon} ${testName}: ${message}`);
  if (data && process.env.VERBOSE) {
    console.log('   Data:', JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// TESTS D'AUTHENTIFICATION
// ============================================================================

/**
 * Test de connexion
 */
async function testLogin() {
  console.log('\n🔑 Test de connexion...');
  
  try {
    const options = createRequestOptions('POST', '/auth/login', false);
    const loginData = {
      email: testConfig.email,
      password: testConfig.password
    };

    const result = await makeRequest(options, loginData);
    
    if (result.status === 200 && result.data.success) {
      authToken = result.data.data.token;
      userId = result.data.data.user.id;
      logTestResult('Connexion', true, 'Connexion réussie');
      return true;
    } else {
      logTestResult('Connexion', false, result.data.message || 'Échec de connexion');
      return false;
    }
  } catch (error) {
    logTestResult('Connexion', false, `Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test de récupération du profil
 */
async function testGetProfile() {
  console.log('\n👤 Test de récupération du profil...');
  
  try {
    const options = createRequestOptions('GET', '/auth/profile');
    const result = await makeRequest(options);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Récupération profil', true, 'Profil récupéré avec succès');
      return true;
    } else {
      logTestResult('Récupération profil', false, result.data.message || 'Échec récupération');
      return false;
    }
  } catch (error) {
    logTestResult('Récupération profil', false, `Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test de mise à jour du profil
 */
async function testUpdateProfile() {
  console.log('\n✏️ Test de mise à jour du profil...');
  
  try {
    const options = createRequestOptions('PUT', '/auth/profile');
    const updateData = {
      first_name: 'TestUpdated',
      last_name: 'PatientUpdated',
      phone: '+33123456789',
      address: '123 Rue de Test, 75001 Paris'
    };

    const result = await makeRequest(options, updateData);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Mise à jour profil', true, 'Profil mis à jour avec succès');
      return true;
    } else {
      logTestResult('Mise à jour profil', false, result.data.message || 'Échec mise à jour');
      return false;
    }
  } catch (error) {
    logTestResult('Mise à jour profil', false, `Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test de changement de mot de passe
 */
async function testChangePassword() {
  console.log('\n🔒 Test de changement de mot de passe...');
  
  try {
    const options = createRequestOptions('PUT', '/auth/change-password');
    const passwordData = {
      currentPassword: testConfig.password,
      newPassword: testConfig.newPassword
    };

    const result = await makeRequest(options, passwordData);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Changement mot de passe', true, 'Mot de passe changé avec succès');
      // Mettre à jour le mot de passe pour les tests suivants
      testConfig.password = testConfig.newPassword;
      return true;
    } else {
      logTestResult('Changement mot de passe', false, result.data.message || 'Échec changement');
      return false;
    }
  } catch (error) {
    logTestResult('Changement mot de passe', false, `Erreur: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTS DES PARAMÈTRES DE NOTIFICATION
// ============================================================================

/**
 * Test de récupération des paramètres de notification
 */
async function testGetNotificationSettings() {
  console.log('\n🔔 Test de récupération des paramètres de notification...');
  
  try {
    const options = createRequestOptions('GET', '/notifications/settings');
    const result = await makeRequest(options);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Paramètres notification - Récupération', true, 'Paramètres récupérés avec succès');
      return true;
    } else {
      logTestResult('Paramètres notification - Récupération', false, result.data.message || 'Échec récupération');
      return false;
    }
  } catch (error) {
    logTestResult('Paramètres notification - Récupération', false, `Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test de mise à jour des paramètres de notification
 */
async function testUpdateNotificationSettings() {
  console.log('\n🔔 Test de mise à jour des paramètres de notification...');
  
  try {
    const options = createRequestOptions('PUT', '/notifications/settings');
    const settingsData = {
      new_message_enabled: true,
      new_document_enabled: true,
      exam_status_enabled: false,
      in_app_enabled: true,
      email_enabled: false,
      push_enabled: true,
      email_frequency: 'daily',
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00'
    };

    const result = await makeRequest(options, settingsData);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Paramètres notification - Mise à jour', true, 'Paramètres mis à jour avec succès');
      return true;
    } else {
      logTestResult('Paramètres notification - Mise à jour', false, result.data.message || 'Échec mise à jour');
      return false;
    }
  } catch (error) {
    logTestResult('Paramètres notification - Mise à jour', false, `Erreur: ${error.message}`);
    return false;
  }
}

// ============================================================================
// TESTS DE GESTION DES DONNÉES
// ============================================================================

/**
 * Test d'export des données
 */
async function testDataExport() {
  console.log('\n📄 Test d\\'export des données...');
  
  try {
    const options = createRequestOptions('POST', '/auth/data-export');
    const result = await makeRequest(options);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Export des données', true, 'Export des données réussi');
      return true;
    } else {
      logTestResult('Export des données', false, result.data.message || 'Échec export');
      return false;
    }
  } catch (error) {
    logTestResult('Export des données', false, `Erreur: ${error.message}`);
    return false;
  }
}

/**
 * Test de suppression de compte (sera le dernier test)
 */
async function testDeleteAccount() {
  console.log('\n🗑️ Test de suppression de compte...');
  
  try {
    const options = createRequestOptions('DELETE', '/auth/account');
    const result = await makeRequest(options);
    
    if (result.status === 200 && result.data.success) {
      logTestResult('Suppression compte', true, 'Compte supprimé avec succès');
      return true;
    } else {
      logTestResult('Suppression compte', false, result.data.message || 'Échec suppression');
      return false;
    }
  } catch (error) {
    logTestResult('Suppression compte', false, `Erreur: ${error.message}`);
    return false;
  }
}

// ============================================================================
// SCRIPT PRINCIPAL
// ============================================================================

async function runTests() {
  console.log('🧪 DÉBUT DES TESTS - GESTION DE COMPTE UTILISATEUR');
  console.log('=' + '='.repeat(60));
  
  let totalTests = 0;
  let passedTests = 0;

  // Liste des tests à exécuter
  const tests = [
    { name: 'Connexion', func: testLogin },
    { name: 'Récupération profil', func: testGetProfile },
    { name: 'Mise à jour profil', func: testUpdateProfile },
    { name: 'Changement mot de passe', func: testChangePassword },
    { name: 'Paramètres notification - Récupération', func: testGetNotificationSettings },
    { name: 'Paramètres notification - Mise à jour', func: testUpdateNotificationSettings },
    { name: 'Export des données', func: testDataExport }
    // Note: Le test de suppression de compte est commenté pour éviter de supprimer le compte de test
    // { name: 'Suppression compte', func: testDeleteAccount }
  ];

  for (const test of tests) {
    totalTests++;
    const success = await test.func();
    if (success) passedTests++;
    
    // Petite pause entre les tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Résumé final
  console.log('\n' + '='.repeat(60));
  console.log('📊 RÉSUMÉ DES TESTS');
  console.log('=' + '='.repeat(60));
  console.log(`Total des tests: ${totalTests}`);
  console.log(`Tests réussis: ${passedTests}`);
  console.log(`Tests échoués: ${totalTests - passedTests}`);
  console.log(`Taux de réussite: ${Math.round((passedTests / totalTests) * 100)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('✅ Les fonctionnalités de gestion de compte sont opérationnelles.');
  } else {
    console.log('\n⚠️  CERTAINS TESTS ONT ÉCHOUÉ');
    console.log('❌ Vérifiez les erreurs ci-dessus et les configurations backend.');
  }

  console.log('\n💡 Pour utiliser les fonctionnalités:');
  console.log('1. Assurez-vous que le backend est démarré (npm start)');
  console.log('2. Créez un compte patient pour tester');
  console.log('3. Utilisez les endpoints via l\\'interface frontend');
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };