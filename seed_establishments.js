// 🏥 SCRIPT DE PEUPLEMENT DES ÉTABLISSEMENTS
// 📅 Créé le : 16 Août 2025
// 🎯 Ajouter des données de test pour les hôpitaux et laboratoires

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hospitals = [
  {
    name: 'Hôpital Central de Paris',
    address: '123 Rue de la Santé, 75001 Paris',
    phone: '01 23 45 67 89',
    email: 'contact@hopital-central-paris.fr',
    city: 'Paris',
    latitude: 48.8566,
    longitude: 2.3522
  },
  {
    name: 'Clinique Saint-Martin',
    address: '789 Boulevard de la République, 75017 Paris',
    phone: '01 11 22 33 44',
    email: 'accueil@clinique-saint-martin.fr',
    city: 'Paris',
    latitude: 48.8738,
    longitude: 2.2950
  },
  {
    name: 'Hôpital Universitaire Lyon Sud',
    address: '165 Chemin du Grand Revoyet, 69310 Pierre-Bénite',
    phone: '04 78 86 41 41',
    email: 'contact@chu-lyon.fr',
    city: 'Lyon',
    latitude: 45.7640,
    longitude: 4.8357
  },
  {
    name: 'Centre Hospitalier de Marseille',
    address: '264 Rue Saint-Pierre, 13005 Marseille',
    phone: '04 91 38 00 00',
    email: 'info@ap-hm.fr',
    city: 'Marseille',
    latitude: 43.2965,
    longitude: 5.3698
  }
];

const laboratories = [
  {
    name: 'Laboratoire BioMed Paris',
    address: '456 Avenue des Sciences, 75002 Paris',
    phone: '01 98 76 54 32',
    email: 'info@biomed-paris.fr',
    city: 'Paris',
    latitude: 48.8606,
    longitude: 2.3376
  },
  {
    name: 'Laboratoire Central Lyon',
    address: '88 Rue de la Paix, 69002 Lyon',
    phone: '04 72 33 44 55',
    email: 'contact@lab-central-lyon.fr',
    city: 'Lyon',
    latitude: 45.7578,
    longitude: 4.8320
  },
  {
    name: 'BioLab Marseille',
    address: '22 Avenue du Prado, 13008 Marseille',
    phone: '04 91 55 66 77',
    email: 'analyses@biolab-marseille.fr',
    city: 'Marseille',
    latitude: 43.2780,
    longitude: 5.3890
  },
  {
    name: 'Laboratoire Pasteur Toulouse',
    address: '15 Place du Capitole, 31000 Toulouse',
    phone: '05 61 22 33 44',
    email: 'info@pasteur-toulouse.fr',
    city: 'Toulouse',
    latitude: 43.6047,
    longitude: 1.4442
  },
  {
    name: 'LabExpert Nice',
    address: '77 Promenade des Anglais, 06000 Nice',
    phone: '04 93 88 99 00',
    email: 'contact@labexpert-nice.fr',
    city: 'Nice',
    latitude: 43.7102,
    longitude: 7.2620
  }
];

async function seedEstablishments() {
  try {
    console.log('🏥 Début du peuplement des établissements...');

    // Supprimer les données existantes (optionnel)
    console.log('🗑️  Nettoyage des données existantes...');
    await prisma.laboratory.deleteMany();
    await prisma.hospital.deleteMany();

    // Ajouter les hôpitaux
    console.log('🏥 Ajout des hôpitaux...');
    for (const hospital of hospitals) {
      await prisma.hospital.create({
        data: hospital
      });
      console.log(`✅ Hôpital ajouté: ${hospital.name}`);
    }

    // Ajouter les laboratoires
    console.log('🧪 Ajout des laboratoires...');
    for (const laboratory of laboratories) {
      await prisma.laboratory.create({
        data: laboratory
      });
      console.log(`✅ Laboratoire ajouté: ${laboratory.name}`);
    }

    // Statistiques finales
    const hospitalCount = await prisma.hospital.count();
    const laboratoryCount = await prisma.laboratory.count();

    console.log('🎉 Peuplement terminé avec succès !');
    console.log(`📊 ${hospitalCount} hôpitaux ajoutés`);
    console.log(`📊 ${laboratoryCount} laboratoires ajoutés`);
    console.log(`📊 Total: ${hospitalCount + laboratoryCount} établissements`);

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedEstablishments()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedEstablishments };