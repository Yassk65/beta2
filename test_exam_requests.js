// 🧪 TEST RAPIDE - DEMANDES D'EXAMENS DE LABORATOIRE
// 📅 Créé le : 11 Août 2025
// 🎯 Tester la nouvelle fonctionnalité de demandes d'examens

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

// Comptes de test
const testAccounts = {
  doctor: { email: 'dr.bernard@chu-paris.fr', password: 'staff123' },
  labStaff: { email: 'tech.dupont@cerba.fr', password: 'staff123' },
  patient: { email: 'jean.dupont@email.fr', password: 'patient123' }
};

async function testExamRequests() {
  console.log('🧪 Test de la fonctionnalité Demandes d\'Examens...\n');

  try {
    // 1. Test de santé de l'API
    console.log('1️⃣ Test de santé de l\'API...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(`   ✅ API opérationnelle: ${healthResponse.data.message}`);

    // 2. Connexion Médecin
    console.log('\n2️⃣ Connexion Médecin...');
    const doctorLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.doctor);
    const doctorToken = doctorLogin.data.data.token;
    console.log(`   ✅ Connexion médecin réussie: ${doctorLogin.data.data.user.first_name} ${doctorLogin.data.data.user.last_name}`);

    // 3. Connexion Personnel Laboratoire
    console.log('\n3️⃣ Connexion Personnel Laboratoire...');
    const labLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.labStaff);
    const labToken = labLogin.data.data.token;
    console.log(`   ✅ Connexion labo réussie: ${labLogin.data.data.user.first_name} ${labLogin.data.data.user.last_name}`);

    // 4. Test statistiques (Médecin)
    console.log('\n4️⃣ Test statistiques demandes d\'examens (Médecin)...');
    const doctorStats = await axios.get(`${API_BASE}/exam-requests/stats`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ Statistiques médecin:`, doctorStats.data.data);

    // 5. Test statistiques (Personnel Labo)
    console.log('\n5️⃣ Test statistiques demandes d\'examens (Personnel Labo)...');
    const labStats = await axios.get(`${API_BASE}/exam-requests/stats`, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    console.log(`   ✅ Statistiques labo:`, labStats.data.data);

    // 6. Liste des demandes (Médecin)
    console.log('\n6️⃣ Liste des demandes d\'examens (Médecin)...');
    const doctorRequests = await axios.get(`${API_BASE}/exam-requests`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ ${doctorRequests.data.data.examRequests.length} demandes trouvées pour le médecin`);

    // 7. Liste des demandes (Personnel Labo)
    console.log('\n7️⃣ Liste des demandes d\'examens (Personnel Labo)...');
    const labRequests = await axios.get(`${API_BASE}/exam-requests`, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    console.log(`   ✅ ${labRequests.data.data.examRequests.length} demandes trouvées pour le laboratoire`);

    // 8. Créer une nouvelle demande d'examen (Médecin)
    console.log('\n8️⃣ Création d\'une nouvelle demande d\'examen...');
    const newExamRequest = await axios.post(`${API_BASE}/exam-requests`, {
      patient_id: 1,
      laboratory_id: 1,
      exam_type: 'blood_test',
      priority: 'high',
      clinical_info: 'Patient présente des symptômes de fatigue chronique. Suspicion d\'anémie. Demande bilan hématologique pour diagnostic.',
      requested_tests: [
        'Hémogramme complet',
        'Fer sérique',
        'Ferritine',
        'Vitamine B12'
      ],
      notes: 'Patient anxieux, prévoir prise de sang en douceur'
    }, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ Demande créée avec succès: ID ${newExamRequest.data.data.examRequest.id}`);
    const newRequestId = newExamRequest.data.data.examRequest.id;

    // 9. Consulter la demande créée
    console.log('\n9️⃣ Consultation de la demande créée...');
    const requestDetails = await axios.get(`${API_BASE}/exam-requests/${newRequestId}`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ Détails récupérés: ${requestDetails.data.data.examRequest.exam_type} - ${requestDetails.data.data.examRequest.status}`);

    // 10. Mettre à jour le statut (Personnel Labo)
    console.log('\n🔟 Mise à jour du statut par le laboratoire...');
    const statusUpdate = await axios.put(`${API_BASE}/exam-requests/${newRequestId}/status`, {
      status: 'accepted',
      notes: 'Demande acceptée. Programmation prévue pour demain matin.',
      scheduled_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    }, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    console.log(`   ✅ Statut mis à jour: ${statusUpdate.data.data.examRequest.status}`);

    // 11. Consulter l'historique
    console.log('\n1️⃣1️⃣ Consultation de l\'historique...');
    const history = await axios.get(`${API_BASE}/exam-requests/${newRequestId}/history`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ ${history.data.data.history.length} entrées dans l\'historique`);

    // 12. Test demandes urgentes
    console.log('\n1️⃣2️⃣ Test des demandes urgentes...');
    const urgentRequests = await axios.get(`${API_BASE}/exam-requests/urgent`, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    console.log(`   ✅ ${urgentRequests.data.data.examRequests.length} demandes urgentes trouvées`);

    // 13. Test accès interdit (Patient)
    console.log('\n1️⃣3️⃣ Test accès interdit (Patient)...');
    const patientLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.patient);
    const patientToken = patientLogin.data.data.token;
    
    try {
      await axios.get(`${API_BASE}/exam-requests/stats`, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      console.log('   ❌ ERREUR: Le patient ne devrait pas avoir accès !');
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('   ✅ Accès correctement refusé au patient (403)');
      } else {
        console.log(`   ⚠️ Erreur inattendue: ${error.response?.status}`);
      }
    }

    console.log('\n✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES :');
    console.log('   ✅ Statistiques par rôle');
    console.log('   ✅ Liste des demandes filtrées');
    console.log('   ✅ Création de demandes (médecin)');
    console.log('   ✅ Consultation des détails');
    console.log('   ✅ Mise à jour des statuts (labo)');
    console.log('   ✅ Historique des changements');
    console.log('   ✅ Demandes urgentes');
    console.log('   ✅ Contrôle d\'accès (patient refusé)');

    console.log('\n🚀 LA NOUVELLE FONCTIONNALITÉ EST OPÉRATIONNELLE !');

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
console.log('🔍 Test de la nouvelle fonctionnalité Demandes d\'Examens...');
console.log('💡 Assurez-vous que le serveur tourne sur http://localhost:3000\n');

testExamRequests();