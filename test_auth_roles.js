// Test des rôles d'authentification
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const testAccounts = {
  superAdmin: {
    email: 'admin@labresult.com',
    password: 'password'
  },
  hospitalAdmin: {
    email: 'admin@hopital-central.fr',
    password: 'password'
  },
  doctor: {
    email: 'dr.martin@hopital-central.fr',
    password: 'password'
  },
  labAdmin: {
    email: 'admin@biotest.fr',
    password: 'password'
  },
  technician: {
    email: 'tech1@biotest.fr',
    password: 'password'
  },
  patient: {
    email: 'patient1@example.com',
    password: 'password'
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
  console.log('🧪 TEST DES RÔLES D\'AUTHENTIFICATION');
  console.log('=====================================');
  
  const roles = {};
  
  for (const [accountType, credentials] of Object.entries(testAccounts)) {
    const role = await testLogin(accountType, credentials);
    if (role) {
      roles[accountType] = role;
    }
  }
  
  console.log('\n📊 RÉSUMÉ DES RÔLES:');
  console.log('===================');
  for (const [accountType, role] of Object.entries(roles)) {
    console.log(`${accountType}: ${role}`);
  }
}

main().catch(console.error);