const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function checkTestData() {
  try {
    log('🔍 Vérification des données de test...', 'blue');
    log('=====================================', 'blue');

    // 1. Vérifier les utilisateurs
    log('\n👥 Utilisateurs dans la base:', 'blue');
    const users = await prisma.user.findMany({
      include: {
        patient: true,
        hospitalStaff: true,
        laboratoryStaff: true
      }
    });

    if (users.length === 0) {
      log('❌ Aucun utilisateur trouvé', 'red');
      log('💡 Création d\'utilisateurs de test...', 'cyan');
      await createTestUsers();
      return;
    }

    users.forEach((user, index) => {
      log(`${index + 1}. ${user.email} (${user.role}) - ID: ${user.id}`, 'green');
      if (user.patient) {
        log(`   └─ Patient ID: ${user.patient.id}`, 'cyan');
      }
    });

    // 2. Vérifier les patients spécifiquement
    log('\n🏥 Patients dans la base:', 'blue');
    const patients = await prisma.patient.findMany({
      include: {
        user: true
      }
    });

    patients.forEach((patient, index) => {
      log(`${index + 1}. Patient ID: ${patient.id} - User: ${patient.user.email} (User ID: ${patient.user_id})`, 'green');
    });

    // 3. Vérifier les documents
    log('\n📄 Documents dans la base:', 'blue');
    const documents = await prisma.document.findMany({
      include: {
        patient: {
          include: { user: true }
        },
        uploader: true
      }
    });

    if (documents.length === 0) {
      log('❌ Aucun document trouvé', 'red');
      log('💡 Création de documents de test...', 'cyan');
      await createTestDocuments();
    } else {
      documents.forEach((doc, index) => {
        log(`${index + 1}. ${doc.filename} - Patient: ${doc.patient.user.email} (Patient ID: ${doc.patient_id})`, 'green');
      });
    }

    // 4. Vérifier les hôpitaux et laboratoires
    log('\n🏥 Hôpitaux:', 'blue');
    const hospitals = await prisma.hospital.findMany();
    hospitals.forEach((hospital, index) => {
      log(`${index + 1}. ${hospital.name} - ${hospital.city}`, 'green');
    });

    log('\n🧪 Laboratoires:', 'blue');
    const laboratories = await prisma.laboratory.findMany();
    laboratories.forEach((lab, index) => {
      log(`${index + 1}. ${lab.name} - ${lab.city}`, 'green');
    });

    log('\n✅ Vérification terminée', 'green');

  } catch (error) {
    log(`❌ Erreur: ${error.message}`, 'red');
  } finally {
    await prisma.$disconnect();
  }
}

async function createTestUsers() {
  try {
    const hashedPassword = await bcrypt.hash('password123', 12);

    // Créer un hôpital de test
    const hospital = await prisma.hospital.create({
      data: {
        name: 'Hôpital de Test',
        address: '123 Rue de Test',
        city: 'Ouagadougou',
        phone: '+226 25 30 40 50',
        email: 'contact@hopital-test.bf'
      }
    });

    // Créer un laboratoire de test
    const laboratory = await prisma.laboratory.create({
      data: {
        name: 'Laboratoire de Test',
        address: '456 Avenue de Test',
        city: 'Ouagadougou',
        phone: '+226 25 30 40 60',
        email: 'contact@labo-test.bf'
      }
    });

    // Créer un utilisateur patient
    const patientUser = await prisma.user.create({
      data: {
        email: 'patient@test.com',
        password: hashedPassword,
        first_name: 'Jean',
        last_name: 'Patient',
        phone: '+226 70 12 34 56',
        role: 'patient',
        is_active: true
      }
    });

    // Créer le profil patient
    const patient = await prisma.patient.create({
      data: {
        user_id: patientUser.id,
        date_of_birth: new Date('1990-01-01'),
        gender: 'M',
        address: '789 Rue du Patient',
        emergency_contact: '+226 70 98 76 54'
      }
    });

    // Créer un utilisateur médecin
    const doctorUser = await prisma.user.create({
      data: {
        email: 'doctor@test.com',
        password: hashedPassword,
        first_name: 'Marie',
        last_name: 'Docteur',
        phone: '+226 70 11 22 33',
        role: 'hospital_staff',
        is_active: true
      }
    });

    // Créer le profil médecin
    await prisma.hospitalStaff.create({
      data: {
        user_id: doctorUser.id,
        hospital_id: hospital.id,
        position: 'Médecin généraliste',
        department: 'Médecine générale'
      }
    });

    // Créer un utilisateur laborantin
    const labUser = await prisma.user.create({
      data: {
        email: 'lab@test.com',
        password: hashedPassword,
        first_name: 'Paul',
        last_name: 'Laborantin',
        phone: '+226 70 44 55 66',
        role: 'lab_staff',
        is_active: true
      }
    });

    // Créer le profil laborantin
    await prisma.laboratoryStaff.create({
      data: {
        user_id: labUser.id,
        laboratory_id: laboratory.id,
        position: 'Technicien de laboratoire',
        specialization: 'Hématologie'
      }
    });

    log('✅ Utilisateurs de test créés:', 'green');
    log(`   - Patient: patient@test.com (ID: ${patientUser.id}, Patient ID: ${patient.id})`, 'green');
    log(`   - Médecin: doctor@test.com (ID: ${doctorUser.id})`, 'green');
    log(`   - Laborantin: lab@test.com (ID: ${labUser.id})`, 'green');
    log(`   - Mot de passe pour tous: password123`, 'yellow');

  } catch (error) {
    log(`❌ Erreur création utilisateurs: ${error.message}`, 'red');
  }
}

async function createTestDocuments() {
  try {
    // Récupérer le premier patient
    const patient = await prisma.patient.findFirst({
      include: { user: true }
    });

    if (!patient) {
      log('❌ Aucun patient trouvé pour créer des documents', 'red');
      return;
    }

    // Récupérer un médecin pour uploader
    const doctor = await prisma.user.findFirst({
      where: { role: 'hospital_staff' }
    });

    if (!doctor) {
      log('❌ Aucun médecin trouvé pour uploader des documents', 'red');
      return;
    }

    // Créer quelques documents de test
    const documents = [
      {
        patient_id: patient.id,
        uploaded_by: doctor.id,
        filename: 'analyse_sang_test.pdf',
        file_path: '/fake/path/analyse_sang_test.pdf',
        file_size: 245760,
        document_type: 'blood_test',
        description: 'Analyse sanguine complète - Document de test',
        secure_token: 'test_token_1'
      },
      {
        patient_id: patient.id,
        uploaded_by: doctor.id,
        filename: 'rapport_consultation_test.pdf',
        file_path: '/fake/path/rapport_consultation_test.pdf',
        file_size: 156432,
        document_type: 'medical_report',
        description: 'Rapport de consultation - Document de test',
        secure_token: 'test_token_2'
      }
    ];

    for (const docData of documents) {
      await prisma.document.create({ data: docData });
    }

    log(`✅ ${documents.length} documents de test créés pour le patient ${patient.user.email}`, 'green');

  } catch (error) {
    log(`❌ Erreur création documents: ${error.message}`, 'red');
  }
}

// Exécuter la vérification
if (require.main === module) {
  checkTestData().catch(error => {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkTestData, createTestUsers, createTestDocuments };