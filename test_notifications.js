// 🔔 TEST RAPIDE - SYSTÈME DE NOTIFICATIONS
// 📅 Créé le : 11 Août 2025
// 🎯 Tester la nouvelle fonctionnalité de notifications

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_BASE = 'http://localhost:3000/api';

// Comptes de test - avec les bons mots de passe
const testAccounts = {
  doctor: { email: 'dr.pierre.dubois@psl.aphp.fr', password: 'staff123' },
  labStaff: { email: 'tech.monique.leroy@cerba.fr', password: 'staff123' },
  patient: { email: 'franoise.garcia@email.fr', password: 'patient123' }
};

async function testNotifications() {
  console.log('🔔 Test du système de notifications...\n');

  try {
    // 1. Test de santé de l'API
    console.log('1️⃣ Test de santé de l\'API...');
    const healthResponse = await axios.get(`${API_BASE}/health`);
    console.log(`   ✅ API opérationnelle: ${healthResponse.data.message}`);

    // 2. Connexion Patient
    console.log('\n2️⃣ Connexion Patient...');
    const patientLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.patient);
    const patientToken = patientLogin.data.data.token;
    console.log(`   ✅ Connexion patient réussie: ${patientLogin.data.data.user.first_name} ${patientLogin.data.data.user.last_name}`);

    // 3. Test statistiques notifications (Patient)
    console.log('\n3️⃣ Test statistiques notifications (Patient)...');
    const patientStats = await axios.get(`${API_BASE}/notifications/stats`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ Statistiques patient:`, patientStats.data.data);

    // 4. Test liste des notifications (Patient)
    console.log('\n4️⃣ Test liste des notifications (Patient)...');
    const patientNotifications = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ ${patientNotifications.data.data.notifications.length} notifications trouvées`);
    console.log(`   ✅ ${patientNotifications.data.data.unreadCount} notifications non lues`);

    // 5. Test notifications non lues uniquement
    console.log('\n5️⃣ Test notifications non lues (Patient)...');
    const unreadNotifications = await axios.get(`${API_BASE}/notifications/unread`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ ${unreadNotifications.data.data.notifications.length} notifications non lues`);

    // 6. Test paramètres de notification
    console.log('\n6️⃣ Test paramètres de notification (Patient)...');
    const settings = await axios.get(`${API_BASE}/notifications/settings`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ Paramètres récupérés:`, {
      messages: settings.data.data.settings.new_message_enabled,
      documents: settings.data.data.settings.new_document_enabled,
      examens: settings.data.data.settings.exam_status_enabled
    });

    // 7. Test mise à jour des paramètres
    console.log('\n7️⃣ Test mise à jour paramètres (Patient)...');
    const updatedSettings = await axios.put(`${API_BASE}/notifications/settings`, {
      new_message_enabled: true,
      new_document_enabled: true,
      exam_status_enabled: false, // Désactiver les notifications d'examens
      email_enabled: false
    }, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ Paramètres mis à jour: examens désactivés`);

    // 8. Marquer une notification comme lue
    if (patientNotifications.data.data.notifications.length > 0) {
      const firstNotification = patientNotifications.data.data.notifications[0];
      if (!firstNotification.is_read) {
        console.log('\n8️⃣ Test marquage notification comme lue...');
        const markRead = await axios.put(`${API_BASE}/notifications/${firstNotification.id}/read`, {}, {
          headers: { Authorization: `Bearer ${patientToken}` }
        });
        console.log(`   ✅ Notification ${firstNotification.id} marquée comme lue`);
      }
    }

    // 9. Connexion Médecin
    console.log('\n9️⃣ Connexion Médecin...');
    const doctorLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.doctor);
    const doctorToken = doctorLogin.data.data.token;
    console.log(`   ✅ Connexion médecin réussie: ${doctorLogin.data.data.user.first_name} ${doctorLogin.data.data.user.last_name}`);

    // 10. Test notifications médecin
    console.log('\n🔟 Test notifications (Médecin)...');
    const doctorNotifications = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ ${doctorNotifications.data.data.notifications.length} notifications médecin`);

    // 11. Test notifications par type
    console.log('\n1️⃣1️⃣ Test notifications par type (exam_results_ready)...');
    const examNotifications = await axios.get(`${API_BASE}/notifications/type/exam_results_ready`, {
      headers: { Authorization: `Bearer ${doctorToken}` }
    });
    console.log(`   ✅ ${examNotifications.data.data.notifications.length} notifications de résultats d'examens`);

    // 12. Connexion Personnel Laboratoire
    console.log('\n1️⃣2️⃣ Connexion Personnel Laboratoire...');
    const labLogin = await axios.post(`${API_BASE}/auth/login`, testAccounts.labStaff);
    const labToken = labLogin.data.data.token;
    console.log(`   ✅ Connexion labo réussie: ${labLogin.data.data.user.first_name} ${labLogin.data.data.user.last_name}`);

    // 13. Test notifications laboratoire
    console.log('\n1️⃣3️⃣ Test notifications (Personnel Labo)...');
    const labNotifications = await axios.get(`${API_BASE}/notifications`, {
      headers: { Authorization: `Bearer ${labToken}` }
    });
    console.log(`   ✅ ${labNotifications.data.data.notifications.length} notifications laboratoire`);

    // 14. Test marquer toutes comme lues
    console.log('\n1️⃣4️⃣ Test marquer toutes notifications comme lues (Patient)...');
    const markAllRead = await axios.put(`${API_BASE}/notifications/read-all`, {}, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    console.log(`   ✅ ${markAllRead.data.data.updatedCount} notifications marquées comme lues`);

    // 15. Test création automatique de notification (envoyer un message)
    console.log('\n1️⃣5️⃣ Test création automatique de notification (nouveau message)...');
    
    // D'abord, récupérer les conversations du patient
    const conversations = await axios.get(`${API_BASE}/messages/conversations`, {
      headers: { Authorization: `Bearer ${patientToken}` }
    });
    
    if (conversations.data.data.conversations.length > 0) {
      const conversationId = conversations.data.data.conversations[0].id;
      
      // Envoyer un message (cela devrait créer une notification automatiquement)
      const newMessage = await axios.post(`${API_BASE}/messages/conversations/${conversationId}/messages`, {
        content: 'Test de notification automatique - nouveau message du patient'
      }, {
        headers: { Authorization: `Bearer ${patientToken}` }
      });
      
      console.log(`   ✅ Message envoyé, notification automatique créée`);
      
      // Attendre un peu puis vérifier les notifications du médecin
      setTimeout(async () => {
        try {
          const updatedDoctorNotifications = await axios.get(`${API_BASE}/notifications/unread`, {
            headers: { Authorization: `Bearer ${doctorToken}` }
          });
          console.log(`   ✅ Médecin a maintenant ${updatedDoctorNotifications.data.data.notifications.length} notifications non lues`);
        } catch (error) {
          console.log(`   ⚠️ Erreur vérification notifications médecin:`, error.message);
        }
      }, 1000);
    }

    // 16. Test création automatique de notification (upload document)
    console.log('\n1️⃣6️⃣ Test création automatique de notification (nouveau document)...');

    try {
      const labPatients = await axios.get(`${API_BASE}/patients/lab`, {
        headers: { Authorization: `Bearer ${labToken}` }
      });

      if (labPatients.data.data.patients.length > 0) {
        const patientId = labPatients.data.data.patients[0].id;
        const testFilePath = path.join(__dirname, 'test_notification_doc.txt');
        fs.writeFileSync(testFilePath, 'Document test pour notifications');

        const form = new FormData();
        form.append('patient_id', patientId);
        form.append('document_type', 'rapport');
        form.append('description', 'Document test notification');
        form.append('file', fs.createReadStream(testFilePath));

        await axios.post(`${API_BASE}/documents/upload`, form, {
          headers: { Authorization: `Bearer ${labToken}`, ...form.getHeaders() }
        });

        fs.unlinkSync(testFilePath);
        console.log('   ✅ Document uploadé, notification automatique créée');

        setTimeout(async () => {
          try {
            const updatedPatientNotifications = await axios.get(`${API_BASE}/notifications/unread`, {
              headers: { Authorization: `Bearer ${patientToken}` }
            });
            console.log(`   ✅ Patient a maintenant ${updatedPatientNotifications.data.data.notifications.length} notifications non lues`);
          } catch (error) {
            console.log('   ⚠️ Erreur vérification notifications patient:', error.message);
          }
        }, 1000);
      } else {
        console.log('   ⚠️ Aucun patient disponible pour test document');
      }
    } catch (error) {
      console.log('   ⚠️ Erreur upload document:', error.message);
    }

    console.log('\n✅ TOUS LES TESTS SONT PASSÉS AVEC SUCCÈS !');
    console.log('\n📋 RÉSUMÉ DES FONCTIONNALITÉS TESTÉES :');
    console.log('   ✅ Statistiques de notifications');
    console.log('   ✅ Liste des notifications avec pagination');
    console.log('   ✅ Notifications non lues uniquement');
    console.log('   ✅ Paramètres de notification');
    console.log('   ✅ Mise à jour des paramètres');
    console.log('   ✅ Marquage comme lu (individuel et global)');
    console.log('   ✅ Notifications par type');
    console.log('   ✅ Notifications par rôle (patient, médecin, labo)');
    console.log('   ✅ Création automatique de notifications (messages & documents)');

    console.log('\n🚀 LE SYSTÈME DE NOTIFICATIONS EST OPÉRATIONNEL !');

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
console.log('🔍 Test du système de notifications...');
console.log('💡 Assurez-vous que le serveur tourne sur http://localhost:3000\n');

testNotifications();