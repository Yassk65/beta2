// 🧪 TEST BACKEND MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Script de test pour vérifier le fonctionnement du backend

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// ============================================================================
// CONFIGURATION DES TESTS
// ============================================================================

const testAccounts = {
  superAdmin: {
    email: 'admin@labresult.com',
    password: 'password'
  },
  hospitalAdmin: {
    email: 'admin@hopital-central.fr',
    password: 'password'
  },
  doctor: {
    email: 'dr.martin@hopital-central.fr',
    password: 'password'
  },
  labAdmin: {
    email: 'admin@biotest.fr',
    password: 'password'
  },
  technician: {
    email: 'tech1@biotest.fr',
    password: 'password'
  },
  patient: {
    email: 'patient1@example.com',
    password: 'password'
  }
};

let tokens = {};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

const log = (message, data = null) => {
  console.log(`\n🔍 ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

const logError = (message, error) => {
  console.error(`\n❌ ${message}`);
  if (error.response) {
    console.error(`Status: ${error.response.status}`);
    console.error(`Data:`, error.response.data);
  } else {
    console.error(error.message);
  }
};

const logSuccess = (message, data = null) => {
  console.log(`\n✅ ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

// ============================================================================
// TESTS D'AUTHENTIFICATION
// ============================================================================

async function testHealth() {
  try {
    log('Test de santé de l\'API...');
    const response = await axios.get(`${BASE_URL}/health`);
    logSuccess('API opérationnelle', response.data);
    return true;
  } catch (error) {
    logError('Échec test de santé', error);
    return false;
  }
}

async function testLogin(accountType, credentials) {
  try {
    log(`Test de connexion ${accountType}...`);
    const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
    
    if (response.data.success) {
      tokens[accountType] = response.data.data.token;
      logSuccess(`Connexion ${accountType} réussie`, {
        user: response.data.data.user.email,
        role: response.data.data.user.role
      });
      return true;
    }
    return false;
  } catch (error) {
    logError(`Échec connexion ${accountType}`, error);
    return false;
  }
}

async function testProfile(accountType) {
  try {
    log(`Test récupération profil ${accountType}...`);
    const response = await axios.get(`${BASE_URL}/auth/profile`, {
      headers: { Authorization: `Bearer ${tokens[accountType]}` }
    });
    
    if (response.data.success) {
      logSuccess(`Profil ${accountType} récupéré`, {
        email: response.data.data.user.email,
        role: response.data.data.user.role,
        hospital: response.data.data.user.hospital?.name,
        laboratory: response.data.data.user.laboratory?.name
      });
      return true;
    }
    return false;
  } catch (error) {
    logError(`Échec récupération profil ${accountType}`, error);
    return false;
  }
}

async function testRegister() {
  try {
    log('Test inscription nouveau patient...');
    const newPatient = {
      email: `test.patient.${Date.now()}@example.com`,
      password: 'TestPassword123',
      first_name: 'Test',
      last_name: 'Patient',
      phone: '0612345678',
      date_of_birth: '1990-01-01',
      gender: 'M'
    };
    
    const response = await axios.post(`${BASE_URL}/auth/register`, newPatient);
    
    if (response.data.success) {
      logSuccess('Inscription réussie', {
        email: response.data.data.user.email,
        role: response.data.data.user.role
      });
      return true;
    }
    return false;
  } catch (error) {
    logError('Échec inscription', error);
    return false;
  }
}

// ============================================================================
// TESTS DES DONNÉES
// ============================================================================

async function testStats(accountType) {
  try {
    log(`Test statistiques ${accountType}...`);
    const response = await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${tokens[accountType]}` }
    });
    
    if (response.data.success) {
      logSuccess(`Statistiques ${accountType}`, response.data.data);
      return true;
    }
    return false;
  } catch (error) {
    logError(`Échec statistiques ${accountType}`, error);
    return false;
  }
}

async function testHospitals() {
  try {
    log('Test liste des hôpitaux...');
    const response = await axios.get(`${BASE_URL}/users/hospitals`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    
    if (response.data.success) {
      logSuccess('Liste hôpitaux récupérée', {
        count: response.data.data.hospitals.length,
        hospitals: response.data.data.hospitals.map(h => ({
          name: h.name,
          city: h.city,
          staff: h._count.users
        }))
      });
      return true;
    }
    return false;
  } catch (error) {
    logError('Échec liste hôpitaux', error);
    return false;
  }
}

async function testLaboratories() {
  try {
    log('Test liste des laboratoires...');
    const response = await axios.get(`${BASE_URL}/users/laboratories`, {
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    
    if (response.data.success) {
      logSuccess('Liste laboratoires récupérée', {
        count: response.data.data.laboratories.length,
        laboratories: response.data.data.laboratories.map(l => ({
          name: l.name,
          city: l.city,
          staff: l._count.users
        }))
      });
      return true;
    }
    return false;
  } catch (error) {
    logError('Échec liste laboratoires', error);
    return false;
  }
}

async function testNearby() {
  try {
    log('Test recherche par proximité...');
    const response = await axios.get(`${BASE_URL}/users/nearby`, {
      params: {
        lat: 48.8566,
        lng: 2.3522,
        radius: 50,
        type: 'both'
      },
      headers: { Authorization: `Bearer ${tokens.patient}` }
    });
    
    if (response.data.success) {
      logSuccess('Recherche proximité réussie', {
        hospitals: response.data.data.hospitals?.length || 0,
        laboratories: response.data.data.laboratories?.length || 0
      });
      return true;
    }
    return false;
  } catch (error) {
    logError('Échec recherche proximité', error);
    return false;
  }
}

// ============================================================================
// TESTS DE PERMISSIONS
// ============================================================================

async function testPermissions() {
  try {
    log('Test permissions - Patient tentant d\'accéder aux stats...');
    
    try {
      await axios.get(`${BASE_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${tokens.patient}` }
      });
      logError('ERREUR: Patient a pu accéder aux stats !');
      return false;
    } catch (error) {
      if (error.response && error.response.status === 403) {
        logSuccess('Permissions correctes - Patient bloqué pour les stats');
        return true;
      } else {
        logError('Erreur inattendue lors du test permissions', error);
        return false;
      }
    }
  } catch (error) {
    logError('Échec test permissions', error);
    return false;
  }
}

// ============================================================================
// EXÉCUTION DES TESTS
// ============================================================================

async function runAllTests() {
  console.log('🚀 ================================');
  console.log('🧪 TESTS BACKEND MVP SANTÉ');
  console.log('🚀 ================================');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };
  
  const runTest = async (testName, testFunction) => {
    results.total++;
    try {
      const success = await testFunction();
      if (success) {
        results.passed++;
        console.log(`\n✅ ${testName} - RÉUSSI`);
      } else {
        results.failed++;
        console.log(`\n❌ ${testName} - ÉCHEC`);
      }
    } catch (error) {
      results.failed++;
      console.log(`\n❌ ${testName} - ERREUR:`, error.message);
    }
  };
  
  // Tests de base
  await runTest('Santé API', testHealth);
  
  // Tests d'authentification
  await runTest('Connexion Super Admin', () => testLogin('superAdmin', testAccounts.superAdmin));
  await runTest('Connexion Admin Hôpital', () => testLogin('hospitalAdmin', testAccounts.hospitalAdmin));
  await runTest('Connexion Médecin', () => testLogin('doctor', testAccounts.doctor));
  await runTest('Connexion Admin Labo', () => testLogin('labAdmin', testAccounts.labAdmin));
  await runTest('Connexion Technicien', () => testLogin('technician', testAccounts.technician));
  await runTest('Connexion Patient', () => testLogin('patient', testAccounts.patient));
  
  // Tests de profils
  await runTest('Profil Super Admin', () => testProfile('superAdmin'));
  await runTest('Profil Patient', () => testProfile('patient'));
  
  // Test inscription
  await runTest('Inscription Nouveau Patient', testRegister);
  
  // Tests de données
  await runTest('Statistiques Super Admin', () => testStats('superAdmin'));
  await runTest('Statistiques Admin Hôpital', () => testStats('hospitalAdmin'));
  await runTest('Liste Hôpitaux', testHospitals);
  await runTest('Liste Laboratoires', testLaboratories);
  await runTest('Recherche Proximité', testNearby);
  
  // Tests de permissions
  await runTest('Test Permissions', testPermissions);
  
  // Résultats finaux
  console.log('\n🚀 ================================');
  console.log('📊 RÉSULTATS DES TESTS');
  console.log('🚀 ================================');
  console.log(`✅ Tests réussis: ${results.passed}`);
  console.log(`❌ Tests échoués: ${results.failed}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`📈 Taux de réussite: ${Math.round((results.passed / results.total) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('🚀 Backend MVP prêt pour le développement !');
  } else {
    console.log(`\n⚠️  ${results.failed} test(s) ont échoué`);
    console.log('🔧 Vérifiez les erreurs ci-dessus');
  }
  
  return results.failed === 0;
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((error) => {
      console.error('💥 Erreur fatale lors des tests:', error);
      process.exit(1);
    });
}

module.exports = { runAllTests };