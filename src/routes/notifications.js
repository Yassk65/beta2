// 🔔 ROUTES NOTIFICATIONS
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour la gestion des notifications utilisateur

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  getNotificationSettings,
  updateNotificationSettingsController
} = require('../controllers/notificationController');
const { 
  authenticateToken, 
  requireRoles
} = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATEURS
// ============================================================================

const notificationsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
  query('type')
    .optional()
    .isIn(['new_message', 'new_document', 'document_shared', 'exam_request_created', 'exam_request_updated', 'exam_results_ready', 'system_alert', 'appointment_reminder'])
    .withMessage('Type de notification invalide'),
  query('is_read')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Statut de lecture invalide'),
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide')
];

const notificationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID notification invalide')
];

const notificationSettingsValidation = [
  body('new_message_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre nouveaux messages invalide'),
  body('new_document_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre nouveaux documents invalide'),
  body('exam_status_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre statut examens invalide'),
  body('in_app_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre notifications in-app invalide'),
  body('email_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre notifications email invalide'),
  body('push_enabled')
    .optional()
    .isBoolean()
    .withMessage('Paramètre notifications push invalide'),
  body('email_frequency')
    .optional()
    .isIn(['immediate', 'hourly', 'daily', 'weekly', 'never'])
    .withMessage('Fréquence email invalide'),
  body('quiet_hours_start')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Heure de début silence invalide (format HH:MM)'),
  body('quiet_hours_end')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Heure de fin silence invalide (format HH:MM)')
];

// ============================================================================
// MIDDLEWARE DE VALIDATION
// ============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: errors.array().map(error => ({
        field: error.path,
        message: error.msg,
        value: error.value
      }))
    });
  }
  next();
};

// ============================================================================
// ROUTES NOTIFICATIONS
// ============================================================================

/**
 * 📊 STATISTIQUES DES NOTIFICATIONS
 * GET /api/notifications/stats
 */
router.get('/stats',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  getNotificationStats
);

/**
 * ⚙️ RÉCUPÉRER LES PARAMÈTRES DE NOTIFICATION
 * GET /api/notifications/settings
 */
router.get('/settings',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  getNotificationSettings
);

/**
 * ⚙️ METTRE À JOUR LES PARAMÈTRES DE NOTIFICATION
 * PUT /api/notifications/settings
 */
router.put('/settings',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  notificationSettingsValidation,
  handleValidationErrors,
  updateNotificationSettingsController
);

/**
 * 📋 LISTER LES NOTIFICATIONS DE L'UTILISATEUR
 * GET /api/notifications
 */
router.get('/',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  notificationsQueryValidation,
  handleValidationErrors,
  getNotifications
);

/**
 * 👁️ MARQUER TOUTES LES NOTIFICATIONS COMME LUES
 * PUT /api/notifications/read-all
 */
router.put('/read-all',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  markAllAsRead
);

/**
 * 🗑️ SUPPRIMER TOUTES LES NOTIFICATIONS LUES
 * DELETE /api/notifications/read
 */
router.delete('/read',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  deleteReadNotifications
);

/**
 * 👁️ MARQUER UNE NOTIFICATION COMME LUE
 * PUT /api/notifications/:id/read
 */
router.put('/:id/read',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  notificationIdValidation,
  handleValidationErrors,
  markAsRead
);

/**
 * 🗑️ SUPPRIMER UNE NOTIFICATION
 * DELETE /api/notifications/:id
 */
router.delete('/:id',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  notificationIdValidation,
  handleValidationErrors,
  deleteNotification
);

// ============================================================================
// ROUTES SPÉCIALISÉES
// ============================================================================

/**
 * 📋 NOTIFICATIONS NON LUES UNIQUEMENT
 * GET /api/notifications/unread
 */
router.get('/unread',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  async (req, res) => {
    try {
      // Rediriger vers la fonction principale avec filtre non lu
      req.query.is_read = 'false';
      req.query.limit = req.query.limit || '50'; // Plus de notifications non lues
      await getNotifications(req, res);
    } catch (error) {
      console.error('Erreur récupération notifications non lues:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 📋 NOTIFICATIONS PAR TYPE
 * GET /api/notifications/type/:type
 */
router.get('/type/:type',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('type').isIn(['new_message', 'new_document', 'document_shared', 'exam_request_created', 'exam_request_updated', 'exam_results_ready', 'system_alert', 'appointment_reminder']).withMessage('Type de notification invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Rediriger vers la fonction principale avec filtre type
      req.query.type = req.params.type;
      await getNotifications(req, res);
    } catch (error) {
      console.error('Erreur récupération notifications par type:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

// ============================================================================
// GESTION DES ERREURS DE ROUTE
// ============================================================================

router.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    availableRoutes: [
      'GET /api/notifications/stats',
      'GET /api/notifications/settings',
      'PUT /api/notifications/settings',
      'GET /api/notifications',
      'PUT /api/notifications/read-all',
      'DELETE /api/notifications/read',
      'PUT /api/notifications/:id/read',
      'DELETE /api/notifications/:id',
      'GET /api/notifications/unread',
      'GET /api/notifications/type/:type'
    ]
  });
});

module.exports = router;