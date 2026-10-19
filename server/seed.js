// Crée les tables et, si la base est vide, les données de démo.
//   npm run seed            → crée ce qui manque
//   npm run seed -- --reset → efface tout et recommence
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { pool, q, definirParametre } from './db.js';

const TABLES = `categories_articles, achats_articles, realisations, notifications_lues, notifications, locations, articles_location, commande_lignes, commandes,
  produits, reservations, promotions, services, users, fichiers, parametres`;

// Réglages par défaut : modifiables dans « Réglages » (administration)
export const FIDELITE = { seuil: 4, remise: 50 };       // après 4 soins terminés, le 5e est à -50 % (« chtar som »)
// Robes, tenues, bijoux et accessoires de démonstration :
// [nom, catégorie, description, taille, prix par jour (null = pas en location), caution, prix de vente (null = pas à vendre), illustration]
const ARTICLES = [
  ['Robe de mariée princesse', 'Robes de mariée', 'Dentelle, traîne longue', '38', 400, 1000, null, 'robe-mariee-princesse'],
  ['Robe de mariée sirène', 'Robes de mariée', 'Satin et perles', '36', 350, 1000, 2800, 'robe-mariee-sirene'],
  ['Robe de mariée bohème', 'Robes de mariée', 'Dentelle légère, manches longues', '40', 300, 800, 2200, 'robe-mariee-boheme'],
  ['Robe de mariée manches longues', 'Robes de mariée', 'Crêpe drapé, coupe sirène', '38', 380, 1000, null, 'robe-mariee-manches'],
  ['Keswa tounsia', 'Tenues traditionnelles', 'Velours bordeaux, broderie dorée', '40', 150, 500, null, 'keswa-tounsia'],
  ['Keswa gabsia', 'Tenues traditionnelles', 'La tenue de Gabès, bleu nuit et or', '38', 140, 500, null, 'keswa-gabsia'],
  ['Jebba fergani', 'Tenues traditionnelles', 'Brodée main, fil doré', '38', 200, 600, 1500, 'jebba-fergani'],
  ['Fouta & blouza', 'Tenues traditionnelles', 'Blouza brodée, fouta rayée', '36', 90, 300, 650, 'fouta-blouza'],
  ['Caftan velours bordeaux', 'Caftans & takchita', 'Galon doré, ceinture bijou', '40', 120, 400, 1200, 'caftan-bordeaux'],
  ['Takchita brodée émeraude', 'Caftans & takchita', 'Deux pièces, broderie or', '38', 150, 500, null, 'takchita-emeraude'],
  ['Caftan moderne rose poudré', 'Caftans & takchita', 'Crêpe fluide, perles nacrées', '36', 100, 300, 900, 'caftan-rose'],
  ['Robe de soirée longue', 'Robes de soirée', 'Mousseline bordeaux', '38', 80, 200, 450, 'soiree-bordeaux'],
  ['Robe de soirée paillettes', 'Robes de soirée', 'Neuve, champagne', '36', null, 0, 520, 'soiree-paillettes'],
  ['Robe satin émeraude', 'Robes de soirée', 'Coupe sirène, dos nu', '38', 70, 200, 380, 'soiree-emeraude'],
  ['Petite robe noire', 'Robes de soirée', 'Courte, plissée', '36', 50, 150, 250, 'petite-robe-noire'],
  ['Parure bijoux mariée', 'Bijoux', 'Collier et boucles assortis', '', 60, 150, null, 'parure-mariee'],
  ['Diadème strass', 'Bijoux', 'Doré, pierres roses', '', 25, 50, 90, 'diademe-strass'],
  ['Boucles d’oreilles chandelier', 'Bijoux', 'Dorées, pampilles', '', 20, 50, 70, 'boucles-chandelier'],
  ['Khlel en argent', 'Bijoux', 'Fibules traditionnelles et chaîne', '', 40, 150, null, 'khlel-argent'],
  ['Bracelets dorés (lot de 6)', 'Bijoux', 'Pour keswa et caftan', '', 15, 50, 60, 'bracelets-dores'],
  ['Voile de mariée cathédrale', 'Accessoires', 'Tulle brodé, 3 m, peigne doré', '', 40, 100, 180, 'voile-cathedrale'],
  ['Pochette de soirée', 'Accessoires', 'Nude pailletée, chaîne dorée', '', 15, 30, 55, 'pochette-soiree'],
  ['Escarpins dorés', 'Accessoires', 'Talon 9 cm', '38', 20, 50, 95, 'escarpins-dores'],
  ['Ceinture bijou', 'Accessoires', 'Pour caftan et takchita', '', 20, 50, 80, 'ceinture-bijou']
];

export const HORAIRES = { ouverture: '09:00', fermeture: '19:00', pas: 30, postes: 3, joursFermes: [0] };  // 0 = dimanche
// Location : avance à verser (pourcentage du total) et délai pour la verser, sinon la demande est annulée
export const LOCATION = { avancePct: 30, delaiHeures: 12 };

export async function initialiser({ reset = false } = {}) {
  if (reset) await pool.query(`DROP TABLE IF EXISTS ${TABLES} CASCADE`);
  await pool.query(readFileSync(new URL('./schema.sql', import.meta.url), 'utf8'));

  const [{ n }] = await q('SELECT count(*)::int AS n FROM users');
  if (n > 0) return false;

  await definirParametre('fidelite', FIDELITE);
  await definirParametre('horaires', HORAIRES);
  await definirParametre('location', LOCATION);

  const mdp = await bcrypt.hash('1234', 10);
  // Safa : administratrice et maquilleuse (elle fait partie de l'équipe)
  await q(`INSERT INTO users (nom, email, telephone, password, role, equipe, specialites) VALUES
    ('Safa – El Ghanja', 'admin@elghanja.tn', '26 972 623', $1, 'admin', true, '{Maquillage}')`, [mdp]);
  // Équipe de démonstration (mot de passe 1234)
  for (const [nom, email, tel, specialites] of [
    ['Amira', 'amira@elghanja.tn', '22 111 222', '{Coiffure}'],
    ['Ines', 'ines@elghanja.tn', '22 333 444', '{Maquillage,Épilation}'],
    ['Nour', 'nour@elghanja.tn', '22 555 666', '{Ongles,"Soins visage"}']
  ])
    await q(`INSERT INTO users (nom, email, telephone, password, role, equipe, specialites)
      VALUES ($1, $2, $3, $4, 'employe', true, $5)`, [nom, email, tel, mdp, specialites]);
  const [salma] = await q(`INSERT INTO users (nom, telephone, tel_cle, email, password, role)
    VALUES ('Salma Ben Ali', '20 100 200', tel_cle('20 100 200'), 'salma@example.com', $1, 'cliente') RETURNING id`, [mdp]);
  await q(`INSERT INTO users (nom, telephone, tel_cle, email, password, role)
    VALUES ('Rim Trabelsi', '50 300 400', tel_cle('50 300 400'), 'rim@example.com', $1, 'cliente')`, [mdp]);

  const services = [
    ['Brushing', 'Coiffure', 'Brushing lisse ou wavy', 15, 45],
    ['Maquillage jour', 'Maquillage', 'Maquillage naturel et lumineux', 35, 45],
    ['Maquillage soirée', 'Maquillage', 'Maquillage pour fêtes et soirées', 60, 60],
    ['Maquillage mariée', 'Maquillage', 'Essai + jour J par Safa', 250, 120],
    ['Maquillage fiançailles / outia', 'Maquillage', 'Look traditionnel ou moderne', 120, 90],
    ['Pose de faux cils', 'Maquillage', 'Cils à la bande ou bouquets', 15, 20],
    ['Chignon & coiffure soirée', 'Coiffure', 'Chignon, ondulations, accessoires', 50, 60],
    ['Soin du visage hydratant', 'Soins visage', 'Nettoyage, gommage, masque', 45, 60],
    ['Épilation sourcils', 'Épilation', 'Au fil ou à la cire', 7, 15],
    ['Pose vernis semi-permanent', 'Ongles', 'Tenue 3 semaines', 35, 60]
  ];
  const ids = [];
  for (const s of services)
    ids.push((await q(`INSERT INTO services (nom, categorie, description, prix, duree) VALUES ($1,$2,$3,$4,$5) RETURNING id`, s))[0].id);

  const produits = [
    ['Kit de pinceaux maquillage', 'Maquillage', '12 pinceaux + trousse', 65, 6],
    ['Perles de poudre bronzantes', 'Maquillage', 'Effet bonne mine', 32, 10],
    ['Rouge à lèvres mat', 'Maquillage', 'Plusieurs teintes', 18, 25],
    ['Éponge à maquillage', 'Maquillage', 'Pour fond de teint', 9, 40],
    ['Crème hydratante visage', 'Soins', 'Peaux sèches, 50 ml', 45, 10],
    ['Huile de figue de Barbarie', 'Soins', '30 ml, bio', 85, 3]
  ];
  for (const p of produits)
    await q('INSERT INTO produits (nom, categorie, description, prix, stock) VALUES ($1,$2,$3,$4,$5)', p);

  const categories = ['Robes de mariée', 'Tenues traditionnelles', 'Caftans & takchita', 'Robes de soirée', 'Bijoux', 'Accessoires'];
  for (const [i, nom] of categories.entries())
    await q('INSERT INTO categories_articles (nom, ordre) VALUES ($1, $2) ON CONFLICT (nom) DO UPDATE SET ordre = $2', [nom, i + 1]);
  for (const a of ARTICLES)
    await q(`INSERT INTO articles_location (nom, categorie, description, taille, prix_jour, caution, prix_vente)
      VALUES ($1,$2,$3,$4,$5,$6,$7)`, a.slice(0, 7));

  // Salma a déjà 4 soins terminés : sa prochaine réservation est à -50 % (démonstration de la carte fidélité)
  for (let i = 0; i < 4; i++)
    await q(`INSERT INTO reservations (client_id, service_id, date, heure, duree, prix, prix_final, statut)
      SELECT $1, id, current_date - ($2 * 7), '10:00', duree, prix, prix, 'terminee' FROM services WHERE id = $3`,
    [salma.id, 4 - i, ids[i % 2]]);

  await q(`INSERT INTO promotions (titre, message, cible, remise_pct, date_debut, date_fin)
    VALUES ('Semaine beauté', 'Profitez de -20 % sur tous les soins cette semaine !', 'services', 20, current_date, current_date + 7)`);
  await q(`INSERT INTO notifications (user_id, type, titre, message)
    VALUES (NULL, 'promotion', '🎉 Semaine beauté : -20 %', 'Profitez de -20 % sur tous les soins cette semaine !')`);
  await photosDemo();
  return true;
}

// Illustrations des soins (dossier photos-demo/, dessinées par photos-demo/dessiner.mjs).
// Seulement pour les soins qui n'ont pas encore de photo : celles de Safa ne sont jamais remplacées.
const PHOTOS_SOINS = {
  'Brushing': 'brushing', 'Chignon & coiffure soirée': 'chignon', 'Maquillage fiançailles / outia': 'maquillage-outia',
  'Maquillage jour': 'maquillage-jour', 'Maquillage mariée': 'maquillage-mariee', 'Maquillage soirée': 'maquillage-soiree',
  'Pose de faux cils': 'faux-cils', 'Pose vernis semi-permanent': 'vernis', 'Soin du visage hydratant': 'soin-visage',
  'Épilation sourcils': 'sourcils'
};
export async function photosDemo() {
  let n = 0;
  const liste = [
    ...Object.entries(PHOTOS_SOINS).map(([nom, f]) => ['services', nom, `${f}.jpg`]),
    ...ARTICLES.map(a => ['articles_location', a[0], `articles/${a[7]}.jpg`])
  ];
  for (const [table, nom, fichier] of liste) {
    const [s] = await q(`SELECT id FROM ${table} WHERE nom = $1 AND image_id IS NULL`, [nom]);
    if (!s) continue;
    const contenu = readFileSync(new URL(`./photos-demo/${fichier}`, import.meta.url));
    const [f] = await q(`INSERT INTO fichiers (nom, type, taille, contenu) VALUES ($1, 'image/jpeg', $2, $3) RETURNING id`,
      [fichier.split('/').pop(), contenu.length, contenu]);
    await q(`UPDATE ${table} SET image_id = $2 WHERE id = $1`, [s.id, f.id]);
    n++;
  }
  return n;
}

// Lancé directement : node seed.js [--reset]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const cree = await initialiser({ reset: process.argv.includes('--reset') });
    console.log(cree ? '✔ Base créée avec les données de démo.' : '✔ Tables à jour (données existantes conservées).');
    // node seed.js --photos : ajoute les illustrations aux soins existants qui n'ont pas de photo
    if (!cree && process.argv.includes('--photos')) console.log(`✔ ${await photosDemo()} illustration(s) ajoutée(s) aux soins.`);
  } catch (e) {
    console.error('✘', e.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
