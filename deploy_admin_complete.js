// 🚀 SCRIPT DE DÉPLOIEMENT COMPLET SYSTÈME D'ADMINISTRATION
// 📅 Créé le : 11 Août 2025
// 🎯 Déploiement automatisé du système d'administration MVP

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION DU DÉPLOIEMENT
// ============================================================================

const DEPLOYMENT_CONFIG = {
  // Super Admin par défaut
  superAdmin: {
    email: 'super@admin.com',
    password: 'SuperAdmin2025!',
    first_name: 'Super',
    last_name: 'Administrator'
  },
  
  // Hôpitaux de démonstration
  hospitals: [
    {
      name: 'Hôpital Central de Paris',
      address: '47 Boulevard de l\'Hôpital',
      city: 'Paris',
      phone: '0142177777',
      email: 'contact@hopital-central-paris.fr',
      latitude: 48.8388,
      longitude: 2.3619,
      admin: {
        email: 'admin@hopital-central-paris.fr',
        password: 'HospitalAdmin2025!',
        first_name: 'Dr. Jean',
        last_name: 'Dubois'
      }
    },
    {
      name: 'CHU de Lyon',
      address: '103 Grande Rue de la Croix-Rousse',
      city: 'Lyon',
      phone: '0472117777',
      email: 'contact@chu-lyon.fr',
      latitude: 45.7640,
      longitude: 4.8357,
      admin: {
        email: 'admin@chu-lyon.fr',
        password: 'HospitalAdmin2025!',
        first_name: 'Dr. Marie',
        last_name: 'Leroy'
      }
    }
  ],
  
  // Laboratoires de démonstration
  laboratories: [
    {
      name: 'Laboratoire BioMed Paris',
      address: '25 Rue de la Santé',
      city: 'Paris',
      phone: '0145678901',
      email: 'contact@biomed-paris.fr',
      latitude: 48.8566,
      longitude: 2.3522,
      admin: {
        email: 'admin@biomed-paris.fr',
        password: 'LabAdmin2025!',
        first_name: 'Dr. Pierre',
        last_name: 'Martin'
      }
    },
    {
      name: 'Laboratoire Analyses Plus',
      address: '15 Avenue des Sciences',
      city: 'Marseille',
      phone: '0491234567',
      email: 'contact@analyses-plus.fr',
      latitude: 43.2965,
      longitude: 5.3698,
      admin: {
        email: 'admin@analyses-plus.fr',
        password: 'LabAdmin2025!',
        first_name: 'Dr. Sophie',
        last_name: 'Bernard'
      }
    }
  ]
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  const colors = {
    info: '\x1b[36m',    // Cyan
    success: '\x1b[32m', // Vert
    error: '\x1b[31m',   // Rouge
    warning: '\x1b[33m', // Jaune
    reset: '\x1b[0m'     // Reset
  };
  
  console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
}

async function hashPassword(password) {
  return await bcrypt.hash(password, 12);
}

// ============================================================================
// FONCTIONS DE DÉPLOIEMENT
// ============================================================================

/**
 * 🔧 Vérifier la connexion à la base de données
 */
async function checkDatabaseConnection() {
  try {
    await prisma.$connect();
    log('✅ Connexion à la base de données réussie', 'success');
    return true;
  } catch (error) {
    log(`❌ Erreur de connexion à la base de données: ${error.message}`, 'error');
    return false;
  }
}

/**
 * 👑 Créer le Super Admin
 */
async function createSuperAdmin() {
  log('👑 Création du Super Admin...', 'info');
  
  try {
    // Vérifier si le super admin existe déjà
    const existingSuperAdmin = await prisma.user.findUnique({
      where: { email: DEPLOYMENT_CONFIG.superAdmin.email }
    });

    if (existingSuperAdmin) {
      log('⚠️ Super Admin existe déjà', 'warning');
      return existingSuperAdmin;
    }

    // Créer le super admin
    const hashedPassword = await hashPassword(DEPLOYMENT_CONFIG.superAdmin.password);
    
    const superAdmin = await prisma.user.create({
      data: {
        email: DEPLOYMENT_CONFIG.superAdmin.email,
        password_hash: hashedPassword,
        first_name: DEPLOYMENT_CONFIG.superAdmin.first_name,
        last_name: DEPLOYMENT_CONFIG.superAdmin.last_name,
        role: 'super_admin',
        is_active: true
      }
    });

    log(`✅ Super Admin créé: ${superAdmin.email}`, 'success');
    return superAdmin;

  } catch (error) {
    log(`❌ Erreur création Super Admin: ${error.message}`, 'error');
    throw error;
  }
}

/**
 * 🏥 Créer les hôpitaux et leurs admins
 */
async function createHospitals() {
  log('🏥 Création des hôpitaux...', 'info');
  
  const createdHospitals = [];

  for (const hospitalConfig of DEPLOYMENT_CONFIG.hospitals) {
    try {
      // Vérifier si l'hôpital existe déjà
      const existingHospital = await prisma.hospital.findFirst({
        where: { 
          OR: [
            { email: hospitalConfig.email },
            { name: hospitalConfig.name }
          ]
        }
      });

      let hospital;
      if (existingHospital) {
        log(`⚠️ Hôpital existe déjà: ${hospitalConfig.name}`, 'warning');
        hospital = existingHospital;
      } else {
        // Créer l'hôpital
        hospital = await prisma.hospital.create({
          data: {
            name: hospitalConfig.name,
            address: hospitalConfig.address,
            city: hospitalConfig.city,
            phone: hospitalConfig.phone,
            email: hospitalConfig.email,
            latitude: hospitalConfig.latitude,
            longitude: hospitalConfig.longitude,
            is_active: true
          }
        });
        log(`✅ Hôpital créé: ${hospital.name}`, 'success');
      }

      // Créer l'admin de l'hôpital
      const existingAdmin = await prisma.user.findUnique({
        where: { email: hospitalConfig.admin.email }
      });

      if (!existingAdmin) {
        const hashedPassword = await hashPassword(hospitalConfig.admin.password);
        
        const hospitalAdmin = await prisma.user.create({
          data: {
            email: hospitalConfig.admin.email,
            password_hash: hashedPassword,
            first_name: hospitalConfig.admin.first_name,
            last_name: hospitalConfig.admin.last_name,
            role: 'hospital_admin',
            hospital_id: hospital.id,
            is_active: true
          }
        });
        log(`✅ Admin hôpital créé: ${hospitalAdmin.email}`, 'success');
      } else {
        log(`⚠️ Admin hôpital existe déjà: ${hospitalConfig.admin.email}`, 'warning');
      }

      createdHospitals.push(hospital);

    } catch (error) {
      log(`❌ Erreur création hôpital ${hospitalConfig.name}: ${error.message}`, 'error');
    }
  }

  return createdHospitals;
}

/**
 * 🧪 Créer les laboratoires et leurs admins
 */
async function createLaboratories() {
  log('🧪 Création des laboratoires...', 'info');
  
  const createdLaboratories = [];

  for (const labConfig of DEPLOYMENT_CONFIG.laboratories) {
    try {
      // Vérifier si le laboratoire existe déjà
      const existingLab = await prisma.laboratory.findFirst({
        where: { 
          OR: [
            { email: labConfig.email },
            { name: labConfig.name }
          ]
        }
      });

      let laboratory;
      if (existingLab) {
        log(`⚠️ Laboratoire existe déjà: ${labConfig.name}`, 'warning');
        laboratory = existingLab;
      } else {
        // Créer le laboratoire
        laboratory = await prisma.laboratory.create({
          data: {
            name: labConfig.name,
            address: labConfig.address,
            city: labConfig.city,
            phone: labConfig.phone,
            email: labConfig.email,
            latitude: labConfig.latitude,
            longitude: labConfig.longitude,
            is_active: true
          }
        });
        log(`✅ Laboratoire créé: ${laboratory.name}`, 'success');
      }

      // Créer l'admin du laboratoire
      const existingAdmin = await prisma.user.findUnique({
        where: { email: labConfig.admin.email }
      });

      if (!existingAdmin) {
        const hashedPassword = await hashPassword(labConfig.admin.password);
        
        const labAdmin = await prisma.user.create({
          data: {
            email: labConfig.admin.email,
            password_hash: hashedPassword,
            first_name: labConfig.admin.first_name,
            last_name: labConfig.admin.last_name,
            role: 'lab_admin',
            laboratory_id: laboratory.id,
            is_active: true
          }
        });
        log(`✅ Admin laboratoire créé: ${labAdmin.email}`, 'success');
      } else {
        log(`⚠️ Admin laboratoire existe déjà: ${labConfig.admin.email}`, 'warning');
      }

      createdLaboratories.push(laboratory);

    } catch (error) {
      log(`❌ Erreur création laboratoire ${labConfig.name}: ${error.message}`, 'error');
    }
  }

  return createdLaboratories;
}

/**
 * 👥 Créer des utilisateurs de démonstration
 */
async function createDemoUsers(hospitals, laboratories) {
  log('👥 Création des utilisateurs de démonstration...', 'info');

  try {
    // Staff hospitalier de démonstration
    if (hospitals.length > 0) {
      const hospital = hospitals[0];
      
      const existingStaff = await prisma.user.findUnique({
        where: { email: 'staff@hopital-demo.fr' }
      });

      if (!existingStaff) {
        const hashedPassword = await hashPassword('StaffDemo2025!');
        
        await prisma.user.create({
          data: {
            email: 'staff@hopital-demo.fr',
            password_hash: hashedPassword,
            first_name: 'Infirmier',
            last_name: 'Démo',
            role: 'hospital_staff',
            hospital_id: hospital.id,
            phone: '0123456789',
            is_active: true
          }
        });
        log('✅ Staff hospitalier de démo créé', 'success');
      }
    }

    // Staff laboratoire de démonstration
    if (laboratories.length > 0) {
      const laboratory = laboratories[0];
      
      const existingLabStaff = await prisma.user.findUnique({
        where: { email: 'staff@labo-demo.fr' }
      });

      if (!existingLabStaff) {
        const hashedPassword = await hashPassword('LabStaffDemo2025!');
        
        await prisma.user.create({
          data: {
            email: 'staff@labo-demo.fr',
            password_hash: hashedPassword,
            first_name: 'Technicien',
            last_name: 'Démo',
            role: 'lab_staff',
            laboratory_id: laboratory.id,
            phone: '0123456790',
            is_active: true
          }
        });
        log('✅ Staff laboratoire de démo créé', 'success');
      }
    }

    // Patients de démonstration
    const patientConfigs = [
      {
        email: 'patient1@demo.fr',
        first_name: 'Jean',
        last_name: 'Patient',
        date_of_birth: '1980-05-15',
        gender: 'M',
        hospital_id: hospitals[0]?.id
      },
      {
        email: 'patient2@demo.fr',
        first_name: 'Marie',
        last_name: 'Patiente',
        date_of_birth: '1992-08-22',
        gender: 'F',
        laboratory_id: laboratories[0]?.id
      }
    ];

    for (const patientConfig of patientConfigs) {
      const existingPatient = await prisma.user.findUnique({
        where: { email: patientConfig.email }
      });

      if (!existingPatient) {
        const hashedPassword = await hashPassword('PatientDemo2025!');
        
        const patient = await prisma.user.create({
          data: {
            email: patientConfig.email,
            password_hash: hashedPassword,
            first_name: patientConfig.first_name,
            last_name: patientConfig.last_name,
            role: 'patient',
            hospital_id: patientConfig.hospital_id || null,
            laboratory_id: patientConfig.laboratory_id || null,
            phone: '0123456791',
            is_active: true
          }
        });

        // Créer le profil patient
        await prisma.patient.create({
          data: {
            user_id: patient.id,
            date_of_birth: new Date(patientConfig.date_of_birth),
            gender: patientConfig.gender,
            phone: '0123456791'
          }
        });

        log(`✅ Patient de démo créé: ${patient.email}`, 'success');
      }
    }

  } catch (error) {
    log(`❌ Erreur création utilisateurs de démo: ${error.message}`, 'error');
  }
}

/**
 * 📊 Afficher le résumé du déploiement
 */
async function displayDeploymentSummary() {
  log('📊 Génération du résumé de déploiement...', 'info');

  try {
    const [
      totalUsers,
      totalHospitals,
      totalLaboratories,
      totalPatients,
      usersByRole
    ] = await Promise.all([
      prisma.user.count(),
      prisma.hospital.count(),
      prisma.laboratory.count(),
      prisma.user.count({ where: { role: 'patient' } }),
      prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      })
    ]);

    console.log('\n🚀 ================================');
    console.log('📊 RÉSUMÉ DU DÉPLOIEMENT');
    console.log('🚀 ================================');
    console.log(`👥 Utilisateurs total: ${totalUsers}`);
    console.log(`🏥 Hôpitaux: ${totalHospitals}`);
    console.log(`🧪 Laboratoires: ${totalLaboratories}`);
    console.log(`🤒 Patients: ${totalPatients}`);
    console.log('\n📋 Répartition par rôle:');
    
    usersByRole.forEach(role => {
      console.log(`   ${role.role}: ${role._count.role}`);
    });

    console.log('\n🔐 COMPTES D\'ADMINISTRATION:');
    console.log(`👑 Super Admin: ${DEPLOYMENT_CONFIG.superAdmin.email}`);
    console.log(`   Mot de passe: ${DEPLOYMENT_CONFIG.superAdmin.password}`);
    
    console.log('\n🏥 Admins Hôpitaux:');
    DEPLOYMENT_CONFIG.hospitals.forEach(hospital => {
      console.log(`   ${hospital.admin.email} (${hospital.name})`);
      console.log(`   Mot de passe: ${hospital.admin.password}`);
    });

    console.log('\n🧪 Admins Laboratoires:');
    DEPLOYMENT_CONFIG.laboratories.forEach(lab => {
      console.log(`   ${lab.admin.email} (${lab.name})`);
      console.log(`   Mot de passe: ${lab.admin.password}`);
    });

    console.log('\n⚠️ IMPORTANT: Changez ces mots de passe en production !');
    console.log('🚀 ================================\n');

  } catch (error) {
    log(`❌ Erreur génération résumé: ${error.message}`, 'error');
  }
}

// ============================================================================
// FONCTION PRINCIPALE DE DÉPLOIEMENT
// ============================================================================

async function deployAdminSystem() {
  console.log('🚀 ================================');
  console.log('🏥 DÉPLOIEMENT SYSTÈME D\'ADMINISTRATION');
  console.log('🚀 ================================\n');

  try {
    // 1. Vérifier la connexion à la base de données
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      throw new Error('Impossible de se connecter à la base de données');
    }

    // 2. Créer le Super Admin
    await createSuperAdmin();

    // 3. Créer les hôpitaux et leurs admins
    const hospitals = await createHospitals();

    // 4. Créer les laboratoires et leurs admins
    const laboratories = await createLaboratories();

    // 5. Créer des utilisateurs de démonstration
    await createDemoUsers(hospitals, laboratories);

    // 6. Afficher le résumé
    await displayDeploymentSummary();

    log('✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS', 'success');

  } catch (error) {
    log(`❌ ERREUR LORS DU DÉPLOIEMENT: ${error.message}`, 'error');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// EXÉCUTION
// ============================================================================

if (require.main === module) {
  deployAdminSystem().catch(console.error);
}

module.exports = {
  deployAdminSystem,
  DEPLOYMENT_CONFIG
};