// test_users_api.js - Script de test pour l'API de gestion des utilisateurs
// 📅 Créé le : 21 Juillet 2025
// 👨‍💻 Développeur : Kiro AI Assistant
// 📝 Description : Suite de tests automatisés pour l'API CRUD des utilisateurs
// 🧪 Tests : 10 tests couvrant tous les endpoints et cas d'usage
// 🚀 Usage : npm run test:users

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let adminToken = '';

// Configuration axios
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Fonction pour se connecter en tant qu'admin
async function loginAsAdmin() {
  try {
    console.log('🔐 Connexion en tant qu\'admin...');
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    adminToken = response.data.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    console.log('✅ Connexion admin réussie');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion admin:', error.response?.data || error.message);
    return false;
  }
}

// Test 1: Obtenir les statistiques des utilisateurs
async function testGetStats() {
  try {
    console.log('\n📊 Test: Obtenir les statistiques...');
    const response = await api.get('/users/stats');
    console.log('✅ Statistiques récupérées:', response.data.data);
  } catch (error) {
    console.error('❌ Erreur stats:', error.response?.data || error.message);
  }
}

// Test 2: Lister tous les utilisateurs
async function testGetAllUsers() {
  try {
    console.log('\n👥 Test: Lister tous les utilisateurs...');
    const response = await api.get('/users?page=1&limit=5');
    console.log('✅ Utilisateurs récupérés:', response.data.data.users.length, 'utilisateurs');
    console.log('📄 Pagination:', response.data.data.pagination);
  } catch (error) {
    console.error('❌ Erreur liste utilisateurs:', error.response?.data || error.message);
  }
}

// Test 3: Rechercher des utilisateurs
async function testSearchUsers() {
  try {
    console.log('\n🔍 Test: Rechercher des utilisateurs...');
    const response = await api.get('/users?search=patient&role=PATIENT');
    console.log('✅ Recherche réussie:', response.data.data.users.length, 'résultats');
  } catch (error) {
    console.error('❌ Erreur recherche:', error.response?.data || error.message);
  }
}

// Test 4: Créer un nouvel utilisateur
async function testCreateUser() {
  try {
    console.log('\n➕ Test: Créer un nouvel utilisateur...');
    const newUser = {
      email: 'test-patient@example.com',
      password: 'TestPassword123',
      role: 'PATIENT',
      firstName: 'Test',
      lastName: 'Patient',
      phone: '0123456789',
      dateOfBirth: '1995-01-01',
      address: '123 Test Street'
    };
    
    const response = await api.post('/users', newUser);
    console.log('✅ Utilisateur créé:', response.data.data.user.email);
    return response.data.data.user.id;
  } catch (error) {
    console.error('❌ Erreur création:', error.response?.data || error.message);
    return null;
  }
}

// Test 5: Obtenir un utilisateur par ID
async function testGetUserById(userId) {
  try {
    console.log('\n👤 Test: Obtenir utilisateur par ID...');
    const response = await api.get(`/users/${userId}`);
    console.log('✅ Utilisateur récupéré:', response.data.data.user.email);
  } catch (error) {
    console.error('❌ Erreur récupération utilisateur:', error.response?.data || error.message);
  }
}

// Test 6: Mettre à jour un utilisateur
async function testUpdateUser(userId) {
  try {
    console.log('\n✏️ Test: Mettre à jour un utilisateur...');
    const updateData = {
      firstName: 'Test-Updated',
      phone: '0987654321'
    };
    
    const response = await api.put(`/users/${userId}`, updateData);
    console.log('✅ Utilisateur mis à jour:', response.data.data.user.firstName);
  } catch (error) {
    console.error('❌ Erreur mise à jour:', error.response?.data || error.message);
  }
}

// Test 7: Désactiver un utilisateur
async function testDeleteUser(userId) {
  try {
    console.log('\n🗑️ Test: Désactiver un utilisateur...');
    const response = await api.delete(`/users/${userId}`);
    console.log('✅ Utilisateur désactivé:', response.data.message);
  } catch (error) {
    console.error('❌ Erreur désactivation:', error.response?.data || error.message);
  }
}

// Test 8: Réactiver un utilisateur
async function testReactivateUser(userId) {
  try {
    console.log('\n🔄 Test: Réactiver un utilisateur...');
    const response = await api.patch(`/users/${userId}/reactivate`);
    console.log('✅ Utilisateur réactivé:', response.data.message);
  } catch (error) {
    console.error('❌ Erreur réactivation:', error.response?.data || error.message);
  }
}

// Test 9: Créer un hôpital
async function testCreateHospital() {
  try {
    console.log('\n🏥 Test: Créer un hôpital...');
    const newHospital = {
      email: 'test-hospital@example.com',
      password: 'HospitalPass123',
      role: 'HOPITAL',
      firstName: 'Dr. Test',
      lastName: 'Hospital',
      phone: '0123456789',
      hospitalName: 'Test Hospital Center',
      hospitalAddress: '456 Hospital Street',
      licenseNumber: 'TEST-HOP-001'
    };
    
    const response = await api.post('/users', newHospital);
    console.log('✅ Hôpital créé:', response.data.data.user.hospitalName);
    return response.data.data.user.id;
  } catch (error) {
    console.error('❌ Erreur création hôpital:', error.response?.data || error.message);
    return null;
  }
}

// Test 10: Créer un laboratoire
async function testCreateLab() {
  try {
    console.log('\n🧪 Test: Créer un laboratoire...');
    const newLab = {
      email: 'test-lab@example.com',
      password: 'LabPassword123',
      role: 'LABO',
      firstName: 'Dr. Test',
      lastName: 'Lab',
      phone: '0123456789',
      labName: 'Test Laboratory',
      labAddress: '789 Lab Street',
      labLicense: 'TEST-LAB-001'
    };
    
    const response = await api.post('/users', newLab);
    console.log('✅ Laboratoire créé:', response.data.data.user.labName);
    return response.data.data.user.id;
  } catch (error) {
    console.error('❌ Erreur création laboratoire:', error.response?.data || error.message);
    return null;
  }
}

// Fonction principale de test
async function runAllTests() {
  console.log('🚀 Début des tests de l\'API de gestion des utilisateurs\n');
  
  // Se connecter en tant qu'admin
  const loginSuccess = await loginAsAdmin();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion admin');
    return;
  }
  
  // Exécuter tous les tests
  await testGetStats();
  await testGetAllUsers();
  await testSearchUsers();
  
  const patientId = await testCreateUser();
  if (patientId) {
    await testGetUserById(patientId);
    await testUpdateUser(patientId);
    await testDeleteUser(patientId);
    await testReactivateUser(patientId);
  }
  
  const hospitalId = await testCreateHospital();
  const labId = await testCreateLab();
  
  // Test final des statistiques
  await testGetStats();
  
  console.log('\n🎉 Tests terminés!');
  console.log('\n💡 Vérifiez les résultats ci-dessus pour vous assurer que tout fonctionne correctement.');
  console.log('📝 Consultez la documentation dans API_USERS_DOCUMENTATION.md pour plus de détails.');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };