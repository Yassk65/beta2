// test_quick_check.js - Test rapide du backend
// 📅 Créé le : 21 Juillet 2025

const axios = require('axios');

async function quickTest() {
  console.log('🚀 Test rapide du backend...\n');
  
  try {
    // Test 1: Vérifier que le serveur répond
    console.log('1. Test de santé du serveur...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ Serveur OK:', healthResponse.data.message);
    
    // Test 2: Tenter une connexion admin
    console.log('\n2. Test de connexion admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Connexion admin OK');
      const token = loginResponse.data.data.token;
      
      // Test 3: Tester l'endpoint de création d'utilisateur
      console.log('\n3. Test de création d\'utilisateur...');
      const userData = {
        email: 'test-quick@example.com',
        password: 'TestPassword123',
        role: 'PATIENT',
        firstName: 'Test',
        lastName: 'Quick',
        phone: '0123456789',
        isActive: true
      };
      
      const createResponse = await axios.post('http://localhost:3000/api/users', userData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (createResponse.data.success) {
        console.log('✅ Création d\'utilisateur OK');
        console.log('📊 Utilisateur créé:', createResponse.data.data.user.email);
        
        // Nettoyer - supprimer l'utilisateur de test
        await axios.delete(`http://localhost:3000/api/users/${createResponse.data.data.user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('🧹 Utilisateur de test supprimé');
      }
    }
    
    console.log('\n🎉 Tous les tests passent ! Le backend fonctionne correctement.');
    console.log('👉 Le problème vient probablement du frontend ou des données envoyées.');
    
  } catch (error) {
    console.error('\n❌ Erreur détectée:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 SERVEUR NON DÉMARRÉ');
      console.error('   → Démarrer le serveur avec: npm run dev');
    } else if (error.response?.status === 500 && error.response?.data?.message?.includes('database')) {
      console.error('🔴 BASE DE DONNÉES NON ACCESSIBLE');
      console.error('   → Démarrer WAMP et vérifier que MySQL fonctionne');
      console.error('   → Icône WAMP doit être VERTE');
    } else if (error.response?.status === 400) {
      console.error('🔴 DONNÉES INVALIDES');
      console.error('   → Vérifier la validation des champs');
      console.error('   → Erreur:', error.response.data);
    } else {
      console.error('🔴 ERREUR INCONNUE');
      console.error('   → Status:', error.response?.status);
      console.error('   → Message:', error.response?.data || error.message);
    }
  }
}

// Exécuter le test
if (require.main === module) {
  quickTest();
}

module.exports = { quickTest };