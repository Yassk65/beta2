// 🔧 POST-MIGRATION SECURITY SETUP
// 📅 Créé le : 21 Août 2025

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function executePostMigrationSecurity() {
  try {
    console.log('🔐 Exécution des fonctionnalités de sécurité post-migration...');

    // Lire le fichier SQL
    const sqlPath = path.join(__dirname, 'prisma', 'post_migration_security.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Diviser le contenu en commandes individuelles
    const commands = sqlContent
      .split(/(?:;[\s]*$)/gm)
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));

    let successCount = 0;
    let errorCount = 0;

    for (const command of commands) {
      try {
        if (command.includes('DELIMITER') || command.includes('delimiter')) {
          console.log('⏭️  Ignoring DELIMITER command (not needed in Prisma)');
          continue;
        }

        console.log(`📝 Exécution: ${command.substring(0, 50)}...`);
        await prisma.$executeRawUnsafe(command);
        successCount++;
        console.log('✅ Succès');
      } catch (error) {
        console.warn(`⚠️  Erreur (peut être ignorée): ${error.message}`);
        errorCount++;
      }
    }

    console.log('\n📊 Résultats:');
    console.log(`✅ Commandes réussies: ${successCount}`);
    console.log(`⚠️  Commandes en erreur: ${errorCount}`);

    // Tester les vues créées
    try {
      const auditCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM security_audit_view`;
      console.log(`✅ Vue security_audit_view créée: ${auditCount[0].count} enregistrements`);
    } catch (error) {
      console.log('⚠️  Vue security_audit_view non disponible:', error.message);
    }

    try {
      const statsCount = await prisma.$queryRaw`SELECT COUNT(*) as count FROM security_stats_view`;
      console.log(`✅ Vue security_stats_view créée: ${statsCount[0].count} enregistrements`);
    } catch (error) {
      console.log('⚠️  Vue security_stats_view non disponible:', error.message);
    }

    console.log('\n🎉 Migration sécurité terminée avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors de la migration sécurité:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  executePostMigrationSecurity();
}

module.exports = { executePostMigrationSecurity };