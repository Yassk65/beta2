// test_update_specific.js - Test spécifique de modification d'utilisateur
// 📅 Créé le : 22 Juillet 2025

const axios = require('axios');

async function testUpdateSpecific() {
  console.log('🚀 Test spécifique de modification d\'utilisateur...\n');
  
  try {
    // Étape 1: Connexion admin
    console.log('1. Connexion admin...');
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@test.com',
      password: 'password123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('Connexion admin échouée');
    }
    
    const token = loginResponse.data.data.token;
    console.log('✅ Connexion admin réussie');
    
    // Étape 2: Lister les utilisateurs pour en prendre un
    console.log('\n2. Récupération de la liste des utilisateurs...');
    const usersResponse = await axios.get('http://localhost:3000/api/users?limit=5', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!usersResponse.data.success || usersResponse.data.data.users.length === 0) {
      throw new Error('Aucun utilisateur trouvé');
    }
    
    // Prendre le premier utilisateur qui n'est pas admin
    const userToModify = usersResponse.data.data.users.find(u => u.role !== 'ADMIN');
    if (!userToModify) {
      throw new Error('Aucun utilisateur non-admin trouvé');
    }
    
    console.log('✅ Utilisateur à modifier trouvé:', {
      id: userToModify.id,
      email: userToModify.email,
      firstName: userToModify.firstName,
      lastName: userToModify.lastName,
      role: userToModify.role
    });
    
    // Étape 3: Modifier l'utilisateur
    console.log('\n3. Modification de l\'utilisateur...');
    const originalFirstName = userToModify.firstName;
    const newFirstName = originalFirstName + '-Modified';
    
    const updateData = {
      firstName: newFirstName,
      lastName: userToModify.lastName,
      email: userToModify.email,
      role: userToModify.role,
      isActive: userToModify.isActive
    };
    
    // Ajouter les champs spécifiques selon le rôle
    if (userToModify.role === 'PATIENT') {
      updateData.dateOfBirth = userToModify.dateOfBirth;
      updateData.address = userToModify.address;
    } else if (userToModify.role === 'HOPITAL') {
      updateData.hospitalName = userToModify.hospitalName;
      updateData.hospitalAddress = userToModify.hospitalAddress;
      updateData.licenseNumber = userToModify.licenseNumber;
    } else if (userToModify.role === 'LABO') {
      updateData.labName = userToModify.labName;
      updateData.labAddress = userToModify.labAddress;
      updateData.labLicense = userToModify.labLicense;
    }
    
    console.log('📤 Données envoyées pour modification:', updateData);
    
    const updateResponse = await axios.put(`http://localhost:3000/api/users/${userToModify.id}`, updateData, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (updateResponse.data.success) {
      console.log('✅ Modification réussie !');
      console.log('📥 Données reçues:', updateResponse.data.data.user);
      
      // Étape 4: Vérifier la modification
      console.log('\n4. Vérification de la modification...');
      const verifyResponse = await axios.get(`http://localhost:3000/api/users/${userToModify.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (verifyResponse.data.success) {
        const modifiedUser = verifyResponse.data.data.user;
        console.log('📋 Utilisateur après modification:', {
          id: modifiedUser.id,
          firstName: modifiedUser.firstName,
          lastName: modifiedUser.lastName,
          email: modifiedUser.email
        });
        
        if (modifiedUser.firstName === newFirstName) {
          console.log('🎉 SUCCÈS: La modification a bien été appliquée !');
          
          // Étape 5: Restaurer l'original
          console.log('\n5. Restauration de l\'original...');
          await axios.put(`http://localhost:3000/api/users/${userToModify.id}`, {
            ...updateData,
            firstName: originalFirstName
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('🔄 Utilisateur restauré à son état original');
          
        } else {
          console.log('❌ ÉCHEC: La modification n\'a pas été appliquée');
          console.log('   Attendu:', newFirstName);
          console.log('   Reçu:', modifiedUser.firstName);
        }
      }
    } else {
      console.log('❌ Modification échouée:', updateResponse.data.message);
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔴 SERVEUR NON DÉMARRÉ');
      console.error('   → Démarrer le serveur avec: npm run dev');
    } else if (error.response?.status === 500) {
      console.error('🔴 ERREUR SERVEUR (500)');
      console.error('   → Vérifier que WAMP/MySQL est démarré');
      console.error('   → Message:', error.response.data?.message);
    } else if (error.response?.status === 400) {
      console.error('🔴 DONNÉES INVALIDES (400)');
      console.error('   → Vérifier la validation des champs');
      console.error('   → Erreurs:', error.response.data?.errors);
    } else if (error.response?.status === 401) {
      console.error('🔴 NON AUTORISÉ (401)');
      console.error('   → Problème d\'authentification');
    } else if (error.response?.status === 403) {
      console.error('🔴 ACCÈS REFUSÉ (403)');
      console.error('   → Seuls les admins peuvent modifier les utilisateurs');
    } else {
      console.error('🔴 ERREUR INCONNUE');
      console.error('   → Status:', error.response?.status);
      console.error('   → Message:', error.response?.data || error.message);
    }
  }
}

// Exécuter le test
if (require.main === module) {
  testUpdateSpecific();
}

module.exports = { testUpdateSpecific };