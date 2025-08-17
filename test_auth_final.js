// Test des rôles d'authentification avec les comptes réels
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const testAccounts = {
  superAdmin: {
    email: 'admin@sante-app.fr',
    password: 'admin123'
  },
  hospitalAdmin: {
    email: 'admin.hospital1@sante-app.fr',
    password: 'hospital123'
  },
  hospitalStaff: {
    email: 'dr.monique.robert@chu-lyon.fr',
    password: 'staff123'
  },
  labAdmin: {
    email: 'admin.lab1@sante-app.fr',
    password: 'lab123'
  },
  labStaff: {
    email: 'tech.monique.leroy@cerba.fr',
    password: 'staff123'
  },
  patient: {
    email: 'catherine.martin@email.fr',
    password: 'patient123'
  }
};

async function testLogin(accountType, credentials) {
  try {
    console.log(`\n🔐 Test connexion ${accountType}...`);
    console.log(`   Email: ${credentials.email}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, credentials);
    
    if (response.data.success) {
      const user = response.data.data.user;
      console.log(`   ✅ Connexion réussie`);
      console.log(`   👤 Nom: ${user.first_name} ${user.last_name}`);
      console.log(`   🎭 Rôle: ${user.role}`);
      console.log(`   🏥 Hôpital ID: ${user.hospital_id || 'N/A'}`);
      console.log(`   🧪 Laboratoire ID: ${user.laboratory_id || 'N/A'}`);
      return user.role;
    } else {
      console.log(`   ❌ Échec: ${response.data.message}`);
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.response?.data?.message || error.message}`);
    return null;
  }
}

async function main() {
  console.log('🧪 TEST FINAL DES RÔLES D\'AUTHENTIFICATION');
  console.log('==========================================');
  
  const roles = {};
  
  for (const [accountType, credentials] of Object.entries(testAccounts)) {
    const role = await testLogin(accountType, credentials);
    if (role) {
      roles[accountType] = role;
    }
    // Attendre 1 seconde entre chaque test pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 RÉSUMÉ DES RÔLES:');
  console.log('===================');
  for (const [accountType, role] of Object.entries(roles)) {
    console.log(`${accountType}: ${role}`);
  }
  
  console.log('\n🎯 ANALYSE DU SYSTÈME D\'AUTHENTIFICATION:');
  console.log('=========================================');
  
  const expectedRoles = {
    superAdmin: 'super_admin',
    hospitalAdmin: 'hospital_admin',
    hospitalStaff: 'hospital_staff',
    labAdmin: 'lab_admin',
    labStaff: 'lab_staff',
    patient: 'patient'
  };
  
  let allWorking = true;
  for (const [accountType, expectedRole] of Object.entries(expectedRoles)) {
    const actualRole = roles[accountType];
    if (actualRole === expectedRole) {
      console.log(`✅ ${accountType}: ${actualRole} (correct)`);
    } else {
      console.log(`❌ ${accountType}: attendu ${expectedRole}, obtenu ${actualRole || 'ÉCHEC'}`);
      allWorking = false;
    }
  }
  
  console.log('\n🏆 RÉSULTAT FINAL:');
  console.log('==================');
  if (allWorking) {
    console.log('✅ TOUS LES RÔLES FONCTIONNENT CORRECTEMENT !');
    console.log('🎉 Le système d\'authentification multi-rôles est opérationnel');
  } else {
    console.log('❌ Certains rôles ne fonctionnent pas correctement');
    console.log('🔧 Vérification nécessaire du système d\'authentification');
  }
}

main().catch(console.error);