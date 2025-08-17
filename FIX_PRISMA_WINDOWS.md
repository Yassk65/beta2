# 🔧 FIX ERREUR PRISMA WINDOWS

## 🚨 Erreur Rencontrée
```
Error: EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

## 💡 Solutions (Dans l'ordre de priorité)

### **Solution 1 : Fermer tous les processus Node.js**
```bash
# Arrêter tous les processus Node.js
taskkill /f /im node.exe

# Puis relancer
npx prisma generate
```

### **Solution 2 : Supprimer le cache Prisma**
```bash
# Supprimer le dossier .prisma
rmdir /s /q node_modules\.prisma

# Réinstaller
npm install
npx prisma generate
```

### **Solution 3 : Exécuter en tant qu'administrateur**
1. **Ferme ton terminal/PowerShell**
2. **Clique droit** sur PowerShell ou CMD
3. **"Exécuter en tant qu'administrateur"**
4. **Navigue** vers ton dossier backend
5. **Relance** `npx prisma generate`

### **Solution 4 : Désactiver l'antivirus temporairement**
1. **Désactive temporairement** ton antivirus (Windows Defender ou autre)
2. **Relance** `npx prisma generate`
3. **Réactive** ton antivirus après

### **Solution 5 : Utiliser Yarn au lieu de NPM**
```bash
# Installer Yarn si pas déjà fait
npm install -g yarn

# Utiliser Yarn
yarn install
yarn prisma generate
```

### **Solution 6 : Forcer la régénération**
```bash
# Supprimer complètement node_modules
rmdir /s /q node_modules

# Nettoyer le cache npm
npm cache clean --force

# Réinstaller
npm install

# Générer Prisma
npx prisma generate
```

### **Solution 7 : Alternative avec db pull**
```bash
# Au lieu de generate, utiliser db pull
npx prisma db pull

# Puis generate
npx prisma generate
```

## 🎯 Solution Rapide Recommandée

**Essaie dans cet ordre :**

1. **Ferme WAMP/Apache** si il tourne
2. **Ferme VS Code** et tous les terminaux
3. **Ouvre PowerShell en ADMINISTRATEUR**
4. **Va dans ton dossier backend**
5. **Lance :**
```bash
taskkill /f /im node.exe
rmdir /s /q node_modules\.prisma
npx prisma generate
```

## 🔄 Si Ça Ne Marche Toujours Pas

**Alternative : Utiliser directement la DB sans Prisma generate**

1. **Assure-toi que ta DB `labresult_mvp` est créée** avec le script SQL
2. **Modifie ton .env :**
```env
DATABASE_URL="mysql://root:@localhost:3306/labresult_mvp"
```
3. **Lance directement ton serveur :**
```bash
npm start
```

## 🚀 Test Final

Une fois que `npx prisma generate` fonctionne :

```bash
# Tester la connexion
npx prisma studio

# Ou lancer le serveur
npm start
```

## 💡 Prévention Future

Pour éviter ce problème :
- **Ferme toujours** les processus Node.js avant de faire `prisma generate`
- **Utilise un terminal administrateur** pour les opérations Prisma
- **Ajoute une exception** dans ton antivirus pour le dossier du projet