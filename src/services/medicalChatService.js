// ============================================================================
// SERVICE CHAT MÉDICAL - GESTION DES SESSIONS
// ============================================================================
// 🎯 Service pour gérer les sessions de chat médical avec le bot IA
// 📅 Créé le : 12 Août 2025

const { PrismaClient } = require('@prisma/client');
const openRouterService = require('./openRouterService');
const notificationService = require('./notificationService');

const prisma = new PrismaClient();

class MedicalChatService {
  /**
   * Crée une nouvelle session de chat médical
   * @param {number} patientId - ID du patient
   * @param {string} firstMessage - Premier message du patient
   * @returns {Object} Session créée avec premier échange
   */
  async createChatSession(patientId, firstMessage) {
    try {
      // Vérification que l'utilisateur est bien un patient
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: { id: true, first_name: true, last_name: true, role: true }
          }
        }
      });

      if (!patient) {
        throw new Error('Patient non trouvé');
      }

      if (patient.user.role !== 'patient') {
        throw new Error('Seuls les patients peuvent utiliser le chat médical');
      }

      // Génération du titre de session
      const sessionTitle = await openRouterService.generateSessionTitle(firstMessage);

      // Création de la session
      const session = await prisma.medicalChatSession.create({
        data: {
          patient_id: patientId,
          session_title: sessionTitle,
          is_active: true
        }
      });

      // Ajout du premier message du patient
      const patientMessage = await prisma.medicalChatMessage.create({
        data: {
          session_id: session.id,
          sender_type: 'patient',
          content: firstMessage
        }
      });

      // Récupération du contexte médical du patient
      const medicalContext = await this.getPatientMedicalContext(patientId);

      // Génération de la réponse du bot
      const botResponse = await openRouterService.generateMedicalResponse(
        firstMessage,
        [],
        medicalContext
      );

      // Sauvegarde de la réponse du bot
      const botMessage = await prisma.medicalChatMessage.create({
        data: {
          session_id: session.id,
          sender_type: 'bot',
          content: botResponse.content,
          model_used: botResponse.metadata.model,
          tokens_used: botResponse.metadata.tokensUsed,
          response_time: botResponse.metadata.responseTime,
          medical_context: JSON.stringify(botResponse.medicalContext),
          confidence_score: botResponse.metadata.confidenceScore
        }
      });

      return {
        success: true,
        session: {
          id: session.id,
          title: session.session_title,
          created_at: session.created_at,
          is_active: session.is_active
        },
        messages: [
          {
            id: patientMessage.id,
            sender_type: 'patient',
            content: patientMessage.content,
            created_at: patientMessage.created_at
          },
          {
            id: botMessage.id,
            sender_type: 'bot',
            content: botMessage.content,
            created_at: botMessage.created_at,
            confidence_score: botMessage.confidence_score
          }
        ]
      };

    } catch (error) {
      console.error('Erreur création session chat:', error);
      throw error;
    }
  }

  /**
   * Envoie un message dans une session existante
   * @param {number} sessionId - ID de la session
   * @param {number} patientId - ID du patient
   * @param {string} message - Message du patient
   * @returns {Object} Nouveau message et réponse du bot
   */
  async sendMessage(sessionId, patientId, message) {
    try {
      // Vérification de la session
      const session = await prisma.medicalChatSession.findFirst({
        where: {
          id: sessionId,
          patient_id: patientId,
          is_active: true
        },
        include: {
          messages: {
            orderBy: { created_at: 'asc' },
            take: 20 // Derniers 20 messages pour le contexte
          }
        }
      });

      if (!session) {
        throw new Error('Session non trouvée ou inactive');
      }

      // Ajout du message du patient
      const patientMessage = await prisma.medicalChatMessage.create({
        data: {
          session_id: sessionId,
          sender_type: 'patient',
          content: message
        }
      });

      // Récupération du contexte médical
      const medicalContext = await this.getPatientMedicalContext(patientId);

      // Génération de la réponse du bot avec historique
      const botResponse = await openRouterService.generateMedicalResponse(
        message,
        session.messages,
        medicalContext
      );

      // Sauvegarde de la réponse du bot
      const botMessage = await prisma.medicalChatMessage.create({
        data: {
          session_id: sessionId,
          sender_type: 'bot',
          content: botResponse.content,
          model_used: botResponse.metadata.model,
          tokens_used: botResponse.metadata.tokensUsed,
          response_time: botResponse.metadata.responseTime,
          medical_context: JSON.stringify(botResponse.medicalContext),
          confidence_score: botResponse.metadata.confidenceScore
        }
      });

      // Mise à jour de la session
      await prisma.medicalChatSession.update({
        where: { id: sessionId },
        data: { updated_at: new Date() }
      });

      return {
        success: true,
        messages: [
          {
            id: patientMessage.id,
            sender_type: 'patient',
            content: patientMessage.content,
            created_at: patientMessage.created_at
          },
          {
            id: botMessage.id,
            sender_type: 'bot',
            content: botMessage.content,
            created_at: botMessage.created_at,
            confidence_score: botMessage.confidence_score
          }
        ]
      };

    } catch (error) {
      console.error('Erreur envoi message:', error);
      throw error;
    }
  }

  /**
   * Récupère l'historique d'une session de chat
   * @param {number} sessionId - ID de la session
   * @param {number} patientId - ID du patient
   * @returns {Object} Session avec messages
   */
  async getChatSession(sessionId, patientId) {
    try {
      const session = await prisma.medicalChatSession.findFirst({
        where: {
          id: sessionId,
          patient_id: patientId
        },
        include: {
          messages: {
            orderBy: { created_at: 'asc' },
            select: {
              id: true,
              sender_type: true,
              content: true,
              created_at: true,
              confidence_score: true
            }
          }
        }
      });

      if (!session) {
        throw new Error('Session non trouvée');
      }

      return {
        success: true,
        session: {
          id: session.id,
          title: session.session_title,
          is_active: session.is_active,
          created_at: session.created_at,
          updated_at: session.updated_at,
          messages: session.messages
        }
      };

    } catch (error) {
      console.error('Erreur récupération session:', error);
      throw error;
    }
  }

  /**
   * Récupère toutes les sessions d'un patient
   * @param {number} patientId - ID du patient
   * @returns {Array} Liste des sessions
   */
  async getPatientChatSessions(patientId) {
    try {
      const sessions = await prisma.medicalChatSession.findMany({
        where: { patient_id: patientId },
        orderBy: { updated_at: 'desc' },
        select: {
          id: true,
          session_title: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: { messages: true }
          }
        }
      });

      return {
        success: true,
        sessions: sessions.map(session => ({
          id: session.id,
          title: session.session_title,
          is_active: session.is_active,
          created_at: session.created_at,
          updated_at: session.updated_at,
          message_count: session._count.messages
        }))
      };

    } catch (error) {
      console.error('Erreur récupération sessions:', error);
      throw error;
    }
  }

  /**
   * Termine une session de chat
   * @param {number} sessionId - ID de la session
   * @param {number} patientId - ID du patient
   * @returns {Object} Confirmation
   */
  async endChatSession(sessionId, patientId) {
    try {
      const session = await prisma.medicalChatSession.findFirst({
        where: {
          id: sessionId,
          patient_id: patientId
        }
      });

      if (!session) {
        throw new Error('Session non trouvée');
      }

      await prisma.medicalChatSession.update({
        where: { id: sessionId },
        data: {
          is_active: false,
          ended_at: new Date()
        }
      });

      return {
        success: true,
        message: 'Session terminée avec succès'
      };

    } catch (error) {
      console.error('Erreur fin de session:', error);
      throw error;
    }
  }

  /**
   * Récupère le contexte médical d'un patient pour enrichir les réponses du bot
   * @param {number} patientId - ID du patient
   * @returns {Object} Contexte médical
   */
  async getPatientMedicalContext(patientId) {
    try {
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          user: {
            select: { first_name: true, last_name: true }
          },
          documents: {
            where: {
              created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
              }
            },
            select: {
              document_type: true,
              created_at: true,
              description: true
            },
            orderBy: { created_at: 'desc' },
            take: 5
          },
          exam_requests: {
            where: {
              created_at: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 derniers jours
              }
            },
            select: {
              exam_type: true,
              status: true,
              created_at: true
            },
            orderBy: { created_at: 'desc' },
            take: 5
          }
        }
      });

      if (!patient) {
        return {};
      }

      // Calcul de l'âge approximatif
      let age = null;
      if (patient.date_of_birth) {
        const today = new Date();
        const birthDate = new Date(patient.date_of_birth);
        age = today.getFullYear() - birthDate.getFullYear();
      }

      return {
        patientName: `${patient.user.first_name} ${patient.user.last_name}`,
        age: age,
        gender: patient.gender,
        recentDocuments: patient.documents,
        recentExams: patient.exam_requests
      };

    } catch (error) {
      console.error('Erreur récupération contexte médical:', error);
      return {};
    }
  }

  /**
   * Statistiques d'utilisation du chat médical
   * @param {number} patientId - ID du patient (optionnel, pour stats globales si omis)
   * @returns {Object} Statistiques
   */
  async getChatStatistics(patientId = null) {
    try {
      const whereClause = patientId ? { patient_id: patientId } : {};

      const stats = await prisma.medicalChatSession.aggregate({
        where: whereClause,
        _count: { id: true },
        _avg: { 
          messages: {
            _count: true
          }
        }
      });

      const totalMessages = await prisma.medicalChatMessage.count({
        where: patientId ? {
          session: { patient_id: patientId }
        } : {}
      });

      return {
        success: true,
        statistics: {
          total_sessions: stats._count.id,
          total_messages: totalMessages,
          active_sessions: await prisma.medicalChatSession.count({
            where: { ...whereClause, is_active: true }
          })
        }
      };

    } catch (error) {
      console.error('Erreur statistiques chat:', error);
      throw error;
    }
  }
}

module.exports = new MedicalChatService();