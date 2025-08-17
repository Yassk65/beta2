// ============================================================================
// ROUTES CHAT MÉDICAL - API ENDPOINTS
// ============================================================================
// 🎯 Routes pour le chat médical avec bot IA via OpenRouter
// 📅 Créé le : 12 Août 2025

const express = require('express');
const { body, param } = require('express-validator');
const medicalChatController = require('../controllers/medicalChatController');
const { authenticateToken } = require('../middleware/auth');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// ============================================================================
// MIDDLEWARE GLOBAL - AUTHENTIFICATION REQUISE
// ============================================================================
router.use(authenticateToken);

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const createSessionValidation = [
  body('message')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Le message doit contenir entre 5 et 2000 caractères')
    .trim()
];

const sendMessageValidation = [
  param('sessionId')
    .isInt({ min: 1 })
    .withMessage('ID de session invalide'),
  body('message')
    .notEmpty()
    .withMessage('Le message est requis')
    .isLength({ min: 1, max: 2000 })
    .withMessage('Le message doit contenir entre 1 et 2000 caractères')
    .trim()
];

const sessionIdValidation = [
  param('sessionId')
    .isInt({ min: 1 })
    .withMessage('ID de session invalide')
];

// ============================================================================
// ROUTES PRINCIPALES
// ============================================================================

/**
 * @route   POST /api/medical-chat/sessions
 * @desc    Crée une nouvelle session de chat médical
 * @access  Private (Patients uniquement)
 * @body    { message: string }
 */
router.post('/sessions', 
  roleMiddleware(['patient']),
  createSessionValidation,
  medicalChatController.createSession
);

/**
 * @route   GET /api/medical-chat/sessions
 * @desc    Récupère toutes les sessions de chat du patient
 * @access  Private (Patients uniquement)
 */
router.get('/sessions',
  roleMiddleware(['patient']),
  medicalChatController.getSessions
);

/**
 * @route   GET /api/medical-chat/sessions/:sessionId
 * @desc    Récupère une session de chat avec son historique
 * @access  Private (Patients uniquement)
 * @params  sessionId: number
 */
router.get('/sessions/:sessionId',
  roleMiddleware(['patient']),
  sessionIdValidation,
  medicalChatController.getSession
);

/**
 * @route   POST /api/medical-chat/sessions/:sessionId/messages
 * @desc    Envoie un message dans une session existante
 * @access  Private (Patients uniquement)
 * @params  sessionId: number
 * @body    { message: string }
 */
router.post('/sessions/:sessionId/messages',
  roleMiddleware(['patient']),
  sendMessageValidation,
  medicalChatController.sendMessage
);

/**
 * @route   PUT /api/medical-chat/sessions/:sessionId/end
 * @desc    Termine une session de chat
 * @access  Private (Patients uniquement)
 * @params  sessionId: number
 */
router.put('/sessions/:sessionId/end',
  roleMiddleware(['patient']),
  sessionIdValidation,
  medicalChatController.endSession
);

/**
 * @route   GET /api/medical-chat/statistics
 * @desc    Récupère les statistiques d'utilisation du chat médical
 * @access  Private (Patients uniquement)
 */
router.get('/statistics',
  roleMiddleware(['patient']),
  medicalChatController.getStatistics
);

/**
 * @route   GET /api/medical-chat/health
 * @desc    Vérifie la santé du service de chat médical
 * @access  Private (Tous les utilisateurs authentifiés)
 */
router.get('/health',
  medicalChatController.checkHealth
);

// ============================================================================
// GESTION D'ERREURS SPÉCIFIQUES
// ============================================================================

// Middleware de gestion d'erreurs pour les routes de chat médical
router.use((error, req, res, next) => {
  console.error('Erreur dans les routes de chat médical:', error);
  
  // Erreurs spécifiques au chat médical
  if (error.message.includes('OpenRouter')) {
    return res.status(503).json({
      success: false,
      message: 'Service de chat médical temporairement indisponible',
      error: 'SERVICE_UNAVAILABLE'
    });
  }

  if (error.message.includes('Session')) {
    return res.status(404).json({
      success: false,
      message: 'Session de chat non trouvée',
      error: 'SESSION_NOT_FOUND'
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur',
    error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_ERROR'
  });
});

module.exports = router;