// test_new_structure.js
// 📅 Créé le : 8 Août 2025
// 🎯 Script de test pour la nouvelle structure multi-tables

const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';
let authTokens = {};

// Fonction utilitaire pour les requêtes
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
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
      error: error.response?.data || error.message 
    };
  }
};

// Test 1: Créer un admin d'hôpital avec un nouvel hôpital
const testCreateHospitalAdmin = async () => {
  console.log('\n🏥 Test 1: Création d\'un admin d\'hôpital...');
  
  const hospitalAdminData = {
    userType: 'hospital_admin',
    email: 'admin.hopital@test.com',
    password: 'password123',
    nom: 'Dupont',
    prenom: 'Jean',
    telephone: '0123456789',
    hospital_name: 'Hôpital Central',
    hospital_address: '123 Rue de la Santé',
    hospital_ville: 'Paris',
    hospital_pays: 'France',
    hospital_telephone: '0123456789',
    hospital_email: 'contact@hopital-central.fr',
    hospital_description: 'Hôpital général avec toutes spécialités'
  };

  const result = await makeRequest('POST', '/auth/register', hospitalAdminData);
  
  if (result.success) {
    console.log('✅ Admin d\'hôpital créé avec succès');
    authTokens.hospitalAdmin = result.data.data.token;
    console.log(`   ID: ${result.data.data.user.id}`);
    console.log(`   Email: ${result.data.data.user.email}`);
    console.log(`   Hôpital: ${result.data.data.user.hospital?.nom}`);
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Test 2: Créer un patient
const testCreatePatient = async () => {
  console.log('\n👤 Test 2: Création d\'un patient...');
  
  const patientData = {
    userType: 'patient',
    email: 'patient@test.com',
    password: 'password123',
    nom: 'Martin',
    prenom: 'Marie',
    telephone: '0987654321'
  };

  const result = await makeRequest('POST', '/auth/register', patientData);
  
  if (result.success) {
    console.log('✅ Patient créé avec succès');
    authTokens.patient = result.data.data.token;
    console.log(`   ID: ${result.data.data.user.id}`);
    console.log(`   Email: ${result.data.data.user.email}`);
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Test 3: Créer un admin de laboratoire
const testCreateLabAdmin = async () => {
  console.log('\n🧪 Test 3: Création d\'un admin de laboratoire...');
  
  const labAdminData = {
    userType: 'lab_admin',
    email: 'admin.labo@test.com',
    password: 'password123',
    nom: 'Durand',
    prenom: 'Pierre',
    lab_name: 'Laboratoire BioTest',
    lab_address: '456 Avenue des Sciences',
    lab_ville: 'Lyon',
    lab_pays: 'France',
    lab_telephone: '0456789123',
    lab_email: 'contact@biotest.fr',
    lab_description: 'Laboratoire d\'analyses médicales'
  };

  const result = await makeRequest('POST', '/auth/register', labAdminData);
  
  if (result.success) {
    console.log('✅ Admin de laboratoire créé avec succès');
    authTokens.labAdmin = result.data.data.token;
    console.log(`   ID: ${result.data.data.user.id}`);
    console.log(`   Email: ${result.data.data.user.email}`);
    console.log(`   Laboratoire: ${result.data.data.user.laboratory?.nom}`);
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Test 4: Connexion des utilisateurs
const testLogin = async () => {
  console.log('\n🔐 Test 4: Connexion des utilisateurs...');
  
  const users = [
    { email: 'admin.hopital@test.com', password: 'password123', type: 'Admin Hôpital' },
    { email: 'patient@test.com', password: 'password123', type: 'Patient' },
    { email: 'admin.labo@test.com', password: 'password123', type: 'Admin Labo' }
  ];

  for (const user of users) {
    const result = await makeRequest('POST', '/auth/login', {
      email: user.email,
      password: user.password
    });

    if (result.success) {
      console.log(`✅ Connexion ${user.type} réussie`);
      console.log(`   Type: ${result.data.data.userType}`);
    } else {
      console.log(`❌ Erreur connexion ${user.type}:`, result.error);
    }
  }
};

// Test 5: Récupérer les statistiques (avec token admin)
const testGetStats = async () => {
  console.log('\n📊 Test 5: Récupération des statistiques...');
  
  const result = await makeRequest('GET', '/users/stats', null, authTokens.hospitalAdmin);
  
  if (result.success) {
    console.log('✅ Statistiques récupérées');
    console.log('   Total utilisateurs:', result.data.data.totalUsers);
    console.log('   Par type:', result.data.data.usersByType);
    console.log('   Entités:', result.data.data.entities);
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Test 6: Lister tous les utilisateurs
const testGetAllUsers = async () => {
  console.log('\n👥 Test 6: Liste de tous les utilisateurs...');
  
  const result = await makeRequest('GET', '/users?page=1&limit=10', null, authTokens.hospitalAdmin);
  
  if (result.success) {
    console.log('✅ Liste des utilisateurs récupérée');
    console.log(`   Nombre d'utilisateurs: ${result.data.data.users.length}`);
    result.data.data.users.forEach(user => {
      console.log(`   - ${user.prenom} ${user.nom} (${user.userType}) - ${user.email}`);
    });
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Test 7: Test de l'API de santé
const testHealthCheck = async () => {
  console.log('\n🏥 Test 7: Vérification de l\'API...');
  
  const result = await makeRequest('GET', '/health');
  
  if (result.success) {
    console.log('✅ API fonctionnelle');
    console.log(`   Structure: ${result.data.data.structure}`);
    console.log(`   Message: ${result.data.data.message}`);
  } else {
    console.log('❌ Erreur:', result.error);
  }
};

// Fonction principale de test
const runAllTests = async () => {
  console.log('🚀 Démarrage des tests de la nouvelle structure...');
  console.log('=' .repeat(60));

  try {
    await testHealthCheck();
    await testCreateHospitalAdmin();
    await testCreatePatient();
    await testCreateLabAdmin();
    await testLogin();
    await testGetStats();
    await testGetAllUsers();

    console.log('\n' + '='.repeat(60));
    console.log('✅ Tous les tests terminés !');
    
  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
  }
};

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  runAllTests,
  testCreateHospitalAdmin,
  testCreatePatient,
  testCreateLabAdmin,
  testLogin,
  testGetStats,
  testGetAllUsers,
  testHealthCheck
};