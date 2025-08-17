# 🔧 CORRECTIONS SYSTÈME DE DOCUMENTS MÉDICAUX

## 🚨 Corrections Critiques à Implémenter

### 1. **Correction Gestion d'Erreurs Upload**

**Problème :** Transaction incomplète lors de l'upload
**Impact :** Documents orphelins en base de données

**Code Actuel (Problématique) :**
```javascript
// Dans uploadDocument()
const document = await prisma.document.create({...}); // Créé en base
const securePath = await moveToSecureStorage(...); // Peut échouer
await prisma.document.update({...}); // Peut ne jamais s'exécuter
```

**Code Corrigé :**
```javascript
const uploadDocumentFixed = async (req, res) => {
  let tempFilePath = null;
  
  try {
    tempFilePath = req.file.path;
    
    // Transaction complète avec rollback automatique
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer l'enregistrement temporaire
      const document = await tx.document.create({
        data: {
          patient_id: parseInt(patient_id),
          uploaded_by: uploaderId,
          hospital_id: assignedHospitalId,
          laboratory_id: assignedLabId,
          filename: req.file.originalname,
          file_path: 'TEMP_PROCESSING', // Marqueur temporaire
          file_size: req.file.size,
          document_type: document_type,
          secure_token: generateSecureToken(),
          description: description || null
        }
      });

      // 2. Déplacer le fichier (peut échouer)
      const secureFilename = encryptFilename(req.file.originalname, document.id);
      const securePath = await moveToSecureStorage(tempFilePath, secureFilename);
      
      // 3. Mettre à jour avec le chemin final
      const updatedDocument = await tx.document.update({
        where: { id: document.id },
        data: { 
          file_path: securePath,
          secure_filename: secureFilename
        }
      });

      return updatedDocument;
    });

    // Succès complet
    res.status(201).json({
      success: true,
      message: 'Document uploadé avec succès',
      data: { document: result }
    });

  } catch (error) {
    // Nettoyage automatique en cas d'erreur
    if (tempFilePath) {
      fs.unlink(tempFilePath).catch(console.error);
    }
    
    console.error('Erreur upload document:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'upload du document'
    });
  }
};
```

### 2. **Sécurisation des Tokens d'Accès**

**Problème :** Tokens génériques non liés aux utilisateurs
**Impact :** Accès non autorisé possible

**Code Actuel (Problématique) :**
```javascript
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
```

**Code Corrigé :**
```javascript
const generateUserSpecificToken = (userId, documentId, expiresIn = 24 * 60 * 60 * 1000) => {
  const payload = {
    userId,
    documentId,
    expiresAt: Date.now() + expiresIn,
    nonce: crypto.randomBytes(16).toString('hex')
  };
  
  const token = jwt.sign(payload, process.env.JWT_SECRET + '_DOCUMENT', {
    expiresIn: '24h'
  });
  
  return token;
};

const validateDocumentToken = (token, userId, documentId) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET + '_DOCUMENT');
    
    return decoded.userId === userId && 
           decoded.documentId === documentId && 
           decoded.expiresAt > Date.now();
  } catch (error) {
    return false;
  }
};
```

### 3. **Validation Avancée des Fichiers**

**Problème :** Validation basée uniquement sur MIME type
**Impact :** Fichiers malveillants peuvent passer

**Code Actuel (Problématique) :**
```javascript
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', ...];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Type de fichier non autorisé'), false);
  }
};
```

**Code Corrigé :**
```javascript
const advancedFileValidation = async (filePath, originalMimeType) => {
  const fileBuffer = await fs.readFile(filePath);
  
  // Vérification des signatures de fichiers
  const fileSignatures = {
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  };
  
  const signature = fileSignatures[originalMimeType];
  if (signature) {
    const fileHeader = Array.from(fileBuffer.slice(0, signature.length));
    if (!signature.every((byte, index) => byte === fileHeader[index])) {
      throw new Error('Signature de fichier invalide');
    }
  }
  
  // Vérification de la taille réelle vs déclarée
  const stats = await fs.stat(filePath);
  if (stats.size > 25 * 1024 * 1024) {
    throw new Error('Fichier trop volumineux');
  }
  
  // Scan antivirus simulé (à remplacer par un vrai scanner)
  if (await simulateVirusScan(fileBuffer)) {
    throw new Error('Fichier potentiellement dangereux détecté');
  }
  
  return true;
};

const simulateVirusScan = async (buffer) => {
  // Recherche de patterns suspects
  const suspiciousPatterns = [
    Buffer.from('MZ'), // Exécutable Windows
    Buffer.from('<script'), // JavaScript
    Buffer.from('<?php') // PHP
  ];
  
  return suspiciousPatterns.some(pattern => buffer.includes(pattern));
};
```

## 🔄 Améliorations de Performance

### 4. **Optimisation des Requêtes**

**Problème :** Requêtes N+1 dans la récupération des documents
**Impact :** Performance dégradée avec beaucoup de documents

**Code Optimisé :**
```javascript
const getPatientDocumentsOptimized = async (req, res) => {
  try {
    // Requête optimisée avec select spécifiques
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        select: {
          id: true,
          filename: true,
          file_size: true,
          document_type: true,
          description: true,
          created_at: true,
          patient: {
            select: {
              id: true,
              user: {
                select: {
                  first_name: true,
                  last_name: true,
                  email: true
                }
              }
            }
          },
          uploader: {
            select: {
              first_name: true,
              last_name: true,
              role: true
            }
          },
          hospital: {
            select: {
              name: true,
              city: true
            }
          },
          laboratory: {
            select: {
              name: true,
              city: true
            }
          }
        },
        skip,
        take,
        orderBy: { created_at: 'desc' }
      }),
      prisma.document.count({ where: whereClause })
    ]);

    // Cache des résultats pour 5 minutes
    const cacheKey = `patient_docs_${patientId}_${page}_${limit}`;
    await redis.setex(cacheKey, 300, JSON.stringify(documents));

    res.json({
      success: true,
      data: { documents, pagination: {...} }
    });
  } catch (error) {
    // Gestion d'erreur
  }
};
```

### 5. **Système de Fallback IA**

**Problème :** Pas de fallback si OpenRouter est indisponible
**Impact :** Service IA complètement indisponible

**Code Corrigé :**
```javascript
const aiProviders = [
  {
    name: 'OpenRouter',
    call: callOpenRouterAI,
    priority: 1
  },
  {
    name: 'OpenAI',
    call: callOpenAI,
    priority: 2
  },
  {
    name: 'Local',
    call: callLocalLLM,
    priority: 3
  }
];

const getAIExplanationWithFallback = async (documentText, documentType) => {
  let lastError = null;
  
  for (const provider of aiProviders.sort((a, b) => a.priority - b.priority)) {
    try {
      log(`Tentative avec ${provider.name}...`, 'info');
      const result = await provider.call(documentText, documentType);
      
      if (result && result.length > 50) { // Validation basique
        return {
          explanation: result,
          provider: provider.name,
          generated_at: new Date()
        };
      }
    } catch (error) {
      lastError = error;
      log(`Échec ${provider.name}: ${error.message}`, 'warning');
      continue;
    }
  }
  
  // Tous les providers ont échoué
  return {
    explanation: "Je ne peux pas analyser ce document pour le moment. Veuillez contacter votre médecin pour plus d'informations sur vos résultats.",
    provider: 'fallback',
    generated_at: new Date(),
    error: lastError?.message
  };
};
```

## 📊 Nouvelles Fonctionnalités

### 6. **Système de Notifications**

```javascript
const notificationService = {
  async notifyNewDocument(documentId, patientId, uploaderName) {
    const notifications = [
      {
        user_id: patientId,
        type: 'NEW_DOCUMENT',
        title: 'Nouveau document médical',
        message: `Un nouveau document a été ajouté par ${uploaderName}`,
        data: { document_id: documentId }
      }
    ];

    // Envoyer les notifications
    await prisma.notification.createMany({
      data: notifications
    });

    // Push notification si configuré
    if (process.env.PUSH_NOTIFICATIONS_ENABLED === 'true') {
      await sendPushNotification(patientId, notifications[0]);
    }
  },

  async notifyDocumentViewed(documentId, viewerId) {
    // Notifier l'uploader que son document a été consulté
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { uploader: true, patient: { include: { user: true } } }
    });

    if (document && document.uploaded_by !== viewerId) {
      await prisma.notification.create({
        data: {
          user_id: document.uploaded_by,
          type: 'DOCUMENT_VIEWED',
          title: 'Document consulté',
          message: `${document.patient.user.first_name} a consulté le document "${document.filename}"`,
          data: { document_id: documentId, viewer_id: viewerId }
        }
      });
    }
  }
};
```

### 7. **Versioning des Documents**

```javascript
const createDocumentVersion = async (originalDocumentId, newFilePath, uploaderId) => {
  return await prisma.$transaction(async (tx) => {
    // Récupérer le document original
    const originalDoc = await tx.document.findUnique({
      where: { id: originalDocumentId }
    });

    // Créer une nouvelle version
    const newVersion = await tx.documentVersion.create({
      data: {
        document_id: originalDocumentId,
        version: originalDoc.current_version + 1,
        file_path: newFilePath,
        uploaded_by: uploaderId,
        changes_description: 'Version mise à jour'
      }
    });

    // Mettre à jour le document principal
    await tx.document.update({
      where: { id: originalDocumentId },
      data: {
        current_version: newVersion.version,
        file_path: newFilePath,
        updated_at: new Date()
      }
    });

    return newVersion;
  });
};
```

### 8. **Workflow d'Approbation**

```javascript
const requestDocumentApproval = async (documentId, approverId, comments) => {
  const approval = await prisma.documentApproval.create({
    data: {
      document_id: documentId,
      approver_id: approverId,
      status: 'PENDING',
      comments: comments,
      requested_at: new Date()
    }
  });

  // Notifier l'approbateur
  await notificationService.notifyApprovalRequest(documentId, approverId);

  return approval;
};

const approveDocument = async (approvalId, approverId, decision, comments) => {
  return await prisma.$transaction(async (tx) => {
    // Mettre à jour l'approbation
    const approval = await tx.documentApproval.update({
      where: { id: approvalId },
      data: {
        status: decision, // 'APPROVED' ou 'REJECTED'
        comments: comments,
        approved_at: new Date(),
        approved_by: approverId
      }
    });

    // Mettre à jour le statut du document
    await tx.document.update({
      where: { id: approval.document_id },
      data: {
        approval_status: decision,
        approved_at: decision === 'APPROVED' ? new Date() : null
      }
    });

    return approval;
  });
};
```

## 🔍 Monitoring et Alertes

### 9. **Système de Monitoring**

```javascript
const monitoringService = {
  async logDocumentActivity(action, documentId, userId, metadata = {}) {
    await prisma.documentActivityLog.create({
      data: {
        action, // 'UPLOAD', 'VIEW', 'DOWNLOAD', 'DELETE', 'AI_EXPLANATION'
        document_id: documentId,
        user_id: userId,
        metadata: JSON.stringify(metadata),
        ip_address: metadata.ip,
        user_agent: metadata.userAgent,
        timestamp: new Date()
      }
    });

    // Alertes automatiques
    await this.checkForAlerts(action, documentId, userId);
  },

  async checkForAlerts(action, documentId, userId) {
    // Alerte: Trop d'accès en peu de temps
    if (action === 'VIEW') {
      const recentViews = await prisma.documentActivityLog.count({
        where: {
          document_id: documentId,
          user_id: userId,
          action: 'VIEW',
          timestamp: {
            gte: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes
          }
        }
      });

      if (recentViews > 10) {
        await this.sendAlert('SUSPICIOUS_ACTIVITY', {
          documentId,
          userId,
          viewCount: recentViews
        });
      }
    }

    // Alerte: Upload de gros volume
    if (action === 'UPLOAD') {
      const todayUploads = await prisma.document.count({
        where: {
          uploaded_by: userId,
          created_at: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      });

      if (todayUploads > 50) {
        await this.sendAlert('HIGH_UPLOAD_VOLUME', {
          userId,
          uploadCount: todayUploads
        });
      }
    }
  },

  async sendAlert(type, data) {
    // Envoyer alerte aux administrateurs
    const admins = await prisma.user.findMany({
      where: { role: { in: ['super_admin', 'hospital_admin', 'lab_admin'] } }
    });

    for (const admin of admins) {
      await prisma.notification.create({
        data: {
          user_id: admin.id,
          type: 'SECURITY_ALERT',
          title: `Alerte sécurité: ${type}`,
          message: `Activité suspecte détectée: ${JSON.stringify(data)}`,
          priority: 'HIGH'
        }
      });
    }
  }
};
```

## 📋 Plan d'Implémentation

### Phase 1 (Urgent - Semaine 1)
- [ ] Corriger la gestion d'erreurs d'upload avec transactions
- [ ] Implémenter la validation avancée des fichiers
- [ ] Sécuriser les tokens d'accès

### Phase 2 (Important - Semaine 2)
- [ ] Optimiser les requêtes de récupération
- [ ] Implémenter le système de fallback IA
- [ ] Ajouter le système de notifications

### Phase 3 (Améliorations - Mois suivant)
- [ ] Versioning des documents
- [ ] Workflow d'approbation
- [ ] Système de monitoring complet

Ces corrections adressent les problèmes critiques identifiés et ajoutent des fonctionnalités essentielles pour un système de documents médicaux robuste et sécurisé.