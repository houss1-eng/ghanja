/* =========================================================
   Notifications dans la barre du téléphone, même application fermée (Web Push / VAPID)
   - Android : Chrome, ou l'application installée depuis Chrome.
   - iPhone : application ajoutée à l'écran d'accueil depuis Safari (iOS 16.4 ou plus récent).
   Les clés VAPID sont créées au premier démarrage et gardées dans PostgreSQL (table parametres).
   Le site doit être en HTTPS (sauf http://localhost pour les essais sur l'ordinateur).
   ========================================================= */
import webpush from 'web-push';
import { q, parametre, definirParametre } from './db.js';

let clePublique = null;

export async function initialiserPush() {
  let cles = await parametre('vapid', null);
  if (!cles) { cles = webpush.generateVAPIDKeys(); await definirParametre('vapid', cles); }
  webpush.setVapidDetails(process.env.PUSH_CONTACT || 'mailto:contact@elghanja.tn', cles.publicKey, cles.privateKey);
  clePublique = cles.publicKey;
}
export const cle = () => clePublique;

// Un téléphone = un abonnement : s'il change de compte, il suit le dernier connecté
export async function abonner(userId, abonnement) {
  await q(`INSERT INTO push_abonnements (user_id, cle, donnees) VALUES ($1, $2, $3)
    ON CONFLICT (cle) DO UPDATE SET user_id = $1, donnees = $3, created_at = now()`,
  [userId, abonnement.endpoint, JSON.stringify(abonnement)]);
}
export async function desabonner(userId, cleAbonnement) {
  await q('DELETE FROM push_abonnements WHERE cle = $1 AND user_id = $2', [cleAbonnement, userId]);
}

// userIds : liste d'identifiants, ou 'clientes' (toutes les clientes : promotions)
export async function pousser(userIds, { titre, texte, type = '' }) {
  const abonnements = userIds === 'clientes'
    ? await q("SELECT a.id, a.donnees FROM push_abonnements a JOIN users u ON u.id = a.user_id WHERE u.role = 'cliente' AND u.actif")
    : await q('SELECT id, donnees FROM push_abonnements WHERE user_id = ANY($1::int[])', [[].concat(userIds)]);
  if (!abonnements.length) return 0;
  const perimes = [];
  let envoyes = 0;
  await Promise.all(abonnements.map(a => webpush.sendNotification(a.donnees, JSON.stringify({ titre, texte, type }), { TTL: 3 * 24 * 3600 })
    .then(() => { envoyes++; })
    .catch(e => {
      if (e.statusCode === 404 || e.statusCode === 410) perimes.push(a.id);   // téléphone désabonné
      else console.error('⚠ Web Push :', e.statusCode || '', e.message);
    })));
  if (perimes.length) await q('DELETE FROM push_abonnements WHERE id = ANY($1::int[])', [perimes]);
  return envoyes;
}
