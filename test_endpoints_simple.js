// test_endpoints_simple.js - Test simple des endpoints CRUD
// 📅 Créé le : 21 Juillet 2025
// 👨‍💻 Développeur : Kiro AI Assistant
// 📝 Description : Test rapide des endpoints de création et suppression

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

// Test de connexion admin
async function testLogin() {
  try {
    console.log('🔐 Test de connexion admin...');
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    if (response.data.success) {
      adminToken = response.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      console.log('✅ Connexion admin réussie');
      return true;
    } else {
      console.log('❌ Échec de connexion:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Test de création d'utilisateur
async function testCreateUser() {
  try {
    console.log('\n➕ Test de création d\'utilisateur...');
    const newUser = {
      email: 'test-creation@example.com',
      password: 'TestPassword123',
      role: 'PATIENT',
      firstName: 'Test',
      lastName: 'Creation',
      phone: '0123456789',
      dateOfBirth: '1990-01-01',
      address: '123 Test Street',
      isActive: true
    };
    
    const response = await api.post('/users', newUser);
    
    if (response.data.success) {
      console.log('✅ Utilisateur créé avec succès:', response.data.data.user.email);
      return response.data.data.user.id;
    } else {
      console.log('❌ Échec de création:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur de création:', error.response?.data || error.message);
    return null;
  }
}

// Test de suppression d'utilisateur
async function testDeleteUser(userId) {
  try {
    console.log('\n🗑️ Test de suppression d\'utilisateur...');
    const response = await api.delete(`/users/${userId}`);
    
    if (response.data.success) {
      console.log('✅ Utilisateur supprimé avec succès:', response.data.message);
      return true;
    } else {
      console.log('❌ Échec de suppression:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de suppression:', error.response?.data || error.message);
    return false;
  }
}

// Test de liste des utilisateurs
async function testListUsers() {
  try {
    console.log('\n📋 Test de liste des utilisateurs...');
    const response = await api.get('/users?page=1&limit=5');
    
    if (response.data.success) {
      console.log('✅ Liste récupérée:', response.data.data.users.length, 'utilisateurs');
      console.log('📊 Pagination:', response.data.data.pagination);
      return true;
    } else {
      console.log('❌ Échec de récupération:', response.data.message);
      return false;
    }
  } catch (error) {
    console.error('❌ Erreur de récupération:', error.response?.data || error.message);
    return false;
  }
}

// Test principal
async function runTests() {
  console.log('🚀 Test des endpoints CRUD utilisateurs\n');
  
  // Test de connexion
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion admin');
    return;
  }
  
  // Test de liste
  await testListUsers();
  
  // Test de création
  const userId = await testCreateUser();
  
  // Test de suppression si création réussie
  if (userId) {
    await testDeleteUser(userId);
  }
  
  console.log('\n🎉 Tests terminés!');
}

// Exécuter les tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };