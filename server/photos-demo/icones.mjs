// Icônes de l'application installée (écran d'accueil Android / iPhone) à partir du logo.
//   node photos-demo/icones.mjs
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
const www = fileURLToPath(new URL('../../www/', import.meta.url));
const POUDRE = { r: 252, g: 216, b: 218, alpha: 1 };

// Logo centré sur fond rose poudré ; « marge » = part vide autour (zone sûre des icônes « maskable » : 20 %)
async function icone(taille, marge, fichier) {
  const logo = await sharp(`${www}img/logo.png`).resize({ width: Math.round(taille * (1 - 2 * marge)), height: Math.round(taille * (1 - 2 * marge)), fit: 'inside' }).toBuffer();
  await sharp({ create: { width: taille, height: taille, channels: 4, background: POUDRE } })
    .composite([{ input: logo, gravity: 'center' }]).png().toFile(`${www}icons/${fichier}`);
}
await icone(192, 0.1, 'icon-192.png');
await icone(512, 0.1, 'icon-512.png');
await icone(512, 0.2, 'icon-maskable-512.png');
await icone(180, 0.1, 'apple-touch-icon.png');
// Petite icône de la barre de notifications Android : silhouette blanche sur fond transparent
await sharp(`${www}img/logo-blanc.png`).resize(80, 80, { fit: 'inside' })
  .extend({ top: 8, bottom: 8, left: 8, right: 8, background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile(`${www}icons/badge-96.png`);
console.log('✔ icônes dans www/icons');
