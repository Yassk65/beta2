// 👥 ROUTES UTILISATEURS MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Routes pour la gestion des utilisateurs et établissements

const express = require('express');
const { query, validationResult } = require('express-validator');
const { PrismaClient } = require('@prisma/client');
const {
  getStats,
  getUsers,
  getHospitals,
  getLaboratories,
  getNearbyEstablishments,
  getPatients
} = require('../controllers/userController');
const { 
  authenticateToken, 
  requireRoles,
  requireHospitalAccess,
  requireLaboratoryAccess 
} = require('../middleware/auth');

const prisma = new PrismaClient();

const router = express.Router();

// ============================================================================
// VALIDATEURS
// ============================================================================

const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100'),
  query('search')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('La recherche doit contenir entre 2 et 50 caractères')
];

const proximityValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide (-90 à 90)'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide (-180 à 180)'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 })
    .withMessage('Rayon invalide (0.1 à 100 km)'),
  query('type')
    .optional()
    .isIn(['hospitals', 'laboratories', 'both'])
    .withMessage('Type invalide (hospitals, laboratories, ou both)')
];

// ============================================================================
// MIDDLEWARE DE VALIDATION
// ============================================================================

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Paramètres invalides',
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
// ROUTES STATISTIQUES
// ============================================================================

/**
 * 📊 STATISTIQUES GÉNÉRALES
 * GET /api/users/stats
 * 
 * Permissions: Admins uniquement
 * Response: { success, data: { users, patients, hospitals, etc. } }
 */
router.get('/stats',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  getStats
);

// ============================================================================
// ROUTES UTILISATEURS
// ============================================================================

/**
 * 👥 LISTER LES UTILISATEURS
 * GET /api/users
 * 
 * Query: ?page=1&limit=10&search=nom&roleFilter=patient
 * Permissions: Admins uniquement
 * Response: { success, data: { users, pagination } }
 */
router.get('/',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'lab_admin']),
  paginationValidation,
  handleValidationErrors,
  getUsers
);

/**
 * 👤 LISTER LES PATIENTS DU LABORATOIRE
 * GET /api/users/patients/lab
 * 
 * Query: ?page=1&limit=10&search=nom
 * Permissions: Staff laboratoire uniquement
 * Response: { success, data: { patients, pagination } }
 */
router.get('/patients/lab',
  authenticateToken,
  requireRoles(['lab_admin', 'lab_staff', 'super_admin']),
  paginationValidation,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role, laboratory_id } = req.user;
      const { page = 1, limit = 10, search } = req.query;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const take = parseInt(limit);

      let whereClause = { role: 'patient' };

      // Pour le staff laboratoire, on peut voir tous les patients
      // Dans une vraie implémentation, on pourrait filtrer par laboratoire
      if (role !== 'super_admin' && laboratory_id) {
        // Ici on pourrait ajouter une logique pour filtrer les patients
        // selon le laboratoire, mais pour l'instant on montre tous les patients
      }

      if (search) {
        whereClause.OR = [
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            created_at: true,
            patient: {
              select: {
                id: true,
                date_of_birth: true,
                gender: true,
                phone: true
              }
            }
          },
          skip,
          take,
          orderBy: { created_at: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      // Transformer les données pour le frontend
      const patients = users.map(user => ({
        id: user.patient?.id || user.id,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || user.patient?.phone
        },
        date_of_birth: user.patient?.date_of_birth,
        gender: user.patient?.gender,
        phone_patient: user.patient?.phone,
        created_at: user.created_at
      }));

      res.json({
        success: true,
        data: {
          patients,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération patients laboratoire:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 🔍 RECHERCHER DES PATIENTS
 * GET /api/users/patients/search
 * 
 * Query: ?q=nom_patient
 * Permissions: Staff médical et admins
 * Response: { success, data: { patients } }
 */
router.get('/patients/search',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'hospital_staff', 'lab_admin', 'lab_staff']),
  query('q').isLength({ min: 2, max: 50 }).withMessage('La recherche doit contenir entre 2 et 50 caractères'),
  handleValidationErrors,
  async (req, res) => {
    try {
      const { role, hospital_id, laboratory_id } = req.user;
      const { q } = req.query;

      let whereClause = {
        role: 'patient',
        OR: [
          { first_name: { contains: q } },
          { last_name: { contains: q } },
          { email: { contains: q } }
        ]
      };

      // Filtrer selon le rôle et l'établissement
      if (role === 'hospital_staff' || role === 'hospital_admin') {
        // Pour l'instant, on montre tous les patients
        // Dans une vraie implémentation, on filtrerait par hôpital
      } else if (role === 'lab_staff' || role === 'lab_admin') {
        // Pour l'instant, on montre tous les patients
        // Dans une vraie implémentation, on filtrerait par laboratoire
      }

      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          patient: {
            select: {
              id: true,
              date_of_birth: true,
              gender: true,
              phone: true
            }
          }
        },
        take: 20, // Limiter à 20 résultats pour la recherche
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ]
      });

      // Transformer les données pour le frontend
      const patients = users.map(user => ({
        id: user.patient?.id || user.id,
        user: {
          id: user.id,
          first_name: user.first_name,
          last_name: user.last_name,
          email: user.email,
          phone: user.phone || user.patient?.phone
        },
        date_of_birth: user.patient?.date_of_birth,
        gender: user.patient?.gender,
        phone_patient: user.patient?.phone
      }));

      res.json({
        success: true,
        data: { patients }
      });

    } catch (error) {
      console.error('Erreur recherche patients:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 👤 LISTER LES PATIENTS
 * GET /api/users/patients
 * 
 * Query: ?page=1&limit=10&search=nom
 * Permissions: Staff médical et admins
 * Response: { success, data: { patients, pagination } }
 */
router.get('/patients',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'hospital_staff', 'lab_admin', 'lab_staff']),
  paginationValidation,
  handleValidationErrors,
  getPatients
);

// ============================================================================
// ROUTES ÉTABLISSEMENTS
// ============================================================================

/**
 * 🏥 LISTER LES HÔPITAUX
 * GET /api/users/hospitals
 * 
 * Query: ?search=nom&city=Paris&active=true
 * Permissions: Tous les utilisateurs connectés
 * Response: { success, data: { hospitals } }
 */
router.get('/hospitals',
  authenticateToken,
  query('search').optional().isLength({ min: 2, max: 50 }),
  query('city').optional().isLength({ min: 2, max: 50 }),
  query('active').optional().isBoolean(),
  handleValidationErrors,
  getHospitals
);

/**
 * 🧪 LISTER LES LABORATOIRES
 * GET /api/users/laboratories
 * 
 * Query: ?search=nom&city=Lyon&active=true
 * Permissions: Tous les utilisateurs connectés
 * Response: { success, data: { laboratories } }
 */
router.get('/laboratories',
  authenticateToken,
  query('search').optional().isLength({ min: 2, max: 50 }),
  query('city').optional().isLength({ min: 2, max: 50 }),
  query('active').optional().isBoolean(),
  handleValidationErrors,
  getLaboratories
);

/**
 * 🗺️ RECHERCHE PAR PROXIMITÉ
 * GET /api/users/nearby
 * 
 * Query: ?lat=48.8566&lng=2.3522&radius=10&type=both
 * Permissions: Tous les utilisateurs connectés
 * Response: { success, data: { hospitals?, laboratories? } }
 */
router.get('/nearby',
  authenticateToken,
  proximityValidation,
  handleValidationErrors,
  getNearbyEstablishments
);

// ============================================================================
// ROUTES SPÉCIFIQUES PAR ÉTABLISSEMENT
// ============================================================================

/**
 * 🏥 UTILISATEURS D'UN HÔPITAL SPÉCIFIQUE
 * GET /api/users/hospitals/:hospitalId/users
 * 
 * Permissions: Super admin ou admin/staff de l'hôpital
 */
router.get('/hospitals/:hospitalId/users',
  authenticateToken,
  requireRoles(['super_admin', 'hospital_admin', 'hospital_staff']),
  requireHospitalAccess,
  paginationValidation,
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
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            role: true,
            is_active: true,
            last_seen: true,
            created_at: true
          },
          skip,
          take,
          orderBy: { created_at: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération utilisateurs hôpital:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
);

/**
 * 🧪 UTILISATEURS D'UN LABORATOIRE SPÉCIFIQUE
 * GET /api/users/laboratories/:laboratoryId/users
 * 
 * Permissions: Super admin ou admin/staff du laboratoire
 */
router.get('/laboratories/:laboratoryId/users',
  authenticateToken,
  requireRoles(['super_admin', 'lab_admin', 'lab_staff']),
  requireLaboratoryAccess,
  paginationValidation,
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
          { first_name: { contains: search } },
          { last_name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where: whereClause,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            role: true,
            is_active: true,
            last_seen: true,
            created_at: true
          },
          skip,
          take,
          orderBy: { created_at: 'desc' }
        }),
        prisma.user.count({ where: whereClause })
      ]);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });

    } catch (error) {
      console.error('Erreur récupération utilisateurs laboratoire:', error);
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
      'GET /api/users/stats',
      'GET /api/users',
      'GET /api/users/patients',
      'GET /api/users/patients/lab',
      'GET /api/users/patients/search',
      'GET /api/users/hospitals',
      'GET /api/users/laboratories',
      'GET /api/users/nearby',
      'GET /api/users/hospitals/:id/users',
      'GET /api/users/laboratories/:id/users'
    ]
  });
});

module.exports = router;