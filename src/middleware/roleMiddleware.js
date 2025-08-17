// ============================================================================
// MIDDLEWARE DE RÔLES - ALIAS POUR COMPATIBILITÉ
// ============================================================================
// 🎯 Alias pour le middleware de vérification des rôles
// 📅 Créé le : 12 Août 2025

const { requireRoles } = require('./auth');

// Export de la fonction requireRoles sous le nom roleMiddleware
module.exports = requireRoles;