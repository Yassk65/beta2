// 🔧 SCRIPT DE MIGRATION SÉCURITÉ DOCUMENTS
// 📅 Créé le : 21 Août 2025

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Configuration de connexion à la base de données
    const dbConfig = {
      host: 'localhost',
      user: 'root',
      password: '', // Modifier si nécessaire
      database: 'labresult_mvp',
      multipleStatements: true
    };

    console.log('🔗 Connexion à la base de données...');
    connection = await mysql.createConnection(dbConfig);

    // Lire le fichier de migration
    const migrationPath = path.join(__dirname, 'migration_secure_documents.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf8');

    console.log('📋 Exécution de la migration...');
    
    // Exécuter le script de migration
    const [results] = await connection.execute(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès!');
    console.log('📊 Résultats:', results);

    // Vérifier que la table a été créée
    const [tables] = await connection.execute("SHOW TABLES LIKE 'document_access'");
    if (tables.length > 0) {
      console.log('✅ Table document_access créée avec succès');
      
      // Afficher la structure de la table
      const [columns] = await connection.execute("DESCRIBE document_access");
      console.log('📋 Structure de la table:');
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Key ? `(${col.Key})` : ''}`);
      });
    } else {
      console.log('❌ Erreur: Table document_access non trouvée après migration');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      console.log('💡 Suggestion: Vérifiez que la base de données labresult_mvp existe');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 Suggestion: Vérifiez les paramètres de connexion MySQL');
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécuter la migration
if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };