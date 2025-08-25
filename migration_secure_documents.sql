-- 🔐 MIGRATION SÉCURITÉ DOCUMENTS
-- 📅 Créé le : 21 Août 2025
-- 🎯 Ajouter les tables nécessaires pour le système de sécurité renforcé

-- Table pour les accès aux documents (audit et sécurité)
CREATE TABLE IF NOT EXISTS `document_access` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `access_type` varchar(20) NOT NULL DEFAULT 'view',
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `is_offline_attempt` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_access_document_id_idx` (`document_id`),
  KEY `document_access_user_id_idx` (`user_id`),
  KEY `document_access_created_at_idx` (`created_at`),
  KEY `document_access_offline_idx` (`is_offline_attempt`),
  KEY `document_access_recent_idx` (`user_id`, `document_id`, `created_at`),
  CONSTRAINT `document_access_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `document_access_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les sessions de documents (vérification en temps réel)
CREATE TABLE IF NOT EXISTS `document_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `document_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `session_token` varchar(64) NOT NULL,
  `expires_at` timestamp NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `document_sessions_document_id_idx` (`document_id`),
  KEY `document_sessions_user_id_idx` (`user_id`),
  KEY `document_sessions_token_idx` (`session_token`),
  KEY `document_sessions_expires_idx` (`expires_at`),
  CONSTRAINT `document_sessions_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `document_sessions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index pour optimiser les requêtes de sécurité (déjà créés dans la table ci-dessus)

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