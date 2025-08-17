// 🏥 ROUTES DES ÉTABLISSEMENTS DE SANTÉ
// 📅 Créé le : 16 Août 2025
// 🎯 Gestion des hôpitaux et laboratoires

const express = require('express');
const { PrismaClient } = require('@prisma/client');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 🏥 RÉCUPÉRER TOUS LES ÉTABLISSEMENTS
 * GET /api/establishments
 */
router.get('/', async (req, res) => {
  try {
    // Récupérer les hôpitaux
    const hospitals = await prisma.hospital.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        latitude: true,
        longitude: true
      }
    });

    // Récupérer les laboratoires
    const laboratories = await prisma.laboratory.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        latitude: true,
        longitude: true
      }
    });

    // Formater les données avec le type et ajouter des spécialités fictives
    const establishments = [
      ...hospitals.map(hospital => ({
        ...hospital,
        type: 'hospital',
        specialties: ['Cardiologie', 'Neurologie', 'Urgences'],
        postal_code: hospital.address.match(/\d{5}/)?.[0] || '75000'
      })),
      ...laboratories.map(lab => ({
        ...lab,
        type: 'laboratory',
        specialties: ['Analyses sanguines', 'Microbiologie', 'Biochimie'],
        postal_code: lab.address.match(/\d{5}/)?.[0] || '75000'
      }))
    ];

    res.json({
      success: true,
      message: 'Établissements récupérés avec succès',
      data: establishments,
      count: establishments.length
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des établissements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des établissements',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

/**
 * 🔍 RECHERCHER DES ÉTABLISSEMENTS
 * GET /api/establishments/search?q=terme
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Le terme de recherche doit contenir au moins 2 caractères'
      });
    }

    const searchTerm = q.trim();

    // Recherche dans les hôpitaux
    const hospitals = await prisma.hospital.findMany({
      where: {
        AND: [
          { is_active: true },
          {
            OR: [
              { name: { contains: searchTerm } },
              { city: { contains: searchTerm } },
              { address: { contains: searchTerm } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        latitude: true,
        longitude: true
      }
    });

    // Recherche dans les laboratoires
    const laboratories = await prisma.laboratory.findMany({
      where: {
        AND: [
          { is_active: true },
          {
            OR: [
              { name: { contains: searchTerm } },
              { city: { contains: searchTerm } },
              { address: { contains: searchTerm } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        email: true,
        city: true,
        latitude: true,
        longitude: true
      }
    });

    // Formater les résultats
    const results = [
      ...hospitals.map(hospital => ({
        ...hospital,
        type: 'hospital',
        specialties: ['Cardiologie', 'Neurologie', 'Urgences'],
        postal_code: hospital.address.match(/\d{5}/)?.[0] || '75000'
      })),
      ...laboratories.map(lab => ({
        ...lab,
        type: 'laboratory',
        specialties: ['Analyses sanguines', 'Microbiologie', 'Biochimie'],
        postal_code: lab.address.match(/\d{5}/)?.[0] || '75000'
      }))
    ];

    res.json({
      success: true,
      message: `${results.length} établissement(s) trouvé(s)`,
      data: results,
      query: q,
      count: results.length
    });

  } catch (error) {
    console.error('Erreur lors de la recherche:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la recherche',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

/**
 * ➕ AJOUTER UN NOUVEL ÉTABLISSEMENT (avec géocodage automatique)
 * POST /api/establishments
 */
router.post('/', async (req, res) => {
  try {
    const { name, type, address, city, phone, email } = req.body;
    
    // Validation des données requises
    if (!name || !type || !address || !city) {
      return res.status(400).json({
        success: false,
        message: 'Nom, type, adresse et ville sont requis'
      });
    }

    if (!['hospital', 'laboratory'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Type doit être "hospital" ou "laboratory"'
      });
    }

    // Géocodage automatique de l'adresse
    const geocodingService = require('../services/geocodingService');
    const coordinates = await geocodingService.getCoordinates(address, city);
    
    let establishment;
    const establishmentData = {
      name,
      address,
      city,
      phone,
      email,
      latitude: coordinates?.latitude || null,
      longitude: coordinates?.longitude || null
    };

    // Créer l'établissement selon son type
    if (type === 'hospital') {
      establishment = await prisma.hospital.create({
        data: establishmentData
      });
    } else {
      establishment = await prisma.laboratory.create({
        data: establishmentData
      });
    }

    res.status(201).json({
      success: true,
      message: 'Établissement créé avec succès',
      data: {
        ...establishment,
        type,
        geocoded: coordinates !== null
      }
    });

  } catch (error) {
    console.error('Erreur lors de la création:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'établissement',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
});

module.exports = router;