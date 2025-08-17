// 🔐 CONTRÔLEUR D'AUTHENTIFICATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion unifiée de l'authentification pour tous les rôles

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION JWT
// ============================================================================

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Générer un token JWT
 */
function generateToken(user) {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    hospital_id: user.hospital_id,
    laboratory_id: user.laboratory_id
  };

  return jwt.sign(payload, JWT_SECRET, { 
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'labresult-mvp',
    audience: 'labresult-users'
  });
}

/**
 * Obtenir les informations complètes de l'utilisateur
 */
async function getUserWithProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      patient: true,
      hospital: {
        select: {
          id: true,
          name: true,
          city: true,
          phone: true,
          email: true
        }
      },
      laboratory: {
        select: {
          id: true,
          name: true,
          city: true,
          phone: true,
          email: true
        }
      }
    }
  });

  if (!user) return null;

  // Nettoyer les données sensibles
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// ============================================================================
// CONTRÔLEURS
// ============================================================================

/**
 * 🔑 CONNEXION UTILISATEUR
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des données
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      });
    }

    // Recherche de l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        },
        laboratory: {
          select: { id: true, name: true, city: true }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérification du compte actif
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé. Contactez l\'administrateur.'
      });
    }

    // Vérification du mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Mise à jour de la dernière connexion
    await prisma.user.update({
      where: { id: user.id },
      data: { last_seen: new Date() }
    });

    // Génération du token
    const token = generateToken(user);

    // Préparation de la réponse
    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: userResponse,
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📝 INSCRIPTION PATIENT
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { 
      email, 
      password, 
      first_name, 
      last_name, 
      phone,
      date_of_birth,
      gender 
    } = req.body;

    // Validation des données obligatoires
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom et nom requis'
      });
    }

    // Validation du format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation du mot de passe
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le mot de passe doit contenir au moins 6 caractères'
      });
    }

    // Vérification de l'unicité de l'email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un compte avec cet email existe déjà'
      });
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'utilisateur et du profil patient en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          first_name,
          last_name,
          phone,
          role: 'patient',
          is_active: true
        }
      });

      // Créer le profil patient
      const patientProfile = await tx.patient.create({
        data: {
          user_id: newUser.id,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender: gender || null,
          phone
        }
      });

      return { user: newUser, patient: patientProfile };
    });

    // Génération du token
    const token = generateToken(result.user);

    // Préparation de la réponse
    const { password_hash, ...userResponse } = result.user;

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: {
          ...userResponse,
          patient: result.patient
        },
        token,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👤 PROFIL UTILISATEUR
 * GET /api/auth/profile
 */
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userProfile = await getUserWithProfile(userId);

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        user: userProfile
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🔄 RAFRAÎCHIR LE TOKEN
 * POST /api/auth/refresh
 */
const refreshToken = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    const newToken = generateToken(user);

    res.json({
      success: true,
      message: 'Token rafraîchi',
      data: {
        token: newToken,
        expiresIn: JWT_EXPIRES_IN
      }
    });

  } catch (error) {
    console.error('Erreur lors du rafraîchissement du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🚪 DÉCONNEXION
 * POST /api/auth/logout
 */
const logout = async (req, res) => {
  try {
    // Dans une implémentation complète, on pourrait blacklister le token
    // Pour l'instant, on se contente de confirmer la déconnexion
    
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });

  } catch (error) {
    console.error('Erreur lors de la déconnexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

/**
 * 🏥 RÉCUPÉRER LE PROFIL PATIENT
 * GET /api/auth/patient-profile
 */
const getPatientProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    // Seuls les patients peuvent utiliser cette route
    if (role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Cette route est réservée aux patients'
      });
    }

    // Récupérer le profil patient
    const patient = await prisma.patient.findFirst({
      where: { user_id: userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            role: true,
            created_at: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Profil patient non trouvé'
      });
    }

    res.json({
      success: true,
      data: {
        patient: {
          id: patient.id,
          user_id: patient.user_id,
          date_of_birth: patient.date_of_birth,
          gender: patient.gender,
          address: patient.address,
          emergency_contact: patient.emergency_contact,
          user: patient.user
        }
      }
    });

  } catch (error) {
    console.error('Erreur lors de la récupération du profil patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

module.exports = {
  login,
  register,
  getProfile,
  getPatientProfile,
  refreshToken,
  logout
};