/* =========================================================
   El Ghanja (Safa Make-up Artist, Gabès) – API (Express + PostgreSQL)
   Espaces : Administration, Clientes.
   Activités : réservations de soins, boutique (vente), location ;
   promotions envoyées aux clientes, carte fidélité (N soins terminés → le suivant remisé).
   Sert aussi l'application web (dossier ../www)
   ========================================================= */
import './env.js';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { fileURLToPath } from 'node:url';
import { q, transaction, parametre, definirParametre } from './db.js';
import { initialiser, FIDELITE, HORAIRES, LOCATION } from './seed.js';
import * as mail from './mail.js';

const SECRET = process.env.JWT_SECRET;
if (!SECRET) throw new Error('JWT_SECRET manquant dans server/.env');

class Erreur extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// ================= DATES (heure de Tunis) =================
const aujourdhui = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Tunis' });
const minutesMaintenant = () => {
  const [h, m] = new Date().toLocaleTimeString('en-GB', { timeZone: 'Africa/Tunis', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).split(':');
  return h * 60 + Number(m);
};
const enMinutes = hhmm => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
const enHeure = min => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const dateValide = d => DATE_RE.test(d || '') && !isNaN(Date.parse(d + 'T00:00:00Z'));
const jourSemaine = d => new Date(d + 'T00:00:00Z').getUTCDay();
const joursEntre = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

const arrondi = n => Math.round(n * 1000) / 1000;
const avecRemise = (prix, pct) => arrondi(prix * (100 - pct) / 100);

// ================= APPLICATION =================
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(fileURLToPath(new URL('../www', import.meta.url))));

async function auth(req, res, next) {
  let id;
  try {
    ({ id } = jwt.verify((req.headers.authorization || '').replace(/^Bearer /, ''), SECRET));
  } catch {
    return res.status(401).json({ erreur: 'Session expirée, reconnectez-vous.' });
  }
  const [u] = await q(`SELECT id, nom, telephone, email, role, created_at, equipe, specialites, photo_id FROM users
    WHERE id = $1 AND actif`, [id]);
  if (!u) return res.status(401).json({ erreur: "Ce compte n'existe plus ou a été désactivé." });
  req.user = u;
  next();
}
const admin = (req, res, next) =>
  req.user.role === 'admin' ? next() : res.status(403).json({ erreur: "Réservé à l'administration." });
const estAdmin = req => req.user.role === 'admin';

const jeton = u => jwt.sign({ id: u.id }, SECRET, { expiresIn: '30d' });
const notifier = (userId, type, titre, message = '', qq = q) =>
  qq('INSERT INTO notifications (user_id, type, titre, message) VALUES ($1, $2, $3, $4)', [userId, type, titre, message]);

// ================= RÉGLAGES, PROMOTIONS, FIDÉLITÉ =================
const reglages = async () => ({
  fidelite: await parametre('fidelite', FIDELITE),
  horaires: await parametre('horaires', HORAIRES),
  location: await parametre('location', LOCATION)
});

// Meilleure promotion en cours pour une activité (« tout » compte pour toutes)
async function promoActive(cible, qq = q) {
  const [p] = await qq(`SELECT id, titre, remise_pct FROM promotions
    WHERE cible IN ($1, 'tout') AND $2::date BETWEEN date_debut AND date_fin
    ORDER BY remise_pct DESC LIMIT 1`, [cible, aujourdhui()]);
  return p || null;
}

// Carte fidélité : chaque soin terminé (non offert) = 1 point ; à « seuil » points, la réservation suivante est remisée.
// Une réservation cadeau (non annulée) consomme « seuil » points ; si elle est annulée, les points reviennent.
async function fidelite(clientId, qq = q) {
  const { seuil, remise } = await parametre('fidelite', FIDELITE);
  const [r] = await qq(`SELECT
      count(*) FILTER (WHERE statut = 'terminee' AND NOT cadeau)::int AS faits,
      count(*) FILTER (WHERE cadeau AND statut <> 'annulee')::int AS cadeaux
    FROM reservations WHERE client_id = $1`, [clientId]);
  const points = Math.max(0, r.faits - r.cadeaux * seuil);
  return { seuil, remise, points: Math.min(points, seuil), cadeauDisponible: points >= seuil, cadeauxRecus: r.cadeaux };
}

// ================= COMPTES =================
const essais = new Map();   // trop d'essais de mot de passe : pause de 15 minutes (par identifiant)

app.post('/api/login', async (req, res) => {
  const identifiant = String(req.body.identifiant || '').trim();
  const cle = identifiant.toLowerCase();
  const e = essais.get(cle);
  if (e && e.n >= 8 && Date.now() - e.debut < 15 * 60e3)
    throw new Erreur(429, 'Trop d’essais. Réessayez dans 15 minutes.');
  const [u] = identifiant.includes('@')
    ? await q('SELECT * FROM users WHERE lower(email) = $1', [cle])
    : await q('SELECT * FROM users WHERE tel_cle = tel_cle($1)', [identifiant]);
  if (!u || !(await bcrypt.compare(String(req.body.password || ''), u.password))) {
    essais.set(cle, e && Date.now() - e.debut < 15 * 60e3 ? { ...e, n: e.n + 1 } : { n: 1, debut: Date.now() });
    throw new Erreur(401, 'Identifiant ou mot de passe incorrect.');
  }
  if (!u.actif) throw new Erreur(403, 'Ce compte a été désactivé par l’administration.');
  essais.delete(cle);
  res.json({ token: jeton(u) });
});

function verifierCliente({ nom, telephone, email }) {
  if (!String(nom || '').trim()) throw new Erreur(400, 'Le nom est obligatoire.');
  if (String(telephone || '').replace(/\D/g, '').length < 8) throw new Erreur(400, 'Numéro de téléphone invalide.');
  if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Erreur(400, 'Adresse email invalide.');
}
async function creerCliente({ nom, telephone, email }, password) {
  try {
    const [u] = await q(`INSERT INTO users (nom, telephone, tel_cle, email, password, role)
      VALUES ($1, $2, tel_cle($2), $3, $4, 'cliente') RETURNING id`,
    [String(nom).trim(), String(telephone).trim(), email ? String(email).trim().toLowerCase() : null, await bcrypt.hash(password, 10)]);
    return u;
  } catch (e) {
    if (e.code === '23505') throw new Erreur(409, 'Ce numéro de téléphone ou cet email a déjà un compte.');
    throw e;
  }
}

// Inscription d'une cliente depuis l'application
app.post('/api/inscription', async (req, res) => {
  verifierCliente(req.body);
  if (String(req.body.password || '').length < 4) throw new Erreur(400, 'Mot de passe : 4 caractères minimum.');
  const u = await creerCliente(req.body, String(req.body.password));
  await notifier(u.id, 'bienvenue', '💖 Bienvenue chez El Ghanja !',
    'Réservez vos soins en ligne. Votre carte fidélité commence aujourd’hui.');
  res.status(201).json({ token: jeton(u) });
});

app.get('/api/moi', auth, async (req, res) => {
  res.json({ ...req.user, fidelite: req.user.role === 'cliente' ? await fidelite(req.user.id) : null });
});

app.put('/api/moi', auth, async (req, res) => {
  const { nom, email, ancien, nouveau } = req.body;
  if (nouveau) {
    const [u] = await q('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!(await bcrypt.compare(String(ancien || ''), u.password))) throw new Erreur(400, 'Ancien mot de passe incorrect.');
    if (String(nouveau).length < 4) throw new Erreur(400, 'Mot de passe : 4 caractères minimum.');
    await q('UPDATE users SET password = $2 WHERE id = $1', [req.user.id, await bcrypt.hash(String(nouveau), 10)]);
  }
  if (nom !== undefined || email !== undefined) {
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Erreur(400, 'Adresse email invalide.');
    try {
      await q('UPDATE users SET nom = coalesce(NULLIF(trim($2), \'\'), nom), email = $3 WHERE id = $1',
        [req.user.id, nom || '', email ? String(email).trim().toLowerCase() : null]);
    } catch (e) {
      if (e.code === '23505') throw new Erreur(409, 'Cet email est déjà utilisé.');
      throw e;
    }
  }
  res.json({ ok: true });
});

// ================= CATALOGUE (public) =================
// Soins, produits, articles à louer, avec le prix après promotion
app.get('/api/catalogue', async (req, res) => {
  const [promoS, promoP, promoL] = await Promise.all(['services', 'produits', 'location'].map(c => promoActive(c)));
  const remise = (p, promo) => p == null ? null : promo ? avecRemise(p, promo.remise_pct) : p;
  const services = await q('SELECT * FROM services WHERE actif ORDER BY categorie, nom');
  const produits = await q('SELECT * FROM produits WHERE actif ORDER BY categorie, nom');
  // Robes & accessoires : ni vendus, ni réservés par une demande d'achat en cours
  const articles = await q(`SELECT a.* FROM articles_location a WHERE ${ARTICLE_DISPO} ORDER BY categorie, nom`);
  const promotions = await q(`SELECT id, titre, message, cible, remise_pct, date_debut, date_fin FROM promotions
    WHERE $1::date BETWEEN date_debut AND date_fin ORDER BY remise_pct DESC`, [aujourdhui()]);
  res.json({
    services: services.map(s => ({ ...s, prix_promo: remise(s.prix, promoS) })),
    produits: produits.map(p => ({ ...p, prix_promo: remise(p.prix, promoP) })),
    articles: articles.map(a => ({ ...a, prix_promo: remise(a.prix_jour, promoL) })),
    promotions,
    categories: await q('SELECT * FROM categories_articles ORDER BY ordre, nom'),
    reglages: await reglages(),
    aujourdhui: aujourdhui()
  });
});

// ================= GESTION DU CATALOGUE (administration) =================
const CATALOGUES = {
  services: { table: 'services', champs: ['nom', 'categorie', 'description', 'prix', 'duree', 'image_id', 'actif'] },
  produits: { table: 'produits', champs: ['nom', 'categorie', 'description', 'prix', 'stock', 'image_id', 'actif'] },
  articles: { table: 'articles_location', champs: ['nom', 'categorie', 'description', 'taille', 'prix_jour', 'caution', 'prix_vente', 'vendu', 'image_id', 'actif'] }
};
const VIDE_EST_NULL = ['image_id', 'prix_jour', 'prix_vente'];   // champ laissé vide : « pas de photo », « pas en location », « pas à vendre »
function catalogue(req) {
  const c = CATALOGUES[req.params.cat];
  if (!c) throw new Erreur(404, 'Catalogue inconnu.');
  return c;
}
function valeurs(c, body) {
  const champs = c.champs.filter(k => body[k] !== undefined);
  if (!champs.length) throw new Erreur(400, 'Aucune donnée.');
  return { champs, vals: champs.map(k => (body[k] === '' || body[k] === null) && VIDE_EST_NULL.includes(k) ? null : body[k]) };
}

app.get('/api/gestion/:cat', auth, admin, async (req, res) => {
  const c = catalogue(req);
  res.json(await q(`SELECT * FROM ${c.table} ORDER BY actif DESC, ${c.table === 'articles_location' ? 'vendu, ' : ''}categorie, nom`));
});
app.post('/api/gestion/:cat', auth, admin, async (req, res) => {
  const c = catalogue(req);
  const { champs, vals } = valeurs(c, req.body);
  const [r] = await q(`INSERT INTO ${c.table} (${champs.join(', ')}) VALUES (${champs.map((_, i) => '$' + (i + 1)).join(', ')}) RETURNING *`, vals);
  await categorieExiste(c, r);
  res.status(201).json(r);
});
app.put('/api/gestion/:cat/:id', auth, admin, async (req, res) => {
  const c = catalogue(req);
  const { champs, vals } = valeurs(c, req.body);
  const [r] = await q(`UPDATE ${c.table} SET ${champs.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`,
    [req.params.id, ...vals]);
  if (!r) throw new Erreur(404, 'Introuvable.');
  await categorieExiste(c, r);
  res.json(r);
});
// Article ajouté dans une catégorie qui n'existe pas encore : elle est créée
const categorieExiste = (c, r) => c.table === 'articles_location'
  && q('INSERT INTO categories_articles (nom, ordre) VALUES ($1, 100) ON CONFLICT (nom) DO NOTHING', [r.categorie]);

// ----- Catégories des robes & accessoires (créées par l'administration) -----
app.post('/api/categories', auth, admin, async (req, res) => {
  const nom = String(req.body.nom || '').trim();
  if (!nom) throw new Erreur(400, 'Donnez un nom à la catégorie.');
  try {
    const [r] = await q(`INSERT INTO categories_articles (nom, image_id, ordre)
      VALUES ($1, $2, (SELECT coalesce(max(ordre), 0) + 1 FROM categories_articles WHERE ordre < 100)) RETURNING *`,
    [nom, req.body.image_id || null]);
    res.status(201).json(r);
  } catch (e) {
    if (e.code === '23505') throw new Erreur(409, 'Cette catégorie existe déjà.');
    throw e;
  }
});
// Renommer (les articles suivent), changer la photo ou l'ordre
app.put('/api/categories/:id', auth, admin, async (req, res) => {
  const nom = String(req.body.nom || '').trim();
  if (!nom) throw new Erreur(400, 'Donnez un nom à la catégorie.');
  const r = await transaction(async tq => {
    const [avant] = await tq('SELECT * FROM categories_articles WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!avant) throw new Erreur(404, 'Catégorie introuvable.');
    const [r] = await tq(`UPDATE categories_articles SET nom = $2, image_id = $3, ordre = coalesce($4, ordre) WHERE id = $1 RETURNING *`,
      [avant.id, nom, req.body.image_id === undefined ? avant.image_id : req.body.image_id || null, req.body.ordre ?? null]);
    if (nom !== avant.nom) await tq('UPDATE articles_location SET categorie = $2 WHERE categorie = $1', [avant.nom, nom]);
    return r;
  }).catch(e => { throw e.code === '23505' ? new Erreur(409, 'Une autre catégorie porte déjà ce nom.') : e; });
  res.json(r);
});
// Supprimer : seulement une catégorie vide
app.delete('/api/categories/:id', auth, admin, async (req, res) => {
  const [c] = await q('SELECT nom FROM categories_articles WHERE id = $1', [req.params.id]);
  if (!c) throw new Erreur(404, 'Catégorie introuvable.');
  const [{ n }] = await q('SELECT count(*)::int AS n FROM articles_location WHERE categorie = $1', [c.nom]);
  if (n) throw new Erreur(409, `Cette catégorie contient ${n} article(s) : déplacez-les ou masquez-les d’abord.`);
  await q('DELETE FROM categories_articles WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// Photos (produits, robes…) : envoyées par l'administration, lues par tout le monde
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
app.post('/api/fichiers', auth, admin, upload.single('fichier'), async (req, res) => {
  const f = req.file;
  if (!f || !/^image\/(jpeg|png|webp|gif)$/.test(f.mimetype)) throw new Erreur(400, 'Envoyez une image (JPG, PNG, WebP).');
  const [r] = await q('INSERT INTO fichiers (nom, type, taille, contenu) VALUES ($1, $2, $3, $4) RETURNING id',
    [f.originalname, f.mimetype, f.size, f.buffer]);
  res.status(201).json(r);
});
app.get('/api/fichiers/:id', async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) throw new Erreur(404, 'Introuvable.');
  const [f] = await q('SELECT type, contenu FROM fichiers WHERE id = $1', [req.params.id]);
  if (!f) throw new Erreur(404, 'Introuvable.');
  res.set('Cache-Control', 'public, max-age=31536000, immutable').type(f.type).send(f.contenu);
});

// ================= RÉALISATIONS (galerie) =================
app.get('/api/realisations', async (req, res) => {
  res.json(await q('SELECT id, titre, categorie, image_id, created_at FROM realisations ORDER BY created_at DESC, id DESC LIMIT 300'));
});
// Plusieurs photos d'un coup : image_ids = [...] (déjà envoyées par /api/fichiers)
app.post('/api/realisations', auth, admin, async (req, res) => {
  const { titre = '', categorie, image_ids } = req.body;
  if (!String(categorie || '').trim()) throw new Erreur(400, 'Choisissez une catégorie.');
  if (!Array.isArray(image_ids) || !image_ids.length) throw new Erreur(400, 'Ajoutez au moins une photo.');
  const r = await q(`INSERT INTO realisations (titre, categorie, image_id)
    SELECT $1, $2, unnest($3::uuid[]) RETURNING *`, [String(titre).trim(), String(categorie).trim(), image_ids]);
  res.status(201).json(r);
});
app.delete('/api/realisations/:id', auth, admin, async (req, res) => {
  // La photo est supprimée avec (fichiers → realisations en cascade)
  await q('DELETE FROM fichiers WHERE id = (SELECT image_id FROM realisations WHERE id = $1)', [req.params.id]);
  res.json({ ok: true });
});

// ================= ÉQUIPE =================
// Membres actifs de l'équipe qui font ce type de soin (spécialité = catégorie du soin)
const membresPour = (categorie, qq = q) => qq(`SELECT id, nom FROM users
  WHERE equipe AND actif AND $1 = ANY(specialites) ORDER BY id`, [categorie]);

// Liste publique (pour « Avec qui ? ») : nom, photo, spécialités
app.get('/api/equipe', auth, async (req, res) => {
  res.json(await q(`SELECT id, nom, specialites, photo_id FROM users WHERE equipe AND actif ORDER BY role = 'admin' DESC, nom`));
});

// Administration : toute l'équipe, avec les rendez-vous à venir
app.get('/api/equipe/gestion', auth, admin, async (req, res) => {
  res.json(await q(`SELECT u.id, u.nom, u.email, u.telephone, u.role, u.equipe, u.specialites, u.actif, u.photo_id,
      (SELECT count(*)::int FROM reservations r WHERE r.employe_id = u.id AND r.date >= $1 AND r.statut IN ('en_attente', 'confirmee')) AS a_venir
    FROM users u WHERE u.role = 'employe' OR (u.role = 'admin' AND u.id = $2) ORDER BY u.role = 'admin' DESC, u.actif DESC, u.nom`,
  [aujourdhui(), req.user.id]));
});

function verifierMembre(b, nouveau) {
  if (!String(b.nom || '').trim()) throw new Erreur(400, 'Le nom est obligatoire.');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(b.email || '')) throw new Erreur(400, 'Adresse email invalide (elle sert à se connecter).');
  if ((nouveau || b.password) && String(b.password || '').length < 4) throw new Erreur(400, 'Mot de passe : 4 caractères minimum.');
  if (!Array.isArray(b.specialites)) throw new Erreur(400, 'Spécialités invalides.');
}
// Nouvelle employée : Safa lui donne son email et son mot de passe
app.post('/api/equipe', auth, admin, async (req, res) => {
  verifierMembre(req.body, true);
  const b = req.body;
  try {
    const [u] = await q(`INSERT INTO users (nom, email, telephone, password, role, equipe, specialites, photo_id)
      VALUES ($1, $2, $3, $4, 'employe', true, $5, $6) RETURNING id`,
    [String(b.nom).trim(), String(b.email).trim().toLowerCase(), b.telephone || null, await bcrypt.hash(String(b.password), 10),
      b.specialites.map(String), b.photo_id || null]);
    res.status(201).json(u);
  } catch (e) {
    if (e.code === '23505') throw new Erreur(409, 'Cet email a déjà un compte.');
    throw e;
  }
});
// Modifier un membre (ou Safa elle-même) ; mot de passe changé seulement s'il est rempli
app.put('/api/equipe/:id', auth, admin, async (req, res) => {
  const b = req.body;
  const [m] = await q(`SELECT id, role FROM users WHERE id = $1 AND (role = 'employe' OR id = $2)`, [req.params.id, req.user.id]);
  if (!m) throw new Erreur(404, 'Membre introuvable.');
  verifierMembre(b, false);
  try {
    await q(`UPDATE users SET nom = $2, email = $3, telephone = $4, specialites = $5, photo_id = $6,
        equipe = $7, actif = $8 WHERE id = $1`,
    [m.id, String(b.nom).trim(), String(b.email).trim().toLowerCase(), b.telephone || null, b.specialites.map(String),
      b.photo_id || null, m.role === 'admin' ? !!b.equipe : true, m.role === 'admin' ? true : b.actif !== false]);
    if (b.password) await q('UPDATE users SET password = $2 WHERE id = $1', [m.id, await bcrypt.hash(String(b.password), 10)]);
  } catch (e) {
    if (e.code === '23505') throw new Erreur(409, 'Cet email a déjà un compte.');
    throw e;
  }
  res.json({ ok: true });
});

// ================= RÉSERVATIONS =================
// Heures de début possibles pour un soin, avec le nombre de places.
// Une place = un poste libre (réglages) ET un membre de l'équipe qui fait ce soin et n'a pas de cliente à cette heure.
// employeId : la cliente a choisi avec qui ; sinon n'importe quel membre qualifié.
// Si personne dans l'équipe ne fait ce soin, seuls les postes comptent.
async function creneaux(date, service, qq = q, employeId = null) {
  const { ouverture, fermeture, pas, postes, joursFermes } = await parametre('horaires', HORAIRES);
  if (joursFermes.includes(jourSemaine(date)) || date < aujourdhui()) return [];
  const prises = (await qq(`SELECT to_char(heure, 'HH24:MI') AS heure, duree, employe_id FROM reservations
    WHERE date = $1 AND statut <> 'annulee'`, [date])).map(r => ({ d: enMinutes(r.heure), f: enMinutes(r.heure) + r.duree, e: r.employe_id }));
  const qualifies = (await membresPour(service.categorie, qq)).map(m => m.id);
  const candidats = employeId ? [Number(employeId)] : qualifies;
  const debutMin = date === aujourdhui() ? minutesMaintenant() + 30 : 0;   // au moins 30 min à l'avance
  const duree = service.duree;
  const liste = [];
  for (let t = enMinutes(ouverture); t + duree <= enMinutes(fermeture); t += pas) {
    if (t < debutMin) continue;
    const enCours = prises.filter(p => p.d < t + duree && t < p.f);
    const postesLibres = Math.max(0, postes - enCours.length);
    const occupes = new Set(enCours.map(p => p.e));
    const libres = candidats.filter(id => !occupes.has(id));
    const places = candidats.length || employeId ? Math.min(postesLibres, libres.length) : postesLibres;
    liste.push({ heure: enHeure(t), places, libres });
  }
  return liste;
}

app.get('/api/creneaux', auth, async (req, res) => {
  const { date, service_id, employe_id } = req.query;
  if (!dateValide(date)) throw new Erreur(400, 'Date invalide.');
  const [s] = await q('SELECT duree, categorie FROM services WHERE id = $1 AND actif', [service_id]);
  if (!s) throw new Erreur(404, 'Soin introuvable.');
  res.json((await creneaux(date, s, q, employe_id || null)).map(({ libres, ...c }) => c));
});

const SELECT_RESA = `SELECT r.id, r.client_id, u.nom AS client, u.telephone, r.service_id, s.nom AS service, s.categorie,
    r.date, to_char(r.heure, 'HH24:MI') AS heure, r.duree, r.prix, r.remise_pct, r.prix_final, r.cadeau, r.statut, r.note, r.created_at,
    r.employe_id, e.nom AS employe
  FROM reservations r JOIN users u ON u.id = r.client_id JOIN services s ON s.id = r.service_id
  LEFT JOIN users e ON e.id = r.employe_id`;

app.get('/api/reservations', auth, async (req, res) => {
  const { date } = req.query;
  if (estAdmin(req)) {
    res.json(await q(`${SELECT_RESA} ${dateValide(date) ? 'WHERE r.date = $1' : 'WHERE r.date >= current_date - 30'}
      ORDER BY r.date DESC, r.heure`, dateValide(date) ? [date] : []));
  } else if (req.user.role === 'employe') {
    // Employée : seulement ses rendez-vous (un jour, ou de la semaine passée à la suite)
    res.json(await q(`${SELECT_RESA} WHERE r.employe_id = $1 AND ${dateValide(date) ? 'r.date = $2' : "r.date >= $2::date - 7"}
      ORDER BY r.date, r.heure`, [req.user.id, dateValide(date) ? date : aujourdhui()]));
  } else {
    res.json(await q(`${SELECT_RESA} WHERE r.client_id = $1 ORDER BY r.date DESC, r.heure DESC`, [req.user.id]));
  }
});

// La cliente réserve pour elle ; l'administration peut réserver pour une cliente (client_id) — confirmée directement.
// employe_id : membre choisi (facultatif : sinon le membre qualifié libre qui a le moins de rendez-vous ce jour-là)
app.post('/api/reservations', auth, async (req, res) => {
  const { service_id, date, heure, note = '' } = req.body;
  const employeChoisi = req.body.employe_id ? Number(req.body.employe_id) : null;
  if (req.user.role === 'employe') throw new Erreur(403, 'Les rendez-vous sont pris par les clientes ou l’administration.');
  const clientId = estAdmin(req) ? Number(req.body.client_id) : req.user.id;
  if (!dateValide(date) || !/^\d{2}:\d{2}$/.test(heure || '')) throw new Erreur(400, 'Choisissez une date et une heure.');

  const resa = await transaction(async tq => {
    // Un seul enregistrement à la fois par jour (pas de double réservation de la dernière place)
    await tq("SELECT pg_advisory_xact_lock(hashtext('resa-' || $1))", [date]);
    const [client] = await tq("SELECT id FROM users WHERE id = $1 AND role = 'cliente' FOR UPDATE", [clientId]);
    if (!client) throw new Erreur(404, 'Cliente introuvable.');
    const [s] = await tq('SELECT * FROM services WHERE id = $1 AND actif', [service_id]);
    if (!s) throw new Erreur(404, 'Soin introuvable.');
    if (employeChoisi && !(await membresPour(s.categorie, tq)).some(m => m.id === employeChoisi))
      throw new Erreur(400, 'Ce membre de l’équipe ne fait pas ce soin.');

    const c = (await creneaux(date, s, tq, employeChoisi)).find(x => x.heure === heure);
    if (!c) throw new Erreur(400, 'Ce créneau n’est pas disponible (fermé ou déjà passé).');
    if (c.places < 1) throw new Erreur(409, employeChoisi ? 'Elle n’est pas libre à cette heure-là, choisissez une autre heure.' : 'Ce créneau est complet, choisissez une autre heure.');
    const [deja] = await tq(`SELECT 1 FROM reservations WHERE client_id = $1 AND date = $2 AND statut <> 'annulee'
      AND heure < $3::time + make_interval(mins => $4) AND $3::time < heure + make_interval(mins => duree)`,
    [clientId, date, heure, s.duree]);
    if (deja) throw new Erreur(409, 'Vous avez déjà une réservation à cette heure-là.');

    // Membre : celui choisi, sinon le membre libre le moins chargé ce jour-là
    let employeId = employeChoisi;
    if (!employeId && c.libres.length) {
      const charges = await tq(`SELECT employe_id, count(*)::int AS n FROM reservations WHERE date = $1 AND statut <> 'annulee'
        AND employe_id = ANY($2) GROUP BY employe_id`, [date, c.libres]);
      const n = id => (charges.find(x => x.employe_id === id) || { n: 0 }).n;
      employeId = [...c.libres].sort((a, b) => n(a) - n(b))[0];
    }

    // Cadeau fidélité ou promotion : la meilleure des deux (pas de cumul)
    const fid = await fidelite(clientId, tq);
    const promo = await promoActive('services', tq);
    const cadeau = fid.cadeauDisponible && fid.remise >= (promo ? promo.remise_pct : 0);
    const remise = cadeau ? fid.remise : (promo ? promo.remise_pct : 0);
    const [r] = await tq(`INSERT INTO reservations
        (client_id, service_id, date, heure, duree, prix, remise_pct, prix_final, cadeau, promotion_id, statut, note, employe_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING id`,
    [clientId, s.id, date, heure, s.duree, s.prix, remise, avecRemise(s.prix, remise), cadeau,
      !cadeau && promo ? promo.id : null, estAdmin(req) ? 'confirmee' : 'en_attente', String(note).slice(0, 500), employeId]);
    if (estAdmin(req))
      await notifier(clientId, 'reservation', '📅 Rendez-vous confirmé', `${s.nom} le ${date} à ${heure}.`, tq);
    if (employeId && employeId !== req.user.id)
      await notifier(employeId, 'reservation', '📅 Nouveau rendez-vous', `${s.nom} le ${date} à ${heure}.`, tq);
    return r;
  });
  const [r] = await q(`${SELECT_RESA} WHERE r.id = $1`, [resa.id]);
  res.status(201).json(r);
});

const TEXTES_RESA = {
  confirmee: ['📅 Rendez-vous confirmé', r => `${r.service} le ${r.date} à ${r.heure}. À bientôt !`],
  annulee: ['❌ Rendez-vous annulé', r => `${r.service} du ${r.date} à ${r.heure} a été annulé par le centre.`]
};
app.patch('/api/reservations/:id', auth, async (req, res) => {
  const { statut } = req.body;
  const [r] = await q(`${SELECT_RESA} WHERE r.id = $1`, [req.params.id]);
  const personnel = estAdmin(req) || (req.user.role === 'employe' && r && r.employe_id === req.user.id);
  if (!r || (!personnel && r.client_id !== req.user.id)) throw new Erreur(404, 'Réservation introuvable.');
  if (req.user.role === 'employe' && !['confirmee', 'terminee'].includes(statut))
    throw new Erreur(403, 'Vous pouvez confirmer un rendez-vous ou le marquer terminé.');
  if (!personnel && !(statut === 'annulee' && ['en_attente', 'confirmee'].includes(r.statut)))
    throw new Erreur(403, 'Vous pouvez seulement annuler un rendez-vous à venir.');
  if (!['en_attente', 'confirmee', 'terminee', 'annulee'].includes(statut)) throw new Erreur(400, 'Statut invalide.');

  const avant = await fidelite(r.client_id);
  await q('UPDATE reservations SET statut = $2 WHERE id = $1', [r.id, statut]);
  if (personnel && TEXTES_RESA[statut] && statut !== r.statut)
    await notifier(r.client_id, 'reservation', TEXTES_RESA[statut][0], TEXTES_RESA[statut][1](r));
  // Le soin qui complète la carte : la cliente est prévenue que le suivant est offert / remisé
  const apres = await fidelite(r.client_id);
  if (apres.cadeauDisponible && !avant.cadeauDisponible)
    await notifier(r.client_id, 'cadeau', '🎁 Votre cadeau fidélité est prêt !',
      apres.remise === 100 ? 'Votre prochain soin est offert.' : `Votre prochain soin est à -${apres.remise} %. Réservez quand vous voulez !`);
  res.json({ ok: true });
});

// ================= BOUTIQUE =================
const SELECT_CMD = `SELECT c.id, c.client_id, u.nom AS client, u.telephone, c.total, c.statut, c.created_at,
    coalesce((SELECT json_agg(json_build_object('nom', l.nom, 'quantite', l.quantite, 'prix_unitaire', l.prix_unitaire) ORDER BY l.id)
      FROM commande_lignes l WHERE l.commande_id = c.id), '[]') AS lignes
  FROM commandes c JOIN users u ON u.id = c.client_id`;

app.get('/api/commandes', auth, async (req, res) => {
  res.json(estAdmin(req)
    ? await q(`${SELECT_CMD} ORDER BY c.created_at DESC LIMIT 300`)
    : await q(`${SELECT_CMD} WHERE c.client_id = $1 ORDER BY c.created_at DESC`, [req.user.id]));
});

// Commande « click & collect » : le stock est réservé tout de suite (rendu si la commande est annulée)
app.post('/api/commandes', auth, async (req, res) => {
  const lignes = Array.isArray(req.body.lignes) ? req.body.lignes : [];
  const clientId = estAdmin(req) ? Number(req.body.client_id) : req.user.id;
  if (!lignes.length) throw new Erreur(400, 'Le panier est vide.');
  const id = await transaction(async tq => {
    const [client] = await tq("SELECT id FROM users WHERE id = $1 AND role = 'cliente'", [clientId]);
    if (!client) throw new Erreur(404, 'Cliente introuvable.');
    const promo = await promoActive('produits', tq);
    const [cmd] = await tq('INSERT INTO commandes (client_id, total) VALUES ($1, 0) RETURNING id', [clientId]);
    let total = 0;
    for (const l of lignes) {
      const quantite = Number(l.quantite);
      if (!Number.isInteger(quantite) || quantite < 1) throw new Erreur(400, 'Quantité invalide.');
      const [p] = await tq('SELECT * FROM produits WHERE id = $1 AND actif FOR UPDATE', [l.produit_id]);
      if (!p) throw new Erreur(404, 'Produit introuvable.');
      if (p.stock < quantite) throw new Erreur(409, `Stock insuffisant pour « ${p.nom} » (reste ${p.stock}).`);
      const prix = promo ? avecRemise(p.prix, promo.remise_pct) : p.prix;
      await tq('UPDATE produits SET stock = stock - $2 WHERE id = $1', [p.id, quantite]);
      await tq(`INSERT INTO commande_lignes (commande_id, produit_id, nom, quantite, prix_unitaire)
        VALUES ($1, $2, $3, $4, $5)`, [cmd.id, p.id, p.nom, quantite, prix]);
      total += prix * quantite;
    }
    await tq('UPDATE commandes SET total = $2 WHERE id = $1', [cmd.id, arrondi(total)]);
    return cmd.id;
  });
  const [c] = await q(`${SELECT_CMD} WHERE c.id = $1`, [id]);
  res.status(201).json(c);
});

app.patch('/api/commandes/:id', auth, async (req, res) => {
  const { statut } = req.body;
  if (!['en_attente', 'prete', 'livree', 'annulee'].includes(statut)) throw new Erreur(400, 'Statut invalide.');
  await transaction(async tq => {
    const [c] = await tq('SELECT * FROM commandes WHERE id = $1 FOR UPDATE', [req.params.id]);
    if (!c || (!estAdmin(req) && c.client_id !== req.user.id)) throw new Erreur(404, 'Commande introuvable.');
    if (!estAdmin(req) && !(statut === 'annulee' && c.statut === 'en_attente'))
      throw new Erreur(403, 'Vous pouvez seulement annuler une commande en attente.');
    if (c.statut === 'annulee') throw new Erreur(400, 'Cette commande est déjà annulée.');
    if (statut === 'annulee')
      await tq(`UPDATE produits p SET stock = p.stock + l.quantite FROM commande_lignes l
        WHERE l.commande_id = $1 AND l.produit_id = p.id`, [c.id]);
    await tq('UPDATE commandes SET statut = $2 WHERE id = $1', [c.id, statut]);
    if (estAdmin(req) && statut === 'prete' && c.statut !== 'prete')
      await notifier(c.client_id, 'commande', '🛍️ Votre commande est prête', `Commande n° ${c.id} : passez la récupérer au centre.`, tq);
  });
  res.json({ ok: true });
});

// ================= LOCATION =================
// Plusieurs clientes peuvent demander la même robe aux mêmes dates (« demandee ») : la première qui verse l'avance
// l'obtient (« confirmee ») et les autres demandes sur ces dates sont annulées. Sans avance dans le délai (12 h par
// défaut), la demande est annulée automatiquement. Seules les locations confirmées ou en cours bloquent les dates.
const SELECT_LOC = `SELECT l.id, l.client_id, u.nom AS client, u.telephone, l.article_id, a.nom AS article, a.categorie, a.image_id,
    l.date_debut, l.date_fin, l.jours, l.prix_jour, l.total, l.caution, l.statut, l.created_at,
    l.expire_le, l.avance, l.avance_le, l.motif_annulation, l.rappel_le,
    (SELECT count(*)::int FROM locations x WHERE x.article_id = l.article_id AND x.id <> l.id AND x.statut = 'demandee'
      AND x.date_debut <= l.date_fin AND l.date_debut <= x.date_fin) AS concurrentes
  FROM locations l JOIN users u ON u.id = l.client_id JOIN articles_location a ON a.id = l.article_id`;
const LOC_BLOQUE = "statut IN ('confirmee', 'en_cours')";      // dates prises (avance versée)
const LOC_ACTIVE = "statut NOT IN ('annulee', 'retournee')";   // demandes en attente + dates prises
// Article proposé aux clientes : visible, pas vendu, pas réservé par une demande d'achat en cours (alias « a »)
const ARTICLE_DISPO = `a.actif AND NOT a.vendu AND NOT EXISTS
  (SELECT 1 FROM achats_articles h WHERE h.article_id = a.id AND h.statut = 'demandee')`;

const reglagesLocation = () => parametre('location', LOCATION);
const avanceDe = (total, pct) => arrondi(total * pct / 100);
const quand = d => new Date(d).toLocaleString('fr-FR', { timeZone: 'Africa/Tunis', weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
async function avecAvance(lignes) {
  const { avancePct } = await reglagesLocation();
  return lignes.map(l => ({ ...l, avance_due: avanceDe(l.total, avancePct) }));
}

// Avance versée : la location est confirmée, les demandes concurrentes sur ces dates sont annulées (dans une transaction)
async function confirmerLocation(tq, l, avance) {
  await tq('SELECT id FROM articles_location WHERE id = $1 FOR UPDATE', [l.article_id]);
  const [pris] = await tq(`SELECT date_debut, date_fin FROM locations WHERE article_id = $1 AND id <> $2 AND ${LOC_BLOQUE}
    AND date_debut <= $4 AND $3 <= date_fin`, [l.article_id, l.id, l.date_debut, l.date_fin]);
  if (pris) throw new Erreur(409, `Déjà louée à une autre cliente du ${pris.date_debut} au ${pris.date_fin}.`);
  await tq("UPDATE locations SET statut = 'confirmee', avance = $2, avance_le = now(), motif_annulation = '' WHERE id = $1", [l.id, avance]);
  const perdues = await tq(`UPDATE locations SET statut = 'annulee', motif_annulation = 'Une autre cliente a versé l’avance avant vous'
    WHERE article_id = $1 AND id <> $2 AND statut = 'demandee' AND date_debut <= $4 AND $3 <= date_fin RETURNING client_id`,
  [l.article_id, l.id, l.date_debut, l.date_fin]);
  for (const p of perdues)
    await notifier(p.client_id, 'location', `😔 ${l.article} n’est plus disponible`,
      `Une autre cliente a versé l’avance avant vous pour ces dates (du ${l.date_debut} au ${l.date_fin}). Découvrez nos autres modèles !`, tq);
  return perdues.length;
}

// Filtre « Quand en avez-vous besoin ? » : articles déjà loués (bloqués) et nombre de demandes en attente par article
app.get('/api/articles/occupes', async (req, res) => {
  const { debut, fin } = req.query;
  if (!dateValide(debut) || !dateValide(fin) || fin < debut) throw new Erreur(400, 'Dates invalides.');
  const lignes = await q(`SELECT article_id, bool_or(${LOC_BLOQUE}) AS bloque, count(*) FILTER (WHERE statut = 'demandee')::int AS demandes
    FROM locations WHERE ${LOC_ACTIVE} AND date_debut <= $2 AND $1 <= date_fin GROUP BY article_id`, [debut, fin]);
  res.json({
    bloques: lignes.filter(l => l.bloque).map(l => l.article_id),
    demandes: Object.fromEntries(lignes.filter(l => !l.bloque && l.demandes).map(l => [l.article_id, l.demandes]))
  });
});

app.get('/api/locations', auth, async (req, res) => {
  res.json(await avecAvance(estAdmin(req)
    ? await q(`${SELECT_LOC} ORDER BY l.date_debut DESC LIMIT 300`)
    : await q(`${SELECT_LOC} WHERE l.client_id = $1 ORDER BY l.date_debut DESC`, [req.user.id])));
});

// Calendrier d'un article : dates prises (avance versée) et demandes en attente
app.get('/api/articles/:id/occupation', async (req, res) => {
  const lignes = await q(`SELECT date_debut, date_fin, statut FROM locations WHERE article_id = $1 AND ${LOC_ACTIVE}
    AND date_fin >= $2 ORDER BY date_debut`, [req.params.id, aujourdhui()]);
  res.json({
    prises: lignes.filter(l => l.statut !== 'demandee').map(({ statut, ...l }) => l),
    demandes: lignes.filter(l => l.statut === 'demandee').map(({ statut, ...l }) => l)
  });
});

app.post('/api/locations', auth, async (req, res) => {
  const { article_id, date_debut, date_fin } = req.body;
  const clientId = estAdmin(req) ? Number(req.body.client_id) : req.user.id;
  if (!dateValide(date_debut) || !dateValide(date_fin) || date_fin < date_debut) throw new Erreur(400, 'Dates invalides.');
  if (date_debut < aujourdhui()) throw new Erreur(400, 'La date de début est déjà passée.');
  const jours = joursEntre(date_debut, date_fin) + 1;
  if (jours > 30) throw new Erreur(400, 'Location de 30 jours maximum.');
  const { avancePct, delaiHeures } = await reglagesLocation();

  const id = await transaction(async tq => {
    const [client] = await tq("SELECT id FROM users WHERE id = $1 AND role = 'cliente'", [clientId]);
    if (!client) throw new Erreur(404, 'Cliente introuvable.');
    const [a] = await tq(`SELECT * FROM articles_location a WHERE id = $1 AND ${ARTICLE_DISPO} FOR UPDATE`, [article_id]);
    if (!a) throw new Erreur(404, 'Cet article n’est plus disponible (vendu ou réservé à l’achat).');
    if (a.prix_jour == null) throw new Erreur(400, 'Cet article est seulement à vendre, pas en location.');
    const [pris] = await tq(`SELECT date_debut, date_fin FROM locations WHERE article_id = $1 AND ${LOC_BLOQUE}
      AND date_debut <= $3 AND $2 <= date_fin`, [a.id, date_debut, date_fin]);
    if (pris) throw new Erreur(409, `Déjà loué du ${pris.date_debut} au ${pris.date_fin}. Choisissez d’autres dates.`);
    const [deja] = await tq(`SELECT 1 FROM locations WHERE article_id = $1 AND client_id = $2 AND statut = 'demandee'
      AND date_debut <= $4 AND $3 <= date_fin`, [a.id, clientId, date_debut, date_fin]);
    if (deja) throw new Erreur(409, 'Vous avez déjà une demande pour cet article sur ces dates.');

    const promo = await promoActive('location', tq);
    const prixJour = promo ? avecRemise(a.prix_jour, promo.remise_pct) : a.prix_jour;
    const total = arrondi(prixJour * jours);
    const [l] = await tq(`INSERT INTO locations (client_id, article_id, date_debut, date_fin, jours, prix_jour, total, caution, statut, expire_le)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'demandee', now() + make_interval(hours => $9)) RETURNING id, expire_le`,
    [clientId, a.id, date_debut, date_fin, jours, prixJour, total, a.caution, delaiHeures]);
    if (estAdmin(req)) {
      // Location enregistrée au centre : l'avance est versée sur place
      const avance = req.body.avance == null || req.body.avance === '' ? avanceDe(total, avancePct) : Number(req.body.avance);
      await confirmerLocation(tq, { id: l.id, article_id: a.id, article: a.nom, date_debut, date_fin }, avance);
    } else {
      await notifier(clientId, 'location', `📌 ${a.nom} : demande enregistrée`,
        `Versez l’avance de ${avanceDe(total, avancePct)} DT au centre avant ${quand(l.expire_le)} pour la réserver. `
        + 'Attention : d’autres clientes peuvent demander le même modèle, la première qui verse l’avance l’obtient. '
        + 'Sans avance dans le délai, la demande est annulée.', tq);
    }
    return l.id;
  });
  const [l] = await avecAvance(await q(`${SELECT_LOC} WHERE l.id = $1`, [id]));
  res.status(201).json(l);
});

app.patch('/api/locations/:id', auth, async (req, res) => {
  const { statut } = req.body;
  if (!['demandee', 'confirmee', 'en_cours', 'retournee', 'annulee'].includes(statut)) throw new Erreur(400, 'Statut invalide.');
  const [l] = await q(`${SELECT_LOC} WHERE l.id = $1`, [req.params.id]);
  if (!l || (!estAdmin(req) && l.client_id !== req.user.id)) throw new Erreur(404, 'Location introuvable.');
  if (!estAdmin(req) && !(statut === 'annulee' && ['demandee', 'confirmee'].includes(l.statut)))
    throw new Erreur(403, 'Vous pouvez seulement annuler une location qui n’a pas commencé.');
  if (statut === l.statut) return res.json({ ok: true });
  const { avancePct, delaiHeures } = await reglagesLocation();

  let perdues = 0;
  await transaction(async tq => {
    if (statut === 'confirmee' && ['demandee', 'annulee'].includes(l.statut)) {
      // Avance reçue (montant saisi par l'administration, sinon le pourcentage des réglages)
      const avance = req.body.avance == null || req.body.avance === '' ? avanceDe(l.total, avancePct) : Number(req.body.avance);
      if (!(avance >= 0)) throw new Erreur(400, 'Montant de l’avance invalide.');
      perdues = await confirmerLocation(tq, l, avance);
      await notifier(l.client_id, 'location', '✅ Location réservée !',
        `${l.article} du ${l.date_debut} au ${l.date_fin} : avance de ${avance} DT reçue. Le modèle est à vous pour ces dates.`, tq);
      return;
    }
    if (statut === 'demandee') {
      // Remettre en attente (nouveau délai pour l'avance)
      await tq(`UPDATE locations SET statut = 'demandee', motif_annulation = '', rappel_le = NULL,
        expire_le = now() + make_interval(hours => $2) WHERE id = $1`, [l.id, delaiHeures]);
      return;
    }
    if (['annulee', 'retournee'].includes(l.statut) && statut !== 'annulee') {
      const [pris] = await tq(`SELECT 1 FROM locations WHERE article_id = $1 AND id <> $2 AND ${LOC_BLOQUE}
        AND date_debut <= $4 AND $3 <= date_fin`, [l.article_id, l.id, l.date_debut, l.date_fin]);
      if (pris) throw new Erreur(409, 'Ces dates ont été louées entre-temps.');
    }
    await tq(`UPDATE locations SET statut = $2, motif_annulation = $3 WHERE id = $1`,
      [l.id, statut, statut === 'annulee' ? (estAdmin(req) ? 'Annulée par le centre' : 'Annulée par vous') : '']);
    if (estAdmin(req) && statut === 'annulee')
      await notifier(l.client_id, 'location', '❌ Location annulée', `${l.article} du ${l.date_debut} au ${l.date_fin}.`, tq);
  });
  res.json({ ok: true, demandesAnnulees: perdues });
});

// L'administration relance une cliente qui n'a pas encore versé l'avance (notification dans l'application)
app.post('/api/locations/:id/rappel', auth, admin, async (req, res) => {
  const [l] = await avecAvance(await q(`${SELECT_LOC} WHERE l.id = $1`, [req.params.id]));
  if (!l || l.statut !== 'demandee') throw new Erreur(400, 'Cette demande n’attend plus d’avance.');
  await q('UPDATE locations SET rappel_le = now() WHERE id = $1', [l.id]);
  await notifier(l.client_id, 'rappel', `⏰ Pensez à votre avance pour ${l.article}`,
    `Passez au centre verser l’avance de ${l.avance_due} DT avant ${quand(l.expire_le)}, sinon la robe pourra être réservée par une autre cliente.`);
  res.json({ ok: true });
});

// Toutes les minutes : demandes sans avance après le délai → annulées ; 3 h avant la fin → rappel automatique
async function surveillerDemandes() {
  const expirees = await q(`UPDATE locations l SET statut = 'annulee', motif_annulation = 'Avance non versée dans le délai'
    FROM articles_location a WHERE a.id = l.article_id AND l.statut = 'demandee' AND l.expire_le < now()
    RETURNING l.client_id, a.nom AS article, l.date_debut, l.date_fin`);
  for (const l of expirees)
    await notifier(l.client_id, 'location', '⌛ Demande de location annulée',
      `${l.article} (du ${l.date_debut} au ${l.date_fin}) : l’avance n’a pas été versée dans le délai. Vous pouvez refaire une demande si le modèle est encore libre.`);
  const { avancePct } = await reglagesLocation();
  const bientot = await q(`UPDATE locations l SET rappel_le = now() FROM articles_location a
    WHERE a.id = l.article_id AND l.statut = 'demandee' AND l.rappel_le IS NULL
      AND l.expire_le > now() AND l.expire_le < now() + interval '3 hours'
    RETURNING l.client_id, a.nom AS article, l.total, l.expire_le`);
  for (const l of bientot)
    await notifier(l.client_id, 'rappel', `⏰ Plus que quelques heures pour ${l.article}`,
      `Versez l’avance de ${avanceDe(l.total, avancePct)} DT avant ${quand(l.expire_le)}, sinon votre demande sera annulée.`);
}

// ================= ACHAT DES ROBES & ACCESSOIRES =================
// La cliente demande l'achat → l'article est réservé (caché aux autres) ; l'administration confirme → vendu, il sort
// du catalogue ; ou annule → il revient dans le catalogue.
const SELECT_ACHAT = `SELECT h.id, h.client_id, u.nom AS client, u.telephone, h.article_id, a.nom AS article, a.categorie,
    a.taille, a.image_id, h.prix, h.statut, h.created_at
  FROM achats_articles h JOIN users u ON u.id = h.client_id JOIN articles_location a ON a.id = h.article_id`;

// Vendu : l'article sort du catalogue ; les demandes de location encore sans avance sont annulées (clientes prévenues)
async function marquerVendu(tq, articleId, nom) {
  await tq('UPDATE articles_location SET vendu = true WHERE id = $1', [articleId]);
  const perdues = await tq(`UPDATE locations SET statut = 'annulee', motif_annulation = 'Modèle vendu'
    WHERE article_id = $1 AND statut = 'demandee' RETURNING client_id`, [articleId]);
  for (const p of perdues)
    await notifier(p.client_id, 'location', `😔 ${nom} n’est plus disponible`, 'Ce modèle vient d’être vendu. Découvrez nos autres modèles !', tq);
}

app.get('/api/achats', auth, async (req, res) => {
  res.json(estAdmin(req)
    ? await q(`${SELECT_ACHAT} ORDER BY h.created_at DESC LIMIT 300`)
    : await q(`${SELECT_ACHAT} WHERE h.client_id = $1 ORDER BY h.created_at DESC`, [req.user.id]));
});

app.post('/api/achats', auth, async (req, res) => {
  const clientId = estAdmin(req) ? Number(req.body.client_id) : req.user.id;
  const id = await transaction(async tq => {
    const [client] = await tq("SELECT id FROM users WHERE id = $1 AND role = 'cliente'", [clientId]);
    if (!client) throw new Erreur(404, 'Cliente introuvable.');
    const [a] = await tq(`SELECT * FROM articles_location a WHERE id = $1 AND ${ARTICLE_DISPO} FOR UPDATE`, [req.body.article_id]);
    if (!a) throw new Erreur(409, 'Cet article vient d’être vendu ou réservé par une autre cliente.');
    if (a.prix_vente == null) throw new Erreur(400, 'Cet article est seulement en location.');
    // Déjà promis en location : la vente attend la fin de la dernière location
    const [loc] = await tq(`SELECT date_debut, date_fin FROM locations WHERE article_id = $1 AND ${LOC_BLOQUE}
      AND date_fin >= $2 ORDER BY date_fin DESC LIMIT 1`, [a.id, aujourdhui()]);
    if (loc) throw new Erreur(409, `Cet article est réservé en location jusqu’au ${loc.date_fin} : achat possible après cette date.`);
    const [h] = await tq(`INSERT INTO achats_articles (client_id, article_id, prix, statut) VALUES ($1, $2, $3, $4) RETURNING id`,
      [clientId, a.id, a.prix_vente, estAdmin(req) ? 'confirmee' : 'demandee']);
    if (estAdmin(req)) await marquerVendu(tq, a.id, a.nom);
    return h.id;
  });
  const [h] = await q(`${SELECT_ACHAT} WHERE h.id = $1`, [id]);
  res.status(201).json(h);
});

app.patch('/api/achats/:id', auth, async (req, res) => {
  const { statut } = req.body;
  if (!['confirmee', 'annulee'].includes(statut)) throw new Erreur(400, 'Statut invalide.');
  const h = await transaction(async tq => {
    const [h] = await tq(`${SELECT_ACHAT} WHERE h.id = $1 FOR UPDATE OF h`, [req.params.id]);
    if (!h || (!estAdmin(req) && h.client_id !== req.user.id)) throw new Erreur(404, 'Achat introuvable.');
    if (h.statut !== 'demandee') throw new Erreur(400, 'Cet achat est déjà traité.');
    if (!estAdmin(req) && statut !== 'annulee') throw new Erreur(403, 'Action non autorisée.');
    await tq('UPDATE achats_articles SET statut = $2 WHERE id = $1', [h.id, statut]);
    // Vendu : l'article sort du catalogue (gardé pour l'historique)
    if (statut === 'confirmee') await marquerVendu(tq, h.article_id, h.article);
    return h;
  });
  if (estAdmin(req))
    await notifier(h.client_id, 'achat', statut === 'confirmee' ? '🛍️ Achat confirmé' : '❌ Achat annulé',
      statut === 'confirmee' ? `${h.article} est à vous ! Passez le récupérer au centre (${h.prix} DT).` : `${h.article} : l’achat a été annulé par le centre.`);
  res.json({ ok: true });
});

// ================= PROMOTIONS =================
app.get('/api/promotions', auth, admin, async (req, res) => {
  res.json(await q('SELECT * FROM promotions ORDER BY date_debut DESC, id DESC'));
});

// Nouvelle promotion : notification dans l'application pour toutes les clientes + email à celles qui en ont un
app.post('/api/promotions', auth, admin, async (req, res) => {
  const { titre, message = '', cible, remise_pct, date_debut, date_fin } = req.body;
  if (!String(titre || '').trim()) throw new Erreur(400, 'Le titre est obligatoire.');
  if (!['tout', 'services', 'produits', 'location'].includes(cible)) throw new Erreur(400, 'Choisissez à quoi s’applique la promotion.');
  const pct = Number(remise_pct);
  if (!Number.isInteger(pct) || pct < 1 || pct > 100) throw new Erreur(400, 'Remise entre 1 et 100 %.');
  if (!dateValide(date_debut) || !dateValide(date_fin) || date_fin < date_debut) throw new Erreur(400, 'Dates invalides.');

  const [p] = await q(`INSERT INTO promotions (titre, message, cible, remise_pct, date_debut, date_fin)
    VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [String(titre).trim(), String(message).trim(), cible, pct, date_debut, date_fin]);
  await notifier(null, 'promotion', `🎉 ${p.titre} : -${p.remise_pct} %`,
    `${p.message ? p.message + ' ' : ''}Du ${p.date_debut} au ${p.date_fin}.`);
  const clientes = await q("SELECT nom, email FROM users WHERE role = 'cliente' AND email IS NOT NULL");
  res.status(201).json({ ...p, emailsPrevus: mail.actif() ? clientes.length : 0 });

  // Les emails partent après la réponse (ils peuvent prendre du temps)
  mail.envoyerPromotion(p, clientes)
    .then(n => q('UPDATE promotions SET emails_envoyes = $2 WHERE id = $1', [p.id, n]))
    .catch(e => console.error('⚠ Emails de la promotion :', e.message));
});

app.delete('/api/promotions/:id', auth, admin, async (req, res) => {
  await q('DELETE FROM promotions WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
});

// ================= NOTIFICATIONS =================
// Les siennes + celles envoyées à toutes les clientes (depuis son inscription, et 30 jours avant)
app.get('/api/notifications', auth, async (req, res) => {
  res.json(await q(`SELECT n.id, n.type, n.titre, n.message, n.created_at, (nl.user_id IS NOT NULL) AS lue
    FROM notifications n LEFT JOIN notifications_lues nl ON nl.notification_id = n.id AND nl.user_id = $1
    WHERE n.user_id = $1 OR (n.user_id IS NULL AND $2 = 'cliente' AND n.created_at > $3::timestamptz - interval '30 days')
    ORDER BY n.created_at DESC LIMIT 50`, [req.user.id, req.user.role, req.user.created_at]));
});
app.post('/api/notifications/lues', auth, async (req, res) => {
  await q(`INSERT INTO notifications_lues (notification_id, user_id)
    SELECT id, $1 FROM notifications WHERE user_id = $1 OR user_id IS NULL ON CONFLICT DO NOTHING`, [req.user.id]);
  res.json({ ok: true });
});

// ================= CLIENTES (administration) =================
app.get('/api/clientes', auth, admin, async (req, res) => {
  const { seuil } = await parametre('fidelite', FIDELITE);
  const lignes = await q(`SELECT u.id, u.nom, u.telephone, u.email, u.created_at,
      count(r.id) FILTER (WHERE r.statut = 'terminee')::int AS soins,
      count(r.id) FILTER (WHERE r.statut = 'terminee' AND NOT r.cadeau)::int AS faits,
      count(r.id) FILTER (WHERE r.cadeau AND r.statut <> 'annulee')::int AS cadeaux,
      coalesce(sum(r.prix_final) FILTER (WHERE r.statut = 'terminee'), 0) AS depense
    FROM users u LEFT JOIN reservations r ON r.client_id = u.id
    WHERE u.role = 'cliente' GROUP BY u.id ORDER BY u.nom`);
  res.json(lignes.map(({ faits, cadeaux, ...c }) => {
    const pts = Math.max(0, faits - cadeaux * seuil);
    return { ...c, cadeaux, points: Math.min(pts, seuil), cadeauDisponible: pts >= seuil };
  }));
});

// Cliente ajoutée au comptoir : son mot de passe de départ est son numéro de téléphone (chiffres seuls)
app.post('/api/clientes', auth, admin, async (req, res) => {
  verifierCliente(req.body);
  const u = await creerCliente(req.body, String(req.body.telephone).replace(/\D/g, ''));
  res.status(201).json(u);
});

// ================= TABLEAU DE BORD & RÉGLAGES =================
app.get('/api/stats', auth, admin, async (req, res) => {
  const j = aujourdhui();
  const [s] = await q(`SELECT
      (SELECT count(*)::int FROM reservations WHERE date = $1 AND statut <> 'annulee') AS rdv_jour,
      (SELECT count(*)::int FROM reservations WHERE statut = 'en_attente') AS rdv_attente,
      (SELECT count(*)::int FROM commandes WHERE statut = 'en_attente') AS cmd_attente,
      (SELECT count(*)::int FROM locations WHERE statut = 'demandee') AS loc_attente,
      (SELECT count(*)::int FROM locations WHERE statut = 'en_cours') AS loc_en_cours,
      (SELECT count(*)::int FROM achats_articles WHERE statut = 'demandee') AS achat_attente,
      (SELECT coalesce(sum(prix), 0) FROM achats_articles WHERE statut = 'confirmee' AND date_trunc('month', created_at) = date_trunc('month', $1::date)) AS ca_ventes_robes,
      (SELECT count(*)::int FROM users WHERE role = 'cliente') AS clientes,
      (SELECT count(*)::int FROM produits WHERE actif AND stock <= 3) AS stock_bas,
      (SELECT coalesce(sum(prix_final), 0) FROM reservations WHERE statut = 'terminee' AND date_trunc('month', date) = date_trunc('month', $1::date)) AS ca_soins,
      (SELECT coalesce(sum(total), 0) FROM commandes WHERE statut = 'livree' AND date_trunc('month', created_at) = date_trunc('month', $1::date)) AS ca_boutique,
      (SELECT coalesce(sum(total), 0) FROM locations WHERE statut IN ('en_cours', 'retournee') AND date_trunc('month', date_debut) = date_trunc('month', $1::date)) AS ca_location`, [j]);
  const top = await q(`SELECT s.nom, count(*)::int AS n FROM reservations r JOIN services s ON s.id = r.service_id
    WHERE r.statut <> 'annulee' AND r.date >= $1::date - 90 GROUP BY s.nom ORDER BY n DESC LIMIT 5`, [j]);
  res.json({ ...s, top });
});

app.put('/api/reglages', auth, admin, async (req, res) => {
  const { fidelite: f, horaires: h, location: l } = req.body;
  if (f) {
    const seuil = Number(f.seuil), remise = Number(f.remise);
    if (!Number.isInteger(seuil) || seuil < 1 || seuil > 50) throw new Erreur(400, 'Nombre de soins entre 1 et 50.');
    if (!Number.isInteger(remise) || remise < 1 || remise > 100) throw new Erreur(400, 'Remise cadeau entre 1 et 100 %.');
    await definirParametre('fidelite', { seuil, remise });
  }
  if (h) {
    const ok = /^\d{2}:\d{2}$/.test(h.ouverture) && /^\d{2}:\d{2}$/.test(h.fermeture) && h.ouverture < h.fermeture;
    const pas = Number(h.pas), postes = Number(h.postes);
    if (!ok) throw new Erreur(400, 'Horaires invalides.');
    if (![15, 30, 60].includes(pas)) throw new Erreur(400, 'Intervalle : 15, 30 ou 60 minutes.');
    if (!Number.isInteger(postes) || postes < 1 || postes > 30) throw new Erreur(400, 'Nombre de postes entre 1 et 30.');
    const joursFermes = (Array.isArray(h.joursFermes) ? h.joursFermes : []).map(Number).filter(d => d >= 0 && d <= 6);
    await definirParametre('horaires', { ouverture: h.ouverture, fermeture: h.fermeture, pas, postes, joursFermes });
  }
  if (l) {
    const avancePct = Number(l.avancePct), delaiHeures = Number(l.delaiHeures);
    if (!Number.isInteger(avancePct) || avancePct < 0 || avancePct > 100) throw new Erreur(400, 'Avance entre 0 et 100 %.');
    if (!Number.isInteger(delaiHeures) || delaiHeures < 1 || delaiHeures > 168) throw new Erreur(400, 'Délai entre 1 et 168 heures.');
    await definirParametre('location', { avancePct, delaiHeures });
  }
  res.json(await reglages());
});

// ================= ERREURS & DÉMARRAGE =================
app.use('/api', (req, res) => res.status(404).json({ erreur: 'Adresse inconnue.' }));
app.use((err, req, res, next) => {
  if (err instanceof Erreur) return res.status(err.status).json({ erreur: err.message });
  if (err instanceof multer.MulterError) return res.status(400).json({ erreur: 'Image trop lourde (5 Mo maximum).' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erreur: 'Données invalides.' });
  if (['22P02', '23503', '23514'].includes(err.code)) return res.status(400).json({ erreur: 'Données invalides.' });
  console.error(err);
  res.status(500).json({ erreur: 'Erreur du serveur, réessayez.' });
});

await initialiser();
const surveiller = () => surveillerDemandes().catch(e => console.error('⚠ Demandes de location :', e.message));
surveiller();
setInterval(surveiller, 60e3);
const PORT = Number(process.env.PORT) || 3005;
app.listen(PORT, () => console.log(`✔ El Ghanja : http://localhost:${PORT}`
  + (mail.actif() ? `\n  Emails des promotions : ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}` : '')));
