# El Ghanja – Safa Make-up Artist

Application web du centre de beauté El Ghanja (Cité Taha Hassine, Beb Bhar, Gabès).

- **Espace Clientes** : réserver un soin (créneaux libres en direct), boutique (commande + retrait au centre),
  location (robes de mariée, tenues traditionnelles, accessoires, avec les dates déjà prises), carte fidélité,
  notifications, profil.
- **Espace Administration** : tableau de bord (à traiter, chiffre d'affaires du mois), rendez-vous par jour,
  commandes, locations, clientes, promotions, catalogue (avec photos), réglages.
- **Robes & tenues** : chaque robe / accessoire est à louer, à vendre, ou les deux. La cliente indique le jour de sa
  fête : seuls les articles libres ce jour-là s'affichent, et un article ne peut jamais être loué deux fois sur les
  mêmes jours. Achat : l'article est mis de côté (caché aux autres) ; quand Safa confirme la vente, il sort du
  catalogue (gardé dans l'historique, marqué « Vendue ») ; si elle annule, il revient.
- **Catégories** : Safa crée ses catégories (Robes de mariée, Bijoux, Sacs…) dans Catalogue → Robes & accessoires,
  les ouvre et y ajoute ses articles (photo, prix de location et/ou de vente). Les clientes voient les mêmes catégories.
- **Location avec avance** : plusieurs clientes peuvent demander le même modèle aux mêmes dates ; la première qui verse
  l'avance (30 % par défaut) l'obtient, les autres demandes sont annulées et les clientes prévenues. Sans avance dans
  les 12 h, la demande est annulée automatiquement (rappel automatique 3 h avant). Safa voit toutes les demandes par
  modèle (Locations → Demandes) avec le temps restant, et peut appeler, écrire sur WhatsApp ou envoyer un rappel.
  Pourcentage et délai : Réglages.
- **Équipe** : Safa crée les comptes de son équipe (email + mot de passe, spécialités, photo). Chaque membre se
  connecte et voit « Mon planning ». La cliente choisit « Avec qui ? » (ou « Peu importe ») : les créneaux suivent
  l'agenda de la personne choisie, qui ne prend qu'une cliente à la fois.
- **Promotions** : une nouvelle promotion part tout de suite à toutes les clientes (notification dans l'application
  + email à celles qui ont une adresse) et baisse automatiquement les prix pendant ses dates.
- **Fidélité** : chaque soin terminé ajoute un tampon ; après 4 soins, le 5e est à -50 % (« chtar som »).
  Nombre de soins et remise modifiables dans « Réglages ». Le cadeau ne se cumule pas avec une promotion : la
  cliente reçoit la meilleure des deux. Si le rendez-vous cadeau est annulé, la cliente garde son cadeau.

Express 5 + PostgreSQL 16 (Docker), frontend HTML/CSS/JS sans framework dans `www/`.

## Démarrer

```bash
npm install          # installe aussi server/
npm run dev          # lance PostgreSQL + Mailpit (Docker) puis le serveur
```

- Application : http://localhost:3005
- Emails envoyés (promotions) : http://localhost:8026 (Mailpit, boîte de test)

Comptes de démonstration (mot de passe `1234`) : cliente `20 100 200`, administration `admin@elghanja.tn`,
équipe `amira@elghanja.tn` (coiffure), `ines@elghanja.tn` (maquillage, épilation), `nour@elghanja.tn` (ongles, soins).

Remettre les données de démonstration : `npm run seed -- --reset` (efface tout).

Illustrations des soins : `server/photos-demo/` (aux couleurs du logo, redessinées par `node photos-demo/dessiner.mjs`).
`npm run seed -- --photos` les ajoute aux soins qui n'ont pas encore de photo, sans toucher aux photos de Safa.

## Configuration

- `.env` (racine) : mot de passe PostgreSQL du `docker-compose.yml`.
- `server/.env` : `DATABASE_URL`, `JWT_SECRET`, `PORT`, et le SMTP des emails
  (`SMTP_HOST` vide = pas d'email, seulement les notifications dans l'application).
- Contacts affichés (WhatsApp, Instagram, Facebook, adresse) : constante `CONTACT` en haut de `www/app.js`.

Ports : PostgreSQL 5437, serveur 3005, Mailpit 1026 / 8026 (les autres sont pris par d'autres projets).
