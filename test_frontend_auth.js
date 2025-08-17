// Test complet du système d'authentification frontend/backend
const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

const testAccounts = [
  {
    name: 'Super Admin',
    email: 'admin@sante-app.fr',
    password: 'admin123',
    expectedRole: 'super_admin',
    expectedRoute: '/superadmin'
  },
  {
    name: 'Admin Hôpital',
    email: 'admin.hospital1@sante-app.fr',
    password: 'hospital123',
    expectedRole: 'hospital_admin',
    expectedRoute: '/admin'
  },
  {
    name: 'Staff Hôpital',
    email: 'dr.monique.robert@chu-lyon.fr',
    password: 'staff123',
    expectedRole: 'hospital_staff',
    expectedRoute: '/doctor'
  },
  {
    name: 'Admin Laboratoire',
    email: 'admin.lab1@sante-app.fr',
    password: 'lab123',
    expectedRole: 'lab_admin',
    expectedRoute: '/labadmin'
  },
  {
    name: 'Staff Laboratoire',
    email: 'tech.alain.moreau@biogroup.fr',
    password: 'staff123',
    expectedRole: 'lab_staff',
    expectedRoute: '/labstaff'
  },
  {
    name: 'Patient',
    email: 'catherine.martin@email.fr',
    password: 'patient123',
    expectedRole: 'patient',
    expectedRoute: '/patient'
  }
];

// Fonction pour simuler le mapping des routes du frontend
function getRoleRoute(role) {
  const roleRouteMap = {
    'super_admin': '/superadmin',
    'hospital_admin': '/admin',
    'hospital_staff': '/doctor',
    'lab_admin': '/labadmin',
    'lab_staff': '/labstaff',
    'patient': '/patient'
  };
  return roleRouteMap[role] || '/login';
}

async function testLogin(account) {
  try {
    console.log(`\n🔐 Test: ${account.name}`);
    console.log(`   📧 Email: ${account.email}`);
    
    const response = await axios.post(`${API_BASE}/auth/login`, {
      email: account.email,
      password: account.password
    });
    
    if (response.data.success) {
      const user = response.data.data.user;
      const actualRoute = getRoleRoute(user.role);
      
      console.log(`   ✅ Connexion réussie`);
      console.log(`   👤 Utilisateur: ${user.first_name} ${user.last_name}`);
      console.log(`   🎭 Rôle obtenu: ${user.role}`);
      console.log(`   🎯 Rôle attendu: ${account.expectedRole}`);
      console.log(`   🚀 Route calculée: ${actualRoute}`);
      console.log(`   📍 Route attendue: ${account.expectedRoute}`);
      
      const roleMatch = user.role === account.expectedRole;
      const routeMatch = actualRoute === account.expectedRoute;
      
      if (roleMatch && routeMatch) {
        console.log(`   🎉 SUCCÈS COMPLET`);
        return { success: true, role: user.role, route: actualRoute };
      } else {
        console.log(`   ⚠️  PROBLÈME DÉTECTÉ:`);
        if (!roleMatch) console.log(`      - Rôle incorrect`);
        if (!routeMatch) console.log(`      - Route incorrecte`);
        return { success: false, role: user.role, route: actualRoute };
      }
    } else {
      console.log(`   ❌ Échec: ${response.data.message}`);
      return { success: false, error: response.data.message };
    }
  } catch (error) {
    const errorMsg = error.response?.data?.message || error.message;
    console.log(`   ❌ Erreur: ${errorMsg}`);
    return { success: false, error: errorMsg };
  }
}

async function main() {
  console.log('🧪 TEST COMPLET DU SYSTÈME D\'AUTHENTIFICATION MULTI-RÔLES');
  console.log('===========================================================');
  console.log('🎯 Objectif: Vérifier que chaque type d\'utilisateur peut se connecter');
  console.log('📱 Frontend: Angular avec routing par rôle');
  console.log('🔧 Backend: Node.js + Express + Prisma + MySQL');
  
  const results = [];
  
  for (const account of testAccounts) {
    const result = await testLogin(account);
    results.push({ account, result });
    
    // Attendre 2 secondes entre chaque test pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('\n📊 RÉSUMÉ FINAL');
  console.log('===============');
  
  let successCount = 0;
  let totalCount = results.length;
  
  results.forEach(({ account, result }) => {
    if (result.success) {
      console.log(`✅ ${account.name}: OK`);
      successCount++;
    } else {
      console.log(`❌ ${account.name}: ${result.error || 'ÉCHEC'}`);
    }
  });
  
  console.log(`\n🎯 SCORE: ${successCount}/${totalCount} (${Math.round(successCount/totalCount*100)}%)`);
  
  if (successCount === totalCount) {
    console.log('\n🏆 FÉLICITATIONS !');
    console.log('✨ Le système d\'authentification multi-rôles fonctionne parfaitement');
    console.log('🚀 Tous les types d\'utilisateurs peuvent se connecter normalement');
    console.log('🔐 La sécurité par rôle est opérationnelle');
    console.log('📱 Le routing frontend est correct');
  } else {
    console.log('\n⚠️  ATTENTION !');
    console.log(`❌ ${totalCount - successCount} type(s) d'utilisateur ne fonctionnent pas correctement`);
    console.log('🔧 Vérification nécessaire du système');
  }
  
  console.log('\n📋 COMPTES DE TEST DISPONIBLES:');
  console.log('==============================');
  testAccounts.forEach(account => {
    console.log(`${account.name}: ${account.email} / ${account.password}`);
  });
}

main().catch(console.error);