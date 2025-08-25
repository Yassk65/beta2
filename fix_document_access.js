// 🔧 FIX DOCUMENT ACCESS TABLE
// 📅 Créé le : 21 Août 2025

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDocumentAccess() {
  try {
    console.log('🔍 Vérification de la table document_access...');

    // Test si la table existe en essayant une requête simple
    try {
      await prisma.$executeRaw`SELECT 1 FROM document_access LIMIT 1`;
      console.log('✅ Table document_access existe déjà');
      
      // Vérifier la structure
      const tableInfo = await prisma.$executeRaw`DESCRIBE document_access`;
      console.log('📋 Structure actuelle:', tableInfo);
      
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('doesn\'t exist')) {
        console.log('❌ Table document_access n\'existe pas. Création...');
        
        // Créer la table
        await prisma.$executeRaw`
          CREATE TABLE document_access (
            id int(11) NOT NULL AUTO_INCREMENT,
            document_id int(11) NOT NULL,
            user_id int(11) NOT NULL,
            access_type varchar(20) NOT NULL DEFAULT 'view',
            ip_address varchar(45) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            is_offline_attempt tinyint(1) NOT NULL DEFAULT 0,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (id),
            KEY document_access_document_id_idx (document_id),
            KEY document_access_user_id_idx (user_id),
            KEY document_access_created_at_idx (created_at),
            KEY document_access_offline_idx (is_offline_attempt),
            KEY document_access_recent_idx (user_id, document_id, created_at),
            CONSTRAINT document_access_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT document_access_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        console.log('✅ Table document_access créée avec succès!');
        
      } else {
        console.error('❌ Erreur lors de la vérification:', error);
      }
    }

    // Créer aussi la table document_sessions
    try {
      await prisma.$executeRaw`SELECT 1 FROM document_sessions LIMIT 1`;
      console.log('✅ Table document_sessions existe déjà');
    } catch (error) {
      if (error.code === 'P2021' || error.message.includes('doesn\'t exist')) {
        console.log('❌ Table document_sessions n\'existe pas. Création...');
        
        await prisma.$executeRaw`
          CREATE TABLE document_sessions (
            id int(11) NOT NULL AUTO_INCREMENT,
            document_id int(11) NOT NULL,
            user_id int(11) NOT NULL,
            session_token varchar(64) NOT NULL,
            expires_at timestamp NOT NULL,
            ip_address varchar(45) DEFAULT NULL,
            user_agent text DEFAULT NULL,
            created_at timestamp NOT NULL DEFAULT current_timestamp(),
            PRIMARY KEY (id),
            KEY document_sessions_document_id_idx (document_id),
            KEY document_sessions_user_id_idx (user_id),
            KEY document_sessions_token_idx (session_token),
            KEY document_sessions_expires_idx (expires_at),
            CONSTRAINT document_sessions_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT document_sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `;
        
        console.log('✅ Table document_sessions créée avec succès!');
      }
    }

    console.log('🎉 Configuration des tables terminée!');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixDocumentAccess();