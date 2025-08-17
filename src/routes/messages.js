// 💬 ROUTES MESSAGERIE MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour le système de messagerie entre utilisateurs

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  getConversations,
  createConversation,
  getConversation,
  sendMessage,
  getMessages,
  addParticipant,
  leaveConversation,
  searchContacts
} = require('../controllers/messageController');
const { 
  authenticateToken, 
  requireRoles
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// VALIDATEURS
// ============================================================================

const conversationValidation = [
  body('participant_ids')
    .isArray({ min: 1 })
    .withMessage('Au moins un participant requis'),
  body('participant_ids.*')
    .isInt({ min: 1 })
    .withMessage('IDs de participants invalides'),
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Titre doit contenir entre 1 et 100 caractères'),
  body('initial_message')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message initial requis (1-2000 caractères)')
];

const messageValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Message requis (1-2000 caractères)')
];

const participantValidation = [
  body('user_id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide')
];

const conversationIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID conversation invalide')
];

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)')
];

const searchValidation = [
  query('search')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Recherche requise (2-50 caractères)'),
  query('role')
    .optional()
    .isIn(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin'])
    .withMessage('Rôle invalide')
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
// ROUTES CONVERSATIONS
// ============================================================================

/**
 * 📋 LISTER LES CONVERSATIONS DE L'UTILISATEUR
 * GET /api/messages/conversations
 * 
 * Query: ?page=1&limit=20&search=titre
 * Permissions: Tous les utilisateurs connectés
 * Response: { success, data: { conversations, pagination } }
 */
router.get('/conversations',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  paginationValidation,
  query('search').optional().trim().isLength({ min: 2, max: 50 }).withMessage('Recherche invalide (2-50 caractères)'),
  handleValidationErrors,
  getConversations
);

/**
 * 💬 CRÉER UNE NOUVELLE CONVERSATION
 * POST /api/messages/conversations
 * 
 * Permissions: Tous les utilisateurs connectés (avec restrictions selon le rôle)
 * Body: { participant_ids: [1, 2], title?: "Titre", initial_message: "Message" }
 * Response: { success, message, data: { conversation } }
 */
router.post('/conversations',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationValidation,
  handleValidationErrors,
  createConversation
);

/**
 * 👁️ OBTENIR UNE CONVERSATION SPÉCIFIQUE
 * GET /api/messages/conversations/:id
 * 
 * Permissions: Participants de la conversation
 * Response: { success, data: { conversation } }
 */
router.get('/conversations/:id',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  handleValidationErrors,
  getConversation
);

// ============================================================================
// ROUTES MESSAGES
// ============================================================================

/**
 * 📋 LISTER LES MESSAGES D'UNE CONVERSATION
 * GET /api/messages/conversations/:id/messages
 * 
 * Query: ?page=1&limit=50&before=2025-01-01T00:00:00Z
 * Permissions: Participants de la conversation
 * Response: { success, data: { messages, pagination } }
 */
router.get('/conversations/:id/messages',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  paginationValidation,
  query('before').optional().isISO8601().withMessage('Date invalide (format ISO 8601)'),
  handleValidationErrors,
  getMessages
);

/**
 * 📨 ENVOYER UN MESSAGE
 * POST /api/messages/conversations/:id/messages
 * 
 * Permissions: Participants de la conversation
 * Body: { content: "Contenu du message" }
 * Response: { success, message, data: { message } }
 */
router.post('/conversations/:id/messages',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  messageValidation,
  handleValidationErrors,
  sendMessage
);

// ============================================================================
// ROUTES PARTICIPANTS
// ============================================================================

/**
 * 👥 AJOUTER UN PARTICIPANT À UNE CONVERSATION
 * POST /api/messages/conversations/:id/participants
 * 
 * Permissions: Créateur de la conversation ou admins
 * Body: { user_id: 123 }
 * Response: { success, message }
 */
router.post('/conversations/:id/participants',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  participantValidation,
  handleValidationErrors,
  addParticipant
);

/**
 * 🚪 QUITTER UNE CONVERSATION
 * DELETE /api/messages/conversations/:id/participants/me
 * 
 * Permissions: Participants de la conversation
 * Response: { success, message }
 */
router.delete('/conversations/:id/participants/me',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  handleValidationErrors,
  leaveConversation
);

// ============================================================================
// ROUTES RECHERCHE ET CONTACTS
// ============================================================================

/**
 * 🔍 RECHERCHER DES UTILISATEURS POUR DÉMARRER UNE CONVERSATION
 * GET /api/messages/contacts
 * 
 * Query: ?search=nom&role=patient&page=1&limit=20
 * Permissions: Tous les utilisateurs connectés (avec restrictions selon le rôle)
 * Response: { success, data: { contacts, pagination } }
 */
router.get('/contacts',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  searchValidation,
  paginationValidation,
  handleValidationErrors,
  searchContacts
);

// ============================================================================
// ROUTES STATISTIQUES ET UTILITAIRES
// ============================================================================

/**
 * 📊 STATISTIQUES DE MESSAGERIE DE L'UTILISATEUR
 * GET /api/messages/stats
 * 
 * Permissions: Tous les utilisateurs connectés
 * Response: { success, data: { totalConversations, totalMessages, unreadCount } }
 */
router.get('/stats',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  async (req, res) => {
    try {
      const { id: userId } = req.user;

      const [
        totalConversations,
        totalMessages,
        recentMessages
      ] = await Promise.all([
        // Nombre total de conversations
        prisma.conversationParticipant.count({
          where: { user_id: userId }
        }),
        // Nombre total de messages envoyés
        prisma.message.count({
          where: { sender_id: userId }
        }),
        // Messages récents (7 derniers jours)
        prisma.message.count({
          where: {
            sender_id: userId,
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        })
      ]);

      const stats = {
        totalConversations,
        totalMessages,
        recentMessages,
        unreadCount: 0 // TODO: Implémenter le système de lecture
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur statistiques messagerie:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 🔄 MARQUER UNE CONVERSATION COMME LUE
 * PUT /api/messages/conversations/:id/read
 * 
 * Permissions: Participants de la conversation
 * Response: { success, message }
 */
router.put('/conversations/:id/read',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  conversationIdValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { id: userId } = req.user;
      const conversationId = parseInt(req.params.id);

      // Vérifier que l'utilisateur fait partie de la conversation
      const participation = await prisma.conversationParticipant.findFirst({
        where: {
          conversation_id: conversationId,
          user_id: userId
        }
      });

      if (!participation) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cette conversation'
        });
      }

      // TODO: Implémenter le système de lecture des messages
      // Pour l'instant, on retourne juste un succès
      res.json({
        success: true,
        message: 'Conversation marquée comme lue'
      });

    } catch (error) {
      console.error('Erreur marquage lecture:', error);
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
      'GET /api/messages/conversations',
      'POST /api/messages/conversations',
      'GET /api/messages/conversations/:id',
      'GET /api/messages/conversations/:id/messages',
      'POST /api/messages/conversations/:id/messages',
      'POST /api/messages/conversations/:id/participants',
      'DELETE /api/messages/conversations/:id/participants/me',
      'GET /api/messages/contacts',
      'GET /api/messages/stats',
      'PUT /api/messages/conversations/:id/read'
    ]
  });
});

module.exports = router;