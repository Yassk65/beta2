// 🇧🇫 SCRIPT DE PEUPLEMENT DES ÉTABLISSEMENTS - BURKINA FASO
// 📅 Créé le : 16 Août 2025
// 🎯 Ajouter des données réelles d'établissements du Burkina Faso

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const hospitals = [
  {
    name: 'Centre Hospitalier Universitaire Yalgado Ouédraogo',
    address: 'Avenue Kumda Yoore, Secteur 7',
    phone: '+226 25 30 67 00',
    email: 'contact@chu-yo.bf',
    city: 'Ouagadougou',
    latitude: 12.3714,
    longitude: -1.5197
  },
  {
    name: 'Hôpital Souro Sanou',
    address: 'Avenue Bassawarga',
    phone: '+226 20 97 00 15',
    email: 'contact@hss-bobo.bf',
    city: 'Bobo-Dioulasso',
    latitude: 11.1839,
    longitude: -4.2971
  },
  {
    name: 'Centre Médical avec Antenne Chirurgicale de Kaya',
    address: 'Route de Dori',
    phone: '+226 24 45 41 24',
    email: 'cmac.kaya@sante.gov.bf',
    city: 'Kaya',
    latitude: 13.0928,
    longitude: -1.0854
  },
  {
    name: 'Hôpital Régional de Ouahigouya',
    address: 'Route de Thiou',
    phone: '+226 24 55 00 24',
    email: 'hr.ouahigouya@sante.gov.bf',
    city: 'Ouahigouya',
    latitude: 13.5827,
    longitude: -2.4214
  },
  {
    name: 'Centre Hospitalier Régional de Fada N\'Gourma',
    address: 'Route de Pama',
    phone: '+226 24 77 00 25',
    email: 'chr.fada@sante.gov.bf',
    city: 'Fada N\'Gourma',
    latitude: 12.0614,
    longitude: 0.3581
  },
  {
    name: 'Hôpital de District de Gaoua',
    address: 'Centre-ville',
    phone: '+226 20 90 40 24',
    email: 'hd.gaoua@sante.gov.bf',
    city: 'Gaoua',
    latitude: 10.3336,
    longitude: -3.1817
  }
];

const laboratories = [
  {
    name: 'Laboratoire National de Santé Publique (LNSP)',
    address: 'Secteur 29, Avenue de la Nation',
    phone: '+226 25 32 41 60',
    email: 'info@lnsp.bf',
    city: 'Ouagadougou',
    latitude: 12.3569,
    longitude: -1.5347
  },
  {
    name: 'Laboratoire Cerba Burkina',
    address: 'Zone du Bois, Secteur 8',
    phone: '+226 25 36 29 29',
    email: 'contact@cerba-burkina.com',
    city: 'Ouagadougou',
    latitude: 12.3892,
    longitude: -1.4742
  },
  {
    name: 'Laboratoire Rodolphe Mérieux',
    address: 'Avenue Kwame Nkrumah',
    phone: '+226 25 30 89 89',
    email: 'contact@fondation-merieux.bf',
    city: 'Ouagadougou',
    latitude: 12.3658,
    longitude: -1.5339
  },
  {
    name: 'Laboratoire de Biologie Médicale de Bobo',
    address: 'Avenue de la République',
    phone: '+226 20 98 25 47',
    email: 'lbm.bobo@gmail.com',
    city: 'Bobo-Dioulasso',
    latitude: 11.1781,
    longitude: -4.2967
  },
  {
    name: 'Centre de Recherche en Santé de Nouna (CRSN)',
    address: 'BP 02',
    phone: '+226 20 53 91 92',
    email: 'info@crsn-nouna.bf',
    city: 'Nouna',
    latitude: 12.7289,
    longitude: -3.8617
  },
  {
    name: 'Laboratoire d\'Analyses Médicales Saint-Camille',
    address: 'Secteur 4, Avenue Loudun',
    phone: '+226 25 31 18 95',
    email: 'lab.saintcamille@fasonet.bf',
    city: 'Ouagadougou',
    latitude: 12.3547,
    longitude: -1.5281
  },
  {
    name: 'Laboratoire Biomédical de Koudougou',
    address: 'Route de Réo',
    phone: '+226 25 44 02 87',
    email: 'lab.koudougou@yahoo.fr',
    city: 'Koudougou',
    latitude: 12.2530,
    longitude: -2.3621
  }
];

async function seedBurkinaEstablishments() {
  try {
    console.log('🇧🇫 Début du peuplement des établissements du Burkina Faso...');

    // Supprimer les données existantes
    console.log('🗑️  Nettoyage des données existantes...');
    await prisma.laboratory.deleteMany();
    await prisma.hospital.deleteMany();

    // Ajouter les hôpitaux
    console.log('🏥 Ajout des hôpitaux du Burkina Faso...');
    for (const hospital of hospitals) {
      await prisma.hospital.create({
        data: hospital
      });
      console.log(`✅ Hôpital ajouté: ${hospital.name} (${hospital.city})`);
    }

    // Ajouter les laboratoires
    console.log('\n🧪 Ajout des laboratoires du Burkina Faso...');
    for (const laboratory of laboratories) {
      await prisma.laboratory.create({
        data: laboratory
      });
      console.log(`✅ Laboratoire ajouté: ${laboratory.name} (${laboratory.city})`);
    }

    // Statistiques finales
    const hospitalCount = await prisma.hospital.count();
    const laboratoryCount = await prisma.laboratory.count();

    console.log('\n🎉 Peuplement terminé avec succès !');
    console.log(`📊 ${hospitalCount} hôpitaux ajoutés`);
    console.log(`📊 ${laboratoryCount} laboratoires ajoutés`);
    console.log(`📊 Total: ${hospitalCount + laboratoryCount} établissements au Burkina Faso`);

    // Afficher la répartition par ville
    const cities = [...new Set([...hospitals.map(h => h.city), ...laboratories.map(l => l.city)])];
    console.log('\n🏙️  Répartition par ville:');
    for (const city of cities) {
      const cityHospitals = hospitals.filter(h => h.city === city).length;
      const cityLabs = laboratories.filter(l => l.city === city).length;
      console.log(`   ${city}: ${cityHospitals} hôpital(x) + ${cityLabs} laboratoire(s)`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du peuplement:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  seedBurkinaEstablishments()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Erreur fatale:', error);
      process.exit(1);
    });
}

module.exports = { seedBurkinaEstablishments };