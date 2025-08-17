// 🏥 CONTRÔLEUR GESTION PATIENTS PAR ADMINS MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion spécialisée des patients pour admins hôpitaux et laboratoires

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================================================
// GESTION DES PATIENTS PAR LES ADMINS
// ============================================================================

/**
 * 👥 CRÉER UN PATIENT (Admin Hôpital/Labo)
 * POST /api/admin/patients
 */
const createPatient = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const {
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      // Associer à l'établissement de l'admin
      assign_to_hospital,
      assign_to_laboratory
    } = req.body;

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Seuls les admins peuvent créer des patients'
      });
    }

    // Validation des données obligatoires
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        message: 'Email, mot de passe, prénom et nom requis'
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

    // Déterminer l'établissement d'assignation
    let hospitalId = null;
    let laboratoryId = null;

    if (adminRole === 'super_admin') {
      // Super admin peut assigner à n'importe quel établissement
      hospitalId = assign_to_hospital ? parseInt(assign_to_hospital) : null;
      laboratoryId = assign_to_laboratory ? parseInt(assign_to_laboratory) : null;
    } else if (adminRole === 'hospital_admin') {
      // Admin hôpital assigne automatiquement à son hôpital
      hospitalId = adminHospitalId;
    } else if (adminRole === 'lab_admin') {
      // Admin labo assigne automatiquement à son laboratoire
      laboratoryId = adminLabId;
    }

    // Vérifier que les établissements existent
    if (hospitalId) {
      const hospital = await prisma.hospital.findUnique({
        where: { id: hospitalId }
      });
      if (!hospital) {
        return res.status(404).json({
          success: false,
          message: 'Hôpital non trouvé'
        });
      }
    }

    if (laboratoryId) {
      const laboratory = await prisma.laboratory.findUnique({
        where: { id: laboratoryId }
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
      // Créer l'utilisateur patient
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password_hash: hashedPassword,
          first_name,
          last_name,
          phone,
          role: 'patient',
          hospital_id: hospitalId,
          laboratory_id: laboratoryId,
          is_active: true
        }
      });

      // Créer le profil patient
      const newPatient = await tx.patient.create({
        data: {
          user_id: newUser.id,
          date_of_birth: date_of_birth ? new Date(date_of_birth) : null,
          gender: gender || null,
          phone
        }
      });

      return { user: newUser, patient: newPatient };
    });

    // Récupérer le patient avec ses relations
    const patientWithRelations = await prisma.user.findUnique({
      where: { id: result.user.id },
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

    const { password_hash, ...patientResponse } = patientWithRelations;

    res.status(201).json({
      success: true,
      message: 'Patient créé avec succès',
      data: { patient: patientResponse }
    });

  } catch (error) {
    console.error('Erreur création patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER LES PATIENTS D'UN ÉTABLISSEMENT
 * GET /api/admin/patients
 */
const getPatients = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      search, 
      is_active,
      gender,
      age_min,
      age_max
    } = req.query;

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = { role: 'patient' };

    // Filtres de permissions selon le rôle admin
    if (adminRole === 'hospital_admin') {
      whereClause.hospital_id = adminHospitalId;
    } else if (adminRole === 'lab_admin') {
      whereClause.laboratory_id = adminLabId;
    }
    // Super admin peut voir tous les patients

    if (is_active !== undefined) whereClause.is_active = is_active === 'true';

    // Recherche textuelle
    if (search) {
      whereClause.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtres sur le profil patient
    let patientWhere = {};
    if (gender) patientWhere.gender = gender;

    // Filtres d'âge (calculés côté base de données)
    if (age_min || age_max) {
      const now = new Date();
      if (age_max) {
        const minBirthDate = new Date(now.getFullYear() - parseInt(age_max) - 1, now.getMonth(), now.getDate());
        patientWhere.date_of_birth = { gte: minBirthDate };
      }
      if (age_min) {
        const maxBirthDate = new Date(now.getFullYear() - parseInt(age_min), now.getMonth(), now.getDate());
        if (patientWhere.date_of_birth) {
          patientWhere.date_of_birth.lte = maxBirthDate;
        } else {
          patientWhere.date_of_birth = { lte: maxBirthDate };
        }
      }
    }

    const [patients, total] = await Promise.all([
      prisma.user.findMany({
        where: {
          ...whereClause,
          patient: Object.keys(patientWhere).length > 0 ? patientWhere : undefined
        },
        include: {
          hospital: {
            select: { id: true, name: true, city: true }
          },
          laboratory: {
            select: { id: true, name: true, city: true }
          },
          patient: true,
          _count: {
            select: {
              uploaded_documents: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.user.count({
        where: {
          ...whereClause,
          patient: Object.keys(patientWhere).length > 0 ? patientWhere : undefined
        }
      })
    ]);

    // Masquer les mots de passe et calculer l'âge
    const patientsResponse = patients.map(patient => {
      const { password_hash, ...patientWithoutPassword } = patient;
      
      // Calculer l'âge si date de naissance disponible
      if (patient.patient?.date_of_birth) {
        const birthDate = new Date(patient.patient.date_of_birth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        patientWithoutPassword.patient.age = age;
      }

      return patientWithoutPassword;
    });

    res.json({
      success: true,
      data: {
        patients: patientsResponse,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération patients:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👤 OBTENIR UN PATIENT SPÉCIFIQUE
 * GET /api/admin/patients/:id
 */
const getPatient = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const patientId = parseInt(req.params.id);

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const patient = await prisma.user.findUnique({
      where: { id: patientId, role: 'patient' },
      include: {
        hospital: {
          select: { id: true, name: true, city: true, phone: true, email: true }
        },
        laboratory: {
          select: { id: true, name: true, city: true, phone: true, email: true }
        },
        patient: true,
        uploaded_documents: {
          select: {
            id: true,
            filename: true,
            document_type: true,
            created_at: true,
            file_size: true
          },
          orderBy: { created_at: 'desc' },
          take: 5 // Derniers 5 documents
        },
        _count: {
          select: {
            uploaded_documents: true
          }
        }
      }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérification des permissions d'accès
    if (adminRole === 'hospital_admin' && patient.hospital_id !== adminHospitalId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce patient'
      });
    }

    if (adminRole === 'lab_admin' && patient.laboratory_id !== adminLabId) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce patient'
      });
    }

    const { password_hash, ...patientResponse } = patient;

    // Calculer l'âge si date de naissance disponible
    if (patient.patient?.date_of_birth) {
      const birthDate = new Date(patient.patient.date_of_birth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      patientResponse.patient.age = age;
    }

    res.json({
      success: true,
      data: { patient: patientResponse }
    });

  } catch (error) {
    console.error('Erreur récupération patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ✏️ MODIFIER UN PATIENT
 * PUT /api/admin/patients/:id
 */
const updatePatient = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const patientId = parseInt(req.params.id);
    const {
      first_name,
      last_name,
      phone,
      is_active,
      date_of_birth,
      gender,
      // Réassignation d'établissement (super admin seulement)
      hospital_id,
      laboratory_id
    } = req.body;

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Récupérer le patient existant
    const existingPatient = await prisma.user.findUnique({
      where: { id: patientId, role: 'patient' },
      include: { patient: true }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérification des permissions d'accès
    if (adminRole === 'hospital_admin' && existingPatient.hospital_id !== adminHospitalId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que les patients de votre hôpital'
      });
    }

    if (adminRole === 'lab_admin' && existingPatient.laboratory_id !== adminLabId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez modifier que les patients de votre laboratoire'
      });
    }

    // Préparer les données de mise à jour
    const userUpdateData = {};
    if (first_name !== undefined) userUpdateData.first_name = first_name;
    if (last_name !== undefined) userUpdateData.last_name = last_name;
    if (phone !== undefined) userUpdateData.phone = phone;
    if (is_active !== undefined) userUpdateData.is_active = is_active;

    // Seul le super admin peut réassigner les établissements
    if (adminRole === 'super_admin') {
      if (hospital_id !== undefined) userUpdateData.hospital_id = hospital_id ? parseInt(hospital_id) : null;
      if (laboratory_id !== undefined) userUpdateData.laboratory_id = laboratory_id ? parseInt(laboratory_id) : null;
    }

    const patientUpdateData = {};
    if (date_of_birth !== undefined) patientUpdateData.date_of_birth = date_of_birth ? new Date(date_of_birth) : null;
    if (gender !== undefined) patientUpdateData.gender = gender;
    if (phone !== undefined) patientUpdateData.phone = phone;

    // Mise à jour en transaction
    await prisma.$transaction(async (tx) => {
      // Mettre à jour l'utilisateur
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: patientId },
          data: userUpdateData
        });
      }

      // Mettre à jour le profil patient
      if (Object.keys(patientUpdateData).length > 0) {
        await tx.patient.update({
          where: { user_id: patientId },
          data: patientUpdateData
        });
      }
    });

    // Récupérer le patient mis à jour
    const updatedPatient = await prisma.user.findUnique({
      where: { id: patientId },
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

    const { password_hash, ...patientResponse } = updatedPatient;

    res.json({
      success: true,
      message: 'Patient mis à jour avec succès',
      data: { patient: patientResponse }
    });

  } catch (error) {
    console.error('Erreur mise à jour patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🗑️ SUPPRIMER UN PATIENT
 * DELETE /api/admin/patients/:id
 */
const deletePatient = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;
    const patientId = parseInt(req.params.id);

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    // Récupérer le patient existant
    const existingPatient = await prisma.user.findUnique({
      where: { id: patientId, role: 'patient' }
    });

    if (!existingPatient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérification des permissions d'accès
    if (adminRole === 'hospital_admin' && existingPatient.hospital_id !== adminHospitalId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que les patients de votre hôpital'
      });
    }

    if (adminRole === 'lab_admin' && existingPatient.laboratory_id !== adminLabId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez supprimer que les patients de votre laboratoire'
      });
    }

    // Vérifier s'il y a des documents associés
    const documentCount = await prisma.document.count({
      where: { patient_id: patientId }
    });

    if (documentCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Impossible de supprimer ce patient : ${documentCount} document(s) associé(s). Supprimez d'abord les documents.`
      });
    }

    // Supprimer le patient (cascade automatique pour le profil patient)
    await prisma.user.delete({
      where: { id: patientId }
    });

    res.json({
      success: true,
      message: 'Patient supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📊 STATISTIQUES PATIENTS D'UN ÉTABLISSEMENT
 * GET /api/admin/patients/stats
 */
const getPatientsStats = async (req, res) => {
  try {
    const { role: adminRole, hospital_id: adminHospitalId, laboratory_id: adminLabId } = req.user;

    // Validation des permissions
    if (!['super_admin', 'hospital_admin', 'lab_admin'].includes(adminRole)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    let whereClause = { role: 'patient' };

    // Filtres de permissions selon le rôle admin
    if (adminRole === 'hospital_admin') {
      whereClause.hospital_id = adminHospitalId;
    } else if (adminRole === 'lab_admin') {
      whereClause.laboratory_id = adminLabId;
    }

    const [
      totalPatients,
      activePatients,
      patientsByGender,
      recentPatients,
      patientsWithDocuments
    ] = await Promise.all([
      prisma.user.count({ where: whereClause }),
      prisma.user.count({ where: { ...whereClause, is_active: true } }),
      prisma.patient.groupBy({
        by: ['gender'],
        where: {
          user: whereClause
        },
        _count: { gender: true }
      }),
      prisma.user.count({
        where: {
          ...whereClause,
          created_at: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
          }
        }
      }),
      prisma.user.count({
        where: {
          ...whereClause,
          uploaded_documents: {
            some: {}
          }
        }
      })
    ]);

    const stats = {
      total: totalPatients,
      active: activePatients,
      inactive: totalPatients - activePatients,
      recent: recentPatients,
      withDocuments: patientsWithDocuments,
      withoutDocuments: totalPatients - patientsWithDocuments,
      byGender: patientsByGender.reduce((acc, item) => {
        acc[item.gender || 'unknown'] = item._count.gender;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur statistiques patients:', error);
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
  createPatient,
  getPatients,
  getPatient,
  updatePatient,
  deletePatient,
  getPatientsStats
};