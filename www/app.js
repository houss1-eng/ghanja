/* =========================================================
   El Ghanja – Safa Make-up Artist (Gabès)
   Espaces : Clientes (réserver, boutique, location, fidélité) et Administration.
   Les données viennent de l'API du serveur (dossier server/, PostgreSQL).
   ========================================================= */

// ================= CONTACTS (carte de visite) =================
const CONTACT = {
  telephone: '+216 26 972 623',
  whatsapp: 'https://wa.me/21626972623',
  instagram: { nom: 'El Ghanja MakeUp', url: 'https://www.instagram.com/explore/search/keyword/?q=El%20Ghanja%20MakeUp' },
  facebook: { nom: 'El Ghanja Make Up Beauty', url: 'https://www.facebook.com/search/top?q=El%20Ghanja%20Make%20Up%20Beauty' },
  adresse: 'Cité Taha Hassine, Beb Bhar, Gabès'
};
const SVG = {
  whatsapp: '<svg viewBox="0 0 24 24"><path style="fill:none;stroke:#fff;stroke-width:1.8" d="M12 2.8a9.2 9.2 0 0 0-7.9 13.9L3 21l4.4-1.1A9.2 9.2 0 1 0 12 2.8z"/><path d="M8.6 7.6c.3-.5.6-.6 1-.6h.6l1 2.3c.1.3 0 .5-.2.7l-.6.7a6.4 6.4 0 0 0 2.8 2.8l.7-.6c.2-.2.5-.3.7-.2l2.3 1c.1.4 0 1.2-.6 1.6-.6.4-1.6.6-3-.1a9.8 9.8 0 0 1-4.2-4.2c-.6-1.3-.6-2.3-.5-3.4z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" style="fill:none;stroke:#fff;stroke-width:1.8"/><circle cx="12" cy="12" r="4" style="fill:none;stroke:#fff;stroke-width:1.8"/><circle cx="17.3" cy="6.7" r="1.1"/></svg>',
  facebook: '<svg viewBox="0 0 24 24"><path d="M13.5 21v-7.5H16l.4-3h-2.9V8.7c0-.9.3-1.4 1.5-1.4h1.5V4.6c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.2H8v3h2.6V21z"/></svg>'
};
function htmlContacts() {
  return `<a href="${CONTACT.whatsapp}" target="_blank" rel="noopener"><span class="rond">${SVG.whatsapp}</span>${CONTACT.telephone}</a>
    <a href="${CONTACT.instagram.url}" target="_blank" rel="noopener"><span class="rond">${SVG.instagram}</span>${CONTACT.instagram.nom}</a>
    <a href="${CONTACT.facebook.url}" target="_blank" rel="noopener"><span class="rond">${SVG.facebook}</span>${CONTACT.facebook.nom}</a>`;
}

// ================= OUTILS =================
const $ = id => document.getElementById(id);
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dt = n => Number(n).toLocaleString('fr-FR', { maximumFractionDigits: 3 }) + ' DT';
const dateLongue = d => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const dateCourte = d => new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const dateHeure = d => new Date(d).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const ajouterJours = (d, n) => { const x = new Date(d + 'T12:00:00Z'); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const imgUrl = id => '/api/fichiers/' + id;
const ICONES_CAT = { Maquillage: '💄', Coiffure: '💇‍♀️', 'Soins visage': '🧖‍♀️', Soins: '🧴', Épilation: '✨', Ongles: '💅', Hammam: '🛁',
  'Robes de mariée': '👰', 'Tenues traditionnelles': '🥻', 'Caftans & takchita': '👘', 'Robes de soirée': '👗', Bijoux: '💍', Accessoires: '👠' };
const icone = cat => ICONES_CAT[cat] || '🌸';
const photo = (x) => x.image_id ? `<img src="${imgUrl(x.image_id)}" alt="" loading="lazy">` : icone(x.categorie);

// Stockage du navigateur (peut être indisponible : navigation privée…)
const STOCK = {
  lire(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  ecrire(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { /* rien */ } }
};

const STATUTS = {
  reservation: { en_attente: ['En attente', 'orange'], confirmee: ['Confirmé', 'bleu'], terminee: ['Terminé', 'vert'], annulee: ['Annulé', 'gris'] },
  commande: { en_attente: ['En préparation', 'orange'], prete: ['Prête à récupérer', 'bleu'], livree: ['Récupérée', 'vert'], annulee: ['Annulée', 'gris'] },
  achat: { demandee: ['Mis de côté, à confirmer', 'orange'], confirmee: ['Vendu ✔', 'vert'], annulee: ['Annulé', 'gris'] },
  location: { demandee: ['En attente d’avance', 'orange'], confirmee: ['Réservée (avance versée)', 'bleu'], en_cours: ['Chez la cliente', 'nude'], retournee: ['Retournée', 'vert'], annulee: ['Annulée', 'gris'] }
};
const badge = (type, s) => { const [t, c] = STATUTS[type][s] || [s, 'gris']; return `<span class="etiquette ${c}">${t}</span>`; };
const CIBLES = { tout: 'Tout', services: 'Soins & maquillage', produits: 'Boutique', location: 'Location' };

// ================= ÉTAT =================
let token = STOCK.lire('ghanja-token');
let moi = null;          // utilisateur connecté (+ carte fidélité)
let CAT = null;          // catalogue : soins, produits, articles, promotions, réglages
let NOTIFS = [];
let panier = {};         // produit_id → quantité
try { panier = JSON.parse(STOCK.lire('ghanja-panier') || '{}') || {}; } catch (e) { panier = {}; }

// ================= API =================
async function api(chemin, { method = 'GET', body } = {}) {
  const opts = { method, headers: {} };
  if (token) opts.headers.Authorization = 'Bearer ' + token;
  if (body instanceof FormData) opts.body = body;
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); }
  let res;
  try { res = await fetch('/api' + chemin, opts); } catch (e) { throw new Error('Pas de connexion au serveur.'); }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token) { deconnexion(); throw new Error(data.erreur || 'Session expirée.'); }
  if (!res.ok) throw new Error(data.erreur || 'Erreur, réessayez.');
  return data;
}

function toast(msg, erreur = false) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const t = document.createElement('div');
  t.className = 'toast' + (erreur ? ' erreur' : '');
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}
// Exécute une action ; affiche l'erreur sans casser la page
async function essayer(fn) {
  try { return await fn(); } catch (e) { toast(e.message, true); }
}

// ================= FENÊTRE =================
function ouvrir(titre, contenu) {
  $('fenetre').innerHTML = `<div class="voile" onclick="if(event.target===this)fermer()">
    <div class="fenetre" role="dialog" aria-modal="true"><div class="titre"><h3>${titre}</h3>
    <button class="fermer" onclick="fermer()" aria-label="Fermer">✕</button></div>${contenu}</div></div>`;
}
function fermer() { $('fenetre').innerHTML = ''; }
document.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });

// ================= CONNEXION =================
function ongletAuth(o) {
  $('onglet-login').classList.toggle('actif', o === 'login');
  $('onglet-inscription').classList.toggle('actif', o === 'inscription');
  $('form-login').classList.toggle('hidden', o !== 'login');
  $('form-inscription').classList.toggle('hidden', o !== 'inscription');
}
async function connexion(e) {
  e.preventDefault();
  demanderNotifPendantGeste();
  $('l-err').textContent = '';
  try {
    const r = await api('/login', { method: 'POST', body: { identifiant: $('l-id').value, password: $('l-mdp').value } });
    await demarrer(r.token);
  } catch (err) { $('l-err').textContent = err.message; }
}
async function inscription(e) {
  e.preventDefault();
  demanderNotifPendantGeste();
  $('i-err').textContent = '';
  try {
    const r = await api('/inscription', { method: 'POST', body: {
      nom: $('i-nom').value, telephone: $('i-tel').value, email: $('i-email').value, password: $('i-mdp').value } });
    await demarrer(r.token);
  } catch (err) { $('i-err').textContent = err.message; }
}
function deconnexion() {
  desactiverPush();
  token = null; moi = null;
  STOCK.ecrire('ghanja-token', null);
  fermer();
  $('app').classList.add('hidden');
  $('auth').classList.remove('hidden');
  location.hash = '';
}

async function demarrer(t) {
  token = t;
  STOCK.ecrire('ghanja-token', t);
  await rafraichirMoi();
  $('auth').classList.add('hidden');
  $('app').classList.remove('hidden');
  if (!location.hash) location.hash = '#/' + pages()[0][0];
  await afficher();
  activerPushAuto();
}
async function rafraichirMoi() {
  [moi, CAT] = await Promise.all([api('/moi'), api('/catalogue')]);
}

// ================= NAVIGATION =================
const PAGES_CLIENTE = [
  ['accueil', '🏠', 'Accueil'], ['reserver', '📅', 'Réserver'], ['boutique', '🛍️', 'Boutique'],
  ['location', '👗', 'Robes & tenues'], ['galerie', '📸', 'Réalisations'], ['activites', '🧾', 'Mes activités'], ['profil', '👤', 'Profil']
];
const PAGES_ADMIN = [
  ['tableau', '📊', 'Tableau de bord'], ['agenda', '📅', 'Rendez-vous'], ['commandes', '🛍️', 'Commandes'],
  ['locations', '👗', 'Locations'], ['clientes', '👥', 'Clientes'], ['promotions', '🎉', 'Promotions'],
  ['catalogue', '🗂️', 'Catalogue'], ['equipe', '👩‍🎨', 'Équipe'], ['galerie', '📸', 'Réalisations'], ['reglages', '⚙️', 'Réglages']
];
const PAGES_EMPLOYE = [['planning', '📅', 'Mon planning'], ['profil', '👤', 'Profil']];
const pages = () => moi.role === 'admin' ? PAGES_ADMIN : moi.role === 'employe' ? PAGES_EMPLOYE : PAGES_CLIENTE;
const TITRES = { notifications: 'Notifications' };
let pageActuelle = null;
let attente = {};   // administration : nombre d'éléments à traiter par page

function aller(p) { location.hash = '#/' + p; }
window.addEventListener('hashchange', () => { if (moi) afficher(); });

function dessinerMenu() {
  const lien = ([id, ico, nom]) => {
    const n = attente[id] ? `<span class="pastille">${attente[id]}</span>` : '';
    return `<a href="#/${id}" class="${id === pageActuelle ? 'actif' : ''}"><span class="ico">${ico}</span>${nom}${n}</a>`;
  };
  $('menu-liens').innerHTML = pages().map(lien).join('');
  $('nav-bas').innerHTML = pages().map(lien).join('');
}

async function afficher() {
  const p = location.hash.replace('#/', '');
  pageActuelle = RENDU[p] && (p === 'notifications' || pages().some(x => x[0] === p)) ? p : pages()[0][0];
  const def = pages().find(x => x[0] === pageActuelle);
  $('titre-page').textContent = def ? def[2] : TITRES[pageActuelle];
  if (moi.role === 'admin') await essayer(chargerAttente);
  dessinerMenu();
  essayer(chargerNotifs);
  $('page').innerHTML = '<p class="muted">Chargement…</p>';
  window.scrollTo(0, 0);
  await essayer(() => RENDU[pageActuelle]());
}
// Recharge la page affichée (après une action)
const recharger = () => essayer(() => RENDU[pageActuelle]());

async function chargerAttente() {
  const s = await api('/stats');
  attente = { agenda: s.rdv_attente, commandes: s.cmd_attente, locations: s.loc_attente + s.achat_attente };
  return s;
}
async function chargerNotifs() {
  NOTIFS = await api('/notifications');
  const n = NOTIFS.filter(x => !x.lue).length;
  $('nb-notifs').textContent = n;
  $('nb-notifs').classList.toggle('hidden', !n);
}

const vide = (ico, texte) => `<div class="vide"><span class="ico">${ico}</span>${texte}</div>`;

// ================= ESPACE CLIENTE =================
function carteFidelite(f) {
  let tampons = '';
  for (let i = 0; i < f.seuil; i++)
    tampons += `<div class="tampon ${i < f.points ? 'plein' : ''}">${i < f.points ? '✓' : ''}</div>`;
  tampons += `<div class="tampon cadeau ${f.cadeauDisponible ? 'pret' : ''}" title="Cadeau">🎁</div>`;
  const cadeau = f.remise === 100 ? 'offert' : `à -${f.remise} %`;
  const reste = f.seuil - f.points;
  return `<div class="fidelite">
    <h3>Ma carte fidélité</h3>
    <div class="small">Après ${f.seuil} soins, le ${f.seuil + 1}<sup>e</sup> est ${cadeau} 💖</div>
    <div class="tampons">${tampons}</div>
    <b>${f.cadeauDisponible
      ? `🎁 Votre prochain soin est ${cadeau} !`
      : `Encore ${reste} soin${reste > 1 ? 's' : ''} avant votre cadeau`}</b>
    ${f.cadeauxRecus ? `<div class="small">Cadeaux reçus : ${f.cadeauxRecus}</div>` : ''}
  </div>`;
}

function bannieresPromo() {
  return CAT.promotions.map(p => `<div class="banniere">
    <div class="small" style="opacity:.85;letter-spacing:2px;text-transform:uppercase">Promotion · ${CIBLES[p.cible]}</div>
    <h3 style="margin:4px 0">${esc(p.titre)}</h3>
    <div class="gros">-${p.remise_pct} %</div>
    <div>${esc(p.message)}</div>
    <div class="small" style="opacity:.85;margin-top:6px">Jusqu'au ${dateLongue(p.date_fin)}</div>
  </div>`).join('');
}

const pied = () => `<div class="pied-contact"><div class="signature" style="margin-bottom:6px">Safa Make-up Artist</div>
  <div class="contacts">${htmlContacts()}</div><p class="adresse">📍 ${CONTACT.adresse}</p></div>`;

const RENDU = {};

RENDU.accueil = async () => {
  await rafraichirMoi();
  const [resas, reals] = await Promise.all([api('/reservations'), api('/realisations')]);
  const prochains = resas.filter(r => ['en_attente', 'confirmee'].includes(r.statut) && r.date >= CAT.aujourdhui)
    .sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure));
  $('page').innerHTML = `
    <h1>Bonjour ${esc(moi.nom.split(' ')[0])} 🌸</h1>
    <p class="muted">Bienvenue chez El Ghanja, votre espace beauté à Gabès.</p>
    ${cartePush()}
    ${bannieresPromo()}
    ${carteFidelite(moi.fidelite)}
    <div class="carte">
      <div class="row between"><h3 style="margin:0">Mes prochains rendez-vous</h3>
        <button class="btn btn-primary btn-sm" onclick="aller('reserver')">+ Réserver</button></div>
      ${prochains.length ? prochains.slice(0, 3).map(ligneResa).join('') : vide('📅', 'Aucun rendez-vous à venir.')}
    </div>
    ${reals.length ? `<div class="carte">
      <div class="row between"><h3 style="margin:0">📸 Les dernières réalisations de Safa</h3>
        <a class="btn btn-sm" href="#/galerie">Tout voir</a></div>
      <div class="galerie" style="margin-top:12px">${reals.slice(0, 6).map(vignette).join('')}</div>
    </div>` : ''}
    <div class="stats">
      <a class="stat" href="#/reserver"><div class="val">💄</div><div class="lib">Réserver un soin</div></a>
      <a class="stat" href="#/boutique"><div class="val">🛍️</div><div class="lib">Boutique beauté</div></a>
      <a class="stat" href="#/location"><div class="val">👰</div><div class="lib">Location robes & tenues</div></a>
    </div>
    ${pied()}`;
};

function ligneResa(r) {
  const [j, m] = [new Date(r.date + 'T00:00:00').getDate(), new Date(r.date + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })];
  const annulable = moi.role === 'cliente' && ['en_attente', 'confirmee'].includes(r.statut);
  return `<div class="ligne">
    <div class="date-bloc"><b>${j}</b><span>${m}</span></div>
    <div class="infos"><b>${esc(r.service)}</b> · ${r.heure}<br>
      <span class="small muted">${r.duree} min · ${r.remise_pct ? `<s>${dt(r.prix)}</s> ` : ''}<b>${dt(r.prix_final)}</b>${r.employe ? ' · avec ' + esc(prenom(r.employe)) : ''}</span>
      ${r.cadeau ? '<span class="etiquette nude">🎁 Cadeau fidélité</span>' : ''}</div>
    ${badge('reservation', r.statut)}
    ${annulable ? `<button class="btn btn-danger btn-sm" onclick="annulerResa(${r.id})">Annuler</button>` : ''}
  </div>`;
}
async function annulerResa(id) {
  if (!confirm('Annuler ce rendez-vous ?')) return;
  await essayer(async () => {
    await api('/reservations/' + id, { method: 'PATCH', body: { statut: 'annulee' } });
    toast('Rendez-vous annulé.');
    recharger();
  });
}

// ----- Réserver -----
const RES = { service: null, date: null, heure: null, filtre: 'Tous', creneaux: [], employe: null };
let EQUIPE = [];
const avatar = (m, taille = 44) => `<span class="avatar" style="width:${taille}px;height:${taille}px">${m.photo_id ? `<img src="${imgUrl(m.photo_id)}" alt="">` : esc((m.nom || '?').replace(/^Safa.*/, 'Safa')[0])}</span>`;
const membresDuSoin = s => EQUIPE.filter(m => m.specialites.includes(s.categorie));
const prenom = nom => String(nom || '').split(/\s[–-]\s|\s/)[0];

function promoPour(cible) {
  return CAT.promotions.filter(p => p.cible === cible || p.cible === 'tout').sort((a, b) => b.remise_pct - a.remise_pct)[0] || null;
}
function prixAffiche(normal, promo) {
  return promo < normal ? `<span class="prix"><s>${dt(normal)}</s>${dt(promo)}</span>` : `<span class="prix">${dt(normal)}</span>`;
}

RENDU.reserver = async () => {
  if (!RES.date) RES.date = CAT.aujourdhui;
  EQUIPE = await api('/equipe');
  if (!RES.service) return dessinerServices();
  dessinerReservation();
};
function dessinerServices() {
  const cats = ['Tous', ...new Set(CAT.services.map(s => s.categorie))];
  const liste = CAT.services.filter(s => RES.filtre === 'Tous' || s.categorie === RES.filtre);
  $('page').innerHTML = `
    ${moi.fidelite.cadeauDisponible ? `<div class="fidelite" style="padding:14px 18px"><b>🎁 Votre prochain soin est ${moi.fidelite.remise === 100 ? 'offert' : 'à -' + moi.fidelite.remise + ' %'} !</b></div>` : ''}
    <div class="filtres">${cats.map(c => `<button class="${c === RES.filtre ? 'actif' : ''}" onclick="RES.filtre='${esc(c)}';dessinerServices()">${c === 'Tous' ? 'Tous' : icone(c) + ' ' + esc(c)}</button>`).join('')}</div>
    <div class="grille">${liste.map(s => `<div class="item">
      <div class="photo">${photo(s)}</div>
      <div class="corps"><span class="etiquette">${esc(s.categorie)}</span><h3>${esc(s.nom)}</h3>
        <span class="small muted">${esc(s.description)}</span><span class="small muted">⏱ ${s.duree} min</span>
        <div class="bas">${prixAffiche(s.prix, s.prix_promo)}
          <button class="btn btn-primary btn-sm" onclick="choisirService(${s.id})">Réserver</button></div></div>
    </div>`).join('') || vide('💄', 'Aucun soin dans cette catégorie.')}</div>`;
}
function choisirService(id) {
  RES.service = CAT.services.find(s => s.id === id);
  RES.heure = null;
  RES.employe = null;
  dessinerReservation();
}
async function dessinerReservation() {
  const s = RES.service;
  const h = CAT.reglages.horaires;
  const ferme = h.joursFermes.includes(new Date(RES.date + 'T12:00:00Z').getUTCDay());
  RES.creneaux = ferme ? [] : await api(`/creneaux?service_id=${s.id}&date=${RES.date}${RES.employe ? '&employe_id=' + RES.employe : ''}`);
  const membres = membresDuSoin(s);
  const choisie = membres.find(m => m.id === RES.employe);
  const f = moi.fidelite;
  const promo = promoPour('services');
  const cadeau = f.cadeauDisponible && f.remise >= (promo ? promo.remise_pct : 0);
  const remise = cadeau ? f.remise : (promo ? promo.remise_pct : 0);
  const final = Math.round(s.prix * (100 - remise) * 10) / 1000;

  $('page').innerHTML = `
    <button class="btn btn-ghost btn-sm" onclick="RES.service=null;dessinerServices()">← Changer de soin</button>
    <div class="carte choix-service">
      <div class="date-bloc" style="font-size:1.6rem;padding:10px 0">${icone(s.categorie)}</div>
      <div class="grow"><b>${esc(s.nom)}</b><br><span class="small muted">${s.duree} min · ${dt(s.prix)}</span></div>
    </div>
    ${membres.length ? `<div class="carte">
      <h3>Avec qui ?</h3>
      <div class="membres">
        <button class="membre ${RES.employe ? '' : 'choisi'}" onclick="RES.employe=null;RES.heure=null;dessinerReservation()"><span class="avatar">✨</span><b>Peu importe</b><small>la première disponible</small></button>
        ${membres.map(m => `<button class="membre ${m.id === RES.employe ? 'choisi' : ''}" onclick="RES.employe=${m.id};RES.heure=null;dessinerReservation()">${avatar(m)}<b>${esc(prenom(m.nom))}</b><small>${m.specialites.map(esc).join(' · ')}</small></button>`).join('')}
      </div>
    </div>` : ''}
    <div class="carte">
      <h3>1. Choisissez le jour</h3>
      <div class="row">
        <button class="btn btn-sm" onclick="changerJour(-1)" ${RES.date <= CAT.aujourdhui ? 'disabled' : ''}>‹</button>
        <input type="date" class="grow" style="max-width:220px" value="${RES.date}" min="${CAT.aujourdhui}" onchange="RES.date=this.value;RES.heure=null;dessinerReservation()">
        <button class="btn btn-sm" onclick="changerJour(1)">›</button>
        <span class="muted">${dateLongue(RES.date)}</span>
      </div>
      <h3 style="margin-top:18px">2. Choisissez l'heure</h3>
      ${ferme ? `<p class="muted">Le centre est fermé le ${JOURS[new Date(RES.date + 'T12:00:00Z').getUTCDay()]}.</p>`
        : RES.creneaux.length ? `<div class="creneaux">${RES.creneaux.map(c => `<button ${c.places < 1 ? 'disabled' : ''}
            class="${c.heure === RES.heure ? 'choisi' : ''}" onclick="RES.heure='${c.heure}';dessinerReservation()">${c.heure}
            <small>${c.places < 1 ? 'complet' : c.places + ' place' + (c.places > 1 ? 's' : '')}</small></button>`).join('')}</div>`
        : '<p class="muted">Plus de créneau ce jour-là, essayez le jour suivant.</p>'}
    </div>
    ${RES.heure ? `<div class="carte">
      <h3>3. Confirmez</h3>
      <div class="recap">
        <div class="ligne-prix"><span>${esc(s.nom)}</span><span>${dt(s.prix)}</span></div>
        <div class="ligne-prix muted"><span>${dateLongue(RES.date)} à ${RES.heure}</span></div>
        ${membres.length ? `<div class="ligne-prix muted"><span>👩‍🎨 ${choisie ? 'Avec ' + esc(prenom(choisie.nom)) : 'Avec la première disponible'}</span></div>` : ''}
        ${remise ? `<div class="ligne-prix" style="color:var(--vert)"><span>${cadeau ? '🎁 Cadeau fidélité' : '🎉 ' + esc(promo.titre)}</span><span>-${remise} %</span></div>` : ''}
        <div class="ligne-prix total"><span>Total</span><span>${dt(final)}</span></div>
      </div>
      <label for="r-note">Une précision ? <span class="muted small">(facultatif)</span></label>
      <textarea id="r-note" placeholder="Ex. : maquillage pour un mariage, photo de la tenue…"></textarea>
      <button class="btn btn-primary btn-block" style="margin-top:12px" onclick="confirmerResa(this)">Confirmer la réservation</button>
    </div>` : ''}`;
}
function changerJour(n) {
  const d = ajouterJours(RES.date, n);
  if (d < CAT.aujourdhui) return;
  RES.date = d; RES.heure = null;
  dessinerReservation();
}
async function confirmerResa(btn) {
  btn.disabled = true;
  try {
    const r = await api('/reservations', { method: 'POST', body: { service_id: RES.service.id, date: RES.date, heure: RES.heure, note: $('r-note').value, employe_id: RES.employe } });
    toast(r.cadeau ? '🎁 Réservé avec votre cadeau fidélité !' : '✔ Réservation envoyée, Safa va la confirmer.');
    RES.service = null; RES.heure = null;
    aller('activites');
  } catch (e) {
    toast(e.message, true);
    btn.disabled = false;
    if (/complet|disponible/.test(e.message)) { RES.heure = null; dessinerReservation(); }
  }
}

// ----- Boutique -----
let filtreBoutique = 'Tous';
const sauverPanier = () => STOCK.ecrire('ghanja-panier', JSON.stringify(panier));
const lignesPanier = () => Object.entries(panier)
  .map(([id, qte]) => ({ p: CAT.produits.find(x => x.id === Number(id)), qte }))
  .filter(l => l.p);

RENDU.boutique = async () => {
  CAT = await api('/catalogue');
  dessinerBoutique();
};
function dessinerBoutique() {
  const cats = ['Tous', ...new Set(CAT.produits.map(p => p.categorie))];
  const liste = CAT.produits.filter(p => filtreBoutique === 'Tous' || p.categorie === filtreBoutique);
  const lignes = lignesPanier();
  const nb = lignes.reduce((s, l) => s + l.qte, 0);
  const total = lignes.reduce((s, l) => s + l.qte * l.p.prix_promo, 0);
  $('page').innerHTML = `
    <p class="muted">Commandez en ligne, récupérez au centre (Beb Bhar, Gabès).</p>
    <div class="filtres">${cats.map(c => `<button class="${c === filtreBoutique ? 'actif' : ''}" onclick="filtreBoutique='${esc(c)}';dessinerBoutique()">${esc(c)}</button>`).join('')}</div>
    <div class="grille">${liste.map(p => `<div class="item">
      <div class="photo">${photo(p)}</div>
      <div class="corps"><span class="etiquette">${esc(p.categorie)}</span><h3>${esc(p.nom)}</h3>
        <span class="small muted">${esc(p.description)}</span>
        <span class="small ${p.stock ? 'muted' : ''}" style="${p.stock ? '' : 'color:var(--rouge)'}">${p.stock ? `En stock (${p.stock})` : 'Rupture de stock'}</span>
        <div class="bas">${prixAffiche(p.prix, p.prix_promo)}
          <button class="btn btn-primary btn-sm" ${p.stock ? '' : 'disabled'} onclick="ajouterPanier(${p.id})">Ajouter</button></div></div>
    </div>`).join('') || vide('🛍️', 'Aucun produit.')}</div>
    ${nb ? `<button class="btn btn-primary panier-flottant" onclick="voirPanier()">🛒 ${nb} · ${dt(total)}</button>` : ''}`;
}
function ajouterPanier(id) {
  const p = CAT.produits.find(x => x.id === id);
  if ((panier[id] || 0) >= p.stock) return toast(`Stock disponible : ${p.stock}`, true);
  panier[id] = (panier[id] || 0) + 1;
  sauverPanier();
  toast(`« ${p.nom} » ajouté au panier`);
  dessinerBoutique();
}
function changerQte(id, n) {
  const p = CAT.produits.find(x => x.id === id);
  panier[id] = Math.min(p.stock, (panier[id] || 0) + n);
  if (panier[id] <= 0) delete panier[id];
  sauverPanier();
  dessinerBoutique();
  if (Object.keys(panier).length) voirPanier(); else fermer();
}
function voirPanier() {
  const lignes = lignesPanier();
  const total = lignes.reduce((s, l) => s + l.qte * l.p.prix_promo, 0);
  ouvrir('🛒 Mon panier', `
    ${lignes.map(l => `<div class="ligne"><div class="infos"><b>${esc(l.p.nom)}</b><br><span class="small muted">${dt(l.p.prix_promo)} / unité</span></div>
      <div class="qte"><button onclick="changerQte(${l.p.id},-1)">−</button><b>${l.qte}</b><button onclick="changerQte(${l.p.id},1)">+</button></div>
      <b>${dt(l.qte * l.p.prix_promo)}</b></div>`).join('')}
    <div class="recap" style="margin-top:12px"><div class="ligne-prix total" style="border:0;margin:0;padding:0"><span>Total</span><span>${dt(total)}</span></div>
    <div class="small muted">Paiement et retrait au centre.</div></div>
    <div class="pied"><button class="btn btn-primary btn-block" onclick="commander(this)">Commander</button></div>`);
}
async function commander(btn) {
  btn.disabled = true;
  try {
    await api('/commandes', { method: 'POST', body: { lignes: lignesPanier().map(l => ({ produit_id: l.p.id, quantite: l.qte })) } });
    panier = {}; sauverPanier(); fermer();
    toast('✔ Commande envoyée ! Vous serez prévenue quand elle sera prête.');
    ACT = 'commandes';
    aller('activites');
  } catch (e) { toast(e.message, true); btn.disabled = false; }
}

// ----- Location & vente des robes et accessoires -----
// Filtres : catégorie, « à louer / à vendre », et les jours où la cliente en a besoin
// (les articles déjà loués ces jours-là sont cachés)
const OCC_VIDE = { bloques: [], demandes: {} };
const FL = { cat: 'Tous', mode: 'tout', debut: '', fin: '', occ: OCC_VIDE };
RENDU.location = async () => {
  CAT = await api('/catalogue');
  if (FL.debut && FL.debut < CAT.aujourdhui) { FL.debut = ''; FL.fin = ''; }
  FL.occ = FL.debut ? await api(`/articles/occupes?debut=${FL.debut}&fin=${FL.fin}`) : OCC_VIDE;
  dessinerLocation();
};
async function changerDatesLocation() {
  FL.debut = $('fl-debut').value;
  FL.fin = $('fl-fin').value || FL.debut;
  if (FL.fin < FL.debut) FL.fin = FL.debut;
  if (FL.debut) FL.mode = 'louer';
  await essayer(async () => {
    FL.occ = FL.debut ? await api(`/articles/occupes?debut=${FL.debut}&fin=${FL.fin}`) : OCC_VIDE;
    dessinerLocation();
  });
}
function effacerDatesLocation() {
  FL.debut = FL.fin = ''; FL.occ = OCC_VIDE; FL.mode = 'tout';
  dessinerLocation();
}
// Ordre d'affichage des catégories (les autres, créées par Safa, viennent après)
const ORDRE_CATS = ['Robes de mariée', 'Tenues traditionnelles', 'Caftans & takchita', 'Robes de soirée', 'Bijoux', 'Accessoires'];
const rangCat = c => { const i = ORDRE_CATS.indexOf(c); return i < 0 ? 99 : i; };
function choisirCategorie(i) {
  FL.cat = i < 0 ? 'Tous' : FL.cats[i];
  dessinerLocation();
  window.scrollTo(0, 0);
}
function dessinerLocation() {
  // Articles selon « à louer / à vendre » et les dates (déjà loués ces jours-là : cachés)
  let base = CAT.articles;
  if (FL.mode === 'louer') base = base.filter(a => a.prix_jour != null);
  if (FL.mode === 'acheter') base = base.filter(a => a.prix_vente != null);
  const libres = FL.debut ? base.filter(a => !FL.occ.bloques.includes(a.id)) : base;
  // Catégories dans l'ordre choisi par Safa, seulement celles qui ont des articles
  const ordre = CAT.categories.map(c => c.nom);
  FL.cats = [...new Set(CAT.articles.map(a => a.categorie))]
    .sort((a, b) => (ordre.indexOf(a) + 1 || 999) - (ordre.indexOf(b) + 1 || 999) || a.localeCompare(b));
  if (FL.cat !== 'Tous' && !FL.cats.includes(FL.cat)) FL.cat = 'Tous';
  const dansCat = a => FL.cat === 'Tous' || a.categorie === FL.cat;
  const liste = libres.filter(dansCat);
  const nbPris = FL.debut ? base.filter(dansCat).length - liste.length : 0;
  const periode = FL.debut ? (FL.fin === FL.debut ? `le ${dateLongue(FL.debut)}` : `du ${dateCourte(FL.debut)} au ${dateCourte(FL.fin)}`) : '';
  const mode = (id, t) => `<button class="${FL.mode === id ? 'actif' : ''}" onclick="FL.mode='${id}';dessinerLocation()">${t}</button>`;

  $('page').innerHTML = `
    <div class="carte">
      <h3 style="margin:0">📅 Quand en avez-vous besoin ?</h3>
      <p class="small muted" style="margin:4px 0 0">Choisissez le jour de votre fête : seules les robes et accessoires libres ce jour-là s'affichent.</p>
      <div class="row" style="align-items:flex-end">
        <div class="grow" style="min-width:140px"><label for="fl-debut">Du</label><input type="date" id="fl-debut" min="${CAT.aujourdhui}" value="${FL.debut}" onchange="if(!$('fl-fin').value||$('fl-fin').value<this.value)$('fl-fin').value=this.value;changerDatesLocation()"></div>
        <div class="grow" style="min-width:140px"><label for="fl-fin">Au (inclus)</label><input type="date" id="fl-fin" min="${FL.debut || CAT.aujourdhui}" value="${FL.fin}" onchange="changerDatesLocation()"></div>
        ${FL.debut ? '<button class="btn btn-ghost" onclick="effacerDatesLocation()">✕ Effacer</button>' : ''}
      </div>
      ${FL.debut ? `<p class="small" style="margin:10px 0 0"><b style="color:var(--vert)">✔ ${liste.length} disponible${liste.length > 1 ? 's' : ''} ${periode}</b>
        ${nbPris ? `<span class="muted"> · ${nbPris} déjà loué${nbPris > 1 ? 's' : ''} ces jours-là (caché${nbPris > 1 ? 's' : ''})</span>` : ''}</p>` : ''}
    </div>
    <div class="filtres">${mode('tout', 'Tout')}${mode('louer', '👗 À louer')}${mode('acheter', '🛍️ À vendre')}</div>
    ${FL.cat === 'Tous' ? cartesCategories(libres) : `
    <div class="row" style="margin-bottom:12px"><button class="btn btn-sm" onclick="choisirCategorie(-1)">← Toutes les catégories</button>
      <h2 style="margin:0">${icone(FL.cat)} ${esc(FL.cat)}</h2></div>
    <div class="grille">${liste.map(a => `<div class="item">
      <div class="photo">${photo(a)}</div>
      <div class="corps">
        <div class="row" style="gap:4px"><span class="etiquette">${esc(a.categorie)}</span>
          ${a.prix_jour != null ? '<span class="etiquette bleu">À louer</span>' : ''}${a.prix_vente != null ? '<span class="etiquette nude">À vendre</span>' : ''}</div>
        <h3>${esc(a.nom)}</h3>
        ${FL.debut && FL.occ.demandes[a.id] ? `<span class="etiquette orange">🔥 ${FL.occ.demandes[a.id]} demande${FL.occ.demandes[a.id] > 1 ? 's' : ''} sur ces dates</span>` : ''}
        <span class="small muted">${esc(a.description)}${a.taille ? ' · Taille ' + esc(a.taille) : ''}</span>
        ${a.prix_jour != null ? `<div>${prixAffiche(a.prix_jour, a.prix_promo)}<span class="small muted"> / jour · caution ${dt(a.caution)}</span></div>` : ''}
        ${a.prix_vente != null ? `<div><span class="prix">${dt(a.prix_vente)}</span><span class="small muted"> à l'achat</span></div>` : ''}
        <div class="bas">
          ${a.prix_jour != null ? `<button class="btn btn-primary btn-sm" onclick="louer(${a.id})">Louer</button>` : ''}
          ${a.prix_vente != null ? `<button class="btn btn-nude btn-sm" onclick="acheter(${a.id})">Acheter</button>` : ''}
        </div></div>
    </div>`).join('')}</div>
    ${liste.length ? '' : vide('👗', FL.debut ? `Tout est déjà loué ${periode} dans cette catégorie. Essayez d'autres dates.` : 'Aucun article dans cette catégorie.')}`}`;
}
// Une carte par catégorie : photo, nombre d'articles (libres aux dates choisies), prix « à partir de »
function cartesCategories(libres) {
  const min = l => l.length ? Math.min(...l) : null;
  return `<div class="grille">${FL.cats.map((c, i) => {
    const tous = CAT.articles.filter(a => a.categorie === c);
    const dispo = libres.filter(a => a.categorie === c);
    const fiche = CAT.categories.find(x => x.nom === c);
    const avecPhoto = fiche && fiche.image_id ? fiche : tous.find(a => a.image_id);
    const loc = min(dispo.filter(a => a.prix_jour != null).map(a => a.prix_promo));
    const vente = min(dispo.filter(a => a.prix_vente != null).map(a => a.prix_vente));
    return `<button class="item categorie" onclick="choisirCategorie(${i})" ${dispo.length ? '' : 'style="opacity:.55"'}>
      <div class="photo">${avecPhoto ? `<img src="${imgUrl(avecPhoto.image_id)}" alt="" loading="lazy">` : icone(c)}</div>
      <div class="corps"><h3>${icone(c)} ${esc(c)}</h3>
        <span class="small muted">${dispo.length} article${dispo.length > 1 ? 's' : ''}${FL.debut ? ' disponible' + (dispo.length > 1 ? 's' : '') : ''}</span>
        ${loc != null ? `<span class="small">Location dès <b class="prix">${dt(loc)}</b> / jour</span>` : ''}
        ${vente != null ? `<span class="small">Achat dès <b class="prix">${dt(vente)}</b></span>` : ''}
        <div class="bas"><span class="btn btn-primary btn-sm">Voir →</span></div></div>
    </button>`;
  }).join('')}</div>`;
}

// Achat d'une robe / d'un accessoire : l'article est réservé pour la cliente jusqu'à la confirmation de Safa
function acheter(id) {
  const a = CAT.articles.find(x => x.id === id);
  ouvrir(`🛍️ Acheter : ${esc(a.nom)}`, `
    ${a.image_id ? `<img class="apercu-image" src="${imgUrl(a.image_id)}" alt="">` : ''}
    <p class="muted">${esc(a.description)}${a.taille ? ' · Taille ' + esc(a.taille) : ''}</p>
    <div class="recap"><div class="ligne-prix total" style="border:0;margin:0;padding:0"><span>Prix</span><span>${dt(a.prix_vente)}</span></div>
      <div class="small muted">L'article est mis de côté pour vous. Safa confirme, puis vous payez et le récupérez au centre.</div></div>
    <p class="error" id="ach-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button>
      <button class="btn btn-primary" onclick="envoyerAchat(this, ${a.id})">Je l'achète</button></div>`);
}
async function envoyerAchat(btn, id) {
  btn.disabled = true;
  try {
    await api('/achats', { method: 'POST', body: { article_id: id } });
    fermer();
    toast('✔ Article mis de côté pour vous ! Safa va confirmer.');
    ACT = 'achats';
    aller('activites');
  } catch (e) { $('ach-err').textContent = e.message; btn.disabled = false; }
}

let LOC = null;
async function louer(id) {
  const a = CAT.articles.find(x => x.id === id);
  const occupation = await essayer(() => api(`/articles/${id}/occupation`));
  if (!occupation) return;
  // Dates déjà choisies dans le filtre « Quand en avez-vous besoin ? »
  LOC = { a, debut: FL.debut || CAT.aujourdhui, fin: FL.fin || FL.debut || CAT.aujourdhui, occupation };
  ouvrir(`👗 ${esc(a.nom)}`, `
    ${a.image_id ? `<img class="apercu-image" src="${imgUrl(a.image_id)}" alt="">` : ''}
    <p class="muted">${esc(a.description)}${a.taille ? ' · Taille ' + esc(a.taille) : ''}</p>
    ${occupation.prises.length ? `<div class="occupe"><b>Déjà réservé (avance versée) :</b><br>${occupation.prises.map(o => `du ${dateCourte(o.date_debut)} au ${dateCourte(o.date_fin)}`).join('<br>')}</div>` : '<p class="small" style="color:var(--vert)">✔ Aucune réservation confirmée à venir.</p>'}
    <div class="recap small" style="margin-top:10px">💡 <b>Comment ça marche ?</b> Envoyez votre demande, puis versez l'avance au centre dans les <b>${CAT.reglages.location.delaiHeures} h</b>. D'autres clientes peuvent demander le même modèle : <b>la première qui verse l'avance l'obtient</b>.</div>
    <div class="grid2">
      <div><label for="loc-debut">Du</label><input type="date" id="loc-debut" min="${CAT.aujourdhui}" value="${LOC.debut}" onchange="majLocation()"></div>
      <div><label for="loc-fin">Au (inclus)</label><input type="date" id="loc-fin" min="${CAT.aujourdhui}" value="${LOC.fin}" onchange="majLocation()"></div>
    </div>
    <div class="recap" id="loc-recap" style="margin-top:14px"></div>
    <p class="error" id="loc-err"></p>
    <div class="pied"><button class="btn btn-primary btn-block" id="loc-btn" onclick="envoyerLocation(this)">Envoyer ma demande</button></div>`);
  majLocation();
}
function majLocation() {
  const debut = $('loc-debut').value, fin = $('loc-fin').value;
  const a = LOC.a;
  if (!debut || !fin || fin < debut) {
    $('loc-recap').innerHTML = '<span class="muted">Choisissez les dates.</span>';
    $('loc-btn').disabled = true;
    return;
  }
  const jours = Math.round((Date.parse(fin) - Date.parse(debut)) / 864e5) + 1;
  const pris = LOC.occupation.prises.find(o => o.date_debut <= fin && debut <= o.date_fin);
  const autres = LOC.occupation.demandes.filter(o => o.date_debut <= fin && debut <= o.date_fin).length;
  $('loc-err').textContent = pris ? `Déjà loué du ${dateCourte(pris.date_debut)} au ${dateCourte(pris.date_fin)}.` : '';
  $('loc-btn').disabled = !!pris;
  const total = jours * a.prix_promo;
  const avance = Math.round(total * CAT.reglages.location.avancePct * 10) / 1000;
  $('loc-recap').innerHTML = `
    <div class="ligne-prix"><span>${jours} jour${jours > 1 ? 's' : ''} × ${dt(a.prix_promo)}</span><span>${dt(jours * a.prix_promo)}</span></div>
    ${a.prix_promo < a.prix_jour ? '<div class="ligne-prix small" style="color:var(--vert)"><span>🎉 Promotion location incluse</span></div>' : ''}
    <div class="ligne-prix muted"><span>Caution (rendue au retour)</span><span>${dt(a.caution)}</span></div>
    <div class="ligne-prix total"><span>Total location</span><span>${dt(total)}</span></div>
    <div class="ligne-prix" style="color:var(--mauve-fonce)"><span>💰 Avance à verser sous ${CAT.reglages.location.delaiHeures} h</span><b>${dt(avance)}</b></div>
    ${autres && !pris ? `<div class="small" style="color:var(--orange);margin-top:6px">🔥 ${autres} autre${autres > 1 ? 's' : ''} cliente${autres > 1 ? 's ont' : ' a'} déjà demandé ce modèle sur ces dates : versez l'avance vite !</div>` : ''}`;
}
async function envoyerLocation(btn) {
  btn.disabled = true;
  try {
    const l = await api('/locations', { method: 'POST', body: { article_id: LOC.a.id, date_debut: $('loc-debut').value, date_fin: $('loc-fin').value } });
    fermer();
    toast(`✔ Demande envoyée ! Versez l'avance de ${dt(l.avance_due)} avant ${dateHeure(l.expire_le)}.`);
    ACT = 'locations';
    aller('activites');
  } catch (e) { $('loc-err').textContent = e.message; btn.disabled = false; }
}

// ----- Mes activités -----
let ACT = 'reservations';
RENDU.activites = async () => {
  const [resas, cmds, locs, achats] = await Promise.all([api('/reservations'), api('/commandes'), api('/locations'), api('/achats')]);
  const onglet = (id, t, n) => `<button class="${ACT === id ? 'actif' : ''}" onclick="ACT='${id}';recharger()">${t} (${n})</button>`;
  let liste;
  if (ACT === 'reservations') liste = resas.map(ligneResa).join('') || vide('📅', 'Aucun rendez-vous.');
  if (ACT === 'commandes') liste = cmds.map(ligneCommande).join('') || vide('🛍️', 'Aucune commande.');
  if (ACT === 'locations') liste = locs.map(ligneLocation).join('') || vide('👗', 'Aucune location.');
  if (ACT === 'achats') liste = achats.map(ligneAchat).join('') || vide('👰', 'Aucun achat de robe ou d’accessoire.');
  $('page').innerHTML = `<div class="filtres">${onglet('reservations', '📅 Rendez-vous', resas.length)}${onglet('commandes', '🛍️ Commandes', cmds.length)}${onglet('locations', '👗 Locations', locs.length)}${onglet('achats', '👰 Robes achetées', achats.length)}</div>
    <div class="carte">${liste}</div>`;
};
function ligneAchat(h) {
  const admin = moi.role === 'admin';
  let actions = '';
  if (h.statut === 'demandee') {
    if (admin) actions = `<button class="btn btn-ok btn-sm" onclick="statut('achats',${h.id},'confirmee','Confirmer la vente ? L’article sera retiré du catalogue.')">Confirmer la vente</button>`;
    actions += `<button class="btn btn-danger btn-sm" onclick="statut('achats',${h.id},'annulee','Annuler cet achat ? L’article reviendra dans le catalogue.')">Annuler</button>`;
  }
  return `<div class="ligne"><div class="date-bloc" style="overflow:hidden;padding:0;height:56px;display:grid;place-items:center">${h.image_id ? `<img src="${imgUrl(h.image_id)}" alt="" style="width:100%;height:100%;object-fit:cover">` : icone(h.categorie)}</div>
    <div class="infos"><b>${esc(h.article)}</b>${admin ? ` · ${esc(h.client)} · <a href="tel:${esc(h.telephone)}">${esc(h.telephone)}</a>` : ''}<br>
      <span class="small muted">${dateHeure(h.created_at)} · <b>${dt(h.prix)}</b>${h.taille ? ' · taille ' + esc(h.taille) : ''}</span></div>
    ${badge('achat', h.statut)}<div class="actions">${actions}</div></div>`;
}
function ligneCommande(c) {
  const admin = moi.role === 'admin';
  let actions = '';
  if (admin && c.statut === 'en_attente') actions = `<button class="btn btn-ok btn-sm" onclick="statut('commandes',${c.id},'prete')">Prête</button>`;
  if (admin && c.statut === 'prete') actions = `<button class="btn btn-ok btn-sm" onclick="statut('commandes',${c.id},'livree')">Récupérée & payée</button>`;
  if (['en_attente', 'prete'].includes(c.statut) && (admin || c.statut === 'en_attente'))
    actions += `<button class="btn btn-danger btn-sm" onclick="statut('commandes',${c.id},'annulee','Annuler cette commande ?')">Annuler</button>`;
  return `<div class="ligne"><div class="date-bloc"><b>🛍️</b><span>n° ${c.id}</span></div>
    <div class="infos">${admin ? `<b>${esc(c.client)}</b> · <a href="tel:${esc(c.telephone)}">${esc(c.telephone)}</a><br>` : ''}
      ${c.lignes.map(l => `${l.quantite} × ${esc(l.nom)}`).join(', ')}<br>
      <span class="small muted">${dateHeure(c.created_at)} · <b>${dt(c.total)}</b></span></div>
    ${badge('commande', c.statut)}<div class="actions">${actions}</div></div>`;
}
// Temps restant avant la fin du délai pour l'avance
const resteAvant = d => {
  const m = Math.max(0, Math.round((new Date(d) - Date.now()) / 60000));
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')}` : `${m} min`;
};
const lienWhatsapp = (tel, texte) => {
  let n = String(tel || '').replace(/\D/g, '');
  if (n.length === 8) n = '216' + n;
  return `https://wa.me/${n}?text=${encodeURIComponent(texte)}`;
};
function ligneLocation(l) {
  const admin = moi.role === 'admin';
  let actions = '';
  if (admin && l.statut === 'demandee') {
    const msg = `Bonjour ${l.client}, c'est El Ghanja 🌸 Votre demande de location « ${l.article} » (du ${dateCourte(l.date_debut)} au ${dateCourte(l.date_fin)}) attend une avance de ${l.avance_due} DT avant ${dateHeure(l.expire_le)}. Passez au centre pour la réserver !`;
    actions = `<button class="btn btn-ok btn-sm" onclick="recevoirAvance(${l.id})">💰 Avance reçue</button>
      <button class="btn btn-sm" onclick="rappelerAvance(${l.id})">⏰ Rappeler</button>
      <a class="btn btn-sm" href="tel:${esc(l.telephone)}" title="Appeler">📞</a>
      <a class="btn btn-sm" href="${lienWhatsapp(l.telephone, msg)}" target="_blank" rel="noopener" title="WhatsApp">💬</a>`;
  }
  if (admin && l.statut === 'confirmee') actions = `<button class="btn btn-ok btn-sm" onclick="statut('locations',${l.id},'en_cours')">Remise à la cliente</button>`;
  if (admin && l.statut === 'en_cours') actions = `<button class="btn btn-ok btn-sm" onclick="statut('locations',${l.id},'retournee')">Retournée</button>`;
  if (['demandee', 'confirmee'].includes(l.statut))
    actions += `<button class="btn btn-danger btn-sm" onclick="statut('locations',${l.id},'annulee','Annuler cette location ?')">Annuler</button>`;
  let suivi = '';
  if (l.statut === 'demandee') suivi = `<div class="small" style="color:var(--orange)">⏳ Avance de <b>${dt(l.avance_due)}</b> à verser avant ${dateHeure(l.expire_le)} (reste ${resteAvant(l.expire_le)})${l.rappel_le && admin ? ' · rappel envoyé' : ''}</div>
    ${l.concurrentes ? `<div class="small" style="color:var(--rouge)">🔥 ${l.concurrentes} autre${l.concurrentes > 1 ? 's' : ''} demande${l.concurrentes > 1 ? 's' : ''} sur ces dates : la première avance l'emporte</div>` : ''}`;
  else if (['confirmee', 'en_cours', 'retournee'].includes(l.statut) && l.avance > 0) suivi = `<div class="small muted">💰 Avance versée : ${dt(l.avance)}</div>`;
  else if (l.statut === 'annulee' && l.motif_annulation) suivi = `<div class="small muted">${esc(l.motif_annulation)}</div>`;
  return `<div class="ligne"><div class="date-bloc"><b>${new Date(l.date_debut + 'T00:00:00').getDate()}</b><span>${new Date(l.date_debut + 'T00:00:00').toLocaleDateString('fr-FR', { month: 'short' })}</span></div>
    <div class="infos"><b>${esc(l.article)}</b>${admin ? ` · ${esc(l.client)} · <a href="tel:${esc(l.telephone)}">${esc(l.telephone)}</a>` : ''}<br>
      <span class="small muted">Du ${dateCourte(l.date_debut)} au ${dateCourte(l.date_fin)} (${l.jours} j) · <b>${dt(l.total)}</b> · caution ${dt(l.caution)}</span>${suivi}</div>
    ${badge('location', l.statut)}<div class="actions">${actions}</div></div>`;
}
// Administration : avance versée au centre → la location est réservée, les autres demandes sur ces dates sont annulées
let LOCS = [];
function recevoirAvance(id) {
  const l = LOCS.find(x => x.id === id);
  ouvrir('💰 Avance reçue', `<p><b>${esc(l.client)}</b> · ${esc(l.article)}<br><span class="muted small">Du ${dateCourte(l.date_debut)} au ${dateCourte(l.date_fin)} · total ${dt(l.total)}</span></p>
    <label for="av-montant">Montant de l'avance reçue (DT)</label><input id="av-montant" type="number" min="0" step="any" value="${l.avance_due}">
    ${l.concurrentes ? `<p class="small" style="color:var(--rouge)">Les ${l.concurrentes} autre${l.concurrentes > 1 ? 's' : ''} demande${l.concurrentes > 1 ? 's' : ''} sur ces dates seront annulée${l.concurrentes > 1 ? 's' : ''} et les clientes prévenues.</p>` : ''}
    <p class="error" id="av-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button><button class="btn btn-primary" onclick="validerAvance(this, ${id})">Confirmer la réservation</button></div>`);
}
async function validerAvance(btn, id) {
  btn.disabled = true;
  try {
    const r = await api('/locations/' + id, { method: 'PATCH', body: { statut: 'confirmee', avance: $('av-montant').value } });
    fermer();
    toast(`✔ Location réservée${r.demandesAnnulees ? ` · ${r.demandesAnnulees} autre(s) demande(s) annulée(s)` : ''}.`);
    await chargerAttente(); dessinerMenu(); recharger();
  } catch (e) { $('av-err').textContent = e.message; btn.disabled = false; }
}
async function rappelerAvance(id) {
  await essayer(async () => {
    await api(`/locations/${id}/rappel`, { method: 'POST' });
    toast('⏰ Rappel envoyé à la cliente (notification).');
    recharger();
  });
}
async function statut(type, id, s, question) {
  if (question && !confirm(question)) return;
  await essayer(async () => {
    await api(`/${type}/${id}`, { method: 'PATCH', body: { statut: s } });
    toast('✔ Enregistré.');
    if (moi.role === 'admin') { await chargerAttente(); dessinerMenu(); }
    recharger();
  });
}

// ----- Notifications -----
RENDU.notifications = async () => {
  await chargerNotifs();
  $('page').innerHTML = cartePush() + (NOTIFS.length
    ? NOTIFS.map(n => `<div class="notif ${n.lue ? '' : 'nouvelle'}"><b>${esc(n.titre)}</b>${esc(n.message)}<div class="small muted">${dateHeure(n.created_at)}</div></div>`).join('')
    : vide('🔔', 'Aucune notification.'));
  if (NOTIFS.some(n => !n.lue)) {
    await api('/notifications/lues', { method: 'POST' });
    $('nb-notifs').classList.add('hidden');
  }
};

// ----- Profil -----
RENDU.profil = async () => {
  $('page').innerHTML = `
    ${cartePush()}
    <div class="carte">
      <h3>Mes informations</h3>
      <p class="muted small">${moi.role === 'cliente' ? `Téléphone (identifiant) : <b>${esc(moi.telephone || '')}</b>` : `Identifiant : <b>${esc(moi.email || '')}</b>`}</p>
      <label for="p-nom">Nom</label><input id="p-nom" value="${esc(moi.nom)}">
      <label for="p-email">Email <span class="muted small">(pour recevoir les promotions)</span></label>
      <input id="p-email" type="email" value="${esc(moi.email || '')}">
      <button class="btn btn-primary" style="margin-top:12px" onclick="sauverProfil()">Enregistrer</button>
    </div>
    <div class="carte">
      <h3>Changer le mot de passe</h3>
      <div class="grid2"><div><label for="p-ancien">Ancien</label><input id="p-ancien" type="password"></div>
        <div><label for="p-nouveau">Nouveau</label><input id="p-nouveau" type="password" minlength="4"></div></div>
      <button class="btn" style="margin-top:12px" onclick="changerMdp()">Changer</button>
    </div>
    <button class="btn btn-danger btn-block" onclick="deconnexion()">🚪 Déconnexion</button>
    ${pied()}`;
};
async function sauverProfil() {
  await essayer(async () => {
    await api('/moi', { method: 'PUT', body: { nom: $('p-nom').value, email: $('p-email').value } });
    await rafraichirMoi();
    toast('✔ Informations enregistrées.');
  });
}
async function changerMdp() {
  await essayer(async () => {
    await api('/moi', { method: 'PUT', body: { ancien: $('p-ancien').value, nouveau: $('p-nouveau').value } });
    $('p-ancien').value = $('p-nouveau').value = '';
    toast('✔ Mot de passe changé.');
  });
}

// ================= RÉALISATIONS (galerie, clientes et administration) =================
let REALS = [];
let filtreGalerie = 'Tous';
let NOUVELLES_PHOTOS = [];   // administration : photos envoyées, pas encore publiées
const CATS_GALERIE = ['Maquillage mariée', 'Maquillage soirée', 'Fiançailles / outia', 'Coiffure', 'Ongles', 'Robes & tenues'];

const vignette = r => `<button class="vignette" onclick="voirPhoto(${r.id})" aria-label="${esc(r.titre || r.categorie)}">
  <img src="${imgUrl(r.image_id)}" alt="" loading="lazy"><span>${esc(r.titre || r.categorie)}</span></button>`;

async function voirPhoto(id) {
  if (!REALS.some(r => r.id === id)) REALS = await api('/realisations');
  const r = REALS.find(x => x.id === id);
  if (!r) return;
  ouvrir(esc(r.titre || r.categorie), `<img src="${imgUrl(r.image_id)}" alt="" style="width:100%;border-radius:14px;display:block">
    <p class="muted small">${esc(r.categorie)} · ${dateHeure(r.created_at)}</p>
    ${moi.role === 'admin'
      ? `<div class="pied"><button class="btn btn-danger" onclick="supprimerPhoto(${r.id})">Supprimer la photo</button></div>`
      : `<div class="pied"><button class="btn btn-primary btn-block" onclick="fermer();aller('reserver')">💄 Je veux le même : réserver</button></div>`}`);
}

RENDU.galerie = async () => {
  REALS = await api('/realisations');
  NOUVELLES_PHOTOS = [];
  dessinerGalerie();
};
function dessinerGalerie() {
  const admin = moi.role === 'admin';
  const cats = ['Tous', ...new Set(REALS.map(r => r.categorie))];
  if (!cats.includes(filtreGalerie)) filtreGalerie = 'Tous';
  const liste = REALS.filter(r => filtreGalerie === 'Tous' || r.categorie === filtreGalerie);
  $('page').innerHTML = `
    ${admin ? `<div class="carte">
      <h3>📸 Ajouter des photos de votre travail</h3>
      <p class="small muted">Choisissez une ou plusieurs photos (maquillage, coiffure, robes…). Elles apparaissent tout de suite chez les clientes.</p>
      <div class="grid2">
        <div><label for="g-cat">Catégorie</label><input id="g-cat" list="g-cats" value="${esc(CATS_GALERIE[0])}">
          <datalist id="g-cats">${[...new Set([...CATS_GALERIE, ...REALS.map(r => r.categorie)])].map(c => `<option value="${esc(c)}">`).join('')}</datalist></div>
        <div><label for="g-titre">Titre <span class="muted small">(facultatif)</span></label><input id="g-titre" placeholder="Ex. : Mariée de juillet"></div>
      </div>
      <label for="g-photos">Photos</label>
      <input type="file" id="g-photos" accept="image/jpeg,image/png,image/webp" multiple onchange="envoyerPhotos(this)">
      <div class="galerie" id="g-apercu" style="margin-top:10px"></div>
      <p class="error" id="g-err"></p>
      <button class="btn btn-primary" id="g-publier" disabled onclick="publierPhotos(this)">Publier</button>
    </div>` : '<p class="muted">Le travail de Safa : maquillages, coiffures et tenues de nos clientes 💖</p>'}
    ${REALS.length ? `<div class="filtres">${cats.map((c, i) => `<button class="${c === filtreGalerie ? 'actif' : ''}" onclick="filtreGalerie=${i ? `'${esc(c)}'` : `'Tous'`};dessinerGalerie()">${esc(c)}</button>`).join('')}</div>` : ''}
    <div class="galerie">${liste.map(vignette).join('')}</div>
    ${liste.length ? '' : vide('📸', admin ? 'Aucune photo pour le moment : ajoutez votre première réalisation !' : 'Les photos arrivent bientôt.')}`;
  // Photos envoyées mais pas encore publiées (changement de filtre) : on les garde
  if (admin && NOUVELLES_PHOTOS.length) {
    $('g-apercu').innerHTML = NOUVELLES_PHOTOS.map(id => `<div class="vignette"><img src="${imgUrl(id)}" alt=""></div>`).join('');
    $('g-publier').disabled = false;
    $('g-publier').textContent = `Publier ${NOUVELLES_PHOTOS.length} photo${NOUVELLES_PHOTOS.length > 1 ? 's' : ''}`;
  }
}
async function envoyerPhotos(input) {
  $('g-err').textContent = '';
  $('g-publier').disabled = true;
  for (const f of input.files) {
    if (f.size > 5 * 1024 * 1024) { $('g-err').textContent = `« ${f.name} » est trop lourde (5 Mo maximum).`; continue; }
    const fd = new FormData();
    fd.append('fichier', f);
    try {
      const { id } = await api('/fichiers', { method: 'POST', body: fd });
      NOUVELLES_PHOTOS.push(id);
      $('g-apercu').insertAdjacentHTML('beforeend', `<div class="vignette"><img src="${imgUrl(id)}" alt=""></div>`);
    } catch (e) { $('g-err').textContent = e.message; }
  }
  input.value = '';
  $('g-publier').disabled = !NOUVELLES_PHOTOS.length;
  $('g-publier').textContent = `Publier ${NOUVELLES_PHOTOS.length} photo${NOUVELLES_PHOTOS.length > 1 ? 's' : ''}`;
}
async function publierPhotos(btn) {
  btn.disabled = true;
  try {
    await api('/realisations', { method: 'POST', body: { categorie: $('g-cat').value, titre: $('g-titre').value, image_ids: NOUVELLES_PHOTOS } });
    toast('✔ Photos publiées : les clientes les voient déjà.');
    recharger();
  } catch (e) { $('g-err').textContent = e.message; btn.disabled = false; }
}
async function supprimerPhoto(id) {
  if (!confirm('Supprimer cette photo ?')) return;
  await essayer(async () => { await api('/realisations/' + id, { method: 'DELETE' }); fermer(); recharger(); });
}

// ================= ESPACE ÉQUIPE : MON PLANNING =================
const PL = { date: null };
RENDU.planning = async () => {
  if (!PL.date) PL.date = CAT.aujourdhui;
  const [jour, avenir] = await Promise.all([api('/reservations?date=' + PL.date), api('/reservations')]);
  const prochains = avenir.filter(r => r.date > PL.date && ['en_attente', 'confirmee'].includes(r.statut)).slice(0, 10);
  const actifs = jour.filter(r => r.statut !== 'annulee');
  $('page').innerHTML = `
    <h1>Bonjour ${esc(prenom(moi.nom))} 🌸</h1>
    <p class="muted">Vos spécialités : ${(moi.specialites || []).map(esc).join(' · ') || '—'}</p>
    ${cartePush()}
    <div class="row" style="margin-bottom:12px">
      <button class="btn btn-sm" onclick="PL.date=ajouterJours(PL.date,-1);recharger()">‹</button>
      <input type="date" style="max-width:200px" value="${PL.date}" onchange="PL.date=this.value;recharger()">
      <button class="btn btn-sm" onclick="PL.date=ajouterJours(PL.date,1);recharger()">›</button>
      <button class="btn btn-ghost btn-sm" onclick="PL.date=CAT.aujourdhui;recharger()">Aujourd'hui</button>
    </div>
    <div class="carte"><div class="row between"><h3 style="margin:0">${dateLongue(PL.date)}</h3>
        <span class="etiquette">${actifs.length} rendez-vous</span></div>
      ${jour.map(lignePlanning).join('') || vide('☕', 'Aucun rendez-vous ce jour-là.')}</div>
    <div class="carte"><h3>Prochains rendez-vous</h3>${prochains.map(lignePlanning).join('') || vide('📅', 'Rien de prévu après ce jour.')}</div>`;
};
function lignePlanning(r) {
  let actions = '';
  if (r.statut === 'en_attente') actions = `<button class="btn btn-ok btn-sm" onclick="statut('reservations',${r.id},'confirmee')">Confirmer</button>`;
  if (r.statut === 'confirmee') actions = `<button class="btn btn-ok btn-sm" onclick="statut('reservations',${r.id},'terminee')">✔ Terminé</button>`;
  return `<div class="ligne">
    <div class="date-bloc"><b style="font-size:1rem">${r.heure}</b><span>${dateCourte(r.date)}</span></div>
    <div class="infos"><b>${esc(r.service)}</b> · ${r.duree} min<br>
      <span class="small">${esc(r.client)} · <a href="tel:${esc(r.telephone)}">${esc(r.telephone)}</a></span>
      ${r.note ? `<div class="small muted">📝 ${esc(r.note)}</div>` : ''}</div>
    ${badge('reservation', r.statut)}<div class="actions">${actions}</div></div>`;
}

// ----- Équipe (administration) : comptes des employées, spécialités, photo -----
let MEMBRES = [];
const SPECIALITES = () => [...new Set(CAT.services.map(x => x.categorie))];
RENDU.equipe = async () => {
  [MEMBRES, CAT] = await Promise.all([api('/equipe/gestion'), api('/catalogue')]);
  $('page').innerHTML = `
    <div class="row between" style="margin-bottom:12px">
      <p class="muted" style="margin:0">Chaque membre se connecte avec son email et son mot de passe et voit son planning. Les clientes choisissent avec qui réserver selon les spécialités.</p>
      <button class="btn btn-primary" onclick="editerMembre()">+ Ajouter un membre</button></div>
    <div class="grille">${MEMBRES.map(m => `<div class="item" style="${m.actif && (m.role === 'employe' || m.equipe) ? '' : 'opacity:.55'}">
      <div class="corps" style="align-items:center;text-align:center;padding-top:20px">
        ${avatar(m, 84)}
        <h3>${esc(m.nom)}${m.role === 'admin' ? ' <span class="etiquette nude">Vous</span>' : ''}</h3>
        <div class="row" style="justify-content:center;gap:4px">${m.specialites.map(x => `<span class="etiquette">${icone(x)} ${esc(x)}</span>`).join('') || '<span class="small muted">Aucune spécialité</span>'}</div>
        <span class="small muted">${esc(m.email || '')}${m.telephone ? ' · ' + esc(m.telephone) : ''}</span>
        <span class="small">${m.role === 'admin' && !m.equipe ? 'Ne prend pas de rendez-vous' : !m.actif ? '⛔ Compte désactivé' : `📅 ${m.a_venir} rendez-vous à venir`}</span>
        <div class="bas" style="justify-content:center"><button class="btn btn-sm" onclick="editerMembre(${m.id})">✏️ Modifier</button></div>
      </div></div>`).join('')}</div>`;
};
function editerMembre(id) {
  const m = MEMBRES.find(x => x.id === id) || { specialites: [], actif: true, role: 'employe', equipe: true };
  IMAGE_ID = m.photo_id || null;
  const moiMeme = m.role === 'admin';
  ouvrir(id ? `Modifier : ${esc(m.nom)}` : 'Nouveau membre de l’équipe', `
    <label for="m-nom">Nom</label><input id="m-nom" value="${esc(m.nom || '')}">
    <div class="grid2">
      <div><label for="m-email">Email (pour se connecter)</label><input id="m-email" type="email" value="${esc(m.email || '')}" autocomplete="off"></div>
      <div><label for="m-tel">Téléphone</label><input id="m-tel" value="${esc(m.telephone || '')}"></div>
    </div>
    <label for="m-mdp">${id ? 'Nouveau mot de passe <span class="muted small">(vide = inchangé)</span>' : 'Mot de passe'}</label>
    <input id="m-mdp" type="text" autocomplete="new-password" placeholder="${id ? '••••' : 'Ex. : ghanja2026'}">
    <label>Spécialités <span class="muted small">(les soins qu'elle fait)</span></label>
    <div class="row">${SPECIALITES().map(x => `<label class="row" style="font-weight:400;margin:0"><input type="checkbox" class="m-spec" value="${esc(x)}" ${m.specialites.includes(x) ? 'checked' : ''}> ${icone(x)} ${esc(x)}</label>`).join('')}</div>
    <label for="e-image">Photo</label>
    <input type="file" id="e-image" accept="image/jpeg,image/png,image/webp" onchange="envoyerImage(this)">
    <img id="e-apercu" class="apercu-image ${IMAGE_ID ? '' : 'hidden'}" src="${IMAGE_ID ? imgUrl(IMAGE_ID) : ''}" alt="" style="object-fit:contain">
    ${moiMeme
      ? `<label class="row" style="font-weight:400"><input type="checkbox" id="m-equipe" ${m.equipe ? 'checked' : ''}> Je prends aussi des rendez-vous (je fais partie de l'équipe)</label>`
      : `<label class="row" style="font-weight:400"><input type="checkbox" id="m-actif" ${m.actif ? 'checked' : ''}> Compte actif (décocher : elle ne peut plus se connecter ni recevoir de rendez-vous)</label>`}
    <p class="error" id="e-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button>
      <button class="btn btn-primary" onclick="sauverMembre(this, ${id || 'null'})">Enregistrer</button></div>`);
}
async function sauverMembre(btn, id) {
  const body = {
    nom: $('m-nom').value, email: $('m-email').value, telephone: $('m-tel').value, password: $('m-mdp').value,
    specialites: [...document.querySelectorAll('.m-spec:checked')].map(c => c.value), photo_id: IMAGE_ID || null,
    equipe: $('m-equipe') ? $('m-equipe').checked : true, actif: $('m-actif') ? $('m-actif').checked : true
  };
  btn.disabled = true;
  try {
    await api('/equipe' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body });
    fermer();
    toast(id ? '✔ Enregistré.' : `✔ Compte créé : donnez-lui son email (${body.email}) et son mot de passe.`);
    if (id === moi.id) await rafraichirMoi();
    recharger();
  } catch (e) { $('e-err').textContent = e.message; btn.disabled = false; }
}

// ================= ADMINISTRATION =================
RENDU.tableau = async () => {
  const s = await chargerAttente();
  dessinerMenu();
  const ca = s.ca_soins + s.ca_boutique + s.ca_location + s.ca_ventes_robes;
  $('page').innerHTML = `
    <h1>Bonjour Safa 🌸</h1>
    <p class="muted">${dateLongue(CAT.aujourdhui)}</p>
    ${cartePush()}
    <div class="stats">
      <a class="stat" href="#/agenda"><div class="val">${s.rdv_jour}</div><div class="lib">Rendez-vous aujourd'hui</div></a>
      <a class="stat ${s.rdv_attente ? 'alerte' : ''}" href="#/agenda"><div class="val">${s.rdv_attente}</div><div class="lib">Rendez-vous à confirmer</div></a>
      <a class="stat ${s.cmd_attente ? 'alerte' : ''}" href="#/commandes"><div class="val">${s.cmd_attente}</div><div class="lib">Commandes à préparer</div></a>
      <a class="stat ${s.loc_attente ? 'alerte' : ''}" href="#/locations"><div class="val">${s.loc_attente}</div><div class="lib">Locations à confirmer</div></a>
      <a class="stat ${s.achat_attente ? 'alerte' : ''}" href="#/locations" onclick="FILTRE_LOC='ventes'"><div class="val">${s.achat_attente}</div><div class="lib">Robes / accessoires vendus à confirmer</div></a>
      <a class="stat" href="#/locations"><div class="val">${s.loc_en_cours}</div><div class="lib">Articles chez les clientes</div></a>
      <a class="stat" href="#/clientes"><div class="val">${s.clientes}</div><div class="lib">Clientes</div></a>
      ${s.stock_bas ? `<a class="stat alerte" href="#/catalogue"><div class="val">${s.stock_bas}</div><div class="lib">Produits bientôt épuisés</div></a>` : ''}
    </div>
    <div class="grid2" style="gap:16px">
      <div class="carte"><h3>Chiffre d'affaires du mois</h3>
        <div class="stat nude" style="box-shadow:none;margin:8px 0"><div class="val">${dt(ca)}</div><div class="lib">Total</div></div>
        <div class="recap"><div class="ligne-prix"><span>💄 Soins</span><b>${dt(s.ca_soins)}</b></div>
          <div class="ligne-prix"><span>🛍️ Boutique</span><b>${dt(s.ca_boutique)}</b></div>
          <div class="ligne-prix"><span>👗 Location</span><b>${dt(s.ca_location)}</b></div>
          <div class="ligne-prix"><span>👰 Vente robes & accessoires</span><b>${dt(s.ca_ventes_robes)}</b></div></div></div>
      <div class="carte"><h3>Soins les plus demandés <span class="small muted">(3 mois)</span></h3>
        ${s.top.length ? s.top.map((t, i) => `<div class="ligne-prix row between" style="padding:6px 0"><span>${i + 1}. ${esc(t.nom)}</span><span class="etiquette">${t.n}</span></div>`).join('') : vide('📊', 'Pas encore de données.')}</div>
    </div>`;
};

// ----- Rendez-vous -----
let AG = { date: null, vue: 'jour', membre: null };
RENDU.agenda = async () => {
  if (!AG.date) AG.date = CAT.aujourdhui;
  EQUIPE = await api('/equipe');
  const toutes = AG.vue === 'attente';
  let resas = toutes
    ? (await api('/reservations')).filter(r => r.statut === 'en_attente').sort((a, b) => (a.date + a.heure).localeCompare(b.date + b.heure))
    : (await api('/reservations?date=' + AG.date)).sort((a, b) => a.heure.localeCompare(b.heure));
  const parMembre = id => resas.filter(r => r.employe_id === id && r.statut !== 'annulee').length;
  const filtreMembres = EQUIPE.length ? `<div class="filtres"><button class="${AG.membre ? '' : 'actif'}" onclick="AG.membre=null;recharger()">Toute l'équipe</button>${EQUIPE.map(m => `<button class="${AG.membre === m.id ? 'actif' : ''}" onclick="AG.membre=${m.id};recharger()">${esc(prenom(m.nom))} (${parMembre(m.id)})</button>`).join('')}</div>` : '';
  if (AG.membre) resas = resas.filter(r => r.employe_id === AG.membre);
  $('page').innerHTML = `
    <div class="row between" style="margin-bottom:12px">
      <div class="filtres" style="margin:0"><button class="${!toutes ? 'actif' : ''}" onclick="AG.vue='jour';recharger()">📅 Par jour</button>
        <button class="${toutes ? 'actif' : ''}" onclick="AG.vue='attente';recharger()">⏳ À confirmer (${attente.agenda || 0})</button></div>
      <button class="btn btn-primary" onclick="nouveauRdv()">+ Rendez-vous</button>
    </div>
    ${toutes ? '' : `<div class="row" style="margin-bottom:12px">
      <button class="btn btn-sm" onclick="AG.date=ajouterJours(AG.date,-1);recharger()">‹</button>
      <input type="date" style="max-width:200px" value="${AG.date}" onchange="AG.date=this.value;recharger()">
      <button class="btn btn-sm" onclick="AG.date=ajouterJours(AG.date,1);recharger()">›</button>
      <button class="btn btn-ghost btn-sm" onclick="AG.date=CAT.aujourdhui;recharger()">Aujourd'hui</button>
      <span class="muted">${dateLongue(AG.date)}</span></div>`}
    ${filtreMembres}
    <div class="carte">${resas.map(ligneResaAdmin).join('') || vide('📅', toutes ? 'Aucun rendez-vous à confirmer.' : 'Aucun rendez-vous ce jour-là.')}</div>`;
};
function ligneResaAdmin(r) {
  let actions = '';
  if (r.statut === 'en_attente') actions = `<button class="btn btn-ok btn-sm" onclick="statut('reservations',${r.id},'confirmee')">Confirmer</button>`;
  if (r.statut === 'confirmee') actions = `<button class="btn btn-ok btn-sm" onclick="statut('reservations',${r.id},'terminee')">✔ Terminé</button>`;
  if (['en_attente', 'confirmee'].includes(r.statut))
    actions += `<button class="btn btn-danger btn-sm" onclick="statut('reservations',${r.id},'annulee','Annuler ce rendez-vous ? La cliente sera prévenue.')">Annuler</button>`;
  return `<div class="ligne">
    <div class="date-bloc"><b style="font-size:1rem">${r.heure}</b><span>${dateCourte(r.date)}</span></div>
    <div class="infos"><b>${esc(r.client)}</b> · <a href="tel:${esc(r.telephone)}">${esc(r.telephone)}</a><br>
      ${esc(r.service)} <span class="small muted">· ${r.duree} min · ${r.remise_pct ? `<s>${dt(r.prix)}</s> ` : ''}<b>${dt(r.prix_final)}</b></span>
      <div class="small">👩‍🎨 ${r.employe ? 'Avec ' + esc(prenom(r.employe)) : '<span class="muted">Personne attribuée</span>'}</div>
      ${r.cadeau ? '<span class="etiquette nude">🎁 Cadeau fidélité</span>' : ''}
      ${r.note ? `<div class="small muted">📝 ${esc(r.note)}</div>` : ''}</div>
    ${badge('reservation', r.statut)}<div class="actions">${actions}</div></div>`;
}

let CLIENTES = [];
async function nouveauRdv(clientId) {
  CLIENTES = await essayer(() => api('/clientes'));
  if (!CLIENTES) return;
  EQUIPE = await api('/equipe');
  RDV = { date: AG.date || CAT.aujourdhui, heure: null };
  ouvrir('Nouveau rendez-vous', `
    <label for="n-client">Cliente</label>
    <select id="n-client">${CLIENTES.map(c => `<option value="${c.id}" ${c.id === clientId ? 'selected' : ''}>${esc(c.nom)} — ${esc(c.telephone)}${c.cadeauDisponible ? ' 🎁' : ''}</option>`).join('')}</select>
    <p class="small muted">Nouvelle cliente ? <a href="#" onclick="nouvelleCliente(); return false">Ajoutez-la d'abord</a>.</p>
    <label for="n-service">Soin</label>
    <select id="n-service" onchange="membresRdv();creneauxRdv()">${CAT.services.map(s => `<option value="${s.id}">${esc(s.nom)} (${s.duree} min, ${dt(s.prix)})</option>`).join('')}</select>
    <label for="n-employe">Avec qui ?</label><select id="n-employe" onchange="creneauxRdv()"></select>
    <label for="n-date">Date</label>
    <input type="date" id="n-date" value="${RDV.date}" min="${CAT.aujourdhui}" onchange="creneauxRdv()">
    <div id="n-creneaux"></div>
    <p class="error" id="n-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button>
      <button class="btn btn-primary" id="n-ok" disabled onclick="enregistrerRdv(this)">Enregistrer</button></div>`);
  membresRdv();
  creneauxRdv();
}
function membresRdv() {
  const s = CAT.services.find(x => x.id === Number($('n-service').value));
  $('n-employe').innerHTML = '<option value="">Peu importe (la première disponible)</option>'
    + membresDuSoin(s).map(m => `<option value="${m.id}">${esc(prenom(m.nom))} — ${m.specialites.map(esc).join(', ')}</option>`).join('');
}
let RDV = {};
async function creneauxRdv() {
  RDV.heure = null;
  $('n-ok').disabled = true;
  const liste = await essayer(() => api(`/creneaux?service_id=${$('n-service').value}&date=${$('n-date').value}${$('n-employe').value ? '&employe_id=' + $('n-employe').value : ''}`));
  if (!liste) return;
  $('n-creneaux').innerHTML = liste.length
    ? `<div class="creneaux">${liste.map(c => `<button ${c.places < 1 ? 'disabled' : ''} onclick="choisirHeureRdv(this,'${c.heure}')">${c.heure}<small>${c.places < 1 ? 'complet' : c.places + ' pl.'}</small></button>`).join('')}</div>`
    : '<p class="muted">Aucun créneau (jour fermé ou passé).</p>';
}
function choisirHeureRdv(btn, h) {
  RDV.heure = h;
  document.querySelectorAll('#n-creneaux button').forEach(b => b.classList.toggle('choisi', b === btn));
  $('n-ok').disabled = false;
}
async function enregistrerRdv(btn) {
  btn.disabled = true;
  try {
    const r = await api('/reservations', { method: 'POST', body: {
      client_id: $('n-client').value, service_id: $('n-service').value, date: $('n-date').value, heure: RDV.heure, employe_id: $('n-employe').value || null } });
    fermer();
    toast(r.cadeau ? `🎁 Rendez-vous enregistré avec le cadeau fidélité (${dt(r.prix_final)})` : '✔ Rendez-vous enregistré et confirmé.');
    AG = { date: r.date, vue: 'jour' };
    if (pageActuelle === 'agenda') recharger(); else aller('agenda');
  } catch (e) { $('n-err').textContent = e.message; btn.disabled = false; }
}

// ----- Commandes & locations -----
let FILTRE_CMD = 'actives';
RENDU.commandes = async () => {
  const cmds = await api('/commandes');
  const liste = FILTRE_CMD === 'actives' ? cmds.filter(c => ['en_attente', 'prete'].includes(c.statut)) : cmds;
  $('page').innerHTML = `<div class="filtres"><button class="${FILTRE_CMD === 'actives' ? 'actif' : ''}" onclick="FILTRE_CMD='actives';recharger()">À traiter</button>
    <button class="${FILTRE_CMD === 'toutes' ? 'actif' : ''}" onclick="FILTRE_CMD='toutes';recharger()">Toutes</button></div>
    <div class="carte">${liste.map(ligneCommande).join('') || vide('🛍️', 'Aucune commande.')}</div>`;
};
let FILTRE_LOC = 'demandes';
RENDU.locations = async () => {
  const [locs, achats] = await Promise.all([api('/locations'), api('/achats')]);
  LOCS = locs;
  const btn = (id, t) => `<button class="${FILTRE_LOC === id ? 'actif' : ''}" onclick="FILTRE_LOC='${id}';recharger()">${t}</button>`;
  let contenu;
  if (FILTRE_LOC === 'demandes') {
    // Une carte par modèle : toutes les clientes qui le demandent, de la plus ancienne demande à la plus récente
    const groupes = {};
    for (const l of locs.filter(x => x.statut === 'demandee').sort((a, b) => a.created_at.localeCompare(b.created_at)))
      (groupes[l.article_id] = groupes[l.article_id] || []).push(l);
    contenu = Object.values(groupes).map(g => `<div class="carte"><div class="row between"><h3 style="margin:0">${icone(g[0].categorie)} ${esc(g[0].article)}</h3>
        <span class="etiquette orange">${g.length} demande${g.length > 1 ? 's' : ''}</span></div>${g.map(ligneLocation).join('')}</div>`).join('');
  } else if (FILTRE_LOC === 'ventes') {
    contenu = achats.map(ligneAchat).join('') || vide('👰', 'Aucune vente de robe ou d’accessoire.');
  } else {
    const liste = FILTRE_LOC === 'actives' ? locs.filter(l => ['confirmee', 'en_cours'].includes(l.statut)) : locs;
    contenu = liste.map(ligneLocation).join('') || vide('👗', 'Aucune location.');
  }
  const ventes = achats.filter(h => h.statut === 'demandee').length;
  const nbDem = locs.filter(l => l.statut === 'demandee').length;
  $('page').innerHTML = `<div class="filtres">${btn('demandes', `⏳ Demandes (attente d'avance)${nbDem ? ` (${nbDem})` : ''}`)}${btn('actives', '👗 Locations en cours')}${btn('toutes', 'Toutes les locations')}
    ${btn('ventes', `🛍️ Ventes${ventes ? ` (${ventes} à confirmer)` : ''}`)}</div>
    ${FILTRE_LOC === 'demandes' ? contenu || `<div class="carte">${vide('⏳', 'Aucune demande en attente d’avance.')}</div>` : `<div class="carte">${contenu}</div>`}`;
};

// ----- Clientes -----
let RECHERCHE = '';
RENDU.clientes = async () => {
  CLIENTES = await api('/clientes');
  dessinerClientes();
};
function dessinerClientes() {
  const r = RECHERCHE.toLowerCase();
  const liste = CLIENTES.filter(c => !r || c.nom.toLowerCase().includes(r) || (c.telephone || '').replace(/\s/g, '').includes(r.replace(/\s/g, '')));
  const seuil = CAT.reglages.fidelite.seuil;
  $('page').innerHTML = `
    <div class="row" style="margin-bottom:12px">
      <input class="grow" placeholder="🔍 Rechercher (nom ou téléphone)" value="${esc(RECHERCHE)}" oninput="RECHERCHE=this.value;dessinerClientes();const i=document.querySelector('.page input');i.focus();i.setSelectionRange(i.value.length,i.value.length)">
      <button class="btn btn-primary" onclick="nouvelleCliente()">+ Cliente</button>
    </div>
    <div class="carte tableau"><table>
      <tr><th>Cliente</th><th>Téléphone</th><th>Soins</th><th>Fidélité</th><th>Dépensé</th><th></th></tr>
      ${liste.map(c => `<tr>
        <td><b>${esc(c.nom)}</b><br><span class="small muted">${esc(c.email || '')}</span></td>
        <td><a href="tel:${esc(c.telephone)}">${esc(c.telephone)}</a></td>
        <td>${c.soins}</td>
        <td>${c.cadeauDisponible ? '<span class="etiquette nude">🎁 Cadeau prêt</span>' : `${c.points} / ${seuil}`}${c.cadeaux ? `<div class="small muted">${c.cadeaux} cadeau(x) reçu(s)</div>` : ''}</td>
        <td>${dt(c.depense)}</td>
        <td><button class="btn btn-sm" onclick="nouveauRdv(${c.id})">+ RDV</button></td></tr>`).join('')}
    </table>${liste.length ? '' : vide('👥', 'Aucune cliente.')}</div>`;
}
function nouvelleCliente() {
  ouvrir('Nouvelle cliente', `
    <label for="c-nom">Nom et prénom</label><input id="c-nom">
    <label for="c-tel">Téléphone</label><input id="c-tel" inputmode="tel">
    <label for="c-email">Email <span class="muted small">(facultatif, pour les promotions)</span></label><input id="c-email" type="email">
    <p class="small muted">Son mot de passe de départ sera son numéro de téléphone (chiffres seuls).</p>
    <p class="error" id="c-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button><button class="btn btn-primary" onclick="enregistrerCliente(this)">Ajouter</button></div>`);
}
async function enregistrerCliente(btn) {
  btn.disabled = true;
  try {
    const u = await api('/clientes', { method: 'POST', body: { nom: $('c-nom').value, telephone: $('c-tel').value, email: $('c-email').value } });
    fermer();
    toast('✔ Cliente ajoutée.');
    if (pageActuelle === 'clientes') await recharger();
    if (pageActuelle === 'agenda') nouveauRdv(u.id);
  } catch (e) { $('c-err').textContent = e.message; btn.disabled = false; }
}

// ----- Promotions -----
RENDU.promotions = async () => {
  const promos = await api('/promotions');
  const j = CAT.aujourdhui;
  const etat = p => p.date_fin < j ? '<span class="etiquette gris">Terminée</span>'
    : p.date_debut > j ? '<span class="etiquette bleu">À venir</span>' : '<span class="etiquette vert">En cours</span>';
  $('page').innerHTML = `
    <div class="carte">
      <h3>🎉 Nouvelle promotion</h3>
      <p class="small muted">Elle est envoyée tout de suite à toutes les clientes : notification dans l'application + email (si elles en ont un).
        Pendant les dates choisies, les prix affichés baissent automatiquement.</p>
      <label for="pr-titre">Titre</label><input id="pr-titre" placeholder="Ex. : Spécial mariées">
      <label for="pr-message">Message aux clientes</label><textarea id="pr-message" placeholder="Ex. : -20 % sur tous les maquillages de soirée !"></textarea>
      <div class="grid2">
        <div><label for="pr-cible">S'applique à</label><select id="pr-cible">${Object.entries(CIBLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <div><label for="pr-remise">Remise (%)</label><input id="pr-remise" type="number" min="1" max="100" value="20"></div>
        <div><label for="pr-debut">Du</label><input id="pr-debut" type="date" value="${j}"></div>
        <div><label for="pr-fin">Au</label><input id="pr-fin" type="date" value="${ajouterJours(j, 7)}"></div>
      </div>
      <p class="error" id="pr-err"></p>
      <button class="btn btn-primary" onclick="envoyerPromo(this)">📣 Envoyer aux clientes</button>
    </div>
    <div class="carte"><h3>Promotions</h3>
      ${promos.map(p => `<div class="ligne"><div class="date-bloc"><b style="font-size:1rem">-${p.remise_pct}%</b></div>
        <div class="infos"><b>${esc(p.titre)}</b> · <span class="small">${CIBLES[p.cible]}</span><br>
          <span class="small muted">Du ${dateCourte(p.date_debut)} au ${dateCourte(p.date_fin)} · ${p.emails_envoyes} email(s) envoyé(s)</span>
          ${p.message ? `<div class="small muted">${esc(p.message)}</div>` : ''}</div>
        ${etat(p)}<button class="btn btn-danger btn-sm" onclick="supprimerPromo(${p.id})">Supprimer</button></div>`).join('') || vide('🎉', 'Aucune promotion.')}
    </div>`;
};
async function envoyerPromo(btn) {
  btn.disabled = true;
  try {
    const p = await api('/promotions', { method: 'POST', body: {
      titre: $('pr-titre').value, message: $('pr-message').value, cible: $('pr-cible').value,
      remise_pct: Number($('pr-remise').value), date_debut: $('pr-debut').value, date_fin: $('pr-fin').value } });
    toast(`📣 Promotion envoyée à toutes les clientes${p.emailsPrevus ? ` (+ ${p.emailsPrevus} email(s))` : ''}.`);
    CAT = await api('/catalogue');
    recharger();
  } catch (e) { $('pr-err').textContent = e.message; btn.disabled = false; }
}
async function supprimerPromo(id) {
  if (!confirm('Supprimer cette promotion ? Les prix reviennent à la normale.')) return;
  await essayer(async () => { await api('/promotions/' + id, { method: 'DELETE' }); CAT = await api('/catalogue'); recharger(); });
}

// ----- Catalogue -----
const CHAMPS = {
  services: { titre: 'Soins', ico: '💄', champs: [['nom', 'Nom'], ['categorie', 'Catégorie'], ['description', 'Description'], ['prix', 'Prix (DT)', 'number'], ['duree', 'Durée (minutes)', 'number']] },
  produits: { titre: 'Boutique', ico: '🛍️', champs: [['nom', 'Nom'], ['categorie', 'Catégorie'], ['description', 'Description'], ['prix', 'Prix (DT)', 'number'], ['stock', 'Stock', 'number']] },
  articles: { titre: 'Robes & accessoires', ico: '👗', champs: [['nom', 'Nom'], ['categorie', 'Catégorie'], ['description', 'Description'], ['taille', 'Taille'],
    ['prix_jour', 'Prix de location par jour (DT) — vide si pas en location', 'number', true], ['caution', 'Caution location (DT)', 'number'],
    ['prix_vente', 'Prix de vente (DT) — vide si pas à vendre', 'number', true]] }
};
let ONGLET_CAT = 'services';
let LISTE_CAT = [];
let CAT_ADMIN = 'Toutes';    // filtre par catégorie dans le catalogue de l'administration
let CATS_ADMIN = [];
RENDU.catalogue = async () => {
  [LISTE_CAT, CAT] = await Promise.all([api('/gestion/' + ONGLET_CAT), api('/catalogue')]);
  dessinerCatalogue();
};
const ongletsCatalogue = bouton => `<div class="row between" style="margin-bottom:12px">
  <div class="filtres" style="margin:0">${Object.entries(CHAMPS).map(([k, v]) => `<button class="${k === ONGLET_CAT ? 'actif' : ''}" onclick="ONGLET_CAT='${k}';CAT_ADMIN='Toutes';recharger()">${v.ico} ${v.titre}</button>`).join('')}</div>
  ${bouton}</div>`;

// ----- Robes & accessoires : un espace par catégorie (Robes de mariée, Bijoux…) -----
const photoCategorie = c => {
  const art = LISTE_CAT.find(a => a.categorie === c.nom && a.image_id);
  const id = c.image_id || (art && art.image_id);
  return id ? `<img src="${imgUrl(id)}" alt="" loading="lazy">` : icone(c.nom);
};
function dessinerEspaceArticles() {
  const cats = CAT.categories;
  if (CAT_ADMIN === 'Toutes' || !cats.some(c => c.nom === CAT_ADMIN)) {
    CAT_ADMIN = 'Toutes';
    $('page').innerHTML = `${ongletsCatalogue('<button class="btn btn-primary" onclick="editerCategorie()">+ Nouvelle catégorie</button>')}
      <p class="small muted">Créez vos catégories (Robes, Bijoux, Accessoires…), ouvrez-en une et ajoutez vos articles un par un, avec photo et prix.</p>
      <div class="grille">${cats.map((c, i) => {
        const arts = LISTE_CAT.filter(a => a.categorie === c.nom);
        const enLigne = arts.filter(a => a.actif && !a.vendu).length;
        return `<button class="item categorie" onclick="CAT_ADMIN=CAT.categories[${i}].nom;dessinerCatalogue();window.scrollTo(0,0)">
          <div class="photo">${photoCategorie(c)}</div>
          <div class="corps"><h3>${icone(c.nom)} ${esc(c.nom)}</h3>
            <span class="small muted">${arts.length} article${arts.length > 1 ? 's' : ''} · ${enLigne} visible${enLigne > 1 ? 's' : ''} par les clientes</span>
            <div class="bas"><span class="btn btn-primary btn-sm">Ouvrir →</span></div></div></button>`;
      }).join('')}
        <button class="item categorie nouvelle" onclick="editerCategorie()"><div class="photo">＋</div>
          <div class="corps"><h3>Nouvelle catégorie</h3><span class="small muted">Ex. : Robes de fiançailles, Sacs…</span></div></button>
      </div>`;
    return;
  }
  const c = cats.find(x => x.nom === CAT_ADMIN);
  const arts = LISTE_CAT.filter(a => a.categorie === c.nom);
  $('page').innerHTML = `${ongletsCatalogue('')}
    <div class="row between" style="margin-bottom:12px">
      <div class="row"><button class="btn btn-sm" onclick="CAT_ADMIN='Toutes';dessinerCatalogue()">← Catégories</button>
        <h2 style="margin:0">${icone(c.nom)} ${esc(c.nom)}</h2></div>
      <div class="row"><button class="btn" onclick="editerCategorie(${c.id})">✏️ Catégorie</button>
        <button class="btn btn-primary" onclick="editerCat()">+ Ajouter un article</button></div>
    </div>
    <div class="grille">${arts.map(a => `<div class="item" style="${a.actif && !a.vendu ? '' : 'opacity:.6'}">
      <div class="photo">${photo(a)}</div>
      <div class="corps">
        <div class="row" style="gap:4px">${a.vendu ? '<span class="etiquette vert">Vendue</span>' : a.actif ? '' : '<span class="etiquette gris">Masqué</span>'}
          ${a.prix_jour != null ? '<span class="etiquette bleu">À louer</span>' : ''}${a.prix_vente != null ? '<span class="etiquette nude">À vendre</span>' : ''}</div>
        <h3>${esc(a.nom)}</h3>
        <span class="small muted">${esc(a.description)}${a.taille ? ' · Taille ' + esc(a.taille) : ''}</span>
        ${a.prix_jour != null ? `<span class="small"><b class="prix">${dt(a.prix_jour)}</b> / jour · caution ${dt(a.caution)}</span>` : ''}
        ${a.prix_vente != null ? `<span class="small"><b class="prix">${dt(a.prix_vente)}</b> à l'achat</span>` : ''}
        <div class="bas"><button class="btn btn-sm" onclick="editerCat(${a.id})">✏️ Modifier</button></div></div>
    </div>`).join('')}
      <button class="item categorie nouvelle" onclick="editerCat()"><div class="photo">＋</div>
        <div class="corps"><h3>Ajouter un article</h3><span class="small muted">Photo, prix de location et/ou de vente</span></div></button>
    </div>`;
}
// Créer / renommer une catégorie, changer sa photo de couverture, la supprimer (si elle est vide)
function editerCategorie(id) {
  const c = CAT.categories.find(x => x.id === id) || {};
  IMAGE_ID = c.image_id || null;
  const vide = id && !LISTE_CAT.some(a => a.categorie === c.nom);
  ouvrir(id ? 'Modifier la catégorie' : 'Nouvelle catégorie', `
    <label for="cat-nom">Nom</label><input id="cat-nom" value="${esc(c.nom || '')}" placeholder="Ex. : Robes de fiançailles">
    <label for="e-image">Photo de couverture <span class="muted small">(facultatif : sinon la photo du premier article)</span></label>
    <input type="file" id="e-image" accept="image/jpeg,image/png,image/webp" onchange="envoyerImage(this)">
    <img id="e-apercu" class="apercu-image ${IMAGE_ID ? '' : 'hidden'}" src="${IMAGE_ID ? imgUrl(IMAGE_ID) : ''}" alt="">
    <p class="error" id="e-err"></p>
    <div class="pied">${vide ? `<button class="btn btn-danger" onclick="supprimerCategorie(${id})">Supprimer</button>` : ''}
      <button class="btn" onclick="fermer()">Annuler</button>
      <button class="btn btn-primary" onclick="sauverCategorie(this, ${id || 'null'})">Enregistrer</button></div>`);
}
async function sauverCategorie(btn, id) {
  btn.disabled = true;
  try {
    const c = await api('/categories' + (id ? '/' + id : ''), { method: id ? 'PUT' : 'POST', body: { nom: $('cat-nom').value, image_id: IMAGE_ID || '' } });
    fermer();
    toast(id ? '✔ Catégorie modifiée.' : '✔ Catégorie créée : ajoutez maintenant vos articles.');
    CAT_ADMIN = c.nom;
    recharger();
  } catch (e) { $('e-err').textContent = e.message; btn.disabled = false; }
}
async function supprimerCategorie(id) {
  if (!confirm('Supprimer cette catégorie vide ?')) return;
  await essayer(async () => { await api('/categories/' + id, { method: 'DELETE' }); fermer(); CAT_ADMIN = 'Toutes'; recharger(); });
}

function dessinerCatalogue() {
  if (ONGLET_CAT === 'articles') return dessinerEspaceArticles();
  const d = CHAMPS[ONGLET_CAT];
  const prixCol = ONGLET_CAT === 'articles' ? 'prix_jour' : 'prix';
  CATS_ADMIN = [...new Set(LISTE_CAT.map(x => x.categorie))].sort((a, b) => rangCat(a) - rangCat(b) || a.localeCompare(b));
  if (!CATS_ADMIN.includes(CAT_ADMIN)) CAT_ADMIN = 'Toutes';
  const lignes = LISTE_CAT.filter(x => CAT_ADMIN === 'Toutes' || x.categorie === CAT_ADMIN);
  $('page').innerHTML = `
    <div class="row between" style="margin-bottom:12px">
      <div class="filtres" style="margin:0">${Object.entries(CHAMPS).map(([k, v]) => `<button class="${k === ONGLET_CAT ? 'actif' : ''}" onclick="ONGLET_CAT='${k}';CAT_ADMIN='Toutes';recharger()">${v.ico} ${v.titre}</button>`).join('')}</div>
      <button class="btn btn-primary" onclick="editerCat()">+ Ajouter${CAT_ADMIN === 'Toutes' ? '' : ' dans « ' + esc(CAT_ADMIN) + ' »'}</button>
    </div>
    <div class="filtres"><button class="${CAT_ADMIN === 'Toutes' ? 'actif' : ''}" onclick="CAT_ADMIN='Toutes';dessinerCatalogue()">Toutes (${LISTE_CAT.length})</button>
      ${CATS_ADMIN.map((c, i) => `<button class="${c === CAT_ADMIN ? 'actif' : ''}" onclick="CAT_ADMIN=CATS_ADMIN[${i}];dessinerCatalogue()">${icone(c)} ${esc(c)} (${LISTE_CAT.filter(x => x.categorie === c).length})</button>`).join('')}</div>
    <p class="small muted">${{
      services: 'Les soins que les clientes peuvent réserver (nom, prix, durée, photo).',
      produits: 'Les produits vendus dans la boutique : les clientes commandent et viennent les récupérer.',
      articles: 'Les robes, tenues et accessoires à louer et/ou à vendre. Location : les clientes choisissent leurs dates et ne voient que ce qui est libre. Vente : quand vous confirmez, l’article est retiré du catalogue.'
    }[ONGLET_CAT]} Décochez « Visible pour les clientes » pour cacher un article sans le supprimer.</p>
    <div class="carte tableau"><table>
      <tr><th></th><th>Nom</th><th>Catégorie</th><th>${ONGLET_CAT === 'articles' ? 'Location / jour' : 'Prix'}</th><th>${ONGLET_CAT === 'services' ? 'Durée' : ONGLET_CAT === 'produits' ? 'Stock' : 'Vente'}</th><th></th></tr>
      ${lignes.map(x => `<tr style="${x.actif && !x.vendu ? '' : 'opacity:.45'}">
        <td style="width:52px"><div class="date-bloc" style="width:44px;height:44px;padding:0;overflow:hidden;display:grid;place-items:center">${x.image_id ? `<img src="${imgUrl(x.image_id)}" style="width:100%;height:100%;object-fit:cover" alt="">` : icone(x.categorie)}</div></td>
        <td><b>${esc(x.nom)}</b>${x.vendu ? ' <span class="etiquette vert">Vendue</span>' : x.actif ? '' : ' <span class="etiquette gris">Masqué</span>'}</td>
        <td>${esc(x.categorie)}</td><td>${x[prixCol] == null ? '<span class="muted">—</span>' : dt(x[prixCol])}</td>
        <td>${ONGLET_CAT === 'services' ? x.duree + ' min' : ONGLET_CAT === 'produits' ? `<span style="${x.stock <= 3 ? 'color:var(--orange);font-weight:600' : ''}">${x.stock}</span>` : x.prix_vente == null ? '<span class="muted">—</span>' : dt(x.prix_vente)}</td>
        <td><button class="btn btn-sm" onclick="editerCat(${x.id})">Modifier</button></td></tr>`).join('')}
    </table>${lignes.length ? '' : vide(d.ico, 'Rien pour le moment.')}</div>`;
}
let IMAGE_ID = null;
function editerCat(id) {
  // Nouvel article : dans la catégorie affichée
  const x = LISTE_CAT.find(e => e.id === id) || { actif: true, categorie: CAT_ADMIN === 'Toutes' ? '' : CAT_ADMIN };
  const d = CHAMPS[ONGLET_CAT];
  IMAGE_ID = x.image_id || null;
  const cats = [...new Set([...LISTE_CAT.map(e => e.categorie), ...(ONGLET_CAT === 'articles' ? ORDRE_CATS : [])])];
  ouvrir(`${id ? 'Modifier' : 'Ajouter'} · ${d.titre}`, `
    ${d.champs.map(([k, lib, type]) => `<label for="e-${k}">${lib}</label>${k === 'description'
      ? `<textarea id="e-${k}">${esc(x[k] || '')}</textarea>`
      : k === 'categorie' && ONGLET_CAT === 'articles'
        ? `<select id="e-categorie">${CAT.categories.map(c => `<option ${c.nom === x.categorie ? 'selected' : ''}>${esc(c.nom)}</option>`).join('')}</select>`
      : `<input id="e-${k}" ${type ? `type="${type}" step="any" min="0"` : ''} value="${esc(x[k] == null ? '' : x[k])}" ${k === 'categorie' ? 'list="e-cats"' : ''}>`}`).join('')}
    <datalist id="e-cats">${cats.map(c => `<option value="${esc(c)}">`).join('')}</datalist>
    <label for="e-image">Photo</label>
    <input type="file" id="e-image" accept="image/jpeg,image/png,image/webp" onchange="envoyerImage(this)">
    <img id="e-apercu" class="apercu-image ${IMAGE_ID ? '' : 'hidden'}" src="${IMAGE_ID ? imgUrl(IMAGE_ID) : ''}" alt="">
    <label class="row" style="font-weight:400"><input type="checkbox" id="e-actif" ${x.actif ? 'checked' : ''}> Visible pour les clientes</label>
    ${ONGLET_CAT === 'articles' ? `<label class="row" style="font-weight:400;margin-top:4px"><input type="checkbox" id="e-vendu" ${x.vendu ? 'checked' : ''}> Vendue (vendue au centre : retirée du catalogue)</label>` : ''}
    <p class="error" id="e-err"></p>
    <div class="pied"><button class="btn" onclick="fermer()">Annuler</button>
      <button class="btn btn-primary" onclick="sauverCat(this, ${id || 'null'})">Enregistrer</button></div>`);
}
async function envoyerImage(input) {
  const f = input.files[0];
  if (!f) return;
  if (f.size > 5 * 1024 * 1024) { $('e-err').textContent = 'Image trop lourde (5 Mo maximum).'; return; }
  const fd = new FormData();
  fd.append('fichier', f);
  try {
    IMAGE_ID = (await api('/fichiers', { method: 'POST', body: fd })).id;
    $('e-apercu').src = imgUrl(IMAGE_ID);
    $('e-apercu').classList.remove('hidden');
  } catch (e) { $('e-err').textContent = e.message; }
}
async function sauverCat(btn, id) {
  const d = CHAMPS[ONGLET_CAT];
  const body = { image_id: IMAGE_ID || '', actif: $('e-actif').checked };
  for (const [k, lib, type, optionnel] of d.champs) {
    const v = $('e-' + k).value.trim();
    if (['nom', 'categorie'].includes(k) && !v) { $('e-err').textContent = `« ${lib} » est obligatoire.`; return; }
    if (type === 'number' && optionnel && v === '') { body[k] = null; continue; }
    if (type === 'number' && (v === '' || isNaN(v) || Number(v) < 0)) { $('e-err').textContent = `« ${lib.split(' — ')[0]} » : nombre invalide.`; return; }
    body[k] = type === 'number' ? Number(v) : v;
  }
  if (ONGLET_CAT === 'articles') {
    if (body.prix_jour == null && body.prix_vente == null) { $('e-err').textContent = 'Indiquez un prix de location, un prix de vente, ou les deux.'; return; }
    body.vendu = $('e-vendu').checked;
  }
  if (ONGLET_CAT === 'services' && body.duree < 5) { $('e-err').textContent = 'Durée : 5 minutes minimum.'; return; }
  btn.disabled = true;
  try {
    await api(`/gestion/${ONGLET_CAT}${id ? '/' + id : ''}`, { method: id ? 'PUT' : 'POST', body });
    fermer();
    toast('✔ Enregistré.');
    CAT = await api('/catalogue');
    recharger();
  } catch (e) { $('e-err').textContent = e.message; btn.disabled = false; }
}

// ----- Réglages -----
RENDU.reglages = async () => {
  CAT = await api('/catalogue');
  const { fidelite: f, horaires: h } = CAT.reglages;
  $('page').innerHTML = `
    <div class="carte">
      <h3>🎁 Carte fidélité</h3>
      <p class="small muted">Chaque soin terminé ajoute un tampon. Quand la carte est pleine, la réservation suivante reçoit la remise cadeau.</p>
      <div class="grid2">
        <div><label for="f-seuil">Nombre de soins pour le cadeau</label><input id="f-seuil" type="number" min="1" max="50" value="${f.seuil}" oninput="apercuFid()"></div>
        <div><label for="f-remise">Remise du cadeau (%)</label><input id="f-remise" type="number" min="1" max="100" value="${f.remise}" oninput="apercuFid()"></div>
      </div>
      <p class="recap" id="f-apercu" style="margin-top:12px"></p>
    </div>
    <div class="carte">
      <h3>👗 Location : avance</h3>
      <p class="small muted">Plusieurs clientes peuvent demander le même modèle : la première qui verse l'avance l'obtient. Sans avance dans le délai, la demande est annulée automatiquement (rappel automatique 3 h avant).</p>
      <div class="grid2">
        <div><label for="l-pct">Avance (% du total de la location)</label><input id="l-pct" type="number" min="0" max="100" value="${CAT.reglages.location.avancePct}"></div>
        <div><label for="l-delai">Délai pour verser l'avance (heures)</label><input id="l-delai" type="number" min="1" max="168" value="${CAT.reglages.location.delaiHeures}"></div>
      </div>
    </div>
    <div class="carte">
      <h3>🕘 Horaires & réservations</h3>
      <div class="grid2">
        <div><label for="h-ouv">Ouverture</label><input id="h-ouv" type="time" value="${h.ouverture}"></div>
        <div><label for="h-ferm">Fermeture</label><input id="h-ferm" type="time" value="${h.fermeture}"></div>
        <div><label for="h-pas">Un créneau toutes les</label><select id="h-pas">${[15, 30, 60].map(p => `<option value="${p}" ${p === h.pas ? 'selected' : ''}>${p} minutes</option>`).join('')}</select></div>
        <div><label for="h-postes">Clientes en même temps</label><input id="h-postes" type="number" min="1" max="30" value="${h.postes}"></div>
      </div>
      <label>Jours de fermeture</label>
      <div class="row">${JOURS.map((j, i) => `<label class="row" style="font-weight:400;margin:0"><input type="checkbox" class="h-jour" value="${i}" ${h.joursFermes.includes(i) ? 'checked' : ''}> ${j}</label>`).join('')}</div>
    </div>
    <div class="row"><button class="btn btn-primary" onclick="sauverReglages(this)">Enregistrer les réglages</button>
      <button class="btn btn-danger" onclick="deconnexion()">🚪 Déconnexion</button></div>`;
  apercuFid();
};
function apercuFid() {
  const s = Number($('f-seuil').value) || 0, r = Number($('f-remise').value) || 0;
  $('f-apercu').innerHTML = `Après <b>${s}</b> soins terminés, le <b>${s + 1}<sup>e</sup></b> est ${r >= 100 ? '<b>offert</b>' : `à <b>-${r} %</b>`} 💖`;
}
async function sauverReglages(btn) {
  btn.disabled = true;
  await essayer(async () => {
    CAT.reglages = await api('/reglages', { method: 'PUT', body: {
      fidelite: { seuil: Number($('f-seuil').value), remise: Number($('f-remise').value) },
      location: { avancePct: Number($('l-pct').value), delaiHeures: Number($('l-delai').value) },
      horaires: { ouverture: $('h-ouv').value, fermeture: $('h-ferm').value, pas: Number($('h-pas').value),
        postes: Number($('h-postes').value), joursFermes: [...document.querySelectorAll('.h-jour:checked')].map(c => Number(c.value)) } } });
    toast('✔ Réglages enregistrés.');
  });
  btn.disabled = false;
}

// ================= APPLICATION SUR LE TÉLÉPHONE =================
// Installation (écran d'accueil Android / iPhone) et notifications dans la barre du téléphone, même application fermée.
// iPhone : seulement depuis l'icône de l'écran d'accueil (ajoutée avec Safari), iOS 16.4 ou plus récent.
const estInstallee = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let invitationInstall = null;   // installation directe proposée par Chrome (Android, ordinateur)

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* site sans HTTPS : pas d'installation ni de notifications */ });
  // Notification touchée alors que l'application était ouverte
  navigator.serviceWorker.addEventListener('message', e => { if (e.data && e.data.ouvrir && moi) aller(e.data.ouvrir); });
}
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); invitationInstall = e; });
window.addEventListener('appinstalled', () => { invitationInstall = null; toast('✔ El Ghanja est installée sur ce téléphone'); });

const ICONE_PARTAGE = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px"><path d="M12 3v12M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>`;
async function installer() {
  if (invitationInstall) {
    invitationInstall.prompt();
    await invitationInstall.userChoice.catch(() => null);
    invitationInstall = null;
    return;
  }
  const etape = (n, t) => `<li><span class="gi-num">${n}</span><span>${t}</span></li>`;
  ouvrir('📲 Installer El Ghanja', estIOS ? `
    <ol class="guide-install">
      ${etape(1, 'Ouvrez ce site dans <b>Safari</b>')}
      ${etape(2, `Touchez <b>Partager</b> ${ICONE_PARTAGE} en bas de l'écran <span class="muted small">(iOS 26 : bouton ⋯ puis Partager)</span>`)}
      ${etape(3, 'Choisissez <b>« Sur l\'écran d\'accueil »</b>, puis <b>Ajouter</b>')}
      ${etape(4, 'Ouvrez El Ghanja depuis la nouvelle icône 🌸 et activez les notifications')}
    </ol>
    <p class="small muted">Sur iPhone, les notifications arrivent seulement dans l'application ajoutée à l'écran d'accueil (iOS 16.4 ou plus récent).</p>` : `
    <ol class="guide-install">
      ${etape(1, 'Ouvrez ce site dans <b>Chrome</b>')}
      ${etape(2, 'Touchez le menu <b>⋮</b> en haut à droite')}
      ${etape(3, 'Choisissez <b>« Installer l\'application »</b> (ou « Ajouter à l\'écran d\'accueil »)')}
      ${etape(4, 'Ouvrez El Ghanja depuis la nouvelle icône 🌸 et activez les notifications')}
    </ol>`);
}

let pushCle = null;      // adresse Web Push de ce téléphone (pour le délier à la déconnexion)
let pushActif = false;   // abonnement enregistré sur le serveur
let demandeNotif = null;
// 'web' | 'ios-installer' (iPhone, pas encore sur l'écran d'accueil) | null (navigateur trop ancien)
function modePush() {
  if ('serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window) return 'web';
  return estIOS && !estInstallee ? 'ios-installer' : null;
}
function base64EnOctets(b64) {
  const s = atob((b64 + '='.repeat((4 - b64.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(s, c => c.charCodeAt(0));
}
// silencieux : à l'ouverture de session, sans rien demander (relie ce téléphone au compte connecté)
async function activerPush(silencieux) {
  if (modePush() !== 'web') return rafraichirCartePush();
  try {
    const permission = silencieux ? Notification.permission : await Notification.requestPermission();
    if (permission !== 'granted') {
      if (!silencieux) toast('Notifications refusées : autorisez-les dans les réglages du téléphone.', true);
      return rafraichirCartePush();
    }
    const { clePublique } = await api('/push');
    const reg = await navigator.serviceWorker.ready;
    let abo = await reg.pushManager.getSubscription();
    if (!abo) abo = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64EnOctets(clePublique) });
    await api('/push/abonnement', { method: 'POST', body: { abonnement: abo.toJSON() } });
    pushCle = abo.endpoint;
    pushActif = true;
    if (!silencieux) toast('🔔 Notifications activées sur ce téléphone ✔');
  } catch (e) {
    if (!silencieux) toast('Activation impossible : ' + e.message, true);
  }
  rafraichirCartePush();
}
// Le téléphone n'affiche la question « Autoriser les notifications ? » que juste après un appui :
// on la pose en touchant « Se connecter » / « Créer mon compte »
function demanderNotifPendantGeste() {
  if (modePush() === 'web' && Notification.permission === 'default' && !demandeNotif)
    demandeNotif = Notification.requestPermission().catch(() => 'default');
}
async function activerPushAuto() {
  if (demandeNotif) { await demandeNotif; demandeNotif = null; }
  await activerPush(true);
}
function desactiverPush() {
  const cle = pushCle;
  pushCle = null; pushActif = false;
  if (cle && token) api('/push/abonnement', { method: 'DELETE', body: { cle } }).catch(() => {});
}
async function testerPush() {
  await essayer(async () => {
    await api('/push/test', { method: 'POST' });
    toast('Notification de test envoyée : regardez la barre du téléphone 📲');
  });
}
// Carte « Notifications sur ce téléphone » (accueil, planning, tableau de bord, notifications, profil)
const cartePush = () => `<div id="carte-push">${htmlCartePush()}</div>`;
function rafraichirCartePush() { const c = $('carte-push'); if (c) c.innerHTML = htmlCartePush(); }
function htmlCartePush() {
  const mode = modePush();
  const installer = estInstallee ? '' : '<button class="btn btn-sm" onclick="installer()">📲 Installer l\'application</button>';
  if (mode === 'ios-installer') return `<div class="carte-push">
    <b>🔔 Recevez vos notifications sur l'iPhone</b>
    <span class="small">Installez d'abord l'application sur l'écran d'accueil, puis ouvrez-la depuis l'icône.</span>
    <div class="row"><button class="btn btn-primary btn-sm" onclick="installer()">📲 Comment installer ?</button></div></div>`;
  if (!mode) return installer ? `<div class="carte-push"><b>📲 El Ghanja sur votre téléphone</b><div class="row">${installer}</div></div>` : '';
  if (Notification.permission === 'denied') return `<div class="carte-push">
    <b>🔕 Notifications bloquées sur ce téléphone</b>
    <span class="small">Autorisez-les dans les réglages du téléphone (Notifications → El Ghanja, ou Chrome), puis revenez ici.</span>
    <div class="row">${installer}</div></div>`;
  if (Notification.permission === 'granted' && pushActif) return `<div class="carte-push actif">
    <span>🔔 Notifications activées sur ce téléphone</span>
    <div class="row"><button class="btn btn-sm" onclick="testerPush()">Tester</button>${installer}</div></div>`;
  return `<div class="carte-push">
    <b>🔔 Activez les notifications sur ce téléphone</b>
    <span class="small">Confirmations, rappels d'avance, cadeaux et promotions arrivent même quand l'application est fermée.</span>
    <div class="row"><button class="btn btn-primary btn-sm" onclick="activerPush(false)">Activer</button>${installer}</div></div>`;
}

// ================= DÉMARRAGE =================
$('contacts-auth').innerHTML = htmlContacts();
if (!estInstallee) $('btn-installer').classList.remove('hidden');
// Comptes de démonstration : affichés seulement sur l'ordinateur de développement
if (!['localhost', '127.0.0.1'].includes(location.hostname)) document.querySelector('.demo').remove();
$('adresse-auth').textContent = '📍 ' + CONTACT.adresse;
(async () => {
  if (token) {
    try { await demarrer(token); return; } catch (e) { STOCK.ecrire('ghanja-token', null); token = null; }
  }
  $('auth').classList.remove('hidden');
})();
