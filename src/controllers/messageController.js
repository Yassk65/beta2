// 💬 CONTRÔLEUR MESSAGERIE MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Système de messagerie entre utilisateurs (patients, staff, admins)

const { PrismaClient } = require('@prisma/client');
const { notifyNewMessage } = require('../services/notificationService');
const { sendRealtimeMessage } = require('../services/websocketService');

const prisma = new PrismaClient();

// ============================================================================
// GESTION DES CONVERSATIONS
// ============================================================================

/**
 * 📋 LISTER LES CONVERSATIONS DE L'UTILISATEUR
 * GET /api/messages/conversations
 */
const getConversations = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { page = 1, limit = 20, search } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = {
      participants: {
        some: {
          user_id: userId
        }
      }
    };

    // Recherche par titre de conversation
    if (search) {
      whereClause.title = {
        contains: search
      };
    }

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  role: true,
                  hospital: {
                    select: { name: true }
                  },
                  laboratory: {
                    select: { name: true }
                  }
                }
              }
            }
          },
          messages: {
            orderBy: { created_at: 'desc' },
            take: 1,
            include: {
              sender: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  role: true
                }
              }
            }
          },
          _count: {
            select: {
              messages: true
            }
          }
        },
        skip,
        take,
        orderBy: {
          messages: {
            _count: 'desc'
          }
        }
      }),
      prisma.conversation.count({ where: whereClause })
    ]);

    // Enrichir les conversations avec des informations utiles
    const enrichedConversations = conversations.map(conversation => {
      const lastMessage = conversation.messages[0] || null;
      const otherParticipants = conversation.participants.filter(p => p.user_id !== userId);
      
      return {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        participants: otherParticipants.map(p => ({
          id: p.user.id,
          name: `${p.user.first_name} ${p.user.last_name}`,
          role: p.user.role,
          establishment: p.user.hospital?.name || p.user.laboratory?.name || null
        })),
        lastMessage: lastMessage ? {
          id: lastMessage.id,
          content: lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : ''),
          sender: {
            id: lastMessage.sender.id,
            name: `${lastMessage.sender.first_name} ${lastMessage.sender.last_name}`,
            role: lastMessage.sender.role
          },
          created_at: lastMessage.created_at
        } : null,
        messageCount: conversation._count.messages,
        unreadCount: 0 // TODO: Implémenter le système de lecture
      };
    });

    res.json({
      success: true,
      data: {
        conversations: enrichedConversations,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 💬 CRÉER UNE NOUVELLE CONVERSATION
 * POST /api/messages/conversations
 */
const createConversation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { participant_ids, title, initial_message } = req.body;

    // Validation des données
    if (!participant_ids || !Array.isArray(participant_ids) || participant_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Au moins un participant requis'
      });
    }

    if (!initial_message || initial_message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message initial requis'
      });
    }

    // Vérifier que les participants existent
    const participants = await prisma.user.findMany({
      where: {
        id: { in: participant_ids },
        is_active: true
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        hospital_id: true,
        laboratory_id: true
      }
    });

    if (participants.length !== participant_ids.length) {
      return res.status(400).json({
        success: false,
        message: 'Un ou plusieurs participants non trouvés'
      });
    }

    // Vérifier les restrictions de communication selon les rôles
    if (!(await checkCommunicationPermissions(req.user, participant_ids))) {
      return res.status(403).json({
        success: false,
        message: 'Vous n\'êtes pas autorisé à communiquer avec ces utilisateurs'
      });
    }

    // Générer un titre automatique si non fourni
    const conversationTitle = title || `Conversation avec ${participants.map(p => `${p.first_name} ${p.last_name}`).join(', ')}`;

    // Créer la conversation en transaction
    const result = await prisma.$transaction(async (tx) => {
      // Créer la conversation
      const conversation = await tx.conversation.create({
        data: {
          title: conversationTitle,
          created_by: userId
        }
      });

      // Ajouter tous les participants (y compris le créateur)
      const allParticipantIds = [...new Set([userId, ...participant_ids])];
      await tx.conversationParticipant.createMany({
        data: allParticipantIds.map(participantId => ({
          conversation_id: conversation.id,
          user_id: participantId
        }))
      });

      // Créer le message initial
      const initialMsg = await tx.message.create({
        data: {
          conversation_id: conversation.id,
          sender_id: userId,
          content: initial_message.trim()
        }
      });

      return { conversation, initialMessage: initialMsg };
    });

    // Récupérer la conversation complète pour la réponse
    const fullConversation = await prisma.conversation.findUnique({
      where: { id: result.conversation.id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                hospital: { select: { name: true } },
                laboratory: { select: { name: true } }
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true
              }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    // Notifier les participants de la nouvelle conversation via WebSocket
    try {
      const { sendRealtimeNotificationToUsers } = require('../services/websocketService');
      const notificationData = {
        id: 0,
        type: 'new_conversation',
        title: 'Nouvelle conversation',
        message: `${req.user.first_name || 'Un utilisateur'} vous a ajouté à une nouvelle conversation : ${conversationTitle}`,
        data: { conversationId: result.conversation.id, conversationTitle },
        is_read: false,
        created_at: new Date().toISOString()
      };
      sendRealtimeNotificationToUsers(participant_ids, notificationData);
    } catch (error) {
      console.error('Erreur notification nouvelle conversation:', error);
    }

    res.status(201).json({
      success: true,
      message: 'Conversation créée avec succès',
      data: { conversation: fullConversation }
    });

  } catch (error) {
    console.error('Erreur création conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👁️ OBTENIR UNE CONVERSATION SPÉCIFIQUE
 * GET /api/messages/conversations/:id
 */
const getConversation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const conversationId = parseInt(req.params.id);

    // Vérifier que l'utilisateur fait partie de la conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participation) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette conversation'
      });
    }

    // Récupérer la conversation complète
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true,
                hospital: { select: { name: true } },
                laboratory: { select: { name: true } }
              }
            }
          }
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                role: true
              }
            }
          },
          orderBy: { created_at: 'asc' }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }

    res.json({
      success: true,
      data: { conversation }
    });

  } catch (error) {
    console.error('Erreur récupération conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES MESSAGES
// ============================================================================

/**
 * 📨 ENVOYER UN MESSAGE
 * POST /api/messages/conversations/:id/messages
 */
const sendMessage = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const conversationId = parseInt(req.params.id);
    const { content } = req.body;

    // Validation du contenu
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Contenu du message requis'
      });
    }

    if (content.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message trop long (maximum 2000 caractères)'
      });
    }

    // Vérifier que l'utilisateur fait partie de la conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participation) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne faites pas partie de cette conversation'
      });
    }

    // Créer le message
    const message = await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: content.trim()
      },
      include: {
        sender: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            role: true
          }
        }
      }
    });

    // Créer les notifications pour les autres participants
    try {
      await notifyNewMessage(message.id, userId);
    } catch (notificationError) {
      console.error('Erreur création notification message:', notificationError);
      // Ne pas faire échouer l'envoi du message si la notification échoue
    }

    // Envoyer le message en temps réel via WebSocket
    try {
      sendRealtimeMessage(conversationId, message, userId);
    } catch (websocketError) {
      console.error('Erreur envoi message temps réel:', websocketError);
      // Ne pas faire échouer l'envoi si le WebSocket échoue
    }

    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: { message }
    });

  } catch (error) {
    console.error('Erreur envoi message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER LES MESSAGES D'UNE CONVERSATION
 * GET /api/messages/conversations/:id/messages
 */
const getMessages = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const conversationId = parseInt(req.params.id);
    const { page = 1, limit = 50, before } = req.query;

    // Vérifier que l'utilisateur fait partie de la conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participation) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à cette conversation'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    let whereClause = { conversation_id: conversationId };

    // Pagination par curseur (pour charger les messages plus anciens)
    if (before) {
      whereClause.created_at = {
        lt: new Date(before)
      };
    }

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: whereClause,
        include: {
          sender: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              role: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.message.count({ where: { conversation_id: conversationId } })
    ]);

    // Inverser l'ordre pour avoir les plus récents en dernier
    const orderedMessages = messages.reverse();

    res.json({
      success: true,
      data: {
        messages: orderedMessages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + messages.length < total
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération messages:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// GESTION DES PARTICIPANTS
// ============================================================================

/**
 * 👥 AJOUTER UN PARTICIPANT À UNE CONVERSATION
 * POST /api/messages/conversations/:id/participants
 */
const addParticipant = async (req, res) => {
  try {
    const { id: userId, role: userRole } = req.user;
    const conversationId = parseInt(req.params.id);
    const { user_id: newParticipantId } = req.body;

    // Vérifier que l'utilisateur fait partie de la conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participation) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne faites pas partie de cette conversation'
      });
    }

    // Seuls les admins et le créateur peuvent ajouter des participants
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId }
    });

    if (conversation.created_by !== userId && !['super_admin', 'hospital_admin', 'lab_admin'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Seul le créateur ou un admin peut ajouter des participants'
      });
    }

    // Vérifier que le nouveau participant existe
    const newParticipant = await prisma.user.findUnique({
      where: { id: newParticipantId, is_active: true },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        role: true,
        hospital_id: true,
        laboratory_id: true
      }
    });

    if (!newParticipant) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Vérifier qu'il n'est pas déjà participant
    const existingParticipation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: newParticipantId
      }
    });

    if (existingParticipation) {
      return res.status(400).json({
        success: false,
        message: 'Cet utilisateur fait déjà partie de la conversation'
      });
    }

    // Ajouter le participant
    await prisma.conversationParticipant.create({
      data: {
        conversation_id: conversationId,
        user_id: newParticipantId
      }
    });

    // Créer un message système pour notifier l'ajout
    await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: `${newParticipant.first_name} ${newParticipant.last_name} a été ajouté(e) à la conversation`
      }
    });

    res.json({
      success: true,
      message: 'Participant ajouté avec succès'
    });

  } catch (error) {
    console.error('Erreur ajout participant:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🚪 QUITTER UNE CONVERSATION
 * DELETE /api/messages/conversations/:id/participants/me
 */
const leaveConversation = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const conversationId = parseInt(req.params.id);

    // Vérifier que l'utilisateur fait partie de la conversation
    const participation = await prisma.conversationParticipant.findFirst({
      where: {
        conversation_id: conversationId,
        user_id: userId
      }
    });

    if (!participation) {
      return res.status(404).json({
        success: false,
        message: 'Vous ne faites pas partie de cette conversation'
      });
    }

    // Supprimer la participation
    await prisma.conversationParticipant.delete({
      where: { id: participation.id }
    });

    // Créer un message système pour notifier le départ
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { first_name: true, last_name: true }
    });

    await prisma.message.create({
      data: {
        conversation_id: conversationId,
        sender_id: userId,
        content: `${user.first_name} ${user.last_name} a quitté la conversation`
      }
    });

    res.json({
      success: true,
      message: 'Vous avez quitté la conversation'
    });

  } catch (error) {
    console.error('Erreur quitter conversation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// RECHERCHE ET CONTACTS
// ============================================================================

/**
 * 🔍 RECHERCHER DES UTILISATEURS POUR DÉMARRER UNE CONVERSATION
 * GET /api/messages/contacts
 */
const searchContacts = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { search, role: roleFilter, page = 1, limit = 20 } = req.query;

    if (!search || search.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Recherche requise (minimum 2 caractères)'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const whereClause = {
      id: { not: userId },
      is_active: true,
      OR: [
        { first_name: { contains: search.trim() } },
        { last_name: { contains: search.trim() } },
        { email: { contains: search.trim() } }
      ]
    };

    if (roleFilter) {
      whereClause.role = roleFilter;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          role: true,
          hospital: {
            select: { name: true }
          },
          laboratory: {
            select: { name: true }
          }
        },
        skip,
        take,
        orderBy: [
          { first_name: 'asc' },
          { last_name: 'asc' }
        ]
      }),
      prisma.user.count({ where: whereClause })
    ]);

    const contacts = users.map(user => ({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.email,
      role: user.role,
      establishment: user.hospital?.name || user.laboratory?.name || null
    }));

    res.json({
      success: true,
      data: {
        contacts,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur recherche contacts:', error);
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
  getConversations,
  createConversation,
  getConversation,
  sendMessage,
  getMessages,
  addParticipant,
  leaveConversation,
  searchContacts
};

/**
 * Vérifier les permissions de communication entre utilisateurs
 */
const checkCommunicationPermissions = async (user, targetParticipantIds) => {
  // Le super admin peut communiquer avec tout le monde
  if (user.role === 'super_admin') {
    return true;
  }
  
  // Récupérer les utilisateurs cibles
  const targetUsers = await prisma.user.findMany({
    where: { id: { in: targetParticipantIds }, is_active: true }
  });

  // Vérifier les règles de communication selon le rôle de l'utilisateur
  switch (user.role) {
    case 'patient':
      // Un patient peut communiquer avec :
      // - d'autres patients
      // - des médecins (hospital_staff)
      // - des laborantins (lab_staff)
      // - le super admin
      return targetUsers.every(u => 
        u.role === 'patient' || 
        u.role === 'hospital_staff' || 
        u.role === 'lab_staff' || 
        u.role === 'super_admin'
      );
    
    case 'hospital_staff':
    case 'lab_staff':
      // Les médecins et laborantins peuvent communiquer avec :
      // - des utilisateurs du même hôpital ou laboratoire
      // - des médecins et laborantins d'autres établissements
      // - des admins de leur établissement
      // - le super admin
      const userEstablishment = user.hospital_id || user.laboratory_id;
      return targetUsers.every(u => {
        const targetEstablishment = u.hospital_id || u.laboratory_id;
        
        return (
          // Même utilisateur
          u.id === user.id ||
          // Même établissement
          targetEstablishment === userEstablishment ||
          // Médecin ou laborantin d'autres établissements
          (u.role === 'hospital_staff' || u.role === 'lab_staff') ||
          // Admins de l'établissement
          (u.role === 'hospital_admin' && u.hospital_id === user.hospital_id) ||
          (u.role === 'lab_admin' && u.laboratory_id === user.laboratory_id) ||
          // Super admin
          u.role === 'super_admin'
        );
      });
    
    case 'hospital_admin':
    case 'lab_admin':
      // Les admins d'hôpital ou de laboratoire peuvent communiquer avec :
      // - tous les utilisateurs de leur établissement
      // - le super admin
      const adminEstablishmentId = user.hospital_id || user.laboratory_id;
      return targetUsers.every(u => {
        const targetEstablishmentId = u.hospital_id || u.laboratory_id;
        
        return (
          // Même utilisateur
          u.id === user.id ||
          // Utilisateurs de leur établissement
          (u.hospital_id === user.hospital_id || u.laboratory_id === user.laboratory_id) ||
          // Super admin
          u.role === 'super_admin'
        );
      });
    
    default:
      return false;
  }
};
