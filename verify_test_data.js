// 🔍 SCRIPT DE VÉRIFICATION DES DONNÉES DE TEST
// 📅 Créé le : 11 Août 2025
// 🎯 Vérifier que toutes les données de test ont été créées correctement

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyData() {
  console.log('🔍 Vérification des données de test...\n');

  try {
    // Compter les utilisateurs par rôle
    const userCounts = await prisma.user.groupBy({
      by: ['role'],
      _count: { role: true }
    });

    console.log('👥 UTILISATEURS PAR RÔLE :');
    userCounts.forEach(count => {
      console.log(`   ${count.role}: ${count._count.role}`);
    });

    // Compter les établissements
    const hospitalCount = await prisma.hospital.count();
    const labCount = await prisma.laboratory.count();
    
    console.log('\n🏢 ÉTABLISSEMENTS :');
    console.log(`   Hôpitaux: ${hospitalCount}`);
    console.log(`   Laboratoires: ${labCount}`);

    // Compter les patients
    const patientCount = await prisma.patient.count();
    console.log(`\n👥 PATIENTS : ${patientCount}`);

    // Compter les documents
    const documentCounts = await prisma.document.groupBy({
      by: ['document_type'],
      _count: { document_type: true }
    });

    console.log('\n📄 DOCUMENTS PAR TYPE :');
    documentCounts.forEach(count => {
      console.log(`   ${count.document_type}: ${count._count.document_type}`);
    });

    // Compter les conversations et messages
    const conversationCount = await prisma.conversation.count();
    const messageCount = await prisma.message.count();
    
    console.log('\n💬 MESSAGERIE :');
    console.log(`   Conversations: ${conversationCount}`);
    console.log(`   Messages: ${messageCount}`);

    // Lister quelques utilisateurs de test
    console.log('\n🔑 COMPTES DE TEST DISPONIBLES :');
    
    const testUsers = await prisma.user.findMany({
      select: {
        email: true,
        role: true,
        first_name: true,
        last_name: true,
        hospital: { select: { name: true } },
        laboratory: { select: { name: true } }
      },
      orderBy: { role: 'asc' }
    });

    testUsers.forEach(user => {
      const establishment = user.hospital?.name || user.laboratory?.name || 'Aucun';
      console.log(`   ${user.role}: ${user.email} (${user.first_name} ${user.last_name}) - ${establishment}`);
    });

    console.log('\n📋 MOTS DE PASSE PAR DÉFAUT :');
    console.log('   Super Admin: admin123');
    console.log('   Admins Hôpital: hospital123');
    console.log('   Admins Labo: lab123');
    console.log('   Personnel Médical: staff123');
    console.log('   Patients: patient123');

    console.log('\n✅ Vérification terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyData();