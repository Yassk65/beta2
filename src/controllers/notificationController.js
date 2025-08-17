// 🔔 CONTRÔLEUR NOTIFICATIONS
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion des notifications utilisateur et paramètres

const { PrismaClient } = require('@prisma/client');
const { updateNotificationSettings } = require('../services/notificationService');

const prisma = new PrismaClient();

// ============================================================================
// GESTION DES NOTIFICATIONS
// ============================================================================

/**
 * 📋 LISTER LES NOTIFICATIONS DE L'UTILISATEUR
 * GET /api/notifications
 */
const getNotifications = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      is_read,
      date_from,
      date_to
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = { user_id: userId };

    // Filtres optionnels
    if (type) whereClause.type = type;
    if (is_read !== undefined) whereClause.is_read = is_read === 'true';

    // Filtre par dates
    if (date_from || date_to) {
      whereClause.created_at = {};
      if (date_from) whereClause.created_at.gte = new Date(date_from);
      if (date_to) whereClause.created_at.lte = new Date(date_to);
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.notification.count({ where: whereClause }),
      prisma.notification.count({ 
        where: { user_id: userId, is_read: false } 
      })
    ]);

    // Parser les données JSON
    const notificationsResponse = notifications.map(notification => ({
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    }));

    res.json({
      success: true,
      data: {
        notifications: notificationsResponse,
        unreadCount,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👁️ MARQUER UNE NOTIFICATION COMME LUE
 * PUT /api/notifications/:id/read
 */
const markAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notificationId = parseInt(req.params.id);

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: { 
        id: notificationId,
        user_id: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    // Marquer comme lue
    const updatedNotification = await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: { notification: updatedNotification }
    });

  } catch (error) {
    console.error('Erreur marquage notification lue:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👁️ MARQUER TOUTES LES NOTIFICATIONS COMME LUES
 * PUT /api/notifications/read-all
 */
const markAllAsRead = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await prisma.notification.updateMany({
      where: { 
        user_id: userId,
        is_read: false
      },
      data: { 
        is_read: true,
        read_at: new Date()
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications marquées comme lues`,
      data: { updatedCount: result.count }
    });

  } catch (error) {
    console.error('Erreur marquage toutes notifications lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🗑️ SUPPRIMER UNE NOTIFICATION
 * DELETE /api/notifications/:id
 */
const deleteNotification = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const notificationId = parseInt(req.params.id);

    // Vérifier que la notification appartient à l'utilisateur
    const notification = await prisma.notification.findFirst({
      where: { 
        id: notificationId,
        user_id: userId 
      }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      });
    }

    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      success: true,
      message: 'Notification supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🗑️ SUPPRIMER TOUTES LES NOTIFICATIONS LUES
 * DELETE /api/notifications/read
 */
const deleteReadNotifications = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const result = await prisma.notification.deleteMany({
      where: { 
        user_id: userId,
        is_read: true
      }
    });

    res.json({
      success: true,
      message: `${result.count} notifications supprimées`,
      data: { deletedCount: result.count }
    });

  } catch (error) {
    console.error('Erreur suppression notifications lues:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📊 STATISTIQUES DES NOTIFICATIONS
 * GET /api/notifications/stats
 */
const getNotificationStats = async (req, res) => {
  try {
    const { id: userId } = req.user;

    const [
      totalNotifications,
      unreadNotifications,
      notificationsByType,
      recentNotifications
    ] = await Promise.all([
      prisma.notification.count({ where: { user_id: userId } }),
      prisma.notification.count({ where: { user_id: userId, is_read: false } }),
      prisma.notification.groupBy({
        by: ['type'],
        where: { user_id: userId },
        _count: { type: true }
      }),
      prisma.notification.count({
        where: {
          user_id: userId,
          created_at: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 derniers jours
          }
        }
      })
    ]);

    const stats = {
      total: totalNotifications,
      unread: unreadNotifications,
      read: totalNotifications - unreadNotifications,
      recent: recentNotifications,
      byType: notificationsByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {})
    };

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Erreur statistiques notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES PARAMÈTRES DE NOTIFICATION
// ============================================================================

/**
 * ⚙️ RÉCUPÉRER LES PARAMÈTRES DE NOTIFICATION
 * GET /api/notifications/settings
 */
const getNotificationSettings = async (req, res) => {
  try {
    const { id: userId } = req.user;

    let settings = await prisma.notificationSettings.findUnique({
      where: { user_id: userId }
    });

    // Créer les paramètres par défaut si ils n'existent pas
    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: {
          user_id: userId,
          new_message_enabled: true,
          new_document_enabled: true,
          exam_status_enabled: true,
          in_app_enabled: true,
          email_enabled: true,
          push_enabled: false,
          email_frequency: 'immediate'
        }
      });
    }

    res.json({
      success: true,
      data: { settings }
    });

  } catch (error) {
    console.error('Erreur récupération paramètres notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * ⚙️ METTRE À JOUR LES PARAMÈTRES DE NOTIFICATION
 * PUT /api/notifications/settings
 */
const updateNotificationSettingsController = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const {
      new_message_enabled,
      new_document_enabled,
      exam_status_enabled,
      in_app_enabled,
      email_enabled,
      push_enabled,
      email_frequency,
      quiet_hours_start,
      quiet_hours_end
    } = req.body;

    const updateData = {};
    
    // Mise à jour sélective des champs fournis
    if (new_message_enabled !== undefined) updateData.new_message_enabled = new_message_enabled;
    if (new_document_enabled !== undefined) updateData.new_document_enabled = new_document_enabled;
    if (exam_status_enabled !== undefined) updateData.exam_status_enabled = exam_status_enabled;
    if (in_app_enabled !== undefined) updateData.in_app_enabled = in_app_enabled;
    if (email_enabled !== undefined) updateData.email_enabled = email_enabled;
    if (push_enabled !== undefined) updateData.push_enabled = push_enabled;
    if (email_frequency !== undefined) updateData.email_frequency = email_frequency;
    if (quiet_hours_start !== undefined) updateData.quiet_hours_start = quiet_hours_start;
    if (quiet_hours_end !== undefined) updateData.quiet_hours_end = quiet_hours_end;

    const settings = await updateNotificationSettings(userId, updateData);

    if (!settings) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour des paramètres'
      });
    }

    res.json({
      success: true,
      message: 'Paramètres de notification mis à jour avec succès',
      data: { settings }
    });

  } catch (error) {
    console.error('Erreur mise à jour paramètres notifications:', error);
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
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteReadNotifications,
  getNotificationStats,
  getNotificationSettings,
  updateNotificationSettingsController
};