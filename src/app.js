// 🚀 APPLICATION BACKEND MVP - ARCHITECTURE SANTÉ
// 📅 Créé le : 11 Août 2025
// 🎯 Architecture unifiée pour l'application de santé

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit'); // Désactivé pour les tests
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

// Import des routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const adminPatientsRoutes = require('./routes/adminPatients');
const messageRoutes = require('./routes/messages');
const documentRoutes = require('./routes/documents');
const examRequestRoutes = require('./routes/examRequests');
const notificationRoutes = require('./routes/notifications');
const medicalChatRoutes = require('./routes/medicalChat');
const establishmentsRoutes = require('./routes/establishments');

const app = express();
const prisma = new PrismaClient();

// ============================================================================
// MIDDLEWARE DE SÉCURITÉ
// ============================================================================

// Headers de sécurité
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Configuration CORS
app.use(cors({
  origin: [
    'http://localhost:8100',
    'http://localhost:4200',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting désactivé pour les tests
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 10, // 10 tentatives par IP
//   message: {
//     success: false,
//     message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.'
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // 100 requêtes par IP
//   message: {
//     success: false,
//     message: 'Trop de requêtes. Réessayez plus tard.'
//   }
// });

// ============================================================================
// MIDDLEWARE DE PARSING
// ============================================================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================================================
// ROUTES
// ============================================================================

// Route de santé de l'API
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API MVP Santé opérationnelle',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes d'authentification (rate limiting désactivé)
app.use('/api/auth', authRoutes);

// Routes utilisateurs (rate limiting désactivé)
app.use('/api/users', userRoutes);

// Routes d'administration (rate limiting désactivé)
app.use('/api/admin', adminRoutes);

// Routes de gestion des patients par les admins
app.use('/api/admin/patients', adminPatientsRoutes);

// Routes de messagerie (rate limiting désactivé)
app.use('/api/messages', messageRoutes);

// Routes de gestion des documents
app.use('/api/documents', documentRoutes);

// Routes de demandes d'examens de laboratoire
app.use('/api/exam-requests', examRequestRoutes);

// Routes de notifications
app.use('/api/notifications', notificationRoutes);

// Routes de chat médical avec bot IA
app.use('/api/medical-chat', medicalChatRoutes);

// Routes des établissements de santé
app.use('/api/establishments', establishmentsRoutes);

// Import du service de géocodage
const geocodingService = require('./services/geocodingService');

// ============================================================================
// GESTION DES ERREURS
// ============================================================================

// Route non trouvée
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    availableRoutes: [
      'GET /api/health',
      'POST /api/auth/login',
      'POST /api/auth/register',
      'GET /api/auth/profile',
      'GET /api/users/hospitals',
      'GET /api/users/laboratories',
      'GET /api/admin/dashboard',
      'GET /api/admin/users',
      'POST /api/admin/users',
      'GET /api/admin/hospitals',
      'POST /api/admin/hospitals',
      'GET /api/admin/laboratories',
      'POST /api/admin/laboratories',
      'GET /api/admin/patients',
      'POST /api/admin/patients',
      'GET /api/messages/conversations',
      'POST /api/messages/conversations',
      'GET /api/messages/contacts',
      'POST /api/documents/upload',
      'GET /api/documents/patient/:id',
      'GET /api/documents/:id/view',
      'GET /api/documents/:id/ai-explanation',
      'GET /api/establishments',
      'GET /api/establishments/search?q=terme',
      'GET /api/medical-chat/sessions',
      'POST /api/medical-chat/sessions',
      'GET /api/medical-chat/health'
    ]
  });
});

// Middleware global de gestion des erreurs
app.use((err, req, res, next) => {
  console.error('🚨 Erreur serveur:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Erreurs Prisma
  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      message: 'Erreur de base de données',
      error: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne'
    });
  }

  // Erreurs de validation
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Données invalides',
      errors: err.details || err.message
    });
  }

  // Erreur générique
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erreur interne du serveur',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// DÉMARRAGE DU SERVEUR
// ============================================================================

const PORT = process.env.PORT || 3000;

// Test de connexion à la base de données au démarrage
async function startServer() {
  try {
    // Test de connexion Prisma
    await prisma.$connect();
    console.log('✅ Connexion à la base de données réussie');

    // Test de requête simple
    const userCount = await prisma.user.count();
    console.log(`📊 ${userCount} utilisateurs dans la base de données`);

    // Démarrage du serveur
    app.listen(PORT, () => {
      console.log('🚀 ================================');
      console.log('🏥 API MVP SANTÉ DÉMARRÉE');
      console.log('🚀 ================================');
      console.log(`📡 Serveur: http://localhost:${PORT}`);
      console.log(`🌍 Environnement: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de données: ${userCount} utilisateurs`);
      console.log(`⏰ Démarré le: ${new Date().toLocaleString('fr-FR')}`);
      console.log('🚀 ================================');
    });

  } catch (error) {
    console.error('❌ Erreur au démarrage:', error);
    console.error('💡 Vérifiez:');
    console.error('   - La base de données est-elle démarrée ?');
    console.error('   - Le fichier .env est-il configuré ?');
    console.error('   - La base de données existe-t-elle ?');
    process.exit(1);
  }
}

// Gestion de la fermeture propre
process.on('SIGINT', async () => {
  console.log('\n🔄 Arrêt du serveur en cours...');
  await prisma.$disconnect();
  console.log('✅ Connexion base de données fermée');
  console.log('👋 Serveur arrêté proprement');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Signal SIGTERM reçu, arrêt du serveur...');
  await prisma.$disconnect();
  process.exit(0);
});

// Démarrer le serveur
startServer();

module.exports = app;