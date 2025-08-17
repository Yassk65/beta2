// 👥 CONTRÔLEUR UTILISATEURS MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion des utilisateurs, établissements et données

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// ============================================================================
// GESTION DES UTILISATEURS
// ============================================================================

/**
 * 📊 STATISTIQUES GÉNÉRALES
 * GET /api/users/stats
 */
const getStats = async (req, res) => {
  try {
    const { role } = req.user;

    let stats = {};

    if (role === 'super_admin') {
      // Stats globales pour super admin
      const [
        totalUsers,
        totalPatients,
        totalHospitals,
        totalLaboratories,
        totalDocuments,
        totalConversations
      ] = await Promise.all([
        prisma.user.count(),
        prisma.patient.count(),
        prisma.hospital.count(),
        prisma.laboratory.count(),
        prisma.document.count(),
        prisma.conversation.count()
      ]);

      const usersByRole = await prisma.user.groupBy({
        by: ['role'],
        _count: { role: true }
      });

      stats = {
        users: {
          total: totalUsers,
          byRole: usersByRole.reduce((acc, item) => {
            acc[item.role] = item._count.role;
            return acc;
          }, {})
        },
        patients: totalPatients,
        hospitals: totalHospitals,
        laboratories: totalLaboratories,
        documents: totalDocuments,
        conversations: totalConversations
      };

    } else if (role === 'hospital_admin') {
      // Stats pour admin hôpital
      const hospitalId = req.user.hospital_id;
      
      const [
        hospitalStaff,
        hospitalDocuments,
        hospitalConversations
      ] = await Promise.all([
        prisma.user.count({
          where: { hospital_id: hospitalId }
        }),
        prisma.document.count({
          where: { hospital_id: hospitalId }
        }),
        prisma.conversation.count({
          where: {
            participants: {
              some: {
                user: { hospital_id: hospitalId }
              }
            }
          }
        })
      ]);

      stats = {
        staff: hospitalStaff,
        documents: hospitalDocuments,
        conversations: hospitalConversations
      };

    } else if (role === 'lab_admin') {
      // Stats pour admin laboratoire
      const laboratoryId = req.user.laboratory_id;
      
      const [
        labStaff,
        labDocuments,
        labConversations
      ] = await Promise.all([
        prisma.user.count({
          where: { laboratory_id: laboratoryId }
        }),
        prisma.document.count({
          where: { laboratory_id: laboratoryId }
        }),
        prisma.conversation.count({
          where: {
            participants: {
              some: {
                user: { laboratory_id: laboratoryId }
              }
            }
          }
        })
      ]);

      stats = {
        staff: labStaff,
        documents: labDocuments,
        conversations: labConversations
      };

    } else {
      // Stats limitées pour les autres rôles
      stats = {
        message: 'Statistiques limitées pour votre rôle'
      };
    }

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur récupération stats:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👥 LISTER LES UTILISATEURS
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { role, hospital_id, laboratory_id } = req.user;
    const { page = 1, limit = 10, search, roleFilter } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {};

    // Filtrage selon le rôle de l'utilisateur connecté
    if (role === 'super_admin') {
      // Super admin voit tout
      if (roleFilter) {
        whereClause.role = roleFilter;
      }
    } else if (role === 'hospital_admin') {
      // Admin hôpital voit son staff
      whereClause.hospital_id = hospital_id;
    } else if (role === 'lab_admin') {
      // Admin labo voit son staff
      whereClause.laboratory_id = laboratory_id;
    } else {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

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
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          is_active: true,
          last_seen: true,
          created_at: true,
          hospital: {
            select: { id: true, name: true, city: true }
          },
          laboratory: {
            select: { id: true, name: true, city: true }
          }
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
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES ÉTABLISSEMENTS
// ============================================================================

/**
 * 🏥 LISTER LES HÔPITAUX
 * GET /api/users/hospitals
 */
const getHospitals = async (req, res) => {
  try {
    const { search, city, active = 'true' } = req.query;

    let whereClause = {};

    if (active === 'true') {
      whereClause.is_active = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    const hospitals = await prisma.hospital.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        is_active: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { hospitals }
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
 * GET /api/users/laboratories
 */
const getLaboratories = async (req, res) => {
  try {
    const { search, city, active = 'true' } = req.query;

    let whereClause = {};

    if (active === 'true') {
      whereClause.is_active = true;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (city) {
      whereClause.city = { contains: city, mode: 'insensitive' };
    }

    const laboratories = await prisma.laboratory.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        latitude: true,
        longitude: true,
        is_active: true,
        _count: {
          select: { users: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: { laboratories }
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
 * 🗺️ RECHERCHE PAR PROXIMITÉ
 * GET /api/users/nearby
 */
const getNearbyEstablishments = async (req, res) => {
  try {
    const { lat, lng, radius = 10, type = 'both' } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude et longitude requises'
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const radiusKm = parseFloat(radius);

    let results = {};

    // Recherche d'hôpitaux
    if (type === 'both' || type === 'hospitals') {
      const hospitals = await prisma.$queryRaw`
        SELECT 
          id, name, address, city, phone, email, latitude, longitude,
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(latitude))
          )) AS distance_km
        FROM hospitals 
        WHERE is_active = 1
        HAVING distance_km <= ${radiusKm}
        ORDER BY distance_km ASC
        LIMIT 20
      `;

      results.hospitals = hospitals;
    }

    // Recherche de laboratoires
    if (type === 'both' || type === 'laboratories') {
      const laboratories = await prisma.$queryRaw`
        SELECT 
          id, name, address, city, phone, email, latitude, longitude,
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(latitude))
          )) AS distance_km
        FROM laboratories 
        WHERE is_active = 1
        HAVING distance_km <= ${radiusKm}
        ORDER BY distance_km ASC
        LIMIT 20
      `;

      results.laboratories = laboratories;
    }

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    console.error('Erreur recherche proximité:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES PATIENTS
// ============================================================================

/**
 * 👤 LISTER LES PATIENTS
 * GET /api/users/patients
 */
const getPatients = async (req, res) => {
  try {
    const { role, hospital_id, laboratory_id } = req.user;
    const { page = 1, limit = 10, search } = req.query;

    // Vérifier les permissions
    if (!['super_admin', 'hospital_admin', 'hospital_staff', 'lab_admin', 'lab_staff'].includes(role)) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {
      user: { role: 'patient' }
    };

    // Filtrage selon l'établissement
    if (role !== 'super_admin') {
      if (hospital_id) {
        whereClause.documents = {
          some: { hospital_id: hospital_id }
        };
      } else if (laboratory_id) {
        whereClause.documents = {
          some: { laboratory_id: laboratory_id }
        };
      }
    }

    // Recherche textuelle
    if (search) {
      whereClause.user.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              phone: true,
              is_active: true,
              created_at: true
            }
          },
          _count: {
            select: { documents: true }
          }
        },
        skip,
        take,
        orderBy: { user: { created_at: 'desc' } }
      }),
      prisma.patient.count({ where: whereClause })
    ]);

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
    console.error('Erreur récupération patients:', error);
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
  getStats,
  getUsers,
  getHospitals,
  getLaboratories,
  getNearbyEstablishments,
  getPatients
};