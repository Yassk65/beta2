// 🧪 ROUTES DEMANDES D'EXAMENS DE LABORATOIRE
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour la gestion des demandes d'examens entre hôpitaux et laboratoires

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const {
  createExamRequest,
  getExamRequests,
  getExamRequest,
  updateExamStatus,
  getExamRequestsStats
} = require('../controllers/examRequestController');
const { 
  authenticateToken, 
  requireRoles
} = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATEURS
// ============================================================================

const createExamRequestValidation = [
  body('patient_id')
    .isInt({ min: 1 })
    .withMessage('ID patient invalide'),
  body('laboratory_id')
    .isInt({ min: 1 })
    .withMessage('ID laboratoire invalide'),
  body('exam_type')
    .isIn(['blood_test', 'urine_test', 'imaging', 'biopsy', 'culture', 'serology', 'biochemistry', 'hematology', 'immunology', 'microbiology', 'other'])
    .withMessage('Type d\'examen invalide'),
  body('priority')
    .optional()
    .isIn(['urgent', 'high', 'normal', 'low'])
    .withMessage('Priorité invalide'),
  body('clinical_info')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Informations cliniques requises (10-2000 caractères)'),
  body('requested_tests')
    .isArray({ min: 1 })
    .withMessage('Au moins un test doit être demandé'),
  body('requested_tests.*')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nom de test invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues (max 1000 caractères)'),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Date de programmation invalide'),
  body('hospital_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID hôpital invalide')
];

const updateStatusValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID demande d\'examen invalide'),
  body('status')
    .isIn(['pending', 'accepted', 'rejected', 'scheduled', 'in_progress', 'completed', 'results_ready', 'cancelled'])
    .withMessage('Statut invalide'),
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes trop longues (max 1000 caractères)'),
  body('scheduled_at')
    .optional()
    .isISO8601()
    .withMessage('Date de programmation invalide'),
  body('completed_at')
    .optional()
    .isISO8601()
    .withMessage('Date de réalisation invalide'),
  body('results_ready_at')
    .optional()
    .isISO8601()
    .withMessage('Date des résultats invalide')
];

const examRequestIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID demande d\'examen invalide')
];

const examRequestsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
  query('status')
    .optional()
    .isIn(['pending', 'accepted', 'rejected', 'scheduled', 'in_progress', 'completed', 'results_ready', 'cancelled'])
    .withMessage('Statut invalide'),
  query('exam_type')
    .optional()
    .isIn(['blood_test', 'urine_test', 'imaging', 'biopsy', 'culture', 'serology', 'biochemistry', 'hematology', 'immunology', 'microbiology', 'other'])
    .withMessage('Type d\'examen invalide'),
  query('priority')
    .optional()
    .isIn(['urgent', 'high', 'normal', 'low'])
    .withMessage('Priorité invalide'),
  query('patient_search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Recherche patient invalide (2-50 caractères)'),
  query('date_from')
    .optional()
    .isISO8601()
    .withMessage('Date de début invalide'),
  query('date_to')
    .optional()
    .isISO8601()
    .withMessage('Date de fin invalide')
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
// ROUTES DEMANDES D'EXAMENS
// ============================================================================

/**
 * 📊 STATISTIQUES DES DEMANDES D'EXAMENS
 * GET /api/exam-requests/stats
 * 
 * Permissions: Personnel hospitalier et laboratoire
 * Response: { success, data: { total, pending, accepted, completed, ... } }
 */
router.get('/stats',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  getExamRequestsStats
);

/**
 * 📋 LISTER LES DEMANDES D'EXAMENS
 * GET /api/exam-requests
 * 
 * Query: ?page=1&limit=10&status=pending&exam_type=blood_test&priority=urgent&patient_search=dupont
 * Permissions: Personnel hospitalier et laboratoire (filtré par établissement)
 * Response: { success, data: { examRequests, pagination } }
 */
router.get('/',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  examRequestsQueryValidation,
  handleValidationErrors,
  getExamRequests
);

/**
 * 📝 CRÉER UNE DEMANDE D'EXAMEN
 * POST /api/exam-requests
 * 
 * Permissions: Personnel hospitalier uniquement
 * Body: { patient_id, laboratory_id, exam_type, priority?, clinical_info, requested_tests, notes?, scheduled_at? }
 * Response: { success, message, data: { examRequest } }
 */
router.post('/',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'super_admin']),
  createExamRequestValidation,
  handleValidationErrors,
  createExamRequest
);

/**
 * 👁️ OBTENIR UNE DEMANDE D'EXAMEN SPÉCIFIQUE
 * GET /api/exam-requests/:id
 * 
 * Permissions: Personnel de l'hôpital demandeur ou du laboratoire destinataire
 * Response: { success, data: { examRequest } }
 */
router.get('/:id',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  examRequestIdValidation,
  handleValidationErrors,
  getExamRequest
);

/**
 * ✏️ METTRE À JOUR LE STATUT D'UNE DEMANDE D'EXAMEN
 * PUT /api/exam-requests/:id/status
 * 
 * Permissions: Personnel du laboratoire destinataire uniquement
 * Body: { status, notes?, scheduled_at?, completed_at?, results_ready_at? }
 * Response: { success, message, data: { examRequest } }
 */
router.put('/:id/status',
  authenticateToken,
  requireRoles(['lab_staff', 'lab_admin', 'super_admin']),
  updateStatusValidation,
  handleValidationErrors,
  updateExamStatus
);

// ============================================================================
// ROUTES SPÉCIALISÉES
// ============================================================================

/**
 * 📋 DEMANDES D'EXAMENS POUR UN PATIENT SPÉCIFIQUE
 * GET /api/exam-requests/patient/:patientId
 * 
 * Permissions: Personnel autorisé selon l'établissement
 * Response: { success, data: { examRequests } }
 */
router.get('/patient/:patientId',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  param('patientId').isInt({ min: 1 }).withMessage('ID patient invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      // Rediriger vers la fonction principale avec un filtre patient
      req.query.patient_id = req.params.patientId;
      await getExamRequests(req, res);
    } catch (error) {
      console.error('Erreur récupération demandes patient:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 📋 DEMANDES D'EXAMENS URGENTES
 * GET /api/exam-requests/urgent
 * 
 * Permissions: Personnel hospitalier et laboratoire
 * Response: { success, data: { examRequests } }
 */
router.get('/urgent',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  async (req, res) => {
    try {
      // Rediriger vers la fonction principale avec un filtre urgent
      req.query.priority = 'urgent';
      req.query.status = 'pending';
      await getExamRequests(req, res);
    } catch (error) {
      console.error('Erreur récupération demandes urgentes:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 📊 HISTORIQUE DES CHANGEMENTS DE STATUT
 * GET /api/exam-requests/:id/history
 * 
 * Permissions: Personnel de l'hôpital demandeur ou du laboratoire destinataire
 * Response: { success, data: { history } }
 */
router.get('/:id/history',
  authenticateToken,
  requireRoles(['hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin']),
  examRequestIdValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role, hospital_id: userHospitalId, laboratory_id: userLabId } = req.user;
      const examRequestId = parseInt(req.params.id);

      // Vérifier que la demande existe et que l'utilisateur y a accès
      const examRequest = await prisma.examRequest.findUnique({
        where: { id: examRequestId },
        select: { hospital_id: true, laboratory_id: true }
      });

      if (!examRequest) {
        return res.status(404).json({
          success: false,
          message: 'Demande d\'examen non trouvée'
        });
      }

      // Vérifier les permissions
      let hasAccess = false;
      if (role === 'super_admin') {
        hasAccess = true;
      } else if ((role === 'hospital_staff' || role === 'hospital_admin') && examRequest.hospital_id === userHospitalId) {
        hasAccess = true;
      } else if ((role === 'lab_staff' || role === 'lab_admin') && examRequest.laboratory_id === userLabId) {
        hasAccess = true;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à l\'historique de cette demande'
        });
      }

      // Récupérer l'historique
      const history = await prisma.examStatusHistory.findMany({
        where: { exam_request_id: examRequestId },
        orderBy: { changed_at: 'desc' }
      });

      res.json({
        success: true,
        data: { history }
      });

    } catch (error) {
      console.error('Erreur récupération historique:', error);
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
      'GET /api/exam-requests/stats',
      'GET /api/exam-requests',
      'POST /api/exam-requests',
      'GET /api/exam-requests/:id',
      'PUT /api/exam-requests/:id/status',
      'GET /api/exam-requests/patient/:patientId',
      'GET /api/exam-requests/urgent',
      'GET /api/exam-requests/:id/history'
    ]
  });
});

module.exports = router;