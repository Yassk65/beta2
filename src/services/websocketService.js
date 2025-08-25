// 🔌 SERVICE WEBSOCKET POUR NOTIFICATIONS TEMPS RÉEL
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion des connexions WebSocket et notifications instantanées

const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Map pour stocker les connexions utilisateur
const userSockets = new Map();

/**
 * 🔐 Middleware d'authentification pour WebSocket
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('Token manquant'));
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Vérifier que l'utilisateur existe et est actif
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, is_active: true }
    });

    if (!user || !user.is_active) {
      return next(new Error('Utilisateur invalide ou inactif'));
    }

    socket.userId = user.id;
    socket.userRole = user.role;
    socket.userEmail = user.email;
    
    next();
  } catch (error) {
    console.error('Erreur authentification WebSocket:', error);
    next(new Error('Token invalide'));
  }
};

/**
 * 🔌 Configuration des gestionnaires WebSocket
 */
const setupWebSocketHandlers = (io) => {
  // Middleware d'authentification
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    const { userId, userRole, userEmail } = socket;
    
    console.log(`🔌 Utilisateur connecté: ${userEmail} (ID: ${userId}, Rôle: ${userRole})`);
    
    // Stocker la connexion
    userSockets.set(userId, socket);
    
    // Joindre l'utilisateur à sa propre room
    socket.join(`user_${userId}`);
    
    // Joindre l'utilisateur à la room de son rôle
    socket.join(`role_${userRole}`);
    
    // Si c'est un staff médical/labo, joindre aux rooms d'établissement
    if (userRole === 'hospital_staff' || userRole === 'hospital_admin') {
      socket.join('hospital_staff');
    } else if (userRole === 'lab_staff' || userRole === 'lab_admin') {
      socket.join('lab_staff');
    }

    // 📊 Événement: Demander les statistiques de notifications
    socket.on('get_notification_stats', async () => {
      try {
        const stats = await getNotificationStats(userId);
        socket.emit('notification_stats', stats);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération des statistiques' });
      }
    });

    // 📋 Événement: Demander la liste des notifications
    socket.on('get_notifications', async (params = {}) => {
      try {
        const notifications = await getNotifications(userId, params);
        socket.emit('notifications_list', notifications);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors de la récupération des notifications' });
      }
    });

    // ✅ Événement: Marquer une notification comme lue
    socket.on('mark_notification_read', async (notificationId) => {
      try {
        await markNotificationAsRead(userId, notificationId);
        socket.emit('notification_marked_read', { notificationId });
        
        // Envoyer les stats mises à jour
        const stats = await getNotificationStats(userId);
        socket.emit('notification_stats', stats);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors du marquage de la notification' });
      }
    });

    // 🔄 Événement: Marquer toutes les notifications comme lues
    socket.on('mark_all_notifications_read', async () => {
      try {
        const result = await markAllNotificationsAsRead(userId);
        socket.emit('all_notifications_marked_read', result);
        
        // Envoyer les stats mises à jour
        const stats = await getNotificationStats(userId);
        socket.emit('notification_stats', stats);
      } catch (error) {
        socket.emit('error', { message: 'Erreur lors du marquage des notifications' });
      }
    });

    // 💬 Événement: Rejoindre une conversation
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
      console.log(`💬 Utilisateur ${userId} a rejoint la conversation ${conversationId}`);
    });

    // 💬 Événement: Quitter une conversation
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
      console.log(`💬 Utilisateur ${userId} a quitté la conversation ${conversationId}`);
    });

    // 🏓 Ping/Pong pour maintenir la connexion
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // 🔌 Gestion de la déconnexion
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Utilisateur déconnecté: ${userEmail} (Raison: ${reason})`);
      userSockets.delete(userId);
    });
  });

  console.log('🔌 Gestionnaires WebSocket configurés');
};

/**
 * 📊 Récupérer les statistiques de notifications
 */
const getNotificationStats = async (userId) => {
  const [total, unread, recent] = await Promise.all([
    prisma.notification.count({ where: { user_id: userId } }),
    prisma.notification.count({ where: { user_id: userId, is_read: false } }),
    prisma.notification.count({
      where: {
        user_id: userId,
        created_at: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    })
  ]);

  const byType = await prisma.notification.groupBy({
    by: ['type'],
    where: { user_id: userId },
    _count: { type: true }
  });

  return {
    total,
    unread,
    recent,
    byType: byType.reduce((acc, item) => {
      acc[item.type] = item._count.type;
      return acc;
    }, {})
  };
};

/**
 * 📋 Récupérer la liste des notifications
 */
const getNotifications = async (userId, params = {}) => {
  const { page = 1, limit = 20, type, is_read } = params;
  const skip = (page - 1) * limit;

  let whereClause = { user_id: userId };
  if (type) whereClause.type = type;
  if (is_read !== undefined) whereClause.is_read = is_read;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: whereClause,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' }
    }),
    prisma.notification.count({ where: whereClause })
  ]);

  return {
    notifications: notifications.map(n => ({
      ...n,
      data: n.data ? JSON.parse(n.data) : null
    })),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

/**
 * ✅ Marquer une notification comme lue
 */
const markNotificationAsRead = async (userId, notificationId) => {
  return await prisma.notification.update({
    where: { 
      id: notificationId,
      user_id: userId // Sécurité: s'assurer que l'utilisateur peut modifier cette notification
    },
    data: { 
      is_read: true,
      read_at: new Date()
    }
  });
};

/**
 * 🔄 Marquer toutes les notifications comme lues
 */
const markAllNotificationsAsRead = async (userId) => {
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

  return { updatedCount: result.count };
};

/**
 * 🔔 Envoyer une notification en temps réel
 * Cette fonction sera appelée par le service de notifications
 */
const sendRealtimeNotification = (userId, notification) => {
  const socket = userSockets.get(userId);
  if (socket && socket.connected) {
    // Envoyer la nouvelle notification
    socket.emit('new_notification', {
      ...notification,
      data: notification.data ? JSON.parse(notification.data) : null
    });
    
    console.log(`🔔 Notification temps réel envoyée à l'utilisateur ${userId}: ${notification.title}`);
    return true;
  }
  
  console.log(`🔔 Utilisateur ${userId} non connecté, notification stockée en base`);
  return false;
};

/**
 * 💬 Envoyer un message en temps réel à une conversation
 */
const sendRealtimeMessage = (conversationId, message, senderUserId) => {
  if (!global.io) {
    console.log('💬 Socket.IO non initialisé');
    return false;
  }

  // Envoyer le message à tous les participants de la conversation (sauf l'expéditeur)
  global.io.to(`conversation_${conversationId}`).except(`user_${senderUserId}`).emit('new_message', {
    id: message.id,
    conversation_id: message.conversation_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: message.created_at,
    sender: message.sender
  });
  
  console.log(`💬 Message temps réel envoyé à la conversation ${conversationId} (sauf expéditeur ${senderUserId})`);
  return true;
};

/**
 * 💬 Envoyer l'état "en train d'écrire" à une conversation
 */
const sendTypingStatus = (conversationId, userId, isTyping) => {
  if (!global.io) {
    return false;
  }

  global.io.to(`conversation_${conversationId}`).except(`user_${userId}`).emit('typing_status', {
    conversation_id: conversationId,
    user_id: userId,
    is_typing: isTyping
  });
  
  return true;
};

/**
 * 📢 Envoyer une notification à plusieurs utilisateurs
 */
const sendRealtimeNotificationToUsers = (userIds, notification) => {
  let sentCount = 0;
  userIds.forEach(userId => {
    if (sendRealtimeNotification(userId, notification)) {
      sentCount++;
    }
  });
  return sentCount;
};

/**
 * 🏥 Envoyer une notification à tous les utilisateurs d'un rôle
 */
const sendRealtimeNotificationToRole = (role, notification) => {
  global.io.to(`role_${role}`).emit('new_notification', {
    ...notification,
    data: notification.data ? JSON.parse(notification.data) : null
  });
  
  console.log(`🔔 Notification temps réel envoyée au rôle ${role}: ${notification.title}`);
};

/**
 * 📊 Obtenir les statistiques des connexions
 */
const getConnectionStats = () => {
  return {
    connectedUsers: userSockets.size,
    totalConnections: global.io.sockets.sockets.size
  };
};

module.exports = {
  setupWebSocketHandlers,
  sendRealtimeNotification,
  sendRealtimeNotificationToUsers,
  sendRealtimeNotificationToRole,
  sendRealtimeMessage,
  sendTypingStatus,
  getConnectionStats
};
