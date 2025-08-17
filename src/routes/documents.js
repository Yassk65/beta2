// 📄 ROUTES DOCUMENTS MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour la gestion des documents médicaux

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken, authenticateDocumentAccess, requireRoles } = require('../middleware/auth');

const router = express.Router();

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
// ROUTES DOCUMENTS
// ============================================================================

/**
 * 📤 UPLOAD DE DOCUMENT
 * POST /api/documents/upload
 * 
 * Permissions: Patients et staff médical
 * Response: { success, message, data: { document } }
 */
router.post('/upload',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  (req, res, next) => {
    const { upload, uploadDocument } = require('../controllers/documentController');
    upload.single('file')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message
        });
      }
      uploadDocument(req, res);
    });
  }
);

/**
 * 📋 LISTER MES DOCUMENTS (PATIENT CONNECTÉ)
 * GET /api/documents/my-documents
 * 
 * Permissions: Patient uniquement
 * Response: { success, data: { documents } }
 */
router.get('/my-documents',
  authenticateToken,
  requireRoles(['patient']),
  async (req, res) => {
    const { getMyDocuments } = require('../controllers/documentController');
    getMyDocuments(req, res);
  }
);

/**
 * 📋 LISTER LES DOCUMENTS D'UN PATIENT
 * GET /api/documents/patient/:id
 * 
 * Permissions: Patient propriétaire ou staff médical autorisé
 * Response: { success, data: { documents } }
 */
router.get('/patient/:patientId',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('patientId').isInt({ min: 1 }).withMessage('ID patient invalide'),
  handleValidationErrors,
  async (req, res) => {
    const { getPatientDocuments } = require('../controllers/documentController');
    getPatientDocuments(req, res);
  }
);

/**
 * 👥 OBTENIR LES DESTINATAIRES POUR TRANSFERT
 * GET /api/documents/transfer-recipients
 * 
 * Permissions: Patient
 * Response: { success, data: { recipients } }
 */
router.get('/transfer-recipients',
  authenticateToken,
  requireRoles(['patient']),
  query('type').isIn(['doctor', 'lab']).withMessage('Type requis: doctor ou lab'),
  handleValidationErrors,
  async (req, res) => {
    const { getTransferRecipients } = require('../controllers/documentController');
    getTransferRecipients(req, res);
  }
);

/**
 * 👁️ VISUALISER UN DOCUMENT
 * GET /api/documents/:id/view
 * 
 * Permissions: Patient propriétaire ou staff médical autorisé
 * Response: Fichier ou { success, data: { document } }
 */
router.get('/:id/view',
  authenticateDocumentAccess,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID document invalide'),
  handleValidationErrors,
  async (req, res) => {
    const { viewDocument } = require('../controllers/documentController');
    viewDocument(req, res);
  }
);

/**
 * 💾 DONNÉES HORS LIGNE D'UN DOCUMENT
 * GET /api/documents/:id/offline-data
 * 
 * Permissions: Patient propriétaire
 * Response: { success, data: { content } }
 */
router.get('/:id/offline-data',
  authenticateToken,
  requireRoles(['patient']),
  param('id').isInt({ min: 1 }).withMessage('ID document invalide'),
  handleValidationErrors,
  async (req, res) => {
    const { getOfflineData } = require('../controllers/documentController');
    getOfflineData(req, res);
  }
);

/**
 * 🤖 RÉSUMÉ IA D'UN DOCUMENT
 * POST /api/documents/:id/ai-summary
 * 
 * Permissions: Patient propriétaire ou staff médical autorisé
 * Response: { success, data: { summary, confidence } }
 */
router.post('/:id/ai-summary',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID document invalide'),
  handleValidationErrors,
  async (req, res) => {
    const { generateAISummary } = require('../controllers/documentController');
    generateAISummary(req, res);
  }
);

/**
 * 📤 TRANSFÉRER UN DOCUMENT
 * POST /api/documents/:id/transfer
 * 
 * Permissions: Patient propriétaire
 * Response: { success, message }
 */
router.post('/:id/transfer',
  authenticateToken,
  requireRoles(['patient']),
  param('id').isInt({ min: 1 }).withMessage('ID document invalide'),
  body('recipient_id').isInt({ min: 1 }).withMessage('ID destinataire requis'),
  body('recipient_type').isIn(['doctor', 'lab']).withMessage('Type destinataire invalide'),
  body('message').optional().isString().withMessage('Message doit être une chaîne'),
  handleValidationErrors,
  async (req, res) => {
    const { transferDocument } = require('../controllers/documentController');
    transferDocument(req, res);
  }
);

/**
 * 🗑️ SUPPRIMER UN DOCUMENT
 * DELETE /api/documents/:id
 * 
 * Permissions: Propriétaire ou admin autorisé
 * Response: { success, message }
 */
router.delete('/:id',
  authenticateToken,
  requireRoles(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID document invalide'),
  handleValidationErrors,
  async (req, res) => {
    const { deleteDocument } = require('../controllers/documentController');
    deleteDocument(req, res);
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
      'POST /api/documents/upload',
      'GET /api/documents/my-documents',
      'GET /api/documents/patient/:id',
      'GET /api/documents/:id/view',
      'POST /api/documents/:id/ai-summary',
      'POST /api/documents/:id/transfer',
      'GET /api/documents/transfer-recipients',
      'GET /api/documents/:id/offline-data',
      'DELETE /api/documents/:id'
    ]
  });
});

module.exports = router;