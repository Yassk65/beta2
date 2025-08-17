// 🛡️ MIDDLEWARE D'AUTHENTIFICATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Vérification des tokens JWT et gestion des permissions

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// ============================================================================
// MIDDLEWARE D'AUTHENTIFICATION
// ============================================================================

/**
 * 🔐 Vérifier le token JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérification du token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Vérification que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        hospital_id: true,
        laboratory_id: true,
        is_active: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré',
        code: 'TOKEN_EXPIRED'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide',
        code: 'TOKEN_INVALID'
      });
    }

    console.error('Erreur d\'authentification:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// MIDDLEWARE DE VÉRIFICATION DES RÔLES
// ============================================================================

/**
 * 👑 Vérifier les rôles autorisés
 * @param {string[]} allowedRoles - Rôles autorisés
 */
const requireRoles = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * 🏥 Vérifier l'accès à un hôpital spécifique
 */
const requireHospitalAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const { role, hospital_id } = req.user;

  // Super admin a accès à tout
  if (role === 'super_admin') {
    return next();
  }

  // Vérifier que l'utilisateur appartient à un hôpital
  if (!hospital_id && (role === 'hospital_admin' || role === 'hospital_staff')) {
    return res.status(403).json({
      success: false,
      message: 'Accès hôpital requis'
    });
  }

  // Vérifier l'accès à l'hôpital spécifique si fourni dans les paramètres
  const requestedHospitalId = parseInt(req.params.hospitalId || req.body.hospital_id);
  if (requestedHospitalId && hospital_id !== requestedHospitalId) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à cet hôpital'
    });
  }

  next();
};

/**
 * 🧪 Vérifier l'accès à un laboratoire spécifique
 */
const requireLaboratoryAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }

  const { role, laboratory_id } = req.user;

  // Super admin a accès à tout
  if (role === 'super_admin') {
    return next();
  }

  // Vérifier que l'utilisateur appartient à un laboratoire
  if (!laboratory_id && (role === 'lab_admin' || role === 'lab_staff')) {
    return res.status(403).json({
      success: false,
      message: 'Accès laboratoire requis'
    });
  }

  // Vérifier l'accès au laboratoire spécifique si fourni dans les paramètres
  const requestedLabId = parseInt(req.params.laboratoryId || req.body.laboratory_id);
  if (requestedLabId && laboratory_id !== requestedLabId) {
    return res.status(403).json({
      success: false,
      message: 'Accès non autorisé à ce laboratoire'
    });
  }

  next();
};

/**
 * 👤 Vérifier l'accès aux données d'un patient
 */
const requirePatientAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentification requise'
      });
    }

    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const requestedPatientId = parseInt(req.params.patientId || req.body.patient_id);

    // Super admin a accès à tout
    if (role === 'super_admin') {
      return next();
    }

    // Patient ne peut accéder qu'à ses propres données
    if (role === 'patient') {
      const patient = await prisma.patient.findFirst({
        where: { user_id: userId }
      });

      if (!patient || patient.id !== requestedPatientId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à ces données patient'
        });
      }
      return next();
    }

    // Staff hospitalier/laboratoire : vérifier l'accès via les documents ou relations
    if (role === 'hospital_staff' || role === 'hospital_admin') {
      // Vérifier si le patient a des documents liés à cet hôpital
      const hasAccess = await prisma.document.findFirst({
        where: {
          patient_id: requestedPatientId,
          hospital_id: hospital_id
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Aucun accès autorisé à ce patient'
        });
      }
    }

    if (role === 'lab_staff' || role === 'lab_admin') {
      // Vérifier si le patient a des documents liés à ce laboratoire
      const hasAccess = await prisma.document.findFirst({
        where: {
          patient_id: requestedPatientId,
          laboratory_id: laboratory_id
        }
      });

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Aucun accès autorisé à ce patient'
        });
      }
    }

    next();

  } catch (error) {
    console.error('Erreur vérification accès patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// MIDDLEWARE OPTIONNEL
// ============================================================================

/**
 * 🔓 Authentification optionnelle (pour les routes publiques avec info utilisateur)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        hospital_id: true,
        laboratory_id: true,
        is_active: true
      }
    });

    req.user = user && user.is_active ? user : null;
    next();

  } catch (error) {
    // En cas d'erreur, continuer sans utilisateur
    req.user = null;
    next();
  }
};

/**
 * 📄 Authentification pour documents (accepte token en header ou paramètre)
 */
const authenticateDocumentAccess = async (req, res, next) => {
  try {
    // Essayer d'abord le header Authorization
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.split(' ')[1];
    }

    // Si pas de header, essayer le paramètre de requête
    if (!token && req.query.token) {
      token = req.query.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    // Vérification du token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Vérification que l'utilisateur existe toujours
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        hospital_id: true,
        laboratory_id: true,
        is_active: true
      }
    });

    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non autorisé'
      });
    }

    // Ajouter les informations utilisateur à la requête
    req.user = user;
    next();

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré'
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      });
    }

    console.error('Erreur d\'authentification document:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  authenticateToken,
  authenticateDocumentAccess,
  requireRoles,
  requireHospitalAccess,
  requireLaboratoryAccess,
  requirePatientAccess,
  optionalAuth
};