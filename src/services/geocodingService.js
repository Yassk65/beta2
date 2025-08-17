// 🌍 SERVICE DE GÉOCODAGE
// 📅 Créé le : 16 Août 2025
// 🎯 Convertir les adresses en coordonnées GPS

const NodeGeocoder = require('node-geocoder');

class GeocodingService {
  constructor() {
    // Configuration du géocodeur (utilise OpenStreetMap - gratuit)
    this.geocoder = NodeGeocoder({
      provider: 'openstreetmap',
      httpAdapter: 'https',
      formatter: null
    });
  }

  /**
   * Convertir une adresse en coordonnées GPS
   * @param {string} address - Adresse complète
   * @param {string} city - Ville
   * @param {string} country - Pays (par défaut: Burkina Faso)
   * @returns {Promise<{latitude: number, longitude: number} | null>}
   */
  async getCoordinates(address, city = '', country = 'Burkina Faso') {
    try {
      const fullAddress = `${address}, ${city}, ${country}`;
      console.log(`🔍 Géocodage de: ${fullAddress}`);
      
      const results = await this.geocoder.geocode(fullAddress);
      
      if (results && results.length > 0) {
        const result = results[0];
        const coordinates = {
          latitude: parseFloat(result.latitude),
          longitude: parseFloat(result.longitude)
        };
        
        // Validation spécifique au Burkina Faso
        if (this.isValidBurkinaFasoCoordinates(coordinates.latitude, coordinates.longitude)) {
          console.log(`✅ Coordonnées trouvées: ${coordinates.latitude}, ${coordinates.longitude}`);
          return coordinates;
        } else {
          console.log(`❌ Coordonnées hors du Burkina Faso: ${coordinates.latitude}, ${coordinates.longitude}`);
          return null;
        }
      }
      
      console.log(`❌ Aucune coordonnée trouvée pour: ${fullAddress}`);
      return null;
      
    } catch (error) {
      console.error(`❌ Erreur de géocodage pour "${address}":`, error.message);
      return null;
    }
  }

  /**
   * Géocoder plusieurs adresses en lot
   * @param {Array} establishments - Liste des établissements
   * @returns {Promise<Array>} - Établissements avec coordonnées
   */
  async geocodeBatch(establishments) {
    const results = [];
    
    for (const establishment of establishments) {
      const coordinates = await this.getCoordinates(establishment.address, establishment.city);
      
      results.push({
        ...establishment,
        latitude: coordinates?.latitude || null,
        longitude: coordinates?.longitude || null
      });
      
      // Pause pour éviter de surcharger l'API
      await this.delay(1000);
    }
    
    return results;
  }

  /**
   * Pause entre les requêtes
   * @param {number} ms - Millisecondes
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valider des coordonnées GPS génériques
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  validateCoordinates(latitude, longitude) {
    return (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      latitude >= -90 && latitude <= 90 &&
      longitude >= -180 && longitude <= 180
    );
  }

  /**
   * Valider des coordonnées spécifiques au Burkina Faso
   * @param {number} latitude 
   * @param {number} longitude 
   * @returns {boolean}
   */
  isValidBurkinaFasoCoordinates(latitude, longitude) {
    // Limites géographiques du Burkina Faso
    const BURKINA_BOUNDS = {
      north: 15.084,   // Frontière avec le Mali/Niger
      south: 9.401,    // Frontière avec la Côte d'Ivoire/Ghana
      east: 2.405,     // Frontière avec le Niger/Bénin
      west: -5.518     // Frontière avec le Mali/Côte d'Ivoire
    };

    return (
      this.validateCoordinates(latitude, longitude) &&
      latitude >= BURKINA_BOUNDS.south &&
      latitude <= BURKINA_BOUNDS.north &&
      longitude >= BURKINA_BOUNDS.west &&
      longitude <= BURKINA_BOUNDS.east
    );
  }
}

module.exports = new GeocodingService();