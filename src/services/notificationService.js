// 🔔 SERVICE DE NOTIFICATIONS
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion centralisée des notifications pour tous les événements

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Vérifier si l'utilisateur a activé un type de notification
 */
const isNotificationEnabled = async (userId, notificationType) => {
  try {
    const settings = await prisma.notificationSettings.findUnique({
      where: { user_id: userId }
    });

    if (!settings) {
      // Paramètres par défaut si pas de configuration
      return true;
    }

    // Vérifier selon le type de notification
    switch (notificationType) {
      case 'new_message':
        return settings.new_message_enabled && settings.in_app_enabled;
      case 'new_document':
      case 'document_shared':
        return settings.new_document_enabled && settings.in_app_enabled;
      case 'exam_request_created':
      case 'exam_request_updated':
      case 'exam_results_ready':
        return settings.exam_status_enabled && settings.in_app_enabled;
      default:
        return settings.in_app_enabled;
    }
  } catch (error) {
    console.error('Erreur vérification paramètres notification:', error);
    return true; // Par défaut, on active
  }
};

/**
 * Vérifier si on est dans les heures de silence
 */
const isInQuietHours = (settings) => {
  if (!settings?.quiet_hours_start || !settings?.quiet_hours_end) {
    return false;
  }

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  
  const [startHour, startMin] = settings.quiet_hours_start.split(':').map(Number);
  const [endHour, endMin] = settings.quiet_hours_end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMin;
  const endTime = endHour * 60 + endMin;

  if (startTime <= endTime) {
    // Même jour (ex: 22:00 - 08:00 du lendemain)
    return currentTime >= startTime && currentTime <= endTime;
  } else {
    // Passage minuit (ex: 22:00 - 08:00)
    return currentTime >= startTime || currentTime <= endTime;
  }
};

/**
 * Obtenir les utilisateurs ayant accès à un document
 */
const getDocumentAccessUsers = async (documentId) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        },
        uploader: true,
        hospital: {
          include: {
            users: {
              where: {
                role: { in: ['hospital_staff', 'hospital_admin'] },
                is_active: true
              }
            }
          }
        },
        laboratory: {
          include: {
            users: {
              where: {
                role: { in: ['lab_staff', 'lab_admin'] },
                is_active: true
              }
            }
          }
        }
      }
    });

    if (!document) return [];

    const users = new Set();
    
    // Patient propriétaire
    users.add(document.patient.user.id);
    
    // Utilisateur qui a uploadé
    users.add(document.uploader.id);
    
    // Personnel de l'hôpital
    if (document.hospital) {
      document.hospital.users.forEach(user => users.add(user.id));
    }
    
    // Personnel du laboratoire
    if (document.laboratory) {
      document.laboratory.users.forEach(user => users.add(user.id));
    }

    // Utilisateurs partagés (si défini dans shared_with)
    if (document.shared_with) {
      try {
        const sharedUsers = JSON.parse(document.shared_with);
        sharedUsers.forEach(userId => users.add(userId));
      } catch (error) {
        console.warn('Erreur parsing shared_with:', error);
      }
    }

    return Array.from(users);
  } catch (error) {
    console.error('Erreur récupération utilisateurs document:', error);
    return [];
  }
};

/**
 * Obtenir les participants d'une conversation
 */
const getConversationParticipants = async (conversationId) => {
  try {
    const participants = await prisma.conversationParticipant.findMany({
      where: { conversation_id: conversationId },
      include: { user: true }
    });

    return participants
      .filter(p => p.user.is_active)
      .map(p => p.user.id);
  } catch (error) {
    console.error('Erreur récupération participants conversation:', error);
    return [];
  }
};

// ============================================================================
// FONCTIONS DE CRÉATION DE NOTIFICATIONS
// ============================================================================

/**
 * Créer une notification pour un utilisateur
 */
const createNotification = async (userId, type, title, message, data = null, relatedIds = {}) => {
  try {
    // Vérifier si les notifications sont activées pour cet utilisateur
    const isEnabled = await isNotificationEnabled(userId, type);
    if (!isEnabled) {
      return null;
    }

    const notification = await prisma.notification.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        related_message_id: relatedIds.messageId || null,
        related_document_id: relatedIds.documentId || null,
        related_exam_id: relatedIds.examId || null
      }
    });

    return notification;
  } catch (error) {
    console.error('Erreur création notification:', error);
    return null;
  }
};

/**
 * Créer des notifications pour plusieurs utilisateurs
 */
const createBulkNotifications = async (userIds, type, title, message, data = null, relatedIds = {}) => {
  try {
    const notifications = [];
    
    for (const userId of userIds) {
      const notification = await createNotification(userId, type, title, message, data, relatedIds);
      if (notification) {
        notifications.push(notification);
      }
    }

    return notifications;
  } catch (error) {
    console.error('Erreur création notifications bulk:', error);
    return [];
  }
};

// ============================================================================
// NOTIFICATIONS SPÉCIFIQUES PAR TYPE D'ÉVÉNEMENT
// ============================================================================

/**
 * Notification pour un nouveau message
 */
const notifyNewMessage = async (messageId, senderId) => {
  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        conversation: true,
        sender: true
      }
    });

    if (!message) return [];

    // Récupérer tous les participants sauf l'expéditeur
    const participantIds = await getConversationParticipants(message.conversation_id);
    const recipientIds = participantIds.filter(id => id !== senderId);

    const title = `Nouveau message de ${message.sender.first_name} ${message.sender.last_name}`;
    const messageText = `${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}`;
    
    const data = {
      conversationId: message.conversation_id,
      conversationTitle: message.conversation.title,
      senderName: `${message.sender.first_name} ${message.sender.last_name}`,
      messagePreview: messageText
    };

    return await createBulkNotifications(
      recipientIds,
      'new_message',
      title,
      messageText,
      data,
      { messageId }
    );
  } catch (error) {
    console.error('Erreur notification nouveau message:', error);
    return [];
  }
};

/**
 * Notification pour un nouveau document
 */
const notifyNewDocument = async (documentId, uploaderId) => {
  try {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        },
        uploader: true,
        hospital: true,
        laboratory: true
      }
    });

    if (!document) return [];

    // Récupérer tous les utilisateurs ayant accès sauf l'uploader
    const accessUserIds = await getDocumentAccessUsers(documentId);
    const recipientIds = accessUserIds.filter(id => id !== uploaderId);

    const patientName = `${document.patient.user.first_name} ${document.patient.user.last_name}`;
    const uploaderName = `${document.uploader.first_name} ${document.uploader.last_name}`;
    
    const title = `Nouveau document pour ${patientName}`;
    const message = `${uploaderName} a ajouté un nouveau document : ${document.filename}`;
    
    const data = {
      documentId,
      patientName,
      uploaderName,
      filename: document.filename,
      documentType: document.document_type,
      description: document.description
    };

    return await createBulkNotifications(
      recipientIds,
      'new_document',
      title,
      message,
      data,
      { documentId }
    );
  } catch (error) {
    console.error('Erreur notification nouveau document:', error);
    return [];
  }
};

/**
 * Notification pour une demande d'examen créée
 */
const notifyExamRequestCreated = async (examRequestId) => {
  try {
    const examRequest = await prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: {
        patient: {
          include: { user: true }
        },
        requester: true,
        laboratory: {
          include: {
            users: {
              where: {
                role: { in: ['lab_staff', 'lab_admin'] },
                is_active: true
              }
            }
          }
        }
      }
    });

    if (!examRequest) return [];

    const patientName = `${examRequest.patient.user.first_name} ${examRequest.patient.user.last_name}`;
    const requesterName = `${examRequest.requester.first_name} ${examRequest.requester.last_name}`;
    
    // Notifier le personnel du laboratoire
    const labUserIds = examRequest.laboratory.users.map(user => user.id);
    
    const title = `Nouvelle demande d'examen - ${patientName}`;
    const message = `${requesterName} a demandé un examen ${examRequest.exam_type} pour ${patientName}`;
    
    const data = {
      examRequestId,
      patientName,
      requesterName,
      examType: examRequest.exam_type,
      priority: examRequest.priority,
      clinicalInfo: examRequest.clinical_info.substring(0, 200)
    };

    return await createBulkNotifications(
      labUserIds,
      'exam_request_created',
      title,
      message,
      data,
      { examId: examRequestId }
    );
  } catch (error) {
    console.error('Erreur notification demande examen créée:', error);
    return [];
  }
};

/**
 * Notification pour mise à jour du statut d'examen
 */
const notifyExamStatusUpdate = async (examRequestId, newStatus, updatedBy) => {
  try {
    const examRequest = await prisma.examRequest.findUnique({
      where: { id: examRequestId },
      include: {
        patient: {
          include: { user: true }
        },
        requester: true,
        processor: true,
        hospital: {
          include: {
            users: {
              where: {
                role: { in: ['hospital_staff', 'hospital_admin'] },
                is_active: true
              }
            }
          }
        }
      }
    });

    if (!examRequest) return [];

    const patientName = `${examRequest.patient.user.first_name} ${examRequest.patient.user.last_name}`;
    const processorName = examRequest.processor ? 
      `${examRequest.processor.first_name} ${examRequest.processor.last_name}` : 
      'Laboratoire';

    // Notifier le médecin demandeur et le patient
    const recipientIds = [examRequest.requested_by, examRequest.patient.user_id];
    
    // Ajouter le personnel de l'hôpital si pertinent
    if (examRequest.hospital) {
      examRequest.hospital.users.forEach(user => {
        if (!recipientIds.includes(user.id)) {
          recipientIds.push(user.id);
        }
      });
    }

    // Exclure celui qui a fait la mise à jour
    const finalRecipientIds = recipientIds.filter(id => id !== updatedBy);

    const statusMessages = {
      accepted: 'acceptée',
      rejected: 'rejetée',
      scheduled: 'programmée',
      in_progress: 'en cours',
      completed: 'terminée',
      results_ready: 'résultats disponibles',
      cancelled: 'annulée'
    };

    const title = `Examen ${statusMessages[newStatus]} - ${patientName}`;
    const message = `${processorName} a mis à jour le statut de l'examen ${examRequest.exam_type} : ${statusMessages[newStatus]}`;
    
    const data = {
      examRequestId,
      patientName,
      processorName,
      examType: examRequest.exam_type,
      oldStatus: examRequest.status,
      newStatus,
      priority: examRequest.priority
    };

    return await createBulkNotifications(
      finalRecipientIds,
      newStatus === 'results_ready' ? 'exam_results_ready' : 'exam_request_updated',
      title,
      message,
      data,
      { examId: examRequestId }
    );
  } catch (error) {
    console.error('Erreur notification mise à jour examen:', error);
    return [];
  }
};

// ============================================================================
// GESTION DES PARAMÈTRES DE NOTIFICATION
// ============================================================================

/**
 * Créer les paramètres par défaut pour un nouvel utilisateur
 */
const createDefaultNotificationSettings = async (userId) => {
  try {
    const settings = await prisma.notificationSettings.upsert({
      where: { user_id: userId },
      update: {},
      create: {
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

    return settings;
  } catch (error) {
    console.error('Erreur création paramètres notification:', error);
    return null;
  }
};

/**
 * Mettre à jour les paramètres de notification
 */
const updateNotificationSettings = async (userId, settings) => {
  try {
    const updatedSettings = await prisma.notificationSettings.upsert({
      where: { user_id: userId },
      update: settings,
      create: {
        user_id: userId,
        ...settings
      }
    });

    return updatedSettings;
  } catch (error) {
    console.error('Erreur mise à jour paramètres notification:', error);
    return null;
  }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  // Fonctions de création de notifications
  createNotification,
  createBulkNotifications,
  
  // Notifications spécifiques
  notifyNewMessage,
  notifyNewDocument,
  notifyExamRequestCreated,
  notifyExamStatusUpdate,
  
  // Gestion des paramètres
  createDefaultNotificationSettings,
  updateNotificationSettings,
  
  // Fonctions utilitaires
  isNotificationEnabled,
  getDocumentAccessUsers,
  getConversationParticipants
};