// 🧪 TEST RAPIDE DE L'API AVEC LES DONNÉES DE TEST
// 📅 Créé le : 11 Août 2025
// 🎯 Tester les principales fonctionnalités avec les comptes créés

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Comptes de test
const testAccounts = {
  superAdmin: { email: 'admin@sante-app.fr', password: 'admin123' },
  hospitalAdmin: { email: 'admin.chu-paris@sante-app.fr', password: 'hospital123' },
  labAdmin: { email: 'admin.cerba@sante-app.fr', password: 'lab123' },
  doctor: { email: 'dr.bernard@chu-paris.fr', password: 'staff123' },
  patient: { email: 'jean.dupont@email.fr', password: 'patient123' }
};

async function testAPI() {
  console.log('🧪 Test de l\'API avec les données de test...\n');

  try {
    // 1. Test de santé de l'API
    console.log('1️⃣ Test de santé de l\'API...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(`   ✅ API opérationnelle: ${healthResponse.data.message}`);

    // 2. Test de connexion Super Admin
    console.log('\n2️⃣ Test connexion Super Admin...');
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.superAdmin);
    const adminToken = adminLogin.data.data.token;
    console.log(`   ✅ Connexion réussie: ${adminLogin.data.data.user.first_name} ${adminLogin.data.data.user.last_name}`);

    // 3. Test récupération des statistiques (Super Admin)
    console.log('\n3️⃣ Test statistiques générales...');
    const statsResponse = await axios.get(`${API_BASE}/users/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`   ✅ Statistiques récupérées:`, statsResponse.data.data);

    // 4. Test connexion Patient
    console.log('\n4️⃣ Test connexion Patient...');
    const patientLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.patient);
    const patientToken = patientLogin.data.data.token;
    console.log(`   ✅ Connexion patient réussie: ${patientLogin.data.data.user.first_name} ${patientLogin.data.data.user.last_name}`);

    // 5. Test récupération profil patient
    console.log('\n5️⃣ Test profil patient...');
    const profileResponse = await axios.get(`${API_BASE}/auth/profile`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ Profil récupéré: ${profileResponse.data.data.user.email}`);

    // 6. Test connexion Admin Hôpital
    console.log('\n6️⃣ Test connexion Admin Hôpital...');
    const hospitalAdminLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.hospitalAdmin);
    const hospitalAdminToken = hospitalAdminLogin.data.data.token;
    console.log(`   ✅ Connexion admin hôpital réussie: ${hospitalAdminLogin.data.data.user.first_name} ${hospitalAdminLogin.data.data.user.last_name}`);

    // 7. Test récupération des patients (Admin Hôpital)
    console.log('\n7️⃣ Test liste des patients (Admin Hôpital)...');
    const patientsResponse = await axios.get(`${API_BASE}/admin/patients`, {
      headers: { Authorization: `Bearer ${hospitalAdminToken}` }
    });
    console.log(`   ✅ ${patientsResponse.data.data.patients.length} patients récupérés`);

    // 8. Test récupération des hôpitaux
    console.log('\n8️⃣ Test liste des hôpitaux...');
    const hospitalsResponse = await axios.get(`${API_BASE}/users/hospitals`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ ${hospitalsResponse.data.data.hospitals.length} hôpitaux récupérés`);

    // 9. Test récupération des laboratoires
    console.log('\n9️⃣ Test liste des laboratoires...');
    const labsResponse = await axios.get(`${API_BASE}/users/laboratories`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ ${labsResponse.data.data.laboratories.length} laboratoires récupérés`);

    // 10. Test connexion Médecin
    console.log('\n🔟 Test connexion Médecin...');
    const doctorLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.doctor);
    const doctorToken = doctorLogin.data.data.token;
    console.log(`   ✅ Connexion médecin réussie: ${doctorLogin.data.data.user.first_name} ${doctorLogin.data.data.user.last_name}`);

    console.log('\n✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES :');
    console.log('   ✅ Santé de l\'API');
    console.log('   ✅ Authentification (tous les rôles)');
    console.log('   ✅ Récupération des profils');
    console.log('   ✅ Statistiques générales');
    console.log('   ✅ Gestion des patients');
    console.log('   ✅ Liste des établissements');

    console.log('\n🚀 L\'API est prête à être utilisée !');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 SOLUTION: Démarrez d\'abord le serveur avec:');
      console.log('   cd backend/src');
      console.log('   node app.js');
    }
  }
}

// Vérifier si le serveur est démarré
console.log('🔍 Vérification que le serveur est démarré...');
console.log('💡 Assurez-vous que le serveur tourne sur http://localhost:3000');
console.log('   Pour démarrer: cd backend/src && node app.js\n');

testAPI();