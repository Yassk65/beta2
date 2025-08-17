// 🏥 ROUTES GESTION PATIENTS PAR ADMINS MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes spécialisées pour la gestion des patients par les admins

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const {
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientsStats
} = require('../controllers/patientAdminController');
const { 
  authenticateToken, 
  requireRoles
} = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATEURS
// ============================================================================

const createPatientValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
    .withMessage('Numéro de téléphone français invalide'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)'),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'Other'])
    .withMessage('Genre invalide (M, F, ou Other)'),
  body('assign_to_hospital')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID hôpital invalide'),
  body('assign_to_laboratory')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID laboratoire invalide')
];

const updatePatientValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID patient invalide'),
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
    .withMessage('Numéro de téléphone français invalide'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Statut actif invalide'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)'),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'Other'])
    .withMessage('Genre invalide (M, F, ou Other)'),
  body('hospital_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID hôpital invalide'),
  body('laboratory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID laboratoire invalide')
];

const patientIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID patient invalide')
];

const patientsQueryValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Numéro de page invalide'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite invalide (1-100)'),
  query('is_active')
    .optional()
    .isIn(['true', 'false'])
    .withMessage('Statut actif invalide'),
  query('gender')
    .optional()
    .isIn(['M', 'F', 'Other'])
    .withMessage('Genre invalide'),
  query('age_min')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Âge minimum invalide'),
  query('age_max')
    .optional()
    .isInt({ min: 0, max: 150 })
    .withMessage('Âge maximum invalide')
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
// ROUTES GESTION DES PATIENTS
// ============================================================================

/**
 * 📊 STATISTIQUES PATIENTS
 * GET /api/admin/patients/stats
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Response: { success, data: { total, active, inactive, recent, byGender, ... } }
 */
router.get('/stats',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  getPatientsStats
);

/**
 * 📋 LISTER LES PATIENTS
 * GET /api/admin/patients
 * 
 * Query: ?page=1&limit=10&search=nom&is_active=true&gender=M&age_min=18&age_max=65
 * Permissions: Admins (avec restrictions par établissement)
 * Response: { success, data: { patients, pagination } }
 */
router.get('/',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  patientsQueryValidation,
  handleValidationErrors,
  getPatients
);

/**
 * 👥 CRÉER UN PATIENT
 * POST /api/admin/patients
 * 
 * Permissions: Admins (patient assigné à leur établissement)
 * Body: { email, password, first_name, last_name, phone?, date_of_birth?, gender?, assign_to_hospital?, assign_to_laboratory? }
 * Response: { success, message, data: { patient } }
 */
router.post('/',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  createPatientValidation,
  handleValidationErrors,
  createPatient
);

/**
 * 👤 OBTENIR UN PATIENT SPÉCIFIQUE
 * GET /api/admin/patients/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Response: { success, data: { patient } }
 */
router.get('/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  patientIdValidation,
  handleValidationErrors,
  getPatient
);

/**
 * ✏️ MODIFIER UN PATIENT
 * PUT /api/admin/patients/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Body: { first_name?, last_name?, phone?, is_active?, date_of_birth?, gender?, hospital_id?, laboratory_id? }
 * Response: { success, message, data: { patient } }
 */
router.put('/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  updatePatientValidation,
  handleValidationErrors,
  updatePatient
);

/**
 * 🗑️ SUPPRIMER UN PATIENT
 * DELETE /api/admin/patients/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Response: { success, message }
 */
router.delete('/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  patientIdValidation,
  handleValidationErrors,
  deletePatient
);

// ============================================================================
// ROUTES SPÉCIALISÉES PAR ÉTABLISSEMENT
// ============================================================================

/**
 * 👥 CRÉER UN PATIENT POUR UN HÔPITAL SPÉCIFIQUE
 * POST /api/admin/hospitals/:hospitalId/patients
 * 
 * Permissions: Super Admin ou Admin de l'hôpital
 */
router.post('/hospitals/:hospitalId/patients',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin']),
  param('hospitalId').isInt({ min: 1 }).withMessage('ID hôpital invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email valide requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('Prénom requis'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Nom requis'),
  handleValidationErrors,
  async (req, res, next) => {
    // Ajouter automatiquement l'assignation à l'hôpital
    req.body.assign_to_hospital = parseInt(req.params.hospitalId);
    next();
  },
  createPatient
);

/**
 * 👥 CRÉER UN PATIENT POUR UN LABORATOIRE SPÉCIFIQUE
 * POST /api/admin/laboratories/:laboratoryId/patients
 * 
 * Permissions: Super Admin ou Admin du laboratoire
 */
router.post('/laboratories/:laboratoryId/patients',
  authenticateToken,
  requireRoles(['super_admin', 'lab_admin']),
  param('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email valide requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('Prénom requis'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Nom requis'),
  handleValidationErrors,
  async (req, res, next) => {
    // Ajouter automatiquement l'assignation au laboratoire
    req.body.assign_to_laboratory = parseInt(req.params.laboratoryId);
    next();
  },
  createPatient
);

// ============================================================================
// ROUTES D'IMPORT/EXPORT (FUTURES FONCTIONNALITÉS)
// ============================================================================

/**
 * 📤 EXPORTER LA LISTE DES PATIENTS (CSV)
 * GET /api/admin/patients/export
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Response: Fichier CSV
 */
router.get('/export',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  async (req, res) => {
    try {
      // TODO: Implémenter l'export CSV des patients
      res.status(501).json({
        success: false,
        message: 'Fonctionnalité d\'export non encore implémentée'
      });
    } catch (error) {
      console.error('Erreur export patients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 📥 IMPORTER DES PATIENTS (CSV)
 * POST /api/admin/patients/import
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Body: FormData avec fichier CSV
 * Response: { success, message, data: { imported, errors } }
 */
router.post('/import',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  async (req, res) => {
    try {
      // TODO: Implémenter l'import CSV des patients
      res.status(501).json({
        success: false,
        message: 'Fonctionnalité d\'import non encore implémentée'
      });
    } catch (error) {
      console.error('Erreur import patients:', error);
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
      'GET /api/admin/patients/stats',
      'GET /api/admin/patients',
      'POST /api/admin/patients',
      'GET /api/admin/patients/:id',
      'PUT /api/admin/patients/:id',
      'DELETE /api/admin/patients/:id',
      'POST /api/admin/hospitals/:hospitalId/patients',
      'POST /api/admin/laboratories/:laboratoryId/patients',
      'GET /api/admin/patients/export',
      'POST /api/admin/patients/import'
    ]
  });
});

module.exports = router;