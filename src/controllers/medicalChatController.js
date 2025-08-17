// ============================================================================
// CONTRÔLEUR CHAT MÉDICAL - ENDPOINTS API
// ============================================================================
// 🎯 Contrôleur pour gérer les endpoints du chat médical avec bot IA
// 📅 Créé le : 12 Août 2025

const { validationResult } = require('express-validator');
const medicalChatService = require('../services/medicalChatService');
const openRouterService = require('../services/openRouterService');

class MedicalChatController {
  /**
   * Crée une nouvelle session de chat médical
   * POST /api/medical-chat/sessions
   */
  async createSession(req, res) {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { message } = req.body;
      const userId = req.user.id;

      // Récupération du patient associé à l'utilisateur
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Seuls les patients peuvent utiliser le chat médical'
        });
      }

      // Création de la session
      const result = await medicalChatService.createChatSession(patient.id, message);

      res.status(201).json({
        success: true,
        message: 'Session de chat créée avec succès',
        data: result
      });

    } catch (error) {
      console.error('Erreur création session chat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la création de la session de chat',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Envoie un message dans une session existante
   * POST /api/medical-chat/sessions/:sessionId/messages
   */
  async sendMessage(req, res) {
    try {
      // Validation des erreurs
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: errors.array()
        });
      }

      const { sessionId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;

      // Récupération du patient
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Envoi du message
      const result = await medicalChatService.sendMessage(
        parseInt(sessionId),
        patient.id,
        message
      );

      res.json({
        success: true,
        message: 'Message envoyé avec succès',
        data: result
      });

    } catch (error) {
      console.error('Erreur envoi message:', error);
      
      if (error.message === 'Session non trouvée ou inactive') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi du message',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupère une session de chat avec son historique
   * GET /api/medical-chat/sessions/:sessionId
   */
  async getSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Récupération du patient
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Récupération de la session
      const result = await medicalChatService.getChatSession(
        parseInt(sessionId),
        patient.id
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Erreur récupération session:', error);
      
      if (error.message === 'Session non trouvée') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupère toutes les sessions d'un patient
   * GET /api/medical-chat/sessions
   */
  async getSessions(req, res) {
    try {
      const userId = req.user.id;

      // Récupération du patient
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Récupération des sessions
      const result = await medicalChatService.getPatientChatSessions(patient.id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Erreur récupération sessions:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des sessions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Termine une session de chat
   * PUT /api/medical-chat/sessions/:sessionId/end
   */
  async endSession(req, res) {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;

      // Récupération du patient
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Fin de session
      const result = await medicalChatService.endChatSession(
        parseInt(sessionId),
        patient.id
      );

      res.json({
        success: true,
        message: 'Session terminée avec succès',
        data: result
      });

    } catch (error) {
      console.error('Erreur fin de session:', error);
      
      if (error.message === 'Session non trouvée') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la fin de session',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupère les statistiques d'utilisation du chat médical
   * GET /api/medical-chat/statistics
   */
  async getStatistics(req, res) {
    try {
      const userId = req.user.id;

      // Récupération du patient
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      
      const patient = await prisma.patient.findUnique({
        where: { user_id: userId }
      });

      if (!patient) {
        return res.status(403).json({
          success: false,
          message: 'Accès refusé'
        });
      }

      // Récupération des statistiques
      const result = await medicalChatService.getChatStatistics(patient.id);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Erreur statistiques chat:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Vérifie la santé du service OpenRouter
   * GET /api/medical-chat/health
   */
  async checkHealth(req, res) {
    try {
      const health = await openRouterService.checkHealth();
      
      res.json({
        success: true,
        service: 'medical-chat',
        openrouter_status: health.status,
        models_available: health.modelsAvailable || 0,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Erreur vérification santé:', error);
      res.status(500).json({
        success: false,
        service: 'medical-chat',
        openrouter_status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }
}

module.exports = new MedicalChatController();