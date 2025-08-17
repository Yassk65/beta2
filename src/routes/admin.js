// 👑 ROUTES D'ADMINISTRATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes CRUD pour Super Admin, Admin Hôpitaux et Admin Laboratoires

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  createUser,
  updateUser,
  deleteUser,
  getUser,
  getUsers,
  createHospital,
  createLaboratory,
  getHospitals,
  getLaboratories,
  updateHospital,
  updateLaboratory,
  resetUserPassword,
  getDashboard
} = require('../controllers/adminController');
const {
  authenticateToken,
  requireRoles,
  requireHospitalAccess,
  requireLaboratoryAccess
} = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================================
// VALIDATEURS
// ============================================================================

const createUserValidation = [
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
  body('role')
    .isIn(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin'])
    .withMessage('Rôle invalide'),
  body('hospital_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID hôpital invalide'),
  body('laboratory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID laboratoire invalide'),
  body('phone')
    .optional()
    .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
    .withMessage('Numéro de téléphone français invalide'),
  body('date_of_birth')
    .optional()
    .isISO8601()
    .withMessage('Date de naissance invalide'),
  body('gender')
    .optional()
    .isIn(['M', 'F', 'Other'])
    .withMessage('Genre invalide')
];

const updateUserValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
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
  body('role')
    .optional()
    .isIn(['patient', 'hospital_staff', 'hospital_admin', 'lab_staff', 'lab_admin', 'super_admin'])
    .withMessage('Rôle invalide'),
  body('hospital_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID hôpital invalide'),
  body('laboratory_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID laboratoire invalide'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('Statut actif invalide')
];

const establishmentValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères'),
  body('address')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('L\'adresse doit contenir entre 5 et 200 caractères'),
  body('city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('La ville doit contenir entre 2 et 50 caractères'),
  body('phone')
    .optional()
    .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
    .withMessage('Numéro de téléphone français invalide'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('latitude')
    .optional()
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide'),
  body('longitude')
    .optional()
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide')
];

const resetPasswordValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID utilisateur invalide'),
  body('new_password')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères')
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
// ROUTES GESTION DES UTILISATEURS
// ============================================================================

/**
 * 📊 TABLEAU DE BORD ADMIN
 * GET /api/admin/dashboard
 * 
 * Permissions: Tous les admins (avec données filtrées selon le rôle)
 */
router.get('/dashboard',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  getDashboard
);

/**
 * 👥 LISTER LES UTILISATEURS
 * GET /api/admin/users
 * 
 * Query: ?page=1&limit=10&search=nom&role=patient&is_active=true&hospital_id=1&laboratory_id=1
 * Permissions: Admins (avec restrictions par établissement)
 */
router.get('/users',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  getUsers
);

/**
 * 👥 CRÉER UN UTILISATEUR
 * POST /api/admin/users
 * 
 * Permissions: Super Admin uniquement
 * Body: { email, password, first_name, last_name, role, hospital_id?, laboratory_id?, ... }
 */
router.post('/users',
  authenticateToken,
  requireRoles(['super_admin']),
  createUserValidation,
  handleValidationErrors,
  createUser
);

/**
 * 👤 OBTENIR UN UTILISATEUR SPÉCIFIQUE
 * GET /api/admin/users/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 */
router.get('/users/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  handleValidationErrors,
  getUser
);

/**
 * ✏️ MODIFIER UN UTILISATEUR
 * PUT /api/admin/users/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Body: { first_name?, last_name?, role?, hospital_id?, laboratory_id?, is_active?, ... }
 */
router.put('/users/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  updateUserValidation,
  handleValidationErrors,
  updateUser
);

/**
 * 🗑️ SUPPRIMER UN UTILISATEUR
 * DELETE /api/admin/users/:id
 * 
 * Permissions: Admins (avec restrictions par établissement)
 */
router.delete('/users/:id',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID utilisateur invalide'),
  handleValidationErrors,
  deleteUser
);

/**
 * 🔑 RÉINITIALISER LE MOT DE PASSE D'UN UTILISATEUR
 * POST /api/admin/users/:id/reset-password
 * 
 * Permissions: Admins (avec restrictions par établissement)
 * Body: { new_password }
 */
router.post('/users/:id/reset-password',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  resetPasswordValidation,
  handleValidationErrors,
  resetUserPassword
);

// ============================================================================
// ROUTES GESTION DES ÉTABLISSEMENTS
// ============================================================================

/**
 * 🏥 CRÉER UN HÔPITAL
 * POST /api/admin/hospitals
 * 
 * Permissions: Super Admin uniquement
 * Body: { name, address, city, phone?, email?, latitude?, longitude? }
 */
router.post('/hospitals',
  authenticateToken,
  requireRoles(['super_admin']),
  establishmentValidation,
  handleValidationErrors,
  createHospital
);

/**
 * 🏥 LISTER LES HÔPITAUX
 * GET /api/admin/hospitals
 * 
 * Query: ?page=1&limit=10&search=nom&is_active=true
 * Permissions: Super Admin uniquement
 */
router.get('/hospitals',
  authenticateToken,
  requireRoles(['super_admin']),
  getHospitals
);

/**
 * ✏️ MODIFIER UN HÔPITAL
 * PUT /api/admin/hospitals/:id
 * 
 * Permissions: Super Admin uniquement
 * Body: { name?, address?, city?, phone?, email?, latitude?, longitude?, is_active? }
 */
router.put('/hospitals/:id',
  authenticateToken,
  requireRoles(['super_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID hôpital invalide'),
  establishmentValidation.map(validation => validation.optional()),
  body('is_active').optional().isBoolean().withMessage('Statut actif invalide'),
  handleValidationErrors,
  updateHospital
);

/**
 * 🧪 CRÉER UN LABORATOIRE
 * POST /api/admin/laboratories
 * 
 * Permissions: Super Admin uniquement
 * Body: { name, address, city, phone?, email?, latitude?, longitude? }
 */
router.post('/laboratories',
  authenticateToken,
  requireRoles(['super_admin']),
  establishmentValidation,
  handleValidationErrors,
  createLaboratory
);

/**
 * 🧪 LISTER LES LABORATOIRES
 * GET /api/admin/laboratories
 * 
 * Query: ?page=1&limit=10&search=nom&is_active=true
 * Permissions: Super Admin uniquement
 */
router.get('/laboratories',
  authenticateToken,
  requireRoles(['super_admin']),
  getLaboratories
);

/**
 * ✏️ MODIFIER UN LABORATOIRE
 * PUT /api/admin/laboratories/:id
 * 
 * Permissions: Super Admin uniquement
 * Body: { name?, address?, city?, phone?, email?, latitude?, longitude?, is_active? }
 */
router.put('/laboratories/:id',
  authenticateToken,
  requireRoles(['super_admin']),
  param('id').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  establishmentValidation.map(validation => validation.optional()),
  body('is_active').optional().isBoolean().withMessage('Statut actif invalide'),
  handleValidationErrors,
  updateLaboratory
);

// ============================================================================
// ROUTES SPÉCIFIQUES PAR ÉTABLISSEMENT
// ============================================================================

/**
 * 👥 CRÉER UN UTILISATEUR POUR UN HÔPITAL SPÉCIFIQUE
 * POST /api/admin/hospitals/:hospitalId/users
 * 
 * Permissions: Super Admin ou Admin de l'hôpital
 */
router.post('/hospitals/:hospitalId/users',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin']),
  requireHospitalAccess,
  param('hospitalId').isInt({ min: 1 }).withMessage('ID hôpital invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email valide requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('Prénom requis'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Nom requis'),
  body('role').isIn(['hospital_staff', 'patient']).withMessage('Rôle invalide pour cet établissement'),
  handleValidationErrors,
  async (req, res, next) => {
    // Ajouter automatiquement l'hospital_id
    req.body.hospital_id = parseInt(req.params.hospitalId);
    next();
  },
  createUser
);

/**
 * 👥 CRÉER UN UTILISATEUR POUR UN LABORATOIRE SPÉCIFIQUE
 * POST /api/admin/laboratories/:laboratoryId/users
 * 
 * Permissions: Super Admin ou Admin du laboratoire
 */
router.post('/laboratories/:laboratoryId/users',
  authenticateToken,
  requireRoles(['super_admin', 'lab_admin']),
  requireLaboratoryAccess,
  param('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  body('email').isEmail().normalizeEmail().withMessage('Email valide requis'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe requis (min 6 caractères)'),
  body('first_name').trim().isLength({ min: 2, max: 50 }).withMessage('Prénom requis'),
  body('last_name').trim().isLength({ min: 2, max: 50 }).withMessage('Nom requis'),
  body('role').isIn(['lab_staff', 'patient']).withMessage('Rôle invalide pour cet établissement'),
  handleValidationErrors,
  async (req, res, next) => {
    // Ajouter automatiquement le laboratory_id
    req.body.laboratory_id = parseInt(req.params.laboratoryId);
    next();
  },
  createUser
);

// ============================================================================
// ROUTES DE GESTION DES DONNÉES LIÉES
// ============================================================================

/**
 * 📄 OBTENIR LES DOCUMENTS D'UN ÉTABLISSEMENT
 * GET /api/admin/hospitals/:hospitalId/documents
 * GET /api/admin/laboratories/:laboratoryId/documents
 */
router.get('/hospitals/:hospitalId/documents',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'hospital_staff']),
  requireHospitalAccess,
  param('hospitalId').isInt({ min: 1 }).withMessage('ID hôpital invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);
      const { page = 1, limit = 10, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      let whereClause = { hospital_id: hospitalId };

      if (search) {
        whereClause.OR = [
          { filename: { contains: search, mode: 'insensitive' } },
          { document_type: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { first_name: true, last_name: true, email: true }
                }
              }
            },
            uploader: {
              select: { first_name: true, last_name: true, role: true }
            }
          },
          skip,
          take,
          orderBy: { created_at: 'desc' }
        }),
        prisma.document.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération documents hôpital:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

router.get('/laboratories/:laboratoryId/documents',
  authenticateToken,
  requireRoles(['super_admin', 'lab_admin', 'lab_staff']),
  requireLaboratoryAccess,
  param('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const laboratoryId = parseInt(req.params.laboratoryId);
      const { page = 1, limit = 10, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      let whereClause = { laboratory_id: laboratoryId };

      if (search) {
        whereClause.OR = [
          { filename: { contains: search, mode: 'insensitive' } },
          { document_type: { contains: search, mode: 'insensitive' } }
        ];
      }

      const [documents, total] = await Promise.all([
        prisma.document.findMany({
          where: whereClause,
          include: {
            patient: {
              include: {
                user: {
                  select: { first_name: true, last_name: true, email: true }
                }
              }
            },
            uploader: {
              select: { first_name: true, last_name: true, role: true }
            }
          },
          skip,
          take,
          orderBy: { created_at: 'desc' }
        }),
        prisma.document.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération documents laboratoire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

// ============================================================================
// ROUTES DE STATISTIQUES AVANCÉES
// ============================================================================

/**
 * 📊 STATISTIQUES DÉTAILLÉES D'UN HÔPITAL
 * GET /api/admin/hospitals/:hospitalId/stats
 */
router.get('/hospitals/:hospitalId/stats',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin']),
  requireHospitalAccess,
  param('hospitalId').isInt({ min: 1 }).withMessage('ID hôpital invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const hospitalId = parseInt(req.params.hospitalId);

      const [
        totalStaff,
        activeStaff,
        totalDocuments,
        recentDocuments,
        staffByRole
      ] = await Promise.all([
        prisma.user.count({
          where: { hospital_id: hospitalId }
        }),
        prisma.user.count({
          where: { hospital_id: hospitalId, is_active: true }
        }),
        prisma.document.count({
          where: { hospital_id: hospitalId }
        }),
        prisma.document.count({
          where: {
            hospital_id: hospitalId,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { hospital_id: hospitalId },
          _count: { role: true }
        })
      ]);

      const stats = {
        staff: {
          total: totalStaff,
          active: activeStaff,
          inactive: totalStaff - activeStaff,
          byRole: staffByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {})
        },
        documents: {
          total: totalDocuments,
          recent: recentDocuments
        }
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur statistiques hôpital:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 📊 STATISTIQUES DÉTAILLÉES D'UN LABORATOIRE
 * GET /api/admin/laboratories/:laboratoryId/stats
 */
router.get('/laboratories/:laboratoryId/stats',
  authenticateToken,
  requireRoles(['super_admin', 'lab_admin']),
  requireLaboratoryAccess,
  param('laboratoryId').isInt({ min: 1 }).withMessage('ID laboratoire invalide'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const laboratoryId = parseInt(req.params.laboratoryId);

      const [
        totalStaff,
        activeStaff,
        totalDocuments,
        recentDocuments,
        staffByRole
      ] = await Promise.all([
        prisma.user.count({
          where: { laboratory_id: laboratoryId }
        }),
        prisma.user.count({
          where: { laboratory_id: laboratoryId, is_active: true }
        }),
        prisma.document.count({
          where: { laboratory_id: laboratoryId }
        }),
        prisma.document.count({
          where: {
            laboratory_id: laboratoryId,
            created_at: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { laboratory_id: laboratoryId },
          _count: { role: true }
        })
      ]);

      const stats = {
        staff: {
          total: totalStaff,
          active: activeStaff,
          inactive: totalStaff - activeStaff,
          byRole: staffByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {})
        },
        documents: {
          total: totalDocuments,
          recent: recentDocuments
        }
      };

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Erreur statistiques laboratoire:', error);
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
      'GET /api/admin/dashboard',
      'GET /api/admin/users',
      'POST /api/admin/users',
      'GET /api/admin/users/:id',
      'PUT /api/admin/users/:id',
      'DELETE /api/admin/users/:id',
      'POST /api/admin/users/:id/reset-password',
      'GET /api/admin/hospitals',
      'POST /api/admin/hospitals',
      'PUT /api/admin/hospitals/:id',
      'GET /api/admin/laboratories',
      'POST /api/admin/laboratories',
      'PUT /api/admin/laboratories/:id',
      'POST /api/admin/hospitals/:id/users',
      'POST /api/admin/laboratories/:id/users',
      'GET /api/admin/hospitals/:id/documents',
      'GET /api/admin/laboratories/:id/documents',
      'GET /api/admin/hospitals/:id/stats',
      'GET /api/admin/laboratories/:id/stats'
    ]
  });
});

module.exports = router;