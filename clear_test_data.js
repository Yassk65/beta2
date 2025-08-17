// 🧹 SCRIPT DE NETTOYAGE DES DONNÉES DE TEST
// 📅 Créé le : 11 Août 2025
// 🎯 Supprimer toutes les données de test pour recommencer

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function clearData() {
  console.log('🧹 Nettoyage des données de test...\n');

  try {
    // Supprimer dans l'ordre inverse des dépendances
    console.log('🗑️ Suppression des logs d\'accès...');
    await prisma.documentAccess.deleteMany();

    console.log('🗑️ Suppression des explications IA...');
    await prisma.documentAIExplanation.deleteMany();

    console.log('🗑️ Suppression des messages...');
    await prisma.message.deleteMany();

    console.log('🗑️ Suppression des participants aux conversations...');
    await prisma.conversationParticipant.deleteMany();

    console.log('🗑️ Suppression des conversations...');
    await prisma.conversation.deleteMany();

    console.log('🗑️ Suppression des documents...');
    await prisma.document.deleteMany();

    console.log('🗑️ Suppression des profils patients...');
    await prisma.patient.deleteMany();

    console.log('🗑️ Suppression des utilisateurs...');
    await prisma.user.deleteMany();

    console.log('🗑️ Suppression des hôpitaux...');
    await prisma.hospital.deleteMany();

    console.log('🗑️ Suppression des laboratoires...');
    await prisma.laboratory.deleteMany();

    console.log('✅ Nettoyage terminé avec succès !');
    console.log('\n💡 Pour recréer les données de test, exécutez:');
    console.log('   npm run db:seed');

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearData();