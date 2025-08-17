const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Couleurs pour les logs
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function checkDatabaseSchema() {
  try {
    log('🔍 Vérification du schéma de base de données...', 'blue');
    log('================================================', 'blue');

    // Vérifier les tables principales
    const tables = [
      'User',
      'Patient', 
      'Document',
      'DocumentAISummary',
      'DocumentTransfer',
      'DocumentAccess',
      'Notification',
      'NotificationSettings',
      'Hospital',
      'Laboratory'
    ];

    for (const table of tables) {
      try {
        // Essayer de compter les enregistrements pour vérifier l'existence de la table
        let count;
        switch (table) {
          case 'User':
            count = await prisma.user.count();
            break;
          case 'Patient':
            count = await prisma.patient.count();
            break;
          case 'Document':
            count = await prisma.document.count();
            break;
          case 'DocumentAISummary':
            // Cette table pourrait ne pas exister, on va la créer si nécessaire
            try {
              count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM DocumentAISummary`;
              count = Number(count[0].count);
            } catch (error) {
              log(`⚠️  Table ${table} n'existe pas - sera créée automatiquement`, 'yellow');
              continue;
            }
            break;
          case 'DocumentTransfer':
            try {
              count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM DocumentTransfer`;
              count = Number(count[0].count);
            } catch (error) {
              log(`⚠️  Table ${table} n'existe pas - sera créée automatiquement`, 'yellow');
              continue;
            }
            break;
          case 'DocumentAccess':
            try {
              count = await prisma.$queryRaw`SELECT COUNT(*) as count FROM DocumentAccess`;
              count = Number(count[0].count);
            } catch (error) {
              log(`⚠️  Table ${table} n'existe pas - sera créée automatiquement`, 'yellow');
              continue;
            }
            break;
          case 'Notification':
            count = await prisma.notification.count();
            break;
          case 'NotificationSettings':
            try {
              count = await prisma.notificationSettings.count();
            } catch (error) {
              log(`⚠️  Table ${table} n'existe pas - sera créée automatiquement`, 'yellow');
              continue;
            }
            break;
          case 'Hospital':
            count = await prisma.hospital.count();
            break;
          case 'Laboratory':
            count = await prisma.laboratory.count();
            break;
          default:
            continue;
        }
        
        log(`✅ Table ${table}: ${count} enregistrement(s)`, 'green');
      } catch (error) {
        log(`❌ Erreur avec la table ${table}: ${error.message}`, 'red');
      }
    }

    // Vérifier les données de test
    log('\n📊 Vérification des données de test...', 'blue');
    
    // Utilisateurs de test
    const testUsers = await prisma.user.findMany({
      where: {
        email: { in: ['patient@test.com', 'doctor@test.com', 'lab@test.com'] }
      }
    });
    
    if (testUsers.length > 0) {
      log(`✅ ${testUsers.length} utilisateur(s) de test trouvé(s)`, 'green');
      testUsers.forEach(user => {
        log(`   - ${user.email} (${user.role})`, 'green');
      });
    } else {
      log('⚠️  Aucun utilisateur de test trouvé', 'yellow');
      log('   Créez des utilisateurs de test avec:', 'yellow');
      log('   - patient@test.com (role: patient)', 'yellow');
      log('   - doctor@test.com (role: hospital_staff)', 'yellow');
      log('   - lab@test.com (role: lab_staff)', 'yellow');
    }

    // Hôpitaux et laboratoires
    const hospitals = await prisma.hospital.count();
    const laboratories = await prisma.laboratory.count();
    
    log(`\n🏥 Hôpitaux: ${hospitals}`, hospitals > 0 ? 'green' : 'yellow');
    log(`🧪 Laboratoires: ${laboratories}`, laboratories > 0 ? 'green' : 'yellow');

    if (hospitals === 0 || laboratories === 0) {
      log('\n💡 Pour créer des données de test:', 'blue');
      log('   npm run seed', 'blue');
    }

    log('\n✅ Vérification terminée', 'green');

  } catch (error) {
    log(`❌ Erreur lors de la vérification: ${error.message}`, 'red');
  } finally {
    await prisma.$disconnect();
  }
}

// Fonction pour créer les tables manquantes
async function createMissingTables() {
  try {
    log('\n🔧 Création des tables manquantes...', 'blue');

    // DocumentAISummary
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS DocumentAISummary (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          summary TEXT NOT NULL,
          generated_by INTEGER NOT NULL,
          generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE,
          FOREIGN KEY (generated_by) REFERENCES User(id) ON DELETE CASCADE
        )
      `;
      log('✅ Table DocumentAISummary créée', 'green');
    } catch (error) {
      log(`⚠️  DocumentAISummary: ${error.message}`, 'yellow');
    }

    // DocumentTransfer
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS DocumentTransfer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          from_user_id INTEGER NOT NULL,
          to_user_id INTEGER NOT NULL,
          recipient_type VARCHAR(20) NOT NULL,
          message TEXT,
          status VARCHAR(20) NOT NULL DEFAULT 'sent',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE,
          FOREIGN KEY (from_user_id) REFERENCES User(id) ON DELETE CASCADE,
          FOREIGN KEY (to_user_id) REFERENCES User(id) ON DELETE CASCADE
        )
      `;
      log('✅ Table DocumentTransfer créée', 'green');
    } catch (error) {
      log(`⚠️  DocumentTransfer: ${error.message}`, 'yellow');
    }

    // DocumentAccess
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS DocumentAccess (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          access_type VARCHAR(20) NOT NULL,
          ip_address VARCHAR(45),
          user_agent TEXT,
          accessed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES Document(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
        )
      `;
      log('✅ Table DocumentAccess créée', 'green');
    } catch (error) {
      log(`⚠️  DocumentAccess: ${error.message}`, 'yellow');
    }

    // NotificationSettings
    try {
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS NotificationSettings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL UNIQUE,
          new_message_enabled BOOLEAN NOT NULL DEFAULT true,
          new_document_enabled BOOLEAN NOT NULL DEFAULT true,
          exam_status_enabled BOOLEAN NOT NULL DEFAULT true,
          in_app_enabled BOOLEAN NOT NULL DEFAULT true,
          email_enabled BOOLEAN NOT NULL DEFAULT true,
          push_enabled BOOLEAN NOT NULL DEFAULT false,
          email_frequency VARCHAR(20) NOT NULL DEFAULT 'immediate',
          quiet_hours_start TIME,
          quiet_hours_end TIME,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES User(id) ON DELETE CASCADE
        )
      `;
      log('✅ Table NotificationSettings créée', 'green');
    } catch (error) {
      log(`⚠️  NotificationSettings: ${error.message}`, 'yellow');
    }

    log('✅ Création des tables terminée', 'green');

  } catch (error) {
    log(`❌ Erreur lors de la création des tables: ${error.message}`, 'red');
  }
}

// Fonction principale
async function main() {
  await checkDatabaseSchema();
  await createMissingTables();
  await checkDatabaseSchema(); // Vérifier à nouveau après création
}

if (require.main === module) {
  main().catch(error => {
    log(`❌ Erreur: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { checkDatabaseSchema, createMissingTables };