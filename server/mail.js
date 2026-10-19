// Emails des promotions (SMTP). Sans SMTP_HOST dans server/.env, rien n'est envoyé :
// les clientes reçoivent seulement la notification dans l'application.
import './env.js';
import nodemailer from 'nodemailer';

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
  })
  : null;

export const actif = () => !!transport;

const echapper = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Envoie la promotion à chaque cliente (un email par cliente) ; renvoie le nombre d'emails partis
export async function envoyerPromotion(promo, clientes) {
  if (!transport) return 0;
  const resultats = await Promise.allSettled(clientes.map(c => transport.sendMail({
    from: process.env.MAIL_FROM || 'El Ghanja Make-up <contact@elghanja.tn>',
    to: c.email,
    subject: `🎉 ${promo.titre} : -${promo.remise_pct} % chez El Ghanja`,
    text: `Bonjour ${c.nom},\n\n${promo.message}\n\nRemise de ${promo.remise_pct} % du ${promo.date_debut} au ${promo.date_fin}.\n\nEl Ghanja – Safa Make-up Artist`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;padding:24px;border-radius:16px;background:#fcd8da">
      <h2 style="color:#6e5359;margin-top:0">${echapper(promo.titre)}</h2>
      <p>Bonjour ${echapper(c.nom)},</p>
      <p>${echapper(promo.message)}</p>
      <p style="font-size:28px;font-weight:bold;color:#6e5359;margin:16px 0">-${promo.remise_pct} %</p>
      <p>Du ${promo.date_debut} au ${promo.date_fin}.</p>
      <p style="color:#888">El Ghanja – Safa Make-up Artist</p></div>`
  })));
  const echecs = resultats.filter(r => r.status === 'rejected');
  if (echecs.length) console.error(`⚠ ${echecs.length} email(s) non envoyé(s) :`, echecs[0].reason.message);
  return resultats.length - echecs.length;
}
