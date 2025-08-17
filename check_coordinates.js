const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCoordinates() {
  try {
    const hospitals = await prisma.hospital.findMany();
    console.log('🏥 Hôpitaux:');
    hospitals.forEach(hospital => {
      console.log(`${hospital.name}: ${hospital.latitude}, ${hospital.longitude}`);
    });

    const laboratories = await prisma.laboratory.findMany();
    console.log('\n🧪 Laboratoires:');
    laboratories.forEach(lab => {
      console.log(`${lab.name}: ${lab.latitude}, ${lab.longitude}`);
    });
  } catch (error) {
    console.error('Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoordinates();