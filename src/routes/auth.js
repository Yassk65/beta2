// 🔐 ROUTES D'AUTHENTIFICATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour connexion, inscription et gestion des comptes

const express = require('express');
const { body, validationResult } = require('express-validator');
const { 
  login, 
  register, 
  getProfile,
  updateProfile,
  changePassword,
  refreshToken, 
  logout,
  deleteAccount,
  requestDataExport
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// VALIDATEURS
// ============================================================================

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 1 })
    .withMessage('Mot de passe requis')
];

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Le mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)')
    .custom((value) => {
      const birthDate = new Date(value);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      
      if (age < 13 || age > 120) {
        throw new Error('L\'âge doit être compris entre 13 et 120 ans');
      }
      return true;
    }),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'Other'])
    .withMessage('Genre invalide (M, F, ou Other)')
];

const updateProfileValidation = [
  body('first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le prénom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Le nom doit contenir entre 2 et 50 caractères')
    .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
    .withMessage('Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email valide requis'),
  body('phone')
    .optional()
    .trim()
    .isLength({ min: 6, max: 20 })
    .withMessage('Le numéro de téléphone doit contenir entre 6 et 20 caractères')
    .matches(/^[+]?[0-9\s\-().]+$/)
    .withMessage('Le numéro de téléphone ne peut contenir que des chiffres, espaces, tirets, parenthèses et le signe +'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide (format YYYY-MM-DD)')
];

const changePasswordValidation = [
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Mot de passe actuel requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Le nouveau mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre')
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
// ROUTES PUBLIQUES
// ============================================================================

/**
 * 🔑 CONNEXION
 * POST /api/auth/login
 * 
 * Body: { email, password }
 * Response: { success, message, data: { user, token, expiresIn } }
 */
router.post('/login', 
  loginValidation,
  handleValidationErrors,
  login
);

/**
 * 📝 INSCRIPTION PATIENT
 * POST /api/auth/register
 * 
 * Body: { email, password, first_name, last_name, phone?, date_of_birth?, gender? }
 * Response: { success, message, data: { user, token, expiresIn } }
 */
router.post('/register',
  registerValidation,
  handleValidationErrors,
  register
);

// ============================================================================
// ROUTES PROTÉGÉES
// ============================================================================

/**
 * 👤 PROFIL UTILISATEUR
 * GET /api/auth/profile
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, data: { user } }
 */
router.get('/profile',
  authenticateToken,
  getProfile
);

/**
 * 🏥 PROFIL PATIENT
 * GET /api/auth/patient-profile
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, data: { patient } }
 */
router.get('/patient-profile',
  authenticateToken,
  async (req, res) => {
    const { getPatientProfile } = require('../controllers/authController');
    getPatientProfile(req, res);
  }
);

/**
 * 🔄 RAFRAÎCHIR TOKEN
 * POST /api/auth/refresh
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { token, expiresIn } }
 */
router.post('/refresh',
  authenticateToken,
  refreshToken
);

/**
 * 🚪 DÉCONNEXION
 * POST /api/auth/logout
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, message }
 */
router.post('/logout',
  authenticateToken,
  logout
);

/**
 * ✏️ METTRE À JOUR LE PROFIL
 * PUT /api/auth/profile
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { first_name?, last_name?, email?, phone?, date_of_birth?, address? }
 * Response: { success, message, data: { user } }
 */
router.put('/profile',
  authenticateToken,
  updateProfileValidation,
  handleValidationErrors,
  updateProfile
);

/**
 * 🔒 CHANGER LE MOT DE PASSE
 * PUT /api/auth/change-password
 * 
 * Headers: Authorization: Bearer <token>
 * Body: { currentPassword, newPassword }
 * Response: { success, message }
 */
router.put('/change-password',
  authenticateToken,
  changePasswordValidation,
  handleValidationErrors,
  changePassword
);

/**
 * 🗑️ SUPPRIMER LE COMPTE
 * DELETE /api/auth/account
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, message }
 */
router.delete('/account',
  authenticateToken,
  deleteAccount
);

/**
 * 📄 DEMANDER UN EXPORT DES DONNÉES
 * POST /api/auth/data-export
 * 
 * Headers: Authorization: Bearer <token>
 * Response: { success, message, data: { user, exportDate, disclaimer } }
 */
router.post('/data-export',
  authenticateToken,
  requestDataExport
);

// ============================================================================
// ROUTE DE TEST
// ============================================================================

/**
 * 🧪 TEST AUTHENTIFICATION
 * GET /api/auth/test
 * 
 * Route pour tester l'authentification
 */
router.get('/test',
  authenticateToken,
  (req, res) => {
    res.json({
      success: true,
      message: 'Authentification fonctionnelle',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email,
          role: req.user.role,
          hospital_id: req.user.hospital_id,
          laboratory_id: req.user.laboratory_id
        },
        timestamp: new Date().toISOString()
      }
    });
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
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'GET /api/auth/patient-profile',
      'PUT /api/auth/change-password',
      'POST /api/auth/refresh',
      'POST /api/auth/logout',
      'DELETE /api/auth/account',
      'POST /api/auth/data-export',
      'GET /api/auth/test'
    ]
  });
});

module.exports = router;