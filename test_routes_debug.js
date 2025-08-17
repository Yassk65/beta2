// Test pour déboguer les routes
const axios = require('axios');

async function testRoutes() {
  console.log('🧪 Test des routes disponibles...');
  
  try {
    // Test de santé de l'API
    console.log('🔍 Test de l\'API health...');
    const healthResponse = await axios.get('http://localhost:3000/api/health');
    console.log('✅ API Health:', healthResponse.data.message);
    
    // Test de connexion avec différents comptes
    const accounts = [
      { email: 'super@admin.com', password: 'SuperAdmin2025!' },
      { email: 'admin@hopital-central-paris.fr', password: 'HospitalAdmin2025!' },
      { email: 'admin@biomed-paris.fr', password: 'LabAdmin2025!' }
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
      console.log('✅ Connexion super admin réussie');
      const token = loginResponse.data.data.token;
      
      // Test des différentes routes patients
      console.log('🔍 Test route /api/users/patients...');
      try {
        const patientsResponse = await axios.get('http://localhost:3000/api/users/patients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Route /api/users/patients fonctionne:', patientsResponse.data.success);
      } catch (error) {
        console.log('❌ Route /api/users/patients échoue:', error.response?.status, error.response?.data?.message);
      }
      
      console.log('🔍 Test route /api/users/patients/lab...');
      try {
        const labPatientsResponse = await axios.get('http://localhost:3000/api/users/patients/lab', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Route /api/users/patients/lab fonctionne:', labPatientsResponse.data.success);
        console.log('📊 Nombre de patients:', labPatientsResponse.data.data?.patients?.length || 0);
      } catch (error) {
        console.log('❌ Route /api/users/patients/lab échoue:', error.response?.status, error.response?.data?.message);
        if (error.response?.data?.error) {
          console.log('🔍 Détail de l\'erreur:', error.response.data.error);
        }
      }
      
      console.log('🔍 Test route /api/users/patients/search...');
      try {
        const searchResponse = await axios.get('http://localhost:3000/api/users/patients/search?q=patient', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        console.log('✅ Route /api/users/patients/search fonctionne:', searchResponse.data.success);
      } catch (error) {
        console.log('❌ Route /api/users/patients/search échoue:', error.response?.status, error.response?.data?.message);
        if (error.response?.data?.error) {
          console.log('🔍 Détail de l\'erreur:', error.response.data.error);
        }
      }
      
    } else {
      console.log('❌ Échec connexion super admin');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error.message);
  }
}

testRoutes();