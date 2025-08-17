// 🧪 SCRIPT DE TEST SYSTÈME D'ADMINISTRATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Test complet des fonctionnalités d'administration

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

// Configuration des utilisateurs de test
const TEST_USERS = {
  superAdmin: {
    email: 'super@admin.com',
    password: 'superadmin123',
    token: null
  },
  hospitalAdmin: {
    email: 'admin@hopital.com',
    password: 'hospitaladmin123',
    token: null,
    hospital_id: null
  },
  labAdmin: {
    email: 'admin@labo.com',
    password: 'labadmin123',
    token: null,
    laboratory_id: null
  }
};

// Données de test
let testHospitalId = null;
let testLaboratoryId = null;
let testPatientId = null;
let testStaffId = null;

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
  log('🔐 Test d\'authentification des admins', 'info');

  // Test connexion Super Admin
  log('Connexion Super Admin...', 'info');
  const superAdminLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.superAdmin.email,
    password: TEST_USERS.superAdmin.password
  });

  if (superAdminLogin.success) {
    TEST_USERS.superAdmin.token = superAdminLogin.data.data.token;
    log('✅ Super Admin connecté', 'success');
  } else {
    log('❌ Échec connexion Super Admin', 'error');
    return false;
  }

  // Test connexion Admin Hôpital
  log('Connexion Admin Hôpital...', 'info');
  const hospitalAdminLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.hospitalAdmin.email,
    password: TEST_USERS.hospitalAdmin.password
  });

  if (hospitalAdminLogin.success) {
    TEST_USERS.hospitalAdmin.token = hospitalAdminLogin.data.data.token;
    TEST_USERS.hospitalAdmin.hospital_id = hospitalAdminLogin.data.data.user.hospital_id;
    log('✅ Admin Hôpital connecté', 'success');
  } else {
    log('❌ Échec connexion Admin Hôpital', 'error');
  }

  // Test connexion Admin Laboratoire
  log('Connexion Admin Laboratoire...', 'info');
  const labAdminLogin = await makeRequest('POST', '/auth/login', {
    email: TEST_USERS.labAdmin.email,
    password: TEST_USERS.labAdmin.password
  });

  if (labAdminLogin.success) {
    TEST_USERS.labAdmin.token = labAdminLogin.data.data.token;
    TEST_USERS.labAdmin.laboratory_id = labAdminLogin.data.data.user.laboratory_id;
    log('✅ Admin Laboratoire connecté', 'success');
  } else {
    log('❌ Échec connexion Admin Laboratoire', 'error');
  }

  return true;
}

// ============================================================================
// TESTS GESTION DES ÉTABLISSEMENTS
// ============================================================================

async function testEstablishmentManagement() {
  log('🏥 Test gestion des établissements', 'info');

  // Test création hôpital (Super Admin seulement)
  log('Création d\'un hôpital...', 'info');
  const hospitalData = {
    name: 'Hôpital Test MVP',
    address: '123 Rue de la Santé',
    city: 'Paris',
    phone: '0123456789',
    email: 'contact@hopital-test.fr',
    latitude: 48.8566,
    longitude: 2.3522
  };

  const createHospital = await makeRequest('POST', '/admin/hospitals', hospitalData, TEST_USERS.superAdmin.token);
  
  if (createHospital.success) {
    testHospitalId = createHospital.data.data.hospital.id;
    log(`✅ Hôpital créé avec ID: ${testHospitalId}`, 'success');
  } else {
    log('❌ Échec création hôpital', 'error');
    console.log(createHospital.error);
  }

  // Test création laboratoire (Super Admin seulement)
  log('Création d\'un laboratoire...', 'info');
  const laboratoryData = {
    name: 'Laboratoire Test MVP',
    address: '456 Avenue des Analyses',
    city: 'Lyon',
    phone: '0123456790',
    email: 'contact@labo-test.fr',
    latitude: 45.7640,
    longitude: 4.8357
  };

  const createLaboratory = await makeRequest('POST', '/admin/laboratories', laboratoryData, TEST_USERS.superAdmin.token);
  
  if (createLaboratory.success) {
    testLaboratoryId = createLaboratory.data.data.laboratory.id;
    log(`✅ Laboratoire créé avec ID: ${testLaboratoryId}`, 'success');
  } else {
    log('❌ Échec création laboratoire', 'error');
    console.log(createLaboratory.error);
  }

  // Test liste des hôpitaux
  log('Récupération liste des hôpitaux...', 'info');
  const getHospitals = await makeRequest('GET', '/admin/hospitals?page=1&limit=5', null, TEST_USERS.superAdmin.token);
  
  if (getHospitals.success) {
    log(`✅ ${getHospitals.data.data.hospitals.length} hôpitaux récupérés`, 'success');
  } else {
    log('❌ Échec récupération hôpitaux', 'error');
  }

  // Test liste des laboratoires
  log('Récupération liste des laboratoires...', 'info');
  const getLaboratories = await makeRequest('GET', '/admin/laboratories?page=1&limit=5', null, TEST_USERS.superAdmin.token);
  
  if (getLaboratories.success) {
    log(`✅ ${getLaboratories.data.data.laboratories.length} laboratoires récupérés`, 'success');
  } else {
    log('❌ Échec récupération laboratoires', 'error');
  }

  return true;
}

// ============================================================================
// TESTS GESTION DES UTILISATEURS
// ============================================================================

async function testUserManagement() {
  log('👥 Test gestion des utilisateurs', 'info');

  // Test création utilisateur par Super Admin
  log('Création d\'un staff hospitalier...', 'info');
  const staffData = {
    email: 'staff@hopital-test.fr',
    password: 'stafftest123',
    first_name: 'Jean',
    last_name: 'Dupont',
    phone: '0123456791',
    role: 'hospital_staff',
    hospital_id: testHospitalId
  };

  const createStaff = await makeRequest('POST', '/admin/users', staffData, TEST_USERS.superAdmin.token);
  
  if (createStaff.success) {
    testStaffId = createStaff.data.data.user.id;
    log(`✅ Staff créé avec ID: ${testStaffId}`, 'success');
  } else {
    log('❌ Échec création staff', 'error');
    console.log(createStaff.error);
  }

  // Test liste des utilisateurs
  log('Récupération liste des utilisateurs...', 'info');
  const getUsers = await makeRequest('GET', '/admin/users?page=1&limit=10', null, TEST_USERS.superAdmin.token);
  
  if (getUsers.success) {
    log(`✅ ${getUsers.data.data.users.length} utilisateurs récupérés`, 'success');
  } else {
    log('❌ Échec récupération utilisateurs', 'error');
  }

  // Test modification utilisateur
  if (testStaffId) {
    log('Modification du staff...', 'info');
    const updateData = {
      first_name: 'Jean-Michel',
      is_active: true
    };

    const updateStaff = await makeRequest('PUT', `/admin/users/${testStaffId}`, updateData, TEST_USERS.superAdmin.token);
    
    if (updateStaff.success) {
      log('✅ Staff modifié avec succès', 'success');
    } else {
      log('❌ Échec modification staff', 'error');
    }
  }

  return true;
}

// ============================================================================
// TESTS GESTION DES PATIENTS
// ============================================================================

async function testPatientManagement() {
  log('🏥 Test gestion des patients', 'info');

  // Test création patient par Super Admin
  log('Création d\'un patient...', 'info');
  const patientData = {
    email: 'patient@test.fr',
    password: 'patient123',
    first_name: 'Marie',
    last_name: 'Martin',
    phone: '0123456792',
    date_of_birth: '1990-05-15',
    gender: 'F',
    assign_to_hospital: testHospitalId
  };

  const createPatient = await makeRequest('POST', '/admin/patients', patientData, TEST_USERS.superAdmin.token);
  
  if (createPatient.success) {
    testPatientId = createPatient.data.data.patient.id;
    log(`✅ Patient créé avec ID: ${testPatientId}`, 'success');
  } else {
    log('❌ Échec création patient', 'error');
    console.log(createPatient.error);
  }

  // Test liste des patients
  log('Récupération liste des patients...', 'info');
  const getPatients = await makeRequest('GET', '/admin/patients?page=1&limit=10', null, TEST_USERS.superAdmin.token);
  
  if (getPatients.success) {
    log(`✅ ${getPatients.data.data.patients.length} patients récupérés`, 'success');
  } else {
    log('❌ Échec récupération patients', 'error');
  }

  // Test statistiques patients
  log('Récupération statistiques patients...', 'info');
  const getPatientsStats = await makeRequest('GET', '/admin/patients/stats', null, TEST_USERS.superAdmin.token);
  
  if (getPatientsStats.success) {
    log(`✅ Statistiques: ${getPatientsStats.data.data.total} patients total`, 'success');
  } else {
    log('❌ Échec récupération statistiques', 'error');
  }

  return true;
}

// ============================================================================
// TESTS PERMISSIONS
// ============================================================================

async function testPermissions() {
  log('🔒 Test des permissions', 'info');

  // Test: Admin hôpital ne peut pas créer d'hôpital
  if (TEST_USERS.hospitalAdmin.token) {
    log('Test: Admin hôpital tente de créer un hôpital...', 'info');
    const forbiddenHospital = await makeRequest('POST', '/admin/hospitals', {
      name: 'Hôpital Interdit',
      address: 'Rue Interdite',
      city: 'Ville Interdite'
    }, TEST_USERS.hospitalAdmin.token);

    if (!forbiddenHospital.success && forbiddenHospital.status === 403) {
      log('✅ Permission correctement refusée', 'success');
    } else {
      log('❌ Permission incorrectement accordée', 'error');
    }
  }

  // Test: Admin labo ne peut pas voir les patients d'un hôpital
  if (TEST_USERS.labAdmin.token && testPatientId) {
    log('Test: Admin labo tente d\'accéder à un patient d\'hôpital...', 'info');
    const forbiddenPatient = await makeRequest('GET', `/admin/patients/${testPatientId}`, null, TEST_USERS.labAdmin.token);

    if (!forbiddenPatient.success && forbiddenPatient.status === 403) {
      log('✅ Accès correctement refusé', 'success');
    } else {
      log('❌ Accès incorrectement accordé', 'error');
    }
  }

  return true;
}

// ============================================================================
// TESTS TABLEAU DE BORD
// ============================================================================

async function testDashboard() {
  log('📊 Test tableau de bord', 'info');

  // Test tableau de bord Super Admin
  log('Récupération tableau de bord Super Admin...', 'info');
  const superAdminDashboard = await makeRequest('GET', '/admin/dashboard', null, TEST_USERS.superAdmin.token);
  
  if (superAdminDashboard.success) {
    const stats = superAdminDashboard.data.data;
    log(`✅ Dashboard Super Admin: ${stats.users.total} utilisateurs, ${stats.establishments.hospitals.total} hôpitaux`, 'success');
  } else {
    log('❌ Échec récupération dashboard Super Admin', 'error');
  }

  // Test tableau de bord Admin Hôpital
  if (TEST_USERS.hospitalAdmin.token) {
    log('Récupération tableau de bord Admin Hôpital...', 'info');
    const hospitalAdminDashboard = await makeRequest('GET', '/admin/dashboard', null, TEST_USERS.hospitalAdmin.token);
    
    if (hospitalAdminDashboard.success) {
      const stats = hospitalAdminDashboard.data.data;
      log(`✅ Dashboard Admin Hôpital: ${stats.staff.total} staff, ${stats.documents.total} documents`, 'success');
    } else {
      log('❌ Échec récupération dashboard Admin Hôpital', 'error');
    }
  }

  return true;
}

// ============================================================================
// FONCTION PRINCIPALE DE TEST
// ============================================================================

async function runAllTests() {
  console.log('🧪 ================================');
  console.log('🏥 TESTS SYSTÈME D\'ADMINISTRATION');
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
    await testEstablishmentManagement();
    await testUserManagement();
    await testPatientManagement();
    await testPermissions();
    await testDashboard();

    console.log('\n🧪 ================================');
    log('✅ TOUS LES TESTS TERMINÉS', 'success');
    console.log('🧪 ================================');

    // Résumé des données créées
    console.log('\n📋 DONNÉES DE TEST CRÉÉES:');
    if (testHospitalId) log(`🏥 Hôpital ID: ${testHospitalId}`, 'info');
    if (testLaboratoryId) log(`🧪 Laboratoire ID: ${testLaboratoryId}`, 'info');
    if (testStaffId) log(`👨‍⚕️ Staff ID: ${testStaffId}`, 'info');
    if (testPatientId) log(`🤒 Patient ID: ${testPatientId}`, 'info');

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
  testEstablishmentManagement,
  testUserManagement,
  testPatientManagement,
  testPermissions,
  testDashboard
};