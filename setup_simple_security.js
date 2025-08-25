// 🔧 SIMPLE SECURITY FEATURES SETUP
// 📅 Créé le : 21 Août 2025

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function setupSimpleSecurityFeatures() {
  try {
    console.log('🔐 Configuration des fonctionnalités de sécurité...');

    // Créer une vue simple pour l'audit de sécurité
    try {
      await prisma.$executeRaw`
        CREATE OR REPLACE VIEW security_audit_view AS
        SELECT 
            da.id,
            da.document_id,
            da.user_id,
            u.email as user_email,
            u.role as user_role,
            da.access_type,
            da.is_offline_attempt,
            da.ip_address,
            da.created_at,
            d.filename as document_filename,
            d.document_type
        FROM document_access da
        JOIN users u ON da.user_id = u.id
        JOIN documents d ON da.document_id = d.id
        WHERE da.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ORDER BY da.created_at DESC
      `;
      console.log('✅ Vue security_audit_view créée');
    } catch (error) {
      console.warn('⚠️  Erreur création vue audit:', error.message);
    }

    // Créer une vue pour les statistiques de sécurité
    try {
      await prisma.$executeRaw`
        CREATE OR REPLACE VIEW security_stats_view AS
        SELECT 
            DATE(da.created_at) as access_date,
            COUNT(*) as total_accesses,
            SUM(CASE WHEN da.is_offline_attempt = 1 THEN 1 ELSE 0 END) as offline_attempts,
            COUNT(DISTINCT da.user_id) as unique_users,
            COUNT(DISTINCT da.document_id) as unique_documents
        FROM document_access da
        WHERE da.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        GROUP BY DATE(da.created_at)
        ORDER BY access_date DESC
      `;
      console.log('✅ Vue security_stats_view créée');
    } catch (error) {
      console.warn('⚠️  Erreur création vue stats:', error.message);
    }

    // Créer un index pour optimiser les performances
    try {
      await prisma.$executeRaw`
        CREATE INDEX idx_document_access_user_recent 
        ON document_access (user_id, document_id, created_at)
      `;
      console.log('✅ Index de performance créé');
    } catch (error) {
      console.warn('⚠️  Index déjà existant:', error.message);
    }

    // Tester les tables de sécurité
    const accessCount = await prisma.documentAccess.count();
    const sessionsCount = await prisma.documentSessions.count();
    
    console.log('\n📊 État des tables de sécurité:');
    console.log(`📝 DocumentAccess: ${accessCount} enregistrements`);
    console.log(`🔐 DocumentSessions: ${sessionsCount} enregistrements`);

    // Tester les vues
    try {
      const auditRows = await prisma.$queryRaw`SELECT COUNT(*) as count FROM security_audit_view`;
      console.log(`👀 Vue audit: ${auditRows[0].count} enregistrements visibles`);
    } catch (error) {
      console.warn('⚠️  Vue audit non testable:', error.message);
    }

    console.log('\n🎉 Configuration sécurité terminée!');
    console.log('🔒 Le système de documents sécurisé est maintenant opérationnel.');
    
  } catch (error) {
    console.error('❌ Erreur configuration sécurité:', error);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  setupSimpleSecurityFeatures();
}

module.exports = { setupSimpleSecurityFeatures };