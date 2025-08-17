// 👑 CONTRÔLEUR D'ADMINISTRATION MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion CRUD pour Super Admin, Admin Hôpitaux et Admin Laboratoires

const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// GESTION DES UTILISATEURS - SUPER ADMIN
// ============================================================================

/**
 * 👥 CRÉER UN UTILISATEUR (Super Admin uniquement)
 * POST /api/admin/users
 */
const createUser = async (req, res) => {
  try {
    const { role: adminRole } = req.user;
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      role,
      hospital_id,
      laboratory_id,
      // Données patient si applicable
      date_of_birth,
      gender
    } = req.body;

    // Seul le super admin peut créer tous types d'utilisateurs
    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut créer des utilisateurs'
      });
    }

    // Validation des données obligatoires
    if (!email || !password || !first_name || !last_name || !role) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom, nom et rôle requis'
      });
    }

    // Vérifier l'unicité de l'email
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Validation des références d'établissement
    if ((role === 'hospital_admin' || role === 'hospital_staff') && !hospital_id) {
      return res.status(400).json({
        success: false,
        message: 'ID hôpital requis pour ce rôle'
      });
    }

    if ((role === 'lab_admin' || role === 'lab_staff') && !laboratory_id) {
      return res.status(400).json({
        success: false,
        message: 'ID laboratoire requis pour ce rôle'
      });
    }

    // Vérifier que l'établissement existe
    if (hospital_id) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: parseInt(hospital_id) }
      });
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hôpital non trouvé'
        });
      }
    }

    if (laboratory_id) {
      const laboratory = await prisma.laboratory.findUnique({
        where: { id: parseInt(laboratory_id) }
      });
      if (!laboratory) {
        return res.status(404).json({
          success: false,
          message: 'Laboratoire non trouvé'
        });
      }
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer l'utilisateur
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          first_name,
          last_name,
          phone,
          role,
          hospital_id: hospital_id ? parseInt(hospital_id) : null,
          laboratory_id: laboratory_id ? parseInt(laboratory_id) : null,
          is_active: true
        }
      });

      // Si c'est un patient, créer le profil patient
      if (role === 'patient') {
        await tx.patient.create({
          data: {
            user_id: newUser.id,
            date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
            gender: gender || null,
            phone
          }
        });
      }

      return newUser;
    });

    // Récupérer l'utilisateur avec ses relations
    const userWithRelations = await prisma.user.findUnique({
      where: { id: result.id },
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        },
        laboratory: {
          select: { id: true, name: true, city: true }
        },
        patient: true
      }
    });

    const { password_hash, ...userResponse } = userWithRelations;

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ✏️ MODIFIER UN UTILISATEUR
 * PUT /api/admin/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const userId = parseInt(req.params.id);
    const {
      first_name,
      last_name,
      phone,
      role,
      hospital_id,
      laboratory_id,
      is_active,
      // Données patient
      date_of_birth,
      gender
    } = req.body;

    // Récupérer l'utilisateur existant
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification des permissions
    if (adminRole === 'super_admin') {
      // Super admin peut tout modifier
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital ne peut modifier que les utilisateurs de son hôpital
      if (existingUser.hospital_id !== adminHospitalId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que les utilisateurs de votre hôpital'
        });
      }
      // Ne peut pas changer le rôle vers super_admin ou admin d'autres établissements
      if (role && !['hospital_staff', 'patient'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer que du staff hospitalier ou des patients'
        });
      }
    } else if (adminRole === 'lab_admin') {
      // Admin labo ne peut modifier que les utilisateurs de son laboratoire
      if (existingUser.laboratory_id !== adminLabId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez modifier que les utilisateurs de votre laboratoire'
        });
      }
      // Ne peut pas changer le rôle vers super_admin ou admin d'autres établissements
      if (role && !['lab_staff', 'patient'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez créer que du staff de laboratoire ou des patients'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Préparer les données de mise à jour
    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Seul le super admin peut changer les rôles et établissements
    if (adminRole === 'super_admin') {
      if (role !== undefined) updateData.role = role;
      if (hospital_id !== undefined) updateData.hospital_id = hospital_id ? parseInt(hospital_id) : null;
      if (laboratory_id !== undefined) updateData.laboratory_id = laboratory_id ? parseInt(laboratory_id) : null;
    }

    // Mise à jour en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: updateData
      });

      // Si c'est un patient, mettre à jour le profil patient
      if (existingUser.role === 'patient' || (role && role === 'patient')) {
        const patientData = {};
        if (date_of_birth !== undefined) patientData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
        if (gender !== undefined) patientData.gender = gender;
        if (phone !== undefined) patientData.phone = phone;

        if (Object.keys(patientData).length > 0) {
          if (existingUser.patient) {
            await tx.patient.update({
              where: { user_id: userId },
              data: patientData
            });
          } else {
            await tx.patient.create({
              data: {
                user_id: userId,
                ...patientData
              }
            });
          }
        }
      }

      return updatedUser;
    });

    // Récupérer l'utilisateur mis à jour avec ses relations
    const userWithRelations = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospital: {
          select: { id: true, name: true, city: true }
        },
        laboratory: {
          select: { id: true, name: true, city: true }
        },
        patient: true
      }
    });

    const { password_hash, ...userResponse } = userWithRelations;

    res.json({
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Erreur mise à jour utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🗑️ SUPPRIMER UN UTILISATEUR
 * DELETE /api/admin/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const userId = parseInt(req.params.id);

    // Récupérer l'utilisateur existant
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification des permissions
    if (adminRole === 'super_admin') {
      // Super admin peut tout supprimer
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital ne peut supprimer que les utilisateurs de son hôpital (sauf autres admins)
      if (existingUser.hospital_id !== adminHospitalId || existingUser.role === 'hospital_admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez supprimer que le staff de votre hôpital'
        });
      }
    } else if (adminRole === 'lab_admin') {
      // Admin labo ne peut supprimer que les utilisateurs de son laboratoire (sauf autres admins)
      if (existingUser.laboratory_id !== adminLabId || existingUser.role === 'lab_admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez supprimer que le staff de votre laboratoire'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Supprimer l'utilisateur (cascade automatique pour patient)
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({
      success: true,
      message: 'Utilisateur supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👤 OBTENIR UN UTILISATEUR SPÉCIFIQUE
 * GET /api/admin/users/:id
 */
const getUser = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const userId = parseInt(req.params.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, phone: true, email: true }
        },
        laboratory: {
          select: { id: true, name: true, city: true, phone: true, email: true }
        },
        patient: true
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification des permissions
    if (adminRole === 'super_admin') {
      // Super admin peut voir tout
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital ne peut voir que les utilisateurs de son hôpital
      if (user.hospital_id !== adminHospitalId && user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet utilisateur'
        });
      }
    } else if (adminRole === 'lab_admin') {
      // Admin labo ne peut voir que les utilisateurs de son laboratoire
      if (user.laboratory_id !== adminLabId && user.role !== 'patient') {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé à cet utilisateur'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const { password_hash, ...userResponse } = user;

    res.json({
      success: true,
      data: { user: userResponse }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES ÉTABLISSEMENTS - SUPER ADMIN
// ============================================================================

/**
 * 🏥 CRÉER UN HÔPITAL (Super Admin uniquement)
 * POST /api/admin/hospitals
 */
const createHospital = async (req, res) => {
  try {
    const { role: adminRole } = req.user;

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut créer des hôpitaux'
      });
    }

    const {
      name,
      address,
      city,
      phone,
      email,
      latitude,
      longitude
    } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Nom, adresse et ville requis'
      });
    }

    const hospital = await prisma.hospital.create({
      data: {
        name,
        address,
        city,
        phone,
        email: email ? email.toLowerCase() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        is_active: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Hôpital créé avec succès',
      data: { hospital }
    });

  } catch (error) {
    console.error('Erreur création hôpital:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🧪 CRÉER UN LABORATOIRE (Super Admin uniquement)
 * POST /api/admin/laboratories
 */
const createLaboratory = async (req, res) => {
  try {
    const { role: adminRole } = req.user;

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut créer des laboratoires'
      });
    }

    const {
      name,
      address,
      city,
      phone,
      email,
      latitude,
      longitude
    } = req.body;

    if (!name || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Nom, adresse et ville requis'
      });
    }

    const laboratory = await prisma.laboratory.create({
      data: {
        name,
        address,
        city,
        phone,
        email: email ? email.toLowerCase() : null,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        is_active: true
      }
    });

    res.status(201).json({
      success: true,
      message: 'Laboratoire créé avec succès',
      data: { laboratory }
    });

  } catch (error) {
    console.error('Erreur création laboratoire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES MOTS DE PASSE
// ============================================================================

/**
 * 🔑 RÉINITIALISER LE MOT DE PASSE D'UN UTILISATEUR
 * POST /api/admin/users/:id/reset-password
 */
const resetUserPassword = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const userId = parseInt(req.params.id);
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Nouveau mot de passe requis (minimum 6 caractères)'
      });
    }

    // Récupérer l'utilisateur existant
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérification des permissions
    if (adminRole === 'super_admin') {
      // Super admin peut réinitialiser tous les mots de passe
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital ne peut réinitialiser que les mots de passe de son staff
      if (existingUser.hospital_id !== adminHospitalId || existingUser.role === 'hospital_admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez réinitialiser que les mots de passe de votre staff'
        });
      }
    } else if (adminRole === 'lab_admin') {
      // Admin labo ne peut réinitialiser que les mots de passe de son staff
      if (existingUser.laboratory_id !== adminLabId || existingUser.role === 'lab_admin') {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez réinitialiser que les mots de passe de votre staff'
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Hacher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(new_password, 12);

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: hashedPassword }
    });

    res.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur réinitialisation mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER LES UTILISATEURS AVEC FILTRES
 * GET /api/admin/users
 */
const getUsers = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      role, 
      is_active, 
      hospital_id, 
      laboratory_id 
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};

    // Filtres de permissions selon le rôle admin
    if (adminRole === 'super_admin') {
      // Super admin peut voir tous les utilisateurs
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital ne peut voir que les utilisateurs de son hôpital
      whereClause.hospital_id = adminHospitalId;
    } else if (adminRole === 'lab_admin') {
      // Admin labo ne peut voir que les utilisateurs de son laboratoire
      whereClause.laboratory_id = adminLabId;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Filtres additionnels (seulement pour super admin)
    if (adminRole === 'super_admin') {
      if (hospital_id) whereClause.hospital_id = parseInt(hospital_id);
      if (laboratory_id) whereClause.laboratory_id = parseInt(laboratory_id);
    }

    if (role) whereClause.role = role;
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    // Recherche textuelle
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        include: {
          hospital: {
            select: { id: true, name: true, city: true }
          },
          laboratory: {
            select: { id: true, name: true, city: true }
          },
          patient: {
            select: { id: true, date_of_birth: true, gender: true }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({ where: whereClause })
    ]);

    // Masquer les mots de passe
    const usersResponse = users.map(user => {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    res.json({
      success: true,
      data: {
        users: usersResponse,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🏥 LISTER LES HÔPITAUX
 * GET /api/admin/hospitals
 */
const getHospitals = async (req, res) => {
  try {
    const { role: adminRole } = req.user;
    const { page = 1, limit = 10, search, is_active } = req.query;

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut lister les hôpitaux'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [hospitals, total] = await Promise.all([
      prisma.hospital.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              users: true,
              documents: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.hospital.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        hospitals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération hôpitaux:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🧪 LISTER LES LABORATOIRES
 * GET /api/admin/laboratories
 */
const getLaboratories = async (req, res) => {
  try {
    const { role: adminRole } = req.user;
    const { page = 1, limit = 10, search, is_active } = req.query;

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut lister les laboratoires'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};
    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [laboratories, total] = await Promise.all([
      prisma.laboratory.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              users: true,
              documents: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.laboratory.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      data: {
        laboratories,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération laboratoires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ✏️ MODIFIER UN HÔPITAL
 * PUT /api/admin/hospitals/:id
 */
const updateHospital = async (req, res) => {
  try {
    const { role: adminRole } = req.user;
    const hospitalId = parseInt(req.params.id);

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut modifier les hôpitaux'
      });
    }

    const {
      name,
      address,
      city,
      phone,
      email,
      latitude,
      longitude,
      is_active
    } = req.body;

    const existingHospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!existingHospital) {
      return res.status(404).json({
        success: false,
        message: 'Hôpital non trouvé'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedHospital = await prisma.hospital.update({
      where: { id: hospitalId },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            documents: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Hôpital mis à jour avec succès',
      data: { hospital: updatedHospital }
    });

  } catch (error) {
    console.error('Erreur mise à jour hôpital:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ✏️ MODIFIER UN LABORATOIRE
 * PUT /api/admin/laboratories/:id
 */
const updateLaboratory = async (req, res) => {
  try {
    const { role: adminRole } = req.user;
    const laboratoryId = parseInt(req.params.id);

    if (adminRole !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Seul le super admin peut modifier les laboratoires'
      });
    }

    const {
      name,
      address,
      city,
      phone,
      email,
      latitude,
      longitude,
      is_active
    } = req.body;

    const existingLaboratory = await prisma.laboratory.findUnique({
      where: { id: laboratoryId }
    });

    if (!existingLaboratory) {
      return res.status(404).json({
        success: false,
        message: 'Laboratoire non trouvé'
      });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email ? email.toLowerCase() : null;
    if (latitude !== undefined) updateData.latitude = latitude ? parseFloat(latitude) : null;
    if (longitude !== undefined) updateData.longitude = longitude ? parseFloat(longitude) : null;
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedLaboratory = await prisma.laboratory.update({
      where: { id: laboratoryId },
      data: updateData,
      include: {
        _count: {
          select: {
            users: true,
            documents: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Laboratoire mis à jour avec succès',
      data: { laboratory: updatedLaboratory }
    });

  } catch (error) {
    console.error('Erreur mise à jour laboratoire:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📊 TABLEAU DE BORD SUPER ADMIN
 * GET /api/admin/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;

    let stats = {};

    if (adminRole === 'super_admin') {
      // Statistiques globales pour super admin
      const [
        totalUsers,
        activeUsers,
        totalHospitals,
        activeHospitals,
        totalLaboratories,
        activeLaboratories,
        totalDocuments,
        recentDocuments,
        usersByRole
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { is_active: true } }),
        prisma.hospital.count(),
        prisma.hospital.count({ where: { is_active: true } }),
        prisma.laboratory.count(),
        prisma.laboratory.count({ where: { is_active: true } }),
        prisma.document.count(),
        prisma.document.count({
          where: {
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true }
        })
      ]);

      stats = {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {})
        },
        establishments: {
          hospitals: {
            total: totalHospitals,
            active: activeHospitals,
            inactive: totalHospitals - activeHospitals
          },
          laboratories: {
            total: totalLaboratories,
            active: activeLaboratories,
            inactive: totalLaboratories - activeLaboratories
          }
        },
        documents: {
          total: totalDocuments,
          recent: recentDocuments
        }
      };

    } else if (adminRole === 'hospital_admin') {
      // Statistiques pour admin hôpital
      const [
        totalStaff,
        activeStaff,
        totalDocuments,
        recentDocuments,
        staffByRole,
        hospitalInfo
      ] = await Promise.all([
        prisma.user.count({ where: { hospital_id: adminHospitalId } }),
        prisma.user.count({ where: { hospital_id: adminHospitalId, is_active: true } }),
        prisma.document.count({ where: { hospital_id: adminHospitalId } }),
        prisma.document.count({
          where: {
            hospital_id: adminHospitalId,
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { hospital_id: adminHospitalId },
          _count: { role: true }
        }),
        prisma.hospital.findUnique({
          where: { id: adminHospitalId },
          select: { id: true, name: true, city: true }
        })
      ]);

      stats = {
        hospital: hospitalInfo,
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

    } else if (adminRole === 'lab_admin') {
      // Statistiques pour admin laboratoire
      const [
        totalStaff,
        activeStaff,
        totalDocuments,
        recentDocuments,
        staffByRole,
        laboratoryInfo
      ] = await Promise.all([
        prisma.user.count({ where: { laboratory_id: adminLabId } }),
        prisma.user.count({ where: { laboratory_id: adminLabId, is_active: true } }),
        prisma.document.count({ where: { laboratory_id: adminLabId } }),
        prisma.document.count({
          where: {
            laboratory_id: adminLabId,
            created_at: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            }
          }
        }),
        prisma.user.groupBy({
          by: ['role'],
          where: { laboratory_id: adminLabId },
          _count: { role: true }
        }),
        prisma.laboratory.findUnique({
          where: { id: adminLabId },
          select: { id: true, name: true, city: true }
        })
      ]);

      stats = {
        laboratory: laboratoryInfo,
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

    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur tableau de bord:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
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
};