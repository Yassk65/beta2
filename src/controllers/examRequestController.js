// 🧪 CONTRÔLEUR DEMANDES D'EXAMENS DE LABORATOIRE
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion des demandes d'examens entre hôpitaux et laboratoires

const { PrismaClient } = require('@prisma/client');
const { notifyExamRequestCreated, notifyExamStatusUpdate } = require('../services/notificationService');

const prisma = new PrismaClient();

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Vérifier les permissions pour créer une demande d'examen
 */
const canRequestExam = (userRole, userHospitalId) => {
  return ['hospital_staff', 'hospital_admin', 'super_admin'].includes(userRole) && 
         (userRole === 'super_admin' || userHospitalId);
};

/**
 * Vérifier les permissions pour traiter une demande d'examen
 */
const canProcessExam = (userRole, userLabId, examLabId) => {
  if (userRole === 'super_admin') return true;
  return ['lab_staff', 'lab_admin'].includes(userRole) && userLabId === examLabId;
};

/**
 * Créer un historique de changement de statut
 */
const createStatusHistory = async (examRequestId, status, changedBy, notes = null) => {
  try {
    await prisma.examStatusHistory.create({
      data: {
        exam_request_id: examRequestId,
        status,
        changed_by: changedBy,
        notes
      }
    });
  } catch (error) {
    console.error('Erreur création historique statut:', error);
  }
};

// ============================================================================
// GESTION DES DEMANDES D'EXAMENS
// ============================================================================

/**
 * 📝 CRÉER UNE DEMANDE D'EXAMEN
 * POST /api/exam-requests
 */
const createExamRequest = async (req, res) => {
  try {
    const { role, id: requesterId, hospital_id: userHospitalId } = req.user;
    const {
      patient_id,
      laboratory_id,
      exam_type,
      priority = 'normal',
      clinical_info,
      requested_tests,
      notes,
      scheduled_at
    } = req.body;

    // Vérifier les permissions
    if (!canRequestExam(role, userHospitalId)) {
      return res.status(403).json({
        success: false,
        message: 'Seul le personnel hospitalier peut demander des examens'
      });
    }

    // Validation des données obligatoires
    if (!patient_id || !laboratory_id || !exam_type || !clinical_info || !requested_tests) {
      return res.status(400).json({
        success: false,
        message: 'Patient, laboratoire, type d\'examen, informations cliniques et tests requis'
      });
    }

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: parseInt(patient_id) },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifier que le laboratoire existe et est actif
    const laboratory = await prisma.laboratory.findUnique({
      where: { id: parseInt(laboratory_id) }
    });

    if (!laboratory || !laboratory.is_active) {
      return res.status(404).json({
        success: false,
        message: 'Laboratoire non trouvé ou inactif'
      });
    }

    // Déterminer l'hôpital demandeur
    let hospitalId = userHospitalId;
    if (role === 'super_admin' && req.body.hospital_id) {
      hospitalId = parseInt(req.body.hospital_id);
    }

    if (!hospitalId) {
      return res.status(400).json({
        success: false,
        message: 'Hôpital demandeur requis'
      });
    }

    // Vérifier que l'hôpital existe
    const hospital = await prisma.hospital.findUnique({
      where: { id: hospitalId }
    });

    if (!hospital) {
      return res.status(404).json({
        success: false,
        message: 'Hôpital non trouvé'
      });
    }

    // Créer la demande d'examen
    const examRequest = await prisma.examRequest.create({
      data: {
        patient_id: parseInt(patient_id),
        requested_by: requesterId,
        hospital_id: hospitalId,
        laboratory_id: parseInt(laboratory_id),
        exam_type,
        priority,
        status: 'pending',
        clinical_info,
        requested_tests: JSON.stringify(requested_tests),
        notes,
        scheduled_at: scheduled_at ? new Date(scheduled_at) : null
      },
      include: {
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true }
            }
          }
        },
        requester: {
          select: { first_name: true, last_name: true, role: true }
        },
        hospital: {
          select: { name: true, city: true, phone: true }
        },
        laboratory: {
          select: { name: true, city: true, phone: true, email: true }
        }
      }
    });

    // Créer l'historique initial
    await createStatusHistory(examRequest.id, 'pending', requesterId, 'Demande d\'examen créée');

    // Masquer les informations sensibles
    const response = {
      ...examRequest,
      requested_tests: JSON.parse(examRequest.requested_tests)
    };

    // Créer les notifications pour le personnel du laboratoire
    try {
      await notifyExamRequestCreated(examRequest.id);
    } catch (notificationError) {
      console.error('Erreur création notification demande examen:', notificationError);
      // Ne pas faire échouer la création si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Demande d\'examen créée avec succès',
      data: { examRequest: response }
    });

  } catch (error) {
    console.error('Erreur création demande examen:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER LES DEMANDES D'EXAMENS
 * GET /api/exam-requests
 */
const getExamRequests = async (req, res) => {
  try {
    const { role, id: userId, hospital_id: userHospitalId, laboratory_id: userLabId } = req.user;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      exam_type, 
      priority,
      patient_search,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};

    // Filtrage par rôle et établissement
    if (role === 'hospital_staff' || role === 'hospital_admin') {
      whereClause.hospital_id = userHospitalId;
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      whereClause.laboratory_id = userLabId;
    }
    // Super admin voit toutes les demandes

    // Filtres optionnels
    if (status) whereClause.status = status;
    if (exam_type) whereClause.exam_type = exam_type;
    if (priority) whereClause.priority = priority;

    // Filtre par dates
    if (date_from || date_to) {
      whereClause.requested_at = {};
      if (date_from) whereClause.requested_at.gte = new Date(date_from);
      if (date_to) whereClause.requested_at.lte = new Date(date_to);
    }

    // Recherche par patient
    if (patient_search) {
      whereClause.patient = {
        user: {
          OR: [
            { first_name: { contains: patient_search, mode: 'insensitive' } },
            { last_name: { contains: patient_search, mode: 'insensitive' } },
            { email: { contains: patient_search, mode: 'insensitive' } }
          ]
        }
      };
    }

    const [examRequests, total] = await Promise.all([
      prisma.examRequest.findMany({
        where: whereClause,
        include: {
          patient: {
            include: {
              user: {
                select: { first_name: true, last_name: true, email: true, phone: true }
              }
            }
          },
          requester: {
            select: { first_name: true, last_name: true, role: true }
          },
          processor: {
            select: { first_name: true, last_name: true, role: true }
          },
          hospital: {
            select: { name: true, city: true, phone: true }
          },
          laboratory: {
            select: { name: true, city: true, phone: true, email: true }
          }
        },
        skip,
        take,
        orderBy: { requested_at: 'desc' }
      }),
      prisma.examRequest.count({ where: whereClause })
    ]);

    // Parser les tests demandés
    const examRequestsResponse = examRequests.map(request => ({
      ...request,
      requested_tests: JSON.parse(request.requested_tests)
    }));

    res.json({
      success: true,
      data: {
        examRequests: examRequestsResponse,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération demandes examens:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👁️ OBTENIR UNE DEMANDE D'EXAMEN SPÉCIFIQUE
 * GET /api/exam-requests/:id
 */
const getExamRequest = async (req, res) => {
  try {
    const { role, id: userId, hospital_id: userHospitalId, laboratory_id: userLabId } = req.user;
    const examRequestId = parseInt(req.params.id);

    const examRequest = await prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: {
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true, phone: true, date_of_birth: true }
            }
          }
        },
        requester: {
          select: { first_name: true, last_name: true, role: true, email: true }
        },
        processor: {
          select: { first_name: true, last_name: true, role: true, email: true }
        },
        hospital: {
          select: { name: true, city: true, phone: true, email: true, address: true }
        },
        laboratory: {
          select: { name: true, city: true, phone: true, email: true, address: true }
        },
        status_history: {
          orderBy: { changed_at: 'desc' },
          take: 10
        }
      }
    });

    if (!examRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande d\'examen non trouvée'
      });
    }

    // Vérifier les permissions d'accès
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
        message: 'Accès non autorisé à cette demande d\'examen'
      });
    }

    const response = {
      ...examRequest,
      requested_tests: JSON.parse(examRequest.requested_tests)
    };

    res.json({
      success: true,
      data: { examRequest: response }
    });

  } catch (error) {
    console.error('Erreur récupération demande examen:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ✏️ METTRE À JOUR LE STATUT D'UNE DEMANDE D'EXAMEN
 * PUT /api/exam-requests/:id/status
 */
const updateExamStatus = async (req, res) => {
  try {
    const { role, id: userId, laboratory_id: userLabId } = req.user;
    const examRequestId = parseInt(req.params.id);
    const { status, notes, scheduled_at, completed_at, results_ready_at } = req.body;

    // Récupérer la demande existante
    const existingRequest = await prisma.examRequest.findUnique({
      where: { id: examRequestId }
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Demande d\'examen non trouvée'
      });
    }

    // Vérifier les permissions
    if (!canProcessExam(role, userLabId, existingRequest.laboratory_id)) {
      return res.status(403).json({
        success: false,
        message: 'Seul le personnel du laboratoire destinataire peut modifier le statut'
      });
    }

    // Validation des transitions de statut
    const validTransitions = {
      'pending': ['accepted', 'rejected'],
      'accepted': ['scheduled', 'in_progress', 'cancelled'],
      'scheduled': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'cancelled'],
      'completed': ['results_ready'],
      'rejected': [],
      'results_ready': [],
      'cancelled': []
    };

    if (!validTransitions[existingRequest.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition de statut invalide: ${existingRequest.status} → ${status}`
      });
    }

    // Préparer les données de mise à jour
    const updateData = { 
      status,
      updated_at: new Date()
    };

    // Assigner le processeur si c'est la première fois qu'il traite la demande
    if (!existingRequest.processed_by && ['accepted', 'rejected'].includes(status)) {
      updateData.processed_by = userId;
    }

    // Mettre à jour les dates selon le statut
    if (status === 'scheduled' && scheduled_at) {
      updateData.scheduled_at = new Date(scheduled_at);
    }
    if (status === 'completed' && completed_at) {
      updateData.completed_at = new Date(completed_at);
    }
    if (status === 'results_ready' && results_ready_at) {
      updateData.results_ready_at = new Date(results_ready_at);
    }

    // Mettre à jour en transaction
    const updatedRequest = await prisma.$transaction(async (tx) => {
      // Mettre à jour la demande
      const updated = await tx.examRequest.update({
        where: { id: examRequestId },
        data: updateData,
        include: {
          patient: {
            include: {
              user: {
                select: { first_name: true, last_name: true, email: true }
              }
            }
          },
          requester: {
            select: { first_name: true, last_name: true, role: true }
          },
          processor: {
            select: { first_name: true, last_name: true, role: true }
          },
          hospital: {
            select: { name: true, city: true }
          },
          laboratory: {
            select: { name: true, city: true }
          }
        }
      });

      // Créer l'historique
      await tx.examStatusHistory.create({
        data: {
          exam_request_id: examRequestId,
          status,
          changed_by: userId,
          notes
        }
      });

      return updated;
    });

    const response = {
      ...updatedRequest,
      requested_tests: JSON.parse(updatedRequest.requested_tests)
    };

    // Créer les notifications pour les utilisateurs concernés
    try {
      await notifyExamStatusUpdate(examRequestId, status, userId);
    } catch (notificationError) {
      console.error('Erreur création notification statut examen:', notificationError);
      // Ne pas faire échouer la mise à jour si la notification échoue
    }

    res.json({
      success: true,
      message: 'Statut de la demande d\'examen mis à jour avec succès',
      data: { examRequest: response }
    });

  } catch (error) {
    console.error('Erreur mise à jour statut examen:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📊 STATISTIQUES DES DEMANDES D'EXAMENS
 * GET /api/exam-requests/stats
 */
const getExamRequestsStats = async (req, res) => {
  try {
    const { role, hospital_id: userHospitalId, laboratory_id: userLabId } = req.user;

    let whereClause = {};

    // Filtrage par rôle et établissement
    if (role === 'hospital_staff' || role === 'hospital_admin') {
      whereClause.hospital_id = userHospitalId;
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      whereClause.laboratory_id = userLabId;
    }

    const [
      totalRequests,
      pendingRequests,
      acceptedRequests,
      completedRequests,
      requestsByType,
      requestsByPriority,
      recentRequests
    ] = await Promise.all([
      prisma.examRequest.count({ where: whereClause }),
      prisma.examRequest.count({ where: { ...whereClause, status: 'pending' } }),
      prisma.examRequest.count({ where: { ...whereClause, status: 'accepted' } }),
      prisma.examRequest.count({ where: { ...whereClause, status: 'completed' } }),
      prisma.examRequest.groupBy({
        by: ['exam_type'],
        where: whereClause,
        _count: { exam_type: true }
      }),
      prisma.examRequest.groupBy({
        by: ['priority'],
        where: whereClause,
        _count: { priority: true }
      }),
      prisma.examRequest.count({
        where: {
          ...whereClause,
          requested_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
          }
        }
      })
    ]);

    const stats = {
      total: totalRequests,
      pending: pendingRequests,
      accepted: acceptedRequests,
      completed: completedRequests,
      recent: recentRequests,
      byType: requestsByType.reduce((acc, item) => {
        acc[item.exam_type] = item._count.exam_type;
        return acc;
      }, {}),
      byPriority: requestsByPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur statistiques demandes examens:', error);
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
  createExamRequest,
  getExamRequests,
  getExamRequest,
  updateExamStatus,
  getExamRequestsStats
};