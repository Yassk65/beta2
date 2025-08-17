// Test des rôles d'authentification avec les bons comptes
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const testAccounts = {
  superAdmin: {
    email: 'admin@sante-app.fr',
    password: 'admin123'
  },
  hospitalAdmin: {
    email: 'admin.chu-paris@sante-app.fr',
    password: 'hospital123'
  },
  hospitalStaff: {
    email: 'dr.bernard@chu-paris.fr',
    password: 'staff123'
  },
  labAdmin: {
    email: 'admin.cerba@sante-app.fr',
    password: 'lab123'
  },
  labStaff: {
    email: 'tech.dupont@cerba.fr',
    password: 'staff123'
  },
  patient: {
    email: 'jean.dupont@email.fr',
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
  console.log('🧪 TEST DES RÔLES D\'AUTHENTIFICATION - COMPTES CORRECTS');
  console.log('========================================================');
  
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
  
  console.log('\n🔑 COMPTES DE TEST DISPONIBLES:');
  console.log('==============================');
  console.log('Super Admin: admin@sante-app.fr / admin123');
  console.log('Admin Hôpital: admin.chu-paris@sante-app.fr / hospital123');
  console.log('Staff Hôpital: dr.bernard@chu-paris.fr / staff123');
  console.log('Admin Labo: admin.cerba@sante-app.fr / lab123');
  console.log('Staff Labo: tech.dupont@cerba.fr / staff123');
  console.log('Patient: jean.dupont@email.fr / patient123');
}

main().catch(console.error);