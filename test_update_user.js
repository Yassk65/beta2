// test_update_user.js - Test spécifique pour la modification d'utilisateur
// 📅 Créé le : 21 Juillet 2025
// 👨‍💻 Développeur : Kiro AI Assistant
// 📝 Description : Test de l'endpoint PUT /api/users/:id

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
    console.log('🔐 Connexion admin...');
    const response = await api.post('/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    if (response.data.success) {
      adminToken = response.data.data.token;
      api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
      console.log('✅ Connexion admin réussie');
      return true;
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
    return false;
  }
}

// Créer un utilisateur de test
async function createTestUser() {
  try {
    console.log('\n➕ Création d\'un utilisateur de test...');
    const userData = {
      email: 'test-update@example.com',
      password: 'TestPassword123',
      role: 'PATIENT',
      firstName: 'Test',
      lastName: 'Update',
      phone: '0123456789',
      dateOfBirth: '1990-01-01',
      address: '123 Test Street',
      isActive: true
    };
    
    const response = await api.post('/users', userData);
    
    if (response.data.success) {
      console.log('✅ Utilisateur créé:', response.data.data.user.email);
      return response.data.data.user;
    }
  } catch (error) {
    console.error('❌ Erreur création:', error.response?.data || error.message);
    return null;
  }
}

// Test de modification d'utilisateur
async function testUpdateUser(user) {
  try {
    console.log('\n✏️ Test de modification d\'utilisateur...');
    console.log('Utilisateur original:', {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    });
    
    const updateData = {
      firstName: 'Test-Modified',
      lastName: 'Update-Modified',
      phone: '0987654321',
      address: '456 Modified Street'
    };
    
    console.log('Données de modification:', updateData);
    
    const response = await api.put(`/users/${user.id}`, updateData);
    
    if (response.data.success) {
      console.log('✅ Utilisateur modifié avec succès');
      console.log('Utilisateur modifié:', {
        id: response.data.data.user.id,
        firstName: response.data.data.user.firstName,
        lastName: response.data.data.user.lastName,
        phone: response.data.data.user.phone,
        address: response.data.data.user.address
      });
      return response.data.data.user;
    } else {
      console.log('❌ Échec de modification:', response.data.message);
      return null;
    }
  } catch (error) {
    console.error('❌ Erreur modification:', error.response?.data || error.message);
    return null;
  }
}

// Vérifier la modification
async function verifyUpdate(userId) {
  try {
    console.log('\n🔍 Vérification de la modification...');
    const response = await api.get(`/users/${userId}`);
    
    if (response.data.success) {
      const user = response.data.data.user;
      console.log('✅ Utilisateur récupéré après modification:', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        address: user.address
      });
      
      // Vérifier que les modifications ont bien été appliquées
      if (user.firstName === 'Test-Modified' && user.lastName === 'Update-Modified') {
        console.log('✅ Modifications confirmées !');
        return true;
      } else {
        console.log('❌ Modifications non appliquées');
        return false;
      }
    }
  } catch (error) {
    console.error('❌ Erreur vérification:', error.response?.data || error.message);
    return false;
  }
}

// Nettoyer - supprimer l'utilisateur de test
async function cleanup(userId) {
  try {
    console.log('\n🧹 Nettoyage - suppression de l\'utilisateur de test...');
    const response = await api.delete(`/users/${userId}`);
    
    if (response.data.success) {
      console.log('✅ Utilisateur de test supprimé');
    }
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error.response?.data || error.message);
  }
}

// Test principal
async function runUpdateTest() {
  console.log('🚀 Test de modification d\'utilisateur\n');
  
  // Connexion
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log('❌ Impossible de continuer sans connexion admin');
    return;
  }
  
  // Créer un utilisateur de test
  const testUser = await createTestUser();
  if (!testUser) {
    console.log('❌ Impossible de créer un utilisateur de test');
    return;
  }
  
  // Tester la modification
  const modifiedUser = await testUpdateUser(testUser);
  if (!modifiedUser) {
    console.log('❌ Échec de la modification');
    await cleanup(testUser.id);
    return;
  }
  
  // Vérifier la modification
  const verified = await verifyUpdate(modifiedUser.id);
  
  // Nettoyer
  await cleanup(modifiedUser.id);
  
  if (verified) {
    console.log('\n🎉 Test de modification réussi !');
  } else {
    console.log('\n❌ Test de modification échoué');
  }
}

// Exécuter le test
if (require.main === module) {
  runUpdateTest().catch(console.error);
}

module.exports = { runUpdateTest };