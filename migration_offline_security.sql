-- Migration pour l'accès hors ligne sécurisé des documents
-- Créé le : 25 Août 2025

-- Table pour gérer les accès hors ligne sécurisés
CREATE TABLE IF NOT EXISTS `document_offline_access` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `key_id` VARCHAR(255) NOT NULL UNIQUE,
  `encrypted_key` TEXT NOT NULL,
  `salt` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `last_accessed_at` DATETIME NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `access_count` INT DEFAULT 0,
  
  INDEX `idx_document_offline_access_document_id` (`document_id`),
  INDEX `idx_document_offline_access_user_id` (`user_id`),
  INDEX `idx_document_offline_access_key_id` (`key_id`),
  INDEX `idx_document_offline_access_expires_at` (`expires_at`),
  
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Table pour les sessions de documents (déjà existante, mais ajout d'index si nécessaire)
CREATE TABLE IF NOT EXISTS `document_sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `user_id` INT NOT NULL,
  `session_token` VARCHAR(255) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `ip_address` VARCHAR(255),
  `user_agent` TEXT,
  
  INDEX `idx_document_sessions_document_id` (`document_id`),
  INDEX `idx_document_sessions_user_id` (`user_id`),
  INDEX `idx_document_sessions_token` (`session_token`),
  INDEX `idx_document_sessions_expires_at` (`expires_at`),
  
  FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
);

-- Ajouter une colonne pour marquer les accès hors ligne dans document_access
ALTER TABLE `document_access` 
ADD COLUMN IF NOT EXISTS `offline_key_id` VARCHAR(255) NULL,
ADD INDEX `idx_document_access_offline_key_id` (`offline_key_id`);

-- Vue pour les statistiques d'accès hors ligne
CREATE OR REPLACE VIEW `offline_access_stats` AS
SELECT 
  doa.user_id,
  u.email as user_email,
  u.first_name,
  u.last_name,
  COUNT(doa.id) as total_offline_keys,
  COUNT(CASE WHEN doa.is_active = 1 THEN 1 END) as active_keys,
  COUNT(CASE WHEN doa.expires_at < NOW() THEN 1 END) as expired_keys,
  SUM(doa.access_count) as total_accesses,
  MAX(doa.last_accessed_at) as last_access,
  MAX(doa.created_at) as last_key_generated
FROM document_offline_access doa
LEFT JOIN users u ON doa.user_id = u.id
GROUP BY doa.user_id, u.email, u.first_name, u.last_name;

-- Procédure pour nettoyer les accès expirés
DELIMITER //
CREATE OR REPLACE PROCEDURE CleanupExpiredOfflineAccess()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE affected_rows INT DEFAULT 0;
  
  -- Désactiver les clés expirées
  UPDATE document_offline_access 
  SET is_active = FALSE 
  WHERE expires_at < NOW() AND is_active = TRUE;
  
  SET affected_rows = ROW_COUNT();
  
  -- Supprimer les clés expirées depuis plus de 30 jours
  DELETE FROM document_offline_access 
  WHERE expires_at < DATE_SUB(NOW(), INTERVAL 30 DAY);
  
  -- Log de l'opération
  INSERT INTO system_logs (action, details, created_at) 
  VALUES ('cleanup_offline_access', 
          CONCAT('Désactivé: ', affected_rows, ' clés, Supprimé: ', ROW_COUNT(), ' anciennes clés'),
          NOW());
          
END //
DELIMITER ;

-- Trigger pour limiter le nombre de clés actives par utilisateur
DELIMITER //
CREATE OR REPLACE TRIGGER limit_offline_keys_per_user
BEFORE INSERT ON document_offline_access
FOR EACH ROW
BEGIN
  DECLARE key_count INT DEFAULT 0;
  
  -- Compter les clés actives pour cet utilisateur
  SELECT COUNT(*) INTO key_count
  FROM document_offline_access 
  WHERE user_id = NEW.user_id 
    AND is_active = TRUE 
    AND expires_at > NOW();
  
  -- Limiter à 5 clés actives par utilisateur
  IF key_count >= 5 THEN
    SIGNAL SQLSTATE '45000' 
    SET MESSAGE_TEXT = 'Limite de 5 clés d\'accès hors ligne actives par utilisateur atteinte';
  END IF;
END //
DELIMITER ;

-- Insérer les autorisations nécessaires
INSERT IGNORE INTO system_logs (action, details, created_at) 
VALUES ('migration_offline_access', 'Tables et procédures pour l\'accès hors ligne sécurisé créées', NOW());

-- Ajouter la variable d'environnement pour la clé maître (à configurer manuellement)
-- OFFLINE_MASTER_KEY=your-very-secure-master-key-here-change-this-in-production