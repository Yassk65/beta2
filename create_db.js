// Script pour créer la base de données automatiquement
require('dotenv').config();
const mysql = require('mysql2/promise');

async function createDatabase() {
    try {
        console.log('🔄 Création de la base de données...');
        
        // Connexion sans spécifier de base de données
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || ''
        });

        // Créer la base de données
        await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Base de données '${process.env.DB_NAME}' créée avec succès!`);
        
        await connection.end();
        
    } catch (error) {
        console.error('❌ Erreur lors de la création de la base:', error.message);
        process.exit(1);
    }
}

createDatabase();