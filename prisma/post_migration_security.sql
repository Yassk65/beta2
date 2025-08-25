-- 🔐 POST-MIGRATION SECURITY FEATURES
-- 📅 Créé le : 21 Août 2025
-- 🎯 Ajouter les vues et procédures pour le système de sécurité renforcé
-- ⚠️  À exécuter après la migration Prisma

-- Vues pour le monitoring de sécurité
CREATE OR REPLACE VIEW `security_audit_view` AS
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
ORDER BY da.created_at DESC;

-- Procédure pour nettoyer les sessions expirées
DELIMITER //
CREATE OR REPLACE PROCEDURE CleanExpiredSessions()
BEGIN
    DELETE FROM document_sessions 
    WHERE expires_at < NOW();
    
    SELECT ROW_COUNT() as deleted_sessions;
END //
DELIMITER ;

-- Event pour nettoyer automatiquement les sessions expirées
CREATE EVENT IF NOT EXISTS `clean_expired_sessions`
ON SCHEDULE EVERY 1 HOUR
DO
  CALL CleanExpiredSessions();

-- Activer l'event scheduler si pas déjà fait
SET GLOBAL event_scheduler = ON;

-- Index additionnels pour optimiser les performances de sécurité
CREATE INDEX IF NOT EXISTS `idx_document_access_user_document_recent` 
ON `document_access` (`user_id`, `document_id`, `created_at` DESC);

CREATE INDEX IF NOT EXISTS `idx_document_sessions_expires` 
ON `document_sessions` (`expires_at`);

-- Vue pour les accès suspects (tentatives hors ligne)
CREATE OR REPLACE VIEW `suspicious_access_view` AS
SELECT 
    da.id,
    da.document_id,
    da.user_id,
    u.email as user_email,
    u.role as user_role,
    da.ip_address,
    da.created_at,
    d.filename as document_filename,
    COUNT(*) OVER (PARTITION BY da.user_id, da.document_id) as attempt_count
FROM document_access da
JOIN users u ON da.user_id = u.id
JOIN documents d ON da.document_id = d.id
WHERE da.is_offline_attempt = 1
ORDER BY da.created_at DESC;

-- Vue pour les statistiques de sécurité
CREATE OR REPLACE VIEW `security_stats_view` AS
SELECT 
    DATE(da.created_at) as access_date,
    COUNT(*) as total_accesses,
    COUNT(CASE WHEN da.is_offline_attempt = 1 THEN 1 END) as offline_attempts,
    COUNT(DISTINCT da.user_id) as unique_users,
    COUNT(DISTINCT da.document_id) as unique_documents
FROM document_access da
WHERE da.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(da.created_at)
ORDER BY access_date DESC;