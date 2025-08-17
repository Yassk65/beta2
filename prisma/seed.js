// 🌱 SCRIPT DE SEED - DONNÉES DE TEST MVP
// 📅 Créé le : 11 Août 2025
// 🎯 Ajouter des données de test réalistes pour le développement

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Début du seeding...');

  try {
    // ============================================================================
    // 1. CRÉER LES ÉTABLISSEMENTS
    // ============================================================================
    
    console.log('🏥 Création des hôpitaux...');
    const hospitals = await Promise.all([
      prisma.hospital.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'CHU de Paris',
          address: '47-83 Boulevard de l\'Hôpital',
          city: 'Paris',
          phone: '01 42 16 00 00',
          email: 'contact@chu-paris.fr',
          latitude: 48.8388,
          longitude: 2.3619,
          is_active: true
        }
      }),
      prisma.hospital.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Hôpital Saint-Louis',
          address: '1 Avenue Claude Vellefaux',
          city: 'Paris',
          phone: '01 42 49 49 49',
          email: 'contact@hopital-saintlouis.fr',
          latitude: 48.8717,
          longitude: 2.3661,
          is_active: true
        }
      }),
      prisma.hospital.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'CHU de Lyon',
          address: '103 Grande Rue de la Croix-Rousse',
          city: 'Lyon',
          phone: '04 72 07 17 17',
          email: 'contact@chu-lyon.fr',
          latitude: 45.7640,
          longitude: 4.8357,
          is_active: true
        }
      })
    ]);

    console.log('🧪 Création des laboratoires...');
    const laboratories = await Promise.all([
      prisma.laboratory.upsert({
        where: { id: 1 },
        update: {},
        create: {
          name: 'Laboratoire Cerba',
          address: '95066 Cergy Pontoise Cedex',
          city: 'Cergy',
          phone: '01 34 40 15 15',
          email: 'contact@cerba.fr',
          latitude: 49.0370,
          longitude: 2.0781,
          is_active: true
        }
      }),
      prisma.laboratory.upsert({
        where: { id: 2 },
        update: {},
        create: {
          name: 'Laboratoire Biogroup',
          address: '12 Rue de la Paix',
          city: 'Paris',
          phone: '01 45 67 89 12',
          email: 'contact@biogroup.fr',
          latitude: 48.8698,
          longitude: 2.3314,
          is_active: true
        }
      }),
      prisma.laboratory.upsert({
        where: { id: 3 },
        update: {},
        create: {
          name: 'Laboratoire Synlab',
          address: '25 Avenue de la République',
          city: 'Lyon',
          phone: '04 78 95 12 34',
          email: 'contact@synlab-lyon.fr',
          latitude: 45.7578,
          longitude: 4.8320,
          is_active: true
        }
      })
    ]);

    // ============================================================================
    // 2. CRÉER LES UTILISATEURS
    // ============================================================================

    console.log('👑 Création du super admin...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const superAdmin = await prisma.user.upsert({
      where: { email: 'admin@sante-app.fr' },
      update: {},
      create: {
        email: 'admin@sante-app.fr',
        password_hash: hashedPassword,
        first_name: 'Super',
        last_name: 'Admin',
        phone: '01 23 45 67 89',
        role: 'super_admin',
        is_active: true
      }
    });

    console.log('🏥 Création des admins hôpitaux...');
    const hospitalAdmins = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin.chu-paris@sante-app.fr' },
        update: {},
        create: {
          email: 'admin.chu-paris@sante-app.fr',
          password_hash: await bcrypt.hash('hospital123', 12),
          first_name: 'Marie',
          last_name: 'Dubois',
          phone: '01 42 16 00 01',
          role: 'hospital_admin',
          hospital_id: hospitals[0].id,
          is_active: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'admin.saint-louis@sante-app.fr' },
        update: {},
        create: {
          email: 'admin.saint-louis@sante-app.fr',
          password_hash: await bcrypt.hash('hospital123', 12),
          first_name: 'Pierre',
          last_name: 'Martin',
          phone: '01 42 49 49 50',
          role: 'hospital_admin',
          hospital_id: hospitals[1].id,
          is_active: true
        }
      })
    ]);

    console.log('🧪 Création des admins laboratoires...');
    const labAdmins = await Promise.all([
      prisma.user.upsert({
        where: { email: 'admin.cerba@sante-app.fr' },
        update: {},
        create: {
          email: 'admin.cerba@sante-app.fr',
          password_hash: await bcrypt.hash('lab123', 12),
          first_name: 'Sophie',
          last_name: 'Leroy',
          phone: '01 34 40 15 16',
          role: 'lab_admin',
          laboratory_id: laboratories[0].id,
          is_active: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'admin.biogroup@sante-app.fr' },
        update: {},
        create: {
          email: 'admin.biogroup@sante-app.fr',
          password_hash: await bcrypt.hash('lab123', 12),
          first_name: 'Thomas',
          last_name: 'Rousseau',
          phone: '01 45 67 89 13',
          role: 'lab_admin',
          laboratory_id: laboratories[1].id,
          is_active: true
        }
      })
    ]);

    console.log('👩‍⚕️ Création du personnel médical...');
    const medicalStaff = await Promise.all([
      // Staff hôpital CHU Paris
      prisma.user.upsert({
        where: { email: 'dr.bernard@chu-paris.fr' },
        update: {},
        create: {
          email: 'dr.bernard@chu-paris.fr',
          password_hash: await bcrypt.hash('staff123', 12),
          first_name: 'Jean',
          last_name: 'Bernard',
          phone: '01 42 16 00 02',
          role: 'hospital_staff',
          hospital_id: hospitals[0].id,
          is_active: true
        }
      }),
      prisma.user.upsert({
        where: { email: 'dr.moreau@chu-paris.fr' },
        update: {},
        create: {
          email: 'dr.moreau@chu-paris.fr',
          password_hash: await bcrypt.hash('staff123', 12),
          first_name: 'Claire',
          last_name: 'Moreau',
          phone: '01 42 16 00 03',
          role: 'hospital_staff',
          hospital_id: hospitals[0].id,
          is_active: true
        }
      }),
      // Staff laboratoire Cerba
      prisma.user.upsert({
        where: { email: 'tech.dupont@cerba.fr' },
        update: {},
        create: {
          email: 'tech.dupont@cerba.fr',
          password_hash: await bcrypt.hash('staff123', 12),
          first_name: 'Michel',
          last_name: 'Dupont',
          phone: '01 34 40 15 17',
          role: 'lab_staff',
          laboratory_id: laboratories[0].id,
          is_active: true
        }
      })
    ]);

    console.log('👥 Création des patients...');
    const patients = [];
    const patientData = [
      {
        email: 'jean.dupont@email.fr',
        first_name: 'Jean',
        last_name: 'Dupont',
        phone: '06 12 34 56 78',
        date_of_birth: new Date('1985-03-15'),
        gender: 'M',
        hospital_id: hospitals[0].id
      },
      {
        email: 'marie.martin@email.fr',
        first_name: 'Marie',
        last_name: 'Martin',
        phone: '06 23 45 67 89',
        date_of_birth: new Date('1992-07-22'),
        gender: 'F',
        laboratory_id: laboratories[0].id
      },
      {
        email: 'pierre.bernard@email.fr',
        first_name: 'Pierre',
        last_name: 'Bernard',
        phone: '06 34 56 78 90',
        date_of_birth: new Date('1978-11-08'),
        gender: 'M',
        hospital_id: hospitals[1].id
      },
      {
        email: 'sophie.leroy@email.fr',
        first_name: 'Sophie',
        last_name: 'Leroy',
        phone: '06 45 67 89 01',
        date_of_birth: new Date('1990-05-12'),
        gender: 'F',
        laboratory_id: laboratories[1].id
      },
      {
        email: 'lucas.moreau@email.fr',
        first_name: 'Lucas',
        last_name: 'Moreau',
        phone: '06 56 78 90 12',
        date_of_birth: new Date('1995-09-30'),
        gender: 'M',
        hospital_id: hospitals[0].id
      }
    ];

    for (const patientInfo of patientData) {
      const user = await prisma.user.upsert({
        where: { email: patientInfo.email },
        update: {},
        create: {
          email: patientInfo.email,
          password_hash: await bcrypt.hash('patient123', 12),
          first_name: patientInfo.first_name,
          last_name: patientInfo.last_name,
          phone: patientInfo.phone,
          role: 'patient',
          hospital_id: patientInfo.hospital_id || null,
          laboratory_id: patientInfo.laboratory_id || null,
          is_active: true
        }
      });

      const patient = await prisma.patient.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          date_of_birth: patientInfo.date_of_birth,
          gender: patientInfo.gender,
          phone: patientInfo.phone
        }
      });

      patients.push({ user, patient });
    }

    // ============================================================================
    // 3. CRÉER DES DOCUMENTS DE TEST
    // ============================================================================

    console.log('📄 Création des documents de test...');
    const documents = [];
    
    for (let i = 0; i < patients.length; i++) {
      const patient = patients[i];
      
      // Document 1: Résultat de laboratoire
      const labDoc = await prisma.document.create({
        data: {
          patient_id: patient.patient.id,
          uploaded_by: medicalStaff[2].id, // Tech labo
          laboratory_id: laboratories[0].id,
          filename: `analyse_${patient.user.last_name.toLowerCase()}_${Date.now()}.pdf`,
          file_path: `/uploads/documents/analyse_${patient.user.last_name.toLowerCase()}_${Date.now()}.pdf`,
          file_size: Math.floor(Math.random() * 500000) + 100000, // 100KB à 600KB
          secure_filename: `sec_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`,
          secure_token: Math.random().toString(36).substring(2, 15),
          document_type: 'lab_result',
          description: `Analyses sanguines complètes pour ${patient.user.first_name} ${patient.user.last_name}`,
          shared_with: JSON.stringify([patient.user.id, medicalStaff[2].id])
        }
      });

      // Document 2: Rapport médical (si patient lié à un hôpital)
      if (patient.user.hospital_id) {
        const medicalDoc = await prisma.document.create({
          data: {
            patient_id: patient.patient.id,
            uploaded_by: medicalStaff[0].id, // Docteur
            hospital_id: patient.user.hospital_id,
            filename: `rapport_${patient.user.last_name.toLowerCase()}_${Date.now()}.pdf`,
            file_path: `/uploads/documents/rapport_${patient.user.last_name.toLowerCase()}_${Date.now()}.pdf`,
            file_size: Math.floor(Math.random() * 800000) + 200000, // 200KB à 1MB
            secure_filename: `sec_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`,
            secure_token: Math.random().toString(36).substring(2, 15),
            document_type: 'medical_report',
            description: `Rapport de consultation pour ${patient.user.first_name} ${patient.user.last_name}`,
            shared_with: JSON.stringify([patient.user.id, medicalStaff[0].id])
          }
        });
        documents.push(medicalDoc);
      }

      documents.push(labDoc);
    }

    // ============================================================================
    // 4. CRÉER DES CONVERSATIONS DE TEST
    // ============================================================================

    console.log('💬 Création des conversations de test...');
    
    // Conversation 1: Patient avec son médecin
    const conversation1 = await prisma.conversation.create({
      data: {
        title: 'Consultation - Jean Dupont',
        created_by: patients[0].user.id
      }
    });

    await Promise.all([
      prisma.conversationParticipant.create({
        data: {
          conversation_id: conversation1.id,
          user_id: patients[0].user.id
        }
      }),
      prisma.conversationParticipant.create({
        data: {
          conversation_id: conversation1.id,
          user_id: medicalStaff[0].id
        }
      })
    ]);

    // Messages de test
    await Promise.all([
      prisma.message.create({
        data: {
          conversation_id: conversation1.id,
          sender_id: patients[0].user.id,
          content: 'Bonjour Docteur, j\'ai reçu mes résultats d\'analyses. Pouvez-vous me les expliquer ?'
        }
      }),
      prisma.message.create({
        data: {
          conversation_id: conversation1.id,
          sender_id: medicalStaff[0].id,
          content: 'Bonjour Jean, vos résultats sont globalement bons. Je vais vous expliquer en détail lors de notre prochain rendez-vous.'
        }
      })
    ]);

    // Conversation 2: Patient avec laboratoire
    const conversation2 = await prisma.conversation.create({
      data: {
        title: 'Résultats analyses - Marie Martin',
        created_by: patients[1].user.id
      }
    });

    await Promise.all([
      prisma.conversationParticipant.create({
        data: {
          conversation_id: conversation2.id,
          user_id: patients[1].user.id
        }
      }),
      prisma.conversationParticipant.create({
        data: {
          conversation_id: conversation2.id,
          user_id: medicalStaff[2].id
        }
      })
    ]);

    await prisma.message.create({
      data: {
        conversation_id: conversation2.id,
        sender_id: patients[1].user.id,
        content: 'Bonjour, quand seront disponibles mes résultats d\'analyses ?'
      }
    });

    // ============================================================================
    // 5. CRÉER DES LOGS D'ACCÈS AUX DOCUMENTS
    // ============================================================================

    console.log('📊 Création des logs d\'accès...');
    
    for (const doc of documents.slice(0, 3)) {
      await prisma.documentAccess.create({
        data: {
          document_id: doc.id,
          user_id: patients[0].user.id,
          access_type: 'view',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
    }

    // ============================================================================
    // 6. CRÉER DES DEMANDES D'EXAMENS DE TEST
    // ============================================================================

    console.log('🧪 Création des demandes d\'examens de test...');
    
    const examRequests = [];
    
    // Demande 1: Analyses sanguines urgentes
    const examRequest1 = await prisma.examRequest.create({
      data: {
        patient_id: patients[0].patient.id, // Jean Dupont
        requested_by: medicalStaff[0].id, // Dr. Bernard
        hospital_id: hospitals[0].id, // CHU Paris
        laboratory_id: laboratories[0].id, // Cerba
        exam_type: 'blood_test',
        priority: 'urgent',
        status: 'pending',
        clinical_info: 'Patient présente des symptômes de fatigue extrême et pâleur. Suspicion d\'anémie. Demande bilan hématologique complet en urgence.',
        requested_tests: JSON.stringify([
          'Hémogramme complet',
          'Fer sérique',
          'Ferritine',
          'Transferrine',
          'Vitamine B12',
          'Folates'
        ]),
        notes: 'Patient anxieux, prévoir prise de sang en douceur'
      }
    });

    // Demande 2: Analyses d'urine de routine
    const examRequest2 = await prisma.examRequest.create({
      data: {
        patient_id: patients[1].patient.id, // Marie Martin
        requested_by: medicalStaff[1].id, // Dr. Moreau
        hospital_id: hospitals[0].id, // CHU Paris
        laboratory_id: laboratories[1].id, // Biogroup
        exam_type: 'urine_test',
        priority: 'normal',
        status: 'accepted',
        clinical_info: 'Contrôle de routine dans le cadre du suivi de grossesse. Recherche d\'infection urinaire et protéinurie.',
        requested_tests: JSON.stringify([
          'ECBU',
          'Protéinurie',
          'Glycosurie',
          'Cétonurie'
        ]),
        notes: 'Patiente enceinte de 28 semaines',
        scheduled_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Dans 2 jours
      }
    });

    // Demande 3: Bilan biochimique complet
    const examRequest3 = await prisma.examRequest.create({
      data: {
        patient_id: patients[2].patient.id, // Pierre Bernard
        requested_by: medicalStaff[0].id, // Dr. Bernard
        hospital_id: hospitals[1].id, // Hôpital Saint-Louis
        laboratory_id: laboratories[0].id, // Cerba
        exam_type: 'biochemistry',
        priority: 'high',
        status: 'completed',
        clinical_info: 'Bilan pré-opératoire pour intervention chirurgicale programmée. Patient diabétique sous traitement.',
        requested_tests: JSON.stringify([
          'Glycémie à jeun',
          'HbA1c',
          'Créatinine',
          'Urée',
          'Bilan lipidique',
          'Transaminases',
          'Gamma GT'
        ]),
        notes: 'Intervention prévue dans 1 semaine',
        scheduled_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Il y a 3 jours
        completed_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // Il y a 1 jour
        results_ready_at: new Date()
      }
    });

    examRequests.push(examRequest1, examRequest2, examRequest3);

    // Créer l'historique des statuts
    console.log('📋 Création de l\'historique des statuts...');
    
    // Historique pour la demande 1 (pending)
    await prisma.examStatusHistory.create({
      data: {
        exam_request_id: examRequest1.id,
        status: 'pending',
        changed_by: medicalStaff[0].id,
        notes: 'Demande d\'examen créée - Urgence médicale'
      }
    });

    // Historique pour la demande 2 (pending -> accepted)
    await Promise.all([
      prisma.examStatusHistory.create({
        data: {
          exam_request_id: examRequest2.id,
          status: 'pending',
          changed_by: medicalStaff[1].id,
          notes: 'Demande d\'examen créée'
        }
      }),
      prisma.examStatusHistory.create({
        data: {
          exam_request_id: examRequest2.id,
          status: 'accepted',
          changed_by: medicalStaff[2].id, // Technicien labo
          notes: 'Demande acceptée, programmée pour dans 2 jours'
        }
      })
    ]);

    // Historique pour la demande 3 (pending -> accepted -> completed)
    await Promise.all([
      prisma.examStatusHistory.create({
        data: {
          exam_request_id: examRequest3.id,
          status: 'pending',
          changed_by: medicalStaff[0].id,
          notes: 'Demande d\'examen créée - Bilan pré-opératoire'
        }
      }),
      prisma.examStatusHistory.create({
        data: {
          exam_request_id: examRequest3.id,
          status: 'accepted',
          changed_by: medicalStaff[2].id,
          notes: 'Demande acceptée, programmée rapidement'
        }
      }),
      prisma.examStatusHistory.create({
        data: {
          exam_request_id: examRequest3.id,
          status: 'completed',
          changed_by: medicalStaff[2].id,
          notes: 'Examens réalisés, résultats disponibles'
        }
      })
    ]);

    // ============================================================================
    // 7. CRÉER DES PARAMÈTRES DE NOTIFICATION ET NOTIFICATIONS DE TEST
    // ============================================================================

    console.log('🔔 Création des paramètres de notification...');
    
    // Créer les paramètres par défaut pour tous les utilisateurs
    const allUsers = [
      superAdmin,
      ...hospitalAdmins,
      ...labAdmins,
      ...medicalStaff,
      ...patients.map(p => p.user)
    ];

    for (const user of allUsers) {
      await prisma.notificationSettings.upsert({
        where: { user_id: user.id },
        update: {},
        create: {
          user_id: user.id,
          new_message_enabled: true,
          new_document_enabled: true,
          exam_status_enabled: true,
          in_app_enabled: true,
          email_enabled: user.role !== 'patient', // Emails désactivés pour les patients par défaut
          push_enabled: false,
          email_frequency: 'immediate'
        }
      });
    }

    console.log('🔔 Création des notifications de test...');
    
    const notifications = [];

    // Notification 1: Nouveau message pour le patient
    const notification1 = await prisma.notification.create({
      data: {
        user_id: patients[0].user.id, // Jean Dupont
        type: 'new_message',
        title: 'Nouveau message de Dr. Bernard',
        message: 'Bonjour Jean, vos résultats sont globalement bons. Je vais vous expliquer en détail lors de notre prochain rendez-vous.',
        data: JSON.stringify({
          conversationId: conversation1.id,
          conversationTitle: 'Consultation - Jean Dupont',
          senderName: 'Dr. Jean Bernard',
          messagePreview: 'Bonjour Jean, vos résultats sont globalement bons...'
        }),
        related_message_id: 2, // ID du message créé précédemment
        is_read: false
      }
    });

    // Notification 2: Nouveau document pour le patient
    const notification2 = await prisma.notification.create({
      data: {
        user_id: patients[1].user.id, // Marie Martin
        type: 'new_document',
        title: 'Nouveau document pour Marie Martin',
        message: 'Michel Dupont a ajouté un nouveau document : analyse_martin_' + Date.now() + '.pdf',
        data: JSON.stringify({
          documentId: documents[1].id,
          patientName: 'Marie Martin',
          uploaderName: 'Michel Dupont',
          filename: documents[1].filename,
          documentType: 'lab_result',
          description: 'Analyses sanguines complètes'
        }),
        related_document_id: documents[1].id,
        is_read: false
      }
    });

    // Notification 3: Demande d'examen créée (pour le laboratoire)
    const notification3 = await prisma.notification.create({
      data: {
        user_id: medicalStaff[2].id, // Michel Dupont (technicien labo)
        type: 'exam_request_created',
        title: 'Nouvelle demande d\'examen - Jean Dupont',
        message: 'Jean Bernard a demandé un examen blood_test pour Jean Dupont',
        data: JSON.stringify({
          examRequestId: examRequest1.id,
          patientName: 'Jean Dupont',
          requesterName: 'Jean Bernard',
          examType: 'blood_test',
          priority: 'urgent',
          clinicalInfo: 'Patient présente des symptômes de fatigue extrême et pâleur. Suspicion d\'anémie...'
        }),
        related_exam_id: examRequest1.id,
        is_read: false
      }
    });

    // Notification 4: Résultats d'examen prêts (pour le médecin et patient)
    const notification4 = await prisma.notification.create({
      data: {
        user_id: medicalStaff[0].id, // Dr. Bernard
        type: 'exam_results_ready',
        title: 'Examen résultats disponibles - Pierre Bernard',
        message: 'Michel Dupont a mis à jour le statut de l\'examen biochemistry : résultats disponibles',
        data: JSON.stringify({
          examRequestId: examRequest3.id,
          patientName: 'Pierre Bernard',
          processorName: 'Michel Dupont',
          examType: 'biochemistry',
          oldStatus: 'completed',
          newStatus: 'results_ready',
          priority: 'high'
        }),
        related_exam_id: examRequest3.id,
        is_read: false
      }
    });

    // Notification 5: Notification lue (pour tester les statistiques)
    const notification5 = await prisma.notification.create({
      data: {
        user_id: patients[0].user.id, // Jean Dupont
        type: 'new_document',
        title: 'Document partagé',
        message: 'Un nouveau document médical a été partagé avec vous',
        data: JSON.stringify({
          documentId: documents[0].id,
          patientName: 'Jean Dupont',
          uploaderName: 'Dr. Bernard'
        }),
        related_document_id: documents[0].id,
        is_read: true,
        read_at: new Date(Date.now() - 2 * 60 * 60 * 1000) // Lu il y a 2 heures
      }
    });

    notifications.push(notification1, notification2, notification3, notification4, notification5);

    console.log('✅ Seeding terminé avec succès !');
    console.log('\n📋 RÉSUMÉ DES DONNÉES CRÉÉES :');
    console.log(`🏥 Hôpitaux: ${hospitals.length}`);
    console.log(`🧪 Laboratoires: ${laboratories.length}`);
    console.log(`👑 Super Admin: 1 (admin@sante-app.fr / admin123)`);
    console.log(`🏥 Admins Hôpitaux: ${hospitalAdmins.length}`);
    console.log(`🧪 Admins Laboratoires: ${labAdmins.length}`);
    console.log(`👩‍⚕️ Personnel Médical: ${medicalStaff.length}`);
    console.log(`👥 Patients: ${patients.length} (mot de passe: patient123)`);
    console.log(`📄 Documents: ${documents.length}`);
    console.log(`💬 Conversations: 2`);
    console.log(`🧪 Demandes d'examens: ${examRequests.length}`);
    console.log(`🔔 Notifications: ${notifications.length}`);
    
    console.log('\n🔑 COMPTES DE TEST :');
    console.log('Super Admin: admin@sante-app.fr / admin123');
    console.log('Admin Hôpital: admin.chu-paris@sante-app.fr / hospital123');
    console.log('Admin Labo: admin.cerba@sante-app.fr / lab123');
    console.log('Médecin: dr.bernard@chu-paris.fr / staff123');
    console.log('Patient: jean.dupont@email.fr / patient123');

  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });