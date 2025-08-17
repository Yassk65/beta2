// Script pour corriger les erreurs de mode Prisma
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/routes/users.js');

// Lire le fichier
let content = fs.readFileSync(filePath, 'utf8');

// Remplacer toutes les occurrences de ", mode: 'insensitive'"
content = content.replace(/, mode: 'insensitive'/g, '');

// Écrire le fichier corrigé
fs.writeFileSync(filePath, content);

console.log('✅ Fichier corrigé : toutes les occurrences de "mode: \'insensitive\'" ont été supprimées');