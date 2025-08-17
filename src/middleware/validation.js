// ✅ MIDDLEWARE DE VALIDATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Validations communes pour l'API

const { body, param, query, validationResult } = require('express-validator');

// ============================================================================
// VALIDATEURS COMMUNS
// ============================================================================

/**
 * 📧 Validation email
 */
const emailValidation = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Email valide requis');

/**
 * 🔒 Validation mot de passe
 */
const passwordValidation = body('password')
  .isLength({ min: 6 })
  .withMessage('Le mot de passe doit contenir au moins 6 caractères')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  .withMessage('Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre');

/**
 * 👤 Validation nom/prénom
 */
const nameValidation = (field) => body(field)
  .trim()
  .isLength({ min: 2, max: 50 })
  .withMessage(`Le ${field} doit contenir entre 2 et 50 caractères`)
  .matches(/^[a-zA-ZÀ-ÿ\s-']+$/)
  .withMessage(`Le ${field} ne peut contenir que des lettres, espaces, tirets et apostrophes`);

/**
 * 📱 Validation téléphone français
 */
const phoneValidation = body('phone')
  .optional()
  .matches(/^(?:\+33|0)[1-9](?:[0-9]{8})$/)
  .withMessage('Numéro de téléphone français invalide');

/**
 * 📅 Validation date de naissance
 */
const dateOfBirthValidation = body('date_of_birth')
  .optional()
  .isISO8601()
  .withMessage('Date de naissance invalide (format YYYY-MM-DD)')
  .custom((value) => {
    if (!value) return true;
    
    const birthDate = new Date(value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    if (age < 13 || age > 120) {
      throw new Error('L\'âge doit être compris entre 13 et 120 ans');
    }
    return true;
  });

/**
 * 🚻 Validation genre
 */
const genderValidation = body('gender')
  .optional()
  .isIn(['M', 'F', 'Other'])
  .withMessage('Genre invalide (M, F, ou Other)');

/**
 * 🔢 Validation ID numérique
 */
const idValidation = (paramName) => param(paramName)
  .isInt({ min: 1 })
  .withMessage(`${paramName} doit être un entier positif`);

/**
 * 📄 Validation pagination
 */
const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('La page doit être un entier positif'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('La limite doit être entre 1 et 100')
];

/**
 * 🔍 Validation recherche
 */
const searchValidation = query('search')
  .optional()
  .isLength({ min: 2, max: 50 })
  .withMessage('La recherche doit contenir entre 2 et 50 caractères')
  .trim();

/**
 * 🗺️ Validation coordonnées GPS
 */
const coordinatesValidation = [
  query('lat')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude invalide (-90 à 90)'),
  query('lng')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude invalide (-180 à 180)')
];

// ============================================================================
// VALIDATEURS COMPOSÉS
// ============================================================================

/**
 * 🔑 Validation connexion
 */
const loginValidation = [
  emailValidation,
  body('password')
    .isLength({ min: 1 })
    .withMessage('Mot de passe requis')
];

/**
 * 📝 Validation inscription
 */
const registerValidation = [
  emailValidation,
  passwordValidation,
  nameValidation('first_name'),
  nameValidation('last_name'),
  phoneValidation,
  dateOfBirthValidation,
  genderValidation
];

/**
 * 👤 Validation profil utilisateur
 */
const profileValidation = [
  nameValidation('first_name').optional(),
  nameValidation('last_name').optional(),
  phoneValidation,
  dateOfBirthValidation,
  genderValidation
];

/**
 * 🏥 Validation établissement
 */
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

// ============================================================================
// MIDDLEWARE DE GESTION DES ERREURS
// ============================================================================

/**
 * 🚨 Gestionnaire d'erreurs de validation
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: formattedErrors,
      count: formattedErrors.length
    });
  }
  
  next();
};

/**
 * 🔍 Validation conditionnelle
 */
const conditionalValidation = (condition, validations) => {
  return (req, res, next) => {
    if (condition(req)) {
      // Appliquer les validations
      const validationChain = Array.isArray(validations) ? validations : [validations];
      let index = 0;
      
      const runNext = () => {
        if (index >= validationChain.length) {
          return next();
        }
        
        const validation = validationChain[index++];
        validation(req, res, runNext);
      };
      
      runNext();
    } else {
      next();
    }
  };
};

/**
 * 🛡️ Sanitisation des données
 */
const sanitizeInput = (req, res, next) => {
  // Nettoyer les chaînes de caractères
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str.trim().replace(/\s+/g, ' '); // Supprimer les espaces multiples
  };

  // Sanitiser récursivement un objet
  const sanitizeObject = (obj) => {
    if (obj === null || obj === undefined) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitizeObject(value);
      }
      return sanitized;
    }
    
    return sanitizeString(obj);
  };

  // Appliquer la sanitisation
  req.body = sanitizeObject(req.body);
  req.query = sanitizeObject(req.query);
  req.params = sanitizeObject(req.params);
  
  next();
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Validateurs de base
  emailValidation,
  passwordValidation,
  nameValidation,
  phoneValidation,
  dateOfBirthValidation,
  genderValidation,
  idValidation,
  paginationValidation,
  searchValidation,
  coordinatesValidation,
  
  // Validateurs composés
  loginValidation,
  registerValidation,
  profileValidation,
  establishmentValidation,
  
  // Middleware
  handleValidationErrors,
  conditionalValidation,
  sanitizeInput
};