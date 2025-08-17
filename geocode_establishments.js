// 🌍 SCRIPT DE GÉOCODAGE DES ÉTABLISSEMENTS
// 📅 Créé le : 16 Août 2025
// 🎯 Ajouter les coordonnées GPS aux établissements existants

const { PrismaClient } = require('@prisma/client');
const geocodingService = require('./src/services/geocodingService');

const prisma = new PrismaClient();

async function geocodeEstablishments() {
  try {
    console.log('🌍 Début du géocodage des établissements...');

    // Récupérer les hôpitaux sans coordonnées
    const hospitalsWithoutCoords = await prisma.hospital.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    console.log(`🏥 ${hospitalsWithoutCoords.length} hôpitaux à géocoder`);

    // Géocoder les hôpitaux
    for (const hospital of hospitalsWithoutCoords) {
      console.log(`\n🔍 Géocodage: ${hospital.name}`);
      
      const coordinates = await geocodingService.getCoordinates(hospital.address, hospital.city);
      
      if (coordinates) {
        await prisma.hospital.update({
          where: { id: hospital.id },
          data: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        });
        console.log(`✅ ${hospital.name} mis à jour`);
      } else {
        console.log(`❌ Impossible de géocoder: ${hospital.name}`);
      }
      
      // Pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Récupérer les laboratoires sans coordonnées
    const laboratoriesWithoutCoords = await prisma.laboratory.findMany({
      where: {
        OR: [
          { latitude: null },
          { longitude: null }
        ]
      }
    });

    console.log(`\n🧪 ${laboratoriesWithoutCoords.length} laboratoires à géocoder`);

    // Géocoder les laboratoires
    for (const laboratory of laboratoriesWithoutCoords) {
      console.log(`\n🔍 Géocodage: ${laboratory.name}`);
      
      const coordinates = await geocodingService.getCoordinates(laboratory.address, laboratory.city);
      
      if (coordinates) {
        await prisma.laboratory.update({
          where: { id: laboratory.id },
          data: {
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
          }
        });
        console.log(`✅ ${laboratory.name} mis à jour`);
      } else {
        console.log(`❌ Impossible de géocoder: ${laboratory.name}`);
      }
      
      // Pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Statistiques finales
    const hospitalsWithCoords = await prisma.hospital.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });

    const laboratoriesWithCoords = await prisma.laboratory.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } }
        ]
      }
    });

    console.log('\n🎉 Géocodage terminé !');
    console.log(`📊 ${hospitalsWithCoords} hôpitaux avec coordonnées`);
    console.log(`📊 ${laboratoriesWithCoords} laboratoires avec coordonnées`);
    console.log(`📊 Total: ${hospitalsWithCoords + laboratoriesWithCoords} établissements géolocalisés`);

  } catch (error) {
    console.error('❌ Erreur lors du géocodage:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  geocodeEstablishments()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { geocodeEstablishments };