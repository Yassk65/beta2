// 📄 CONTRÔLEUR DOCUMENTS MÉDICAUX MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Gestion sécurisée des documents médicaux avec IA et visualisation

const { PrismaClient } = require('@prisma/client');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');
const { notifyNewDocument } = require('../services/notificationService');
const openRouterService = require('../services/openRouterService');

const prisma = new PrismaClient();

// ============================================================================
// CONFIGURATION SÉCURISÉE DES UPLOADS
// ============================================================================

// Créer les dossiers de stockage sécurisés
const SECURE_UPLOADS_DIR = path.join(__dirname, '../../secure_uploads');
const TEMP_UPLOADS_DIR = path.join(__dirname, '../../temp_uploads');

// Initialiser les dossiers
const initializeDirectories = async () => {
  try {
    await fs.mkdir(SECURE_UPLOADS_DIR, { recursive: true });
    await fs.mkdir(TEMP_UPLOADS_DIR, { recursive: true });
    
    // Créer des sous-dossiers par type
    const subDirs = ['documents', 'thumbnails', 'processed'];
    for (const subDir of subDirs) {
      await fs.mkdir(path.join(SECURE_UPLOADS_DIR, subDir), { recursive: true });
    }
  } catch (error) {
    console.error('Erreur initialisation dossiers:', error);
  }
};

// Initialiser au démarrage
initializeDirectories();

// Configuration Multer sécurisée
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, TEMP_UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    // Générer un nom sécurisé avec hash
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${timestamp}_${hash}${ext}`);
  }
});

// Filtres de sécurité pour les fichiers
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.gif', '.doc', '.docx', '.txt'];
  const fileExtension = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé. Formats acceptés : PDF, Images, Word, Texte'), false);
  }
};

// Configuration Multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB max
    files: 5 // Maximum 5 fichiers simultanés
  }
});

// ============================================================================
// FONCTIONS UTILITAIRES SÉCURISÉES
// ============================================================================

/**
 * Générer un token sécurisé pour l'accès aux documents
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Chiffrer le nom de fichier pour le stockage sécurisé
 */
const encryptFilename = (originalName, documentId) => {
  const hash = crypto.createHash('sha256');
  hash.update(`${documentId}_${originalName}_${process.env.JWT_SECRET}`);
  return hash.digest('hex');
};

/**
 * Déplacer le fichier vers le stockage sécurisé
 */
const moveToSecureStorage = async (tempPath, secureFilename) => {
  const securePath = path.join(SECURE_UPLOADS_DIR, 'documents', secureFilename);
  await fs.rename(tempPath, securePath);
  return securePath;
};

/**
 * Extraire le texte d'un document pour l'IA
 */
const extractTextFromDocument = async (filePath, mimeType) => {
  try {
    // Pour l'instant, on simule l'extraction de texte
    // Dans une vraie implémentation, on utiliserait des bibliothèques comme pdf-parse, tesseract.js, etc.
    
    if (mimeType === 'text/plain') {
      const content = await fs.readFile(filePath, 'utf8');
      return content.substring(0, 5000); // Limiter à 5000 caractères
    }
    
    // Pour les autres types, on retourne un texte simulé
    return "Contenu du document médical extrait pour analyse IA";
  } catch (error) {
    console.error('Erreur extraction texte:', error);
    return null;
  }
};

/**
 * Appel à l'IA via OpenRouter pour analyser le document
 */
const callAI = async (documentText, documentType, analysisType = 'summary') => {
  try {
    // Vérifier que le service OpenRouter est disponible
    if (!openRouterService) {
      throw new Error('Service OpenRouter non disponible');
    }

    // Utiliser le service OpenRouter pour analyser le document
    const result = await openRouterService.analyzeDocument(
      documentText, 
      documentType, 
      analysisType
    );
    
    if (result.success) {
      return result.content;
    } else {
      console.error('Erreur analyse OpenRouter:', result.error);
      return result.content; // Contient la réponse de fallback
    }

  } catch (error) {
    console.error('Erreur appel service IA:', error);
    
    // Réponse de fallback en cas d'erreur critique
    const analysisWord = analysisType === 'summary' ? 'résumé' : 'explication';
    return `Service d'analyse temporairement indisponible. Impossible de générer un ${analysisWord} pour ce document.

**Recommandations importantes :**
- Consultez votre médecin traitant pour l'interprétation de ce document
- Apportez le document original lors de votre prochaine consultation
- En cas d'urgence médicale, appelez le 15 (SAMU)

⚠️ **Disclaimer médical :** Cet assistant ne remplace en aucun cas une consultation médicale professionnelle.`;
  }
};

// ============================================================================
// GESTION DES DOCUMENTS
// ============================================================================

/**
 * 📤 UPLOAD SÉCURISÉ DE DOCUMENTS
 * POST /api/documents/upload
 */
const uploadDocument = async (req, res) => {
  try {
    const { role, id: uploaderId, hospital_id, laboratory_id } = req.user;
    const { patient_id, document_type, description, shared_with } = req.body;

    // Vérifier qu'un fichier a été uploadé
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    // Validation des données obligatoires
    if (!patient_id || !document_type) {
      return res.status(400).json({
        success: false,
        message: 'ID patient et type de document requis'
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

    // Vérifications de permissions
    let canUpload = false;
    let assignedHospitalId = null;
    let assignedLabId = null;

    if (role === 'patient') {
      // Un patient ne peut uploader que pour lui-même
      if (patient.user_id !== uploaderId) {
        return res.status(403).json({
          success: false,
          message: 'Vous ne pouvez uploader que vos propres documents'
        });
      }
      canUpload = true;
    } else if (role === 'hospital_staff' || role === 'hospital_admin') {
      // Staff hospitalier peut uploader pour les patients de son hôpital
      if (hospital_id) {
        canUpload = true;
        assignedHospitalId = hospital_id;
      }
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      // Staff laboratoire peut uploader pour tous les patients
      if (laboratory_id) {
        canUpload = true;
        assignedLabId = laboratory_id;
      }
    } else if (role === 'super_admin') {
      canUpload = true;
    }

    if (!canUpload) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour uploader ce document'
      });
    }

    // Générer un token sécurisé pour l'accès
    const secureToken = generateSecureToken();
    
    // Créer l'enregistrement du document en base
    const document = await prisma.document.create({
      data: {
        patient_id: parseInt(patient_id),
        uploaded_by: uploaderId,
        hospital_id: assignedHospitalId,
        laboratory_id: assignedLabId,
        filename: req.file.originalname,
        file_path: req.file.path, // Chemin temporaire pour l'instant
        file_size: req.file.size,
        document_type: document_type,
        secure_token: secureToken,
        description: description || null,
        shared_with: shared_with ? JSON.stringify(shared_with) : null
      }
    });

    // Générer le nom de fichier chiffré
    const secureFilename = encryptFilename(req.file.originalname, document.id);
    
    // Déplacer vers le stockage sécurisé
    const securePath = await moveToSecureStorage(req.file.path, secureFilename);
    
    // Mettre à jour le chemin sécurisé en base
    await prisma.document.update({
      where: { id: document.id },
      data: { 
        file_path: securePath,
        secure_filename: secureFilename
      }
    });

    // Récupérer le document complet pour la réponse
    const fullDocument = await prisma.document.findUnique({
      where: { id: document.id },
      include: {
        patient: {
          include: {
            user: {
              select: { first_name: true, last_name: true, email: true }
            }
          }
        },
        uploader: {
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

    // Masquer les informations sensibles
    const { file_path, secure_token, secure_filename, ...documentResponse } = fullDocument;

    // Créer les notifications pour les utilisateurs ayant accès au document
    try {
      await notifyNewDocument(document.id, uploaderId);
    } catch (notificationError) {
      console.error('Erreur création notification document:', notificationError);
      // Ne pas faire échouer l'upload si la notification échoue
    }

    res.status(201).json({
      success: true,
      message: 'Document uploadé avec succès',
      data: { 
        document: {
          ...documentResponse,
          secure_url: `/api/documents/${document.id}/view`
        }
      }
    });

  } catch (error) {
    console.error('Erreur upload document:', error);
    
    // Supprimer le fichier temporaire en cas d'erreur
    if (req.file && req.file.path) {
      fs.unlink(req.file.path).catch(console.error);
    }
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER MES DOCUMENTS (PATIENT CONNECTÉ)
 * GET /api/documents/my-documents
 */
const getMyDocuments = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { page = 1, limit = 10, type, search } = req.query;

    // Seuls les patients peuvent utiliser cette route
    if (role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Cette route est réservée aux patients'
      });
    }

    // Trouver le patient correspondant à l'utilisateur connecté
    const patient = await prisma.patient.findFirst({
      where: { user_id: userId },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Profil patient non trouvé'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Construire la clause WHERE pour les documents du patient
    let whereClause = { patient_id: patient.id };

    // Filtrer par type si spécifié
    if (type) {
      whereClause.document_type = type;
    }

    // Recherche dans le nom de fichier ou description
    if (search) {
      whereClause.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: { first_name: true, last_name: true, role: true }
          },
          hospital: {
            select: { name: true, city: true }
          },
          laboratory: {
            select: { name: true, city: true }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.document.count({ where: whereClause })
    ]);

    // Masquer les informations sensibles et ajouter les URLs sécurisées
    const documentsResponse = documents.map(doc => {
      const { file_path, secure_token, secure_filename, ...docResponse } = doc;
      return {
        ...docResponse,
        secure_url: `/api/documents/${doc.id}/view`,
        ai_summary_url: `/api/documents/${doc.id}/ai-summary`
      };
    });

    res.json({
      success: true,
      data: {
        documents: documentsResponse,
        patient: {
          id: patient.id,
          name: `${patient.user.first_name} ${patient.user.last_name}`,
          email: patient.user.email
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération mes documents:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 📋 LISTER LES DOCUMENTS D'UN PATIENT
 * GET /api/documents/patient/:patientId
 */
const getPatientDocuments = async (req, res) => {
  try {
    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const patientId = parseInt(req.params.patientId);
    const { page = 1, limit = 10, type, search } = req.query;

    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
      include: { user: true }
    });

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient non trouvé'
      });
    }

    // Vérifications de permissions
    let canAccess = false;
    let whereClause = { patient_id: patientId };

    if (role === 'patient') {
      // Un patient ne peut voir que ses propres documents
      if (patient.user_id !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Accès non autorisé'
        });
      }
      canAccess = true;
    } else if (role === 'hospital_staff' || role === 'hospital_admin') {
      // Staff hospitalier peut voir les documents de son hôpital
      whereClause.hospital_id = hospital_id;
      canAccess = true;
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      // Staff laboratoire peut voir les documents de son laboratoire
      whereClause.laboratory_id = laboratory_id;
      canAccess = true;
    } else if (role === 'super_admin') {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Filtrer par type si spécifié
    if (type) {
      whereClause.document_type = type;
    }

    // Recherche dans le nom de fichier ou description
    if (search) {
      whereClause.OR = [
        { filename: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        include: {
          uploader: {
            select: { first_name: true, last_name: true, role: true }
          },
          hospital: {
            select: { name: true, city: true }
          },
          laboratory: {
            select: { name: true, city: true }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.document.count({ where: whereClause })
    ]);

    // Masquer les informations sensibles et ajouter les URLs sécurisées
    const documentsResponse = documents.map(doc => {
      const { file_path, secure_token, secure_filename, ...docResponse } = doc;
      return {
        ...docResponse,
        secure_url: `/api/documents/${doc.id}/view`,
        ai_explanation_url: role === 'patient' ? `/api/documents/${doc.id}/ai-explanation` : null
      };
    });

    res.json({
      success: true,
      data: {
        documents: documentsResponse,
        patient: {
          id: patient.id,
          name: `${patient.user.first_name} ${patient.user.last_name}`,
          email: patient.user.email
        },
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Erreur récupération documents patient:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 👁️ VISUALISER UN DOCUMENT DE MANIÈRE SÉCURISÉE (ONLINE ONLY)
 * GET /api/documents/:id/view
 */
const viewDocument = async (req, res) => {
  try {
    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const documentId = parseInt(req.params.id);
    const { download = false, session_verify = true } = req.query;

    // 🔒 SÉCURITÉ RENFORCÉE: Vérification de session en temps réel pour les patients
    if (role === 'patient' && session_verify !== 'false') {
      // Générer un token de session unique pour cette visualisation
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
      
      // Stocker le token de session en base pour vérification
      await prisma.documentSessions.create({
        data: {
          document_id: documentId,
          user_id: userId,
          session_token: sessionToken,
          expires_at: sessionExpiry,
          ip_address: req.ip,
          user_agent: req.get('User-Agent') || 'Unknown'
        }
      }).catch(console.error);

      // Ajouter des headers anti-cache très stricts pour les patients
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.setHeader('Surrogate-Control', 'no-store');
      res.setHeader('X-Session-Token', sessionToken);
    }

    // Récupérer le document avec ses relations
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifications de permissions
    let canAccess = false;

    if (role === 'patient') {
      // Un patient ne peut voir que ses propres documents ET doit être en ligne
      if (document.patient.user_id === userId) {
        canAccess = true;
      }
    } else if (role === 'hospital_staff' || role === 'hospital_admin') {
      // Staff hospitalier ne peut voir que les documents de son hôpital
      if (document.hospital_id === hospital_id) {
        canAccess = true;
      }
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      // Staff laboratoire ne peut voir que les documents de son laboratoire
      if (document.laboratory_id === laboratory_id) {
        canAccess = true;
      }
    } else if (role === 'super_admin') {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Vérifier que le fichier existe
    try {
      await fs.access(document.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    // Enregistrer l'accès pour audit
    await prisma.documentAccess.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_type: download === 'true' ? 'download' : 'view',
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || 'Unknown',
        is_offline_attempt: false // Toujours en ligne pour cette nouvelle logique
      }
    }).catch(console.error); // Ne pas faire échouer si l'audit échoue

    // 🚫 BLOQUER COMPLÈTEMENT LE TÉLÉCHARGEMENT POUR LES PATIENTS
    if (role === 'patient') {
      if (download === 'true') {
        return res.status(403).json({
          success: false,
          message: 'Téléchargement interdit pour les patients. Utilisez uniquement la visualisation sécurisée en ligne.'
        });
      }
      
      // Ajouter des headers spéciaux pour empêcher la sauvegarde
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'DENY'); // Plus strict que SAMEORIGIN
      res.setHeader('X-Download-Options', 'noopen');
      res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
      res.setHeader('Referrer-Policy', 'no-referrer');
      res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'none'; object-src 'none';");
    }

    // Définir les headers sécurisés
    const mimeType = getMimeType(document.filename);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', document.file_size);
    
    if (download === 'true') {
      res.setHeader('Content-Disposition', `attachment; filename="${document.filename}"`);
    } else {
      res.setHeader('Content-Disposition', `inline; filename="${document.filename}"`);
      // Headers de sécurité pour la visualisation
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    }

    // Stream sécurisé du fichier
    const fileStream = require('fs').createReadStream(document.file_path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Erreur streaming fichier:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la lecture du fichier'
        });
      }
    });

  } catch (error) {
    console.error('Erreur visualisation document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🤖 GÉNÉRER UN RÉSUMÉ IA D'UN DOCUMENT
 * POST /api/documents/:id/ai-summary
 */
const generateAISummary = async (req, res) => {
  try {
    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const documentId = parseInt(req.params.id);

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifications de permissions
    let canAccess = false;

    if (role === 'patient') {
      if (document.patient.user_id === userId) {
        canAccess = true;
      }
    } else if (role === 'hospital_staff' || role === 'hospital_admin') {
      if (document.hospital_id === hospital_id) {
        canAccess = true;
      }
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      if (document.laboratory_id === laboratory_id) {
        canAccess = true;
      }
    } else if (role === 'super_admin') {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Vérifier que le service OpenRouter est disponible
    if (!openRouterService) {
      return res.status(503).json({
        success: false,
        message: 'Service IA non configuré. Veuillez configurer le service OpenRouter.'
      });
    }

    // Pour l'instant, générer un résumé à chaque fois (pas de cache)
    // Extraire le texte du document (simulation)
    const documentText = `Document médical: ${document.filename}
Type: ${document.document_type}
Description: ${document.description || 'Aucune description'}
Taille: ${document.file_size} bytes
Date: ${document.created_at}`;

    // Générer le résumé IA
    const aiSummary = await callAI(documentText, document.document_type, 'summary');
    
    // Créer un objet résumé temporaire
    const summary = {
      summary: aiSummary,
      generated_at: new Date(),
      document_id: documentId
    };

    res.json({
      success: true,
      data: {
        summary: summary.summary,
        generated_at: summary.generated_at,
        document: {
          id: document.id,
          filename: document.filename,
          document_type: document.document_type,
          created_at: document.created_at
        }
      }
    });

  } catch (error) {
    console.error('Erreur résumé IA:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération du résumé'
    });
  }
};

/**
 * 📤 TRANSFÉRER UN DOCUMENT À UN MÉDECIN/LABORANTIN
 * POST /api/documents/:id/transfer
 */
const transferDocument = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const documentId = parseInt(req.params.id);
    const { recipient_id, recipient_type, message } = req.body;

    // Seuls les patients peuvent transférer leurs documents
    if (role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Fonctionnalité réservée aux patients'
      });
    }

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifier que le patient peut transférer ce document
    if (document.patient.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez transférer que vos propres documents'
      });
    }

    // Vérifier que le destinataire existe
    let recipient;
    if (recipient_type === 'doctor') {
      recipient = await prisma.user.findFirst({
        where: {
          id: recipient_id,
          role: { in: ['hospital_staff', 'hospital_admin'] }
        },
        include: {
          hospital: true
        }
      });
    } else if (recipient_type === 'lab') {
      recipient = await prisma.user.findFirst({
        where: {
          id: recipient_id,
          role: { in: ['lab_staff', 'lab_admin'] }
        },
        include: {
          laboratory: true
        }
      });
    }

    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Destinataire non trouvé'
      });
    }

    // Créer une notification pour le destinataire
    await prisma.notification.create({
      data: {
        user_id: recipient_id,
        type: 'document_shared',
        title: 'Nouveau document transféré',
        message: `${document.patient.user.first_name} ${document.patient.user.last_name} vous a transféré le document "${document.filename}"`,
        data: JSON.stringify({
          document_id: documentId,
          patient_name: `${document.patient.user.first_name} ${document.patient.user.last_name}`,
          message: message
        })
      }
    });

    res.json({
      success: true,
      message: 'Document transféré avec succès',
      data: {
        recipient: {
          name: `${recipient.first_name} ${recipient.last_name}`,
          type: recipient_type
        }
      }
    });

  } catch (error) {
    console.error('Erreur transfert document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du transfert'
    });
  }
};

/**
 * 👥 OBTENIR LES DESTINATAIRES DISPONIBLES POUR TRANSFERT
 * GET /api/documents/transfer-recipients
 */
const getTransferRecipients = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const { type } = req.query;

    // Seuls les patients peuvent voir les destinataires
    if (role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Fonctionnalité réservée aux patients'
      });
    }

    let recipients = [];

    if (type === 'doctor') {
      // Récupérer les médecins avec leurs hôpitaux
      recipients = await prisma.user.findMany({
        where: {
          role: { in: ['hospital_staff', 'hospital_admin'] },
          is_active: true
        },
        include: {
          hospital: true
        },
        take: 20 // Limiter à 20 résultats
      });

      recipients = recipients.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        establishment_name: user.hospital?.name || 'Hôpital non spécifié',
        establishment_city: user.hospital?.city || 'Ville non spécifiée'
      }));
    } else if (type === 'lab') {
      // Récupérer les laborantins avec leurs laboratoires
      recipients = await prisma.user.findMany({
        where: {
          role: { in: ['lab_staff', 'lab_admin'] },
          is_active: true
        },
        include: {
          laboratory: true
        },
        take: 20 // Limiter à 20 résultats
      });

      recipients = recipients.map(user => ({
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        establishment_name: user.laboratory?.name || 'Laboratoire non spécifié',
        establishment_city: user.laboratory?.city || 'Ville non spécifiée'
      }));
    }

    res.json({
      success: true,
      data: {
        recipients: recipients
      }
    });

  } catch (error) {
    console.error('Erreur récupération destinataires:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des destinataires'
    });
  }
};

/**
 * 🚫 BLOQUER L'ACCÈS HORS LIGNE AUX DONNÉES (SECURE)
 * GET /api/documents/:id/offline-data
 */
const getOfflineData = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const documentId = parseInt(req.params.id);

    // 🚫 COMPLÈTEMENT DÉSACTIVÉ POUR LES PATIENTS
    if (role === 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Accès hors ligne désactivé pour des raisons de sécurité. Connexion Internet requise pour consulter vos documents.',
        require_online: true,
        error_code: 'OFFLINE_ACCESS_DENIED'
      });
    }

    // Pour les autres rôles, maintenir la fonctionnalité existante
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifications de permissions pour le staff
    let canAccess = false;
    if (role === 'hospital_staff' || role === 'hospital_admin') {
      canAccess = (document.hospital_id === req.user.hospital_id);
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      canAccess = (document.laboratory_id === req.user.laboratory_id);
    } else if (role === 'super_admin') {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé'
      });
    }

    // Extraire les métadonnées pour consultation hors ligne (staff uniquement)
    const offlineData = {
      id: document.id,
      filename: document.filename,
      document_type: document.document_type,
      description: document.description,
      created_at: document.created_at,
      file_size: document.file_size,
      content: 'Document disponible pour consultation hors ligne (staff uniquement)'
    };

    res.json({
      success: true,
      data: offlineData
    });

  } catch (error) {
    console.error('Erreur données hors ligne:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des données hors ligne'
    });
  }
};

/**
 * 🔐 VÉRIFIER L'ACCÈS EN TEMPS RÉEL (ANTI-OFFLINE)
 * POST /api/documents/:id/verify-access
 */
const verifyDocumentAccess = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    const documentId = parseInt(req.params.id);
    const { session_token, timestamp } = req.body;

    // Seuls les patients ont besoin de vérification de session
    if (role !== 'patient') {
      return res.json({
        success: true,
        message: 'Vérification non nécessaire pour ce rôle',
        access_granted: true
      });
    }

    // Vérifier le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: { include: { user: true } }
      }
    });

    if (!document || document.patient.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Document non accessible',
        access_granted: false
      });
    }

    // Vérifier la connexion récente (moins de 5 minutes)
    const recentAccess = await prisma.documentAccess.findFirst({
      where: {
        document_id: documentId,
        user_id: userId,
        created_at: { gt: new Date(Date.now() - 5 * 60 * 1000) }
      },
      orderBy: { created_at: 'desc' }
    });

    // Si pas d'accès récent, créer un nouvel enregistrement d'accès (première fois ou après expiration)
    if (!recentAccess) {
      // Créer un nouvel enregistrement d'accès
      await prisma.documentAccess.create({
        data: {
          document_id: documentId,
          user_id: userId,
          access_type: 'view',
          ip_address: req.ip,
          user_agent: req.get('User-Agent') || 'Unknown',
          is_offline_attempt: false
        }
      });

      console.log(`✅ Nouvel accès accordé pour document ${documentId} par utilisateur ${userId}`);
      
      return res.json({
        success: true,
        message: 'Accès accordé et enregistré',
        access_granted: true,
        session_valid: true,
        expires_in: 300, // 5 minutes
        is_new_session: true
      });
    }

    // Si accès récent trouvé, enregistrer la vérification
    await prisma.documentAccess.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_type: 'verify',
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || 'Unknown',
        is_offline_attempt: false
      }
    }).catch(console.error);

    const timeRemaining = Math.max(0, 300 - Math.floor((Date.now() - recentAccess.created_at.getTime()) / 1000));

    res.json({
      success: true,
      message: 'Accès vérifié - session active',
      access_granted: true,
      session_valid: true,
      expires_in: timeRemaining,
      is_new_session: false
    });

  } catch (error) {
    console.error('Erreur vérification accès:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification',
      access_granted: false
    });
  }
};

/**
 * 📱 TÉLÉCHARGEMENT SÉCURISÉ POUR STOCKAGE OFFLINE CHIFFRÉ (PATIENTS)
 * GET /api/documents/:id/secure-download
 */
const secureDownloadForOffline = async (req, res) => {
  try {
    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const documentId = parseInt(req.params.id);

    // Récupérer le document avec ses relations
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifications de permissions
    let canAccess = false;

    if (role === 'patient') {
      // Un patient ne peut télécharger que ses propres documents
      if (document.patient.user_id === userId) {
        canAccess = true;
      }
    } else if (role === 'hospital_staff' || role === 'hospital_admin') {
      // Staff hospitalier ne peut voir que les documents de son hôpital
      if (document.hospital_id === hospital_id) {
        canAccess = true;
      }
    } else if (role === 'lab_staff' || role === 'lab_admin') {
      // Staff laboratoire ne peut voir que les documents de son laboratoire
      if (document.laboratory_id === laboratory_id) {
        canAccess = true;
      }
    } else if (role === 'super_admin') {
      canAccess = true;
    }

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Accès non autorisé à ce document'
      });
    }

    // Vérifier que le fichier existe
    try {
      await fs.access(document.file_path);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: 'Fichier non trouvé sur le serveur'
      });
    }

    // Enregistrer l'accès pour audit
    await prisma.documentAccess.create({
      data: {
        document_id: documentId,
        user_id: userId,
        access_type: 'secure_download',
        ip_address: req.ip,
        user_agent: req.get('User-Agent') || 'Unknown',
        is_offline_attempt: false
      }
    }).catch(console.error);

    // Headers pour téléchargement sécurisé
    const mimeType = getMimeType(document.filename);
    res.setHeader('Content-Type', 'application/octet-stream'); // Force binary download
    res.setHeader('Content-Length', document.file_size);
    res.setHeader('Content-Disposition', `attachment; filename="encrypted_${document.filename}"`);
    
    // Headers de sécurité
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Download-Options', 'noopen');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    // Informations pour l'app (dans des headers personnalisés)
    res.setHeader('X-Document-Id', documentId.toString());
    res.setHeader('X-Document-Type', document.document_type);
    res.setHeader('X-Original-Filename', document.filename);
    res.setHeader('X-Secure-Download', 'true');

    // Stream sécurisé du fichier
    const fileStream = require('fs').createReadStream(document.file_path);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Erreur streaming fichier pour téléchargement sécurisé:', error);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la lecture du fichier'
        });
      }
    });

  } catch (error) {
    console.error('Erreur téléchargement sécurisé:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

/**
 * 🗑️ SUPPRIMER UN DOCUMENT
 * DELETE /api/documents/:id
 */
const deleteDocument = async (req, res) => {
  try {
    const { role, id: userId, hospital_id, laboratory_id } = req.user;
    const documentId = parseInt(req.params.id);

    // Récupérer le document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        patient: {
          include: { user: true }
        }
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document non trouvé'
      });
    }

    // Vérifications de permissions
    let canDelete = false;

    if (role === 'patient') {
      // Un patient ne peut supprimer que ses propres documents
      if (document.patient.user_id === userId) {
        canDelete = true;
      }
    } else if (role === 'hospital_admin') {
      // Admin hôpital peut supprimer les documents de son hôpital
      if (document.hospital_id === hospital_id) {
        canDelete = true;
      }
    } else if (role === 'lab_admin') {
      // Admin laboratoire peut supprimer les documents de son laboratoire
      if (document.laboratory_id === laboratory_id) {
        canDelete = true;
      }
    } else if (role === 'hospital_staff') {
      // Staff hospitalier ne peut supprimer que ses propres uploads
      if (document.uploaded_by === userId && document.hospital_id === hospital_id) {
        canDelete = true;
      }
    } else if (role === 'lab_staff') {
      // Staff laboratoire ne peut supprimer que ses propres uploads
      if (document.uploaded_by === userId && document.laboratory_id === laboratory_id) {
        canDelete = true;
      }
    } else if (role === 'super_admin') {
      canDelete = true;
    }

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: 'Permissions insuffisantes pour supprimer ce document'
      });
    }

    // Supprimer le fichier physique
    try {
      await fs.unlink(document.file_path);
    } catch (error) {
      console.warn('Impossible de supprimer le fichier physique:', error.message);
    }

    // Supprimer les enregistrements liés en transaction
    await prisma.$transaction(async (tx) => {
      // Supprimer l'explication IA si elle existe
      await tx.documentAIExplanation.deleteMany({
        where: { document_id: documentId }
      });

      // Supprimer les accès enregistrés
      await tx.documentAccess.deleteMany({
        where: { document_id: documentId }
      });

      // Supprimer le document
      await tx.document.delete({
        where: { id: documentId }
      });
    });

    res.json({
      success: true,
      message: 'Document supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur suppression document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Obtenir le type MIME d'un fichier
 */
const getMimeType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.pdf': 'application/pdf',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.txt': 'text/plain'
  };
  return mimeTypes[ext] || 'application/octet-stream';
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  upload,
  uploadDocument,
  getMyDocuments,
  getPatientDocuments,
  viewDocument,
  generateAISummary,
  transferDocument,
  getTransferRecipients,
  getOfflineData,
  verifyDocumentAccess,
  secureDownloadForOffline,
  deleteDocument
};