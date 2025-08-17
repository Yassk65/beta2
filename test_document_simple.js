// Test simple pour l'upload de documents
const axios = require('axios');

async function testDocumentEndpoints() {
  console.log('🧪 Test des endpoints de documents...');
  
  try {
    // Test de connexion avec différents comptes
    const accounts = [
      { email: 'tech1@biotest.fr', password: 'tech123' },
      { email: 'labstaff@lab.com', password: 'labstaff123' },
      { email: 'admin@biotest.fr', password: 'admin123' }
    ];
    
    let loginResponse = null;
    for (const account of accounts) {
      try {
        console.log(`🔐 Tentative de connexion avec ${account.email}...`);
        loginResponse = await axios.post('http://localhost:3000/api/auth/login', account);
        if (loginResponse.data.success) {
          console.log(`✅ Connexion réussie avec ${account.email}`);
          break;
        }
      } catch (error) {
        console.log(`❌ Échec avec ${account.email}: ${error.response?.data?.message || error.message}`);
      }
    }
    
    if (loginResponse.data.success) {
      console.log('✅ Connexion réussie');
      const token = loginResponse.data.data.token;
      
      // Test récupération patients
      const patientsResponse = await axios.get('http://localhost:3000/api/users/patients/lab', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📊 Patients:', patientsResponse.data);
      
    } else {
      console.log('❌ Échec connexion');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
  }
}

testDocumentEndpoints();