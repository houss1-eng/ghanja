-- ================= SCHÉMA POSTGRESQL – El Ghanja – Safa Make-up Artist =================
-- Deux espaces : Administration (email), Clientes (numéro de téléphone).
-- Trois activités : réservations de soins, boutique (vente), location (robes, tenues, accessoires).
-- Promotions envoyées à toutes les clientes ; fidélité : après N soins terminés, le suivant est offert / remisé.

-- Numéro de téléphone → clé de comparaison (chiffres seuls, sans « 00 » ni « 216 » devant un numéro tunisien)
CREATE OR REPLACE FUNCTION tel_cle(t TEXT) RETURNS TEXT IMMUTABLE LANGUAGE sql AS $$
  SELECT NULLIF(CASE WHEN d ~ '^216\d{8}$' THEN substr(d, 4) ELSE d END, '')
  FROM (SELECT regexp_replace(regexp_replace(coalesce(t, ''), '\D', '', 'g'), '^00', '') AS d) x
$$;

-- Réglages (fidélité, horaires…)
CREATE TABLE IF NOT EXISTS parametres (
  cle    TEXT PRIMARY KEY,
  valeur JSONB NOT NULL
);

-- Photos envoyées par l'administration (produits, robes…), stockées dans la base
CREATE TABLE IF NOT EXISTS fichiers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom        TEXT NOT NULL,
  type       TEXT NOT NULL,
  taille     INTEGER NOT NULL,
  contenu    BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  nom        TEXT NOT NULL,
  telephone  TEXT,
  tel_cle    TEXT UNIQUE,                              -- clientes : identifiant de connexion
  email      TEXT UNIQUE,                              -- administration (et clientes : emails des promotions)
  password   TEXT NOT NULL,                            -- haché avec bcrypt
  role       TEXT NOT NULL CHECK (role IN ('admin', 'cliente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= SOINS & RÉSERVATIONS =================
CREATE TABLE IF NOT EXISTS services (
  id          SERIAL PRIMARY KEY,
  nom         TEXT NOT NULL,
  categorie   TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prix        NUMERIC(10,3) NOT NULL CHECK (prix >= 0),
  duree       INTEGER NOT NULL CHECK (duree > 0),      -- minutes
  image_id    UUID REFERENCES fichiers(id) ON DELETE SET NULL,
  actif       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS promotions (
  id             SERIAL PRIMARY KEY,
  titre          TEXT NOT NULL,
  message        TEXT NOT NULL DEFAULT '',
  cible          TEXT NOT NULL CHECK (cible IN ('tout', 'services', 'produits', 'location')),
  remise_pct     INTEGER NOT NULL CHECK (remise_pct BETWEEN 1 AND 100),
  date_debut     DATE NOT NULL,
  date_fin       DATE NOT NULL CHECK (date_fin >= date_debut),
  emails_envoyes INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reservations (
  id           SERIAL PRIMARY KEY,
  client_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id   INTEGER NOT NULL REFERENCES services(id),
  date         DATE NOT NULL,
  heure        TIME NOT NULL,
  duree        INTEGER NOT NULL,                       -- copiée du soin au moment de la réservation
  prix         NUMERIC(10,3) NOT NULL,                 -- prix normal
  remise_pct   INTEGER NOT NULL DEFAULT 0,
  prix_final   NUMERIC(10,3) NOT NULL,
  cadeau       BOOLEAN NOT NULL DEFAULT false,         -- réservation offerte par la carte fidélité
  promotion_id INTEGER REFERENCES promotions(id) ON DELETE SET NULL,
  statut       TEXT NOT NULL DEFAULT 'en_attente'
               CHECK (statut IN ('en_attente', 'confirmee', 'terminee', 'annulee')),
  note         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS reservations_date ON reservations (date);
CREATE INDEX IF NOT EXISTS reservations_client ON reservations (client_id);

-- ================= BOUTIQUE (VENTE) =================
CREATE TABLE IF NOT EXISTS produits (
  id          SERIAL PRIMARY KEY,
  nom         TEXT NOT NULL,
  categorie   TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  prix        NUMERIC(10,3) NOT NULL CHECK (prix >= 0),
  stock       INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image_id    UUID REFERENCES fichiers(id) ON DELETE SET NULL,
  actif       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS commandes (
  id         SERIAL PRIMARY KEY,
  client_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total      NUMERIC(10,3) NOT NULL,
  statut     TEXT NOT NULL DEFAULT 'en_attente'
             CHECK (statut IN ('en_attente', 'prete', 'livree', 'annulee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS commande_lignes (
  id            SERIAL PRIMARY KEY,
  commande_id   INTEGER NOT NULL REFERENCES commandes(id) ON DELETE CASCADE,
  produit_id    INTEGER NOT NULL REFERENCES produits(id),
  nom           TEXT NOT NULL,
  quantite      INTEGER NOT NULL CHECK (quantite > 0),
  prix_unitaire NUMERIC(10,3) NOT NULL                 -- après promotion
);

-- ================= LOCATION (robes, tenues traditionnelles, accessoires) =================
-- Chaque article est une pièce unique : il ne peut pas être loué deux fois sur les mêmes jours
CREATE TABLE IF NOT EXISTS articles_location (
  id          SERIAL PRIMARY KEY,
  nom         TEXT NOT NULL,
  categorie   TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  taille      TEXT NOT NULL DEFAULT '',
  prix_jour   NUMERIC(10,3) NOT NULL CHECK (prix_jour >= 0),
  caution     NUMERIC(10,3) NOT NULL DEFAULT 0,
  image_id    UUID REFERENCES fichiers(id) ON DELETE SET NULL,
  actif       BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS locations (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id  INTEGER NOT NULL REFERENCES articles_location(id),
  date_debut  DATE NOT NULL,
  date_fin    DATE NOT NULL CHECK (date_fin >= date_debut),
  jours       INTEGER NOT NULL,
  prix_jour   NUMERIC(10,3) NOT NULL,                  -- après promotion
  total       NUMERIC(10,3) NOT NULL,
  caution     NUMERIC(10,3) NOT NULL,
  statut      TEXT NOT NULL DEFAULT 'demandee'
              CHECK (statut IN ('demandee', 'confirmee', 'en_cours', 'retournee', 'annulee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS locations_article ON locations (article_id);

-- ================= NOTIFICATIONS =================
-- user_id NULL : pour toutes les clientes (promotions)
CREATE TABLE IF NOT EXISTS notifications (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  titre      TEXT NOT NULL,
  message    TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user ON notifications (user_id);

CREATE TABLE IF NOT EXISTS notifications_lues (
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (notification_id, user_id)
);

-- ================= RÉALISATIONS (galerie du travail de Safa) =================
CREATE TABLE IF NOT EXISTS realisations (
  id         SERIAL PRIMARY KEY,
  titre      TEXT NOT NULL DEFAULT '',
  categorie  TEXT NOT NULL,
  image_id   UUID NOT NULL REFERENCES fichiers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ================= VENTE DES ROBES & ACCESSOIRES =================
-- Un article peut être à louer (prix_jour), à vendre (prix_vente), ou les deux.
-- Vendu (achat confirmé par l'administration) : il disparaît du catalogue, l'historique est gardé.
ALTER TABLE articles_location ALTER COLUMN prix_jour DROP NOT NULL;
ALTER TABLE articles_location ADD COLUMN IF NOT EXISTS prix_vente NUMERIC(10,3) CHECK (prix_vente >= 0);
ALTER TABLE articles_location ADD COLUMN IF NOT EXISTS vendu BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS achats_articles (
  id          SERIAL PRIMARY KEY,
  client_id   INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  article_id  INTEGER NOT NULL REFERENCES articles_location(id),
  prix        NUMERIC(10,3) NOT NULL,
  statut      TEXT NOT NULL DEFAULT 'demandee' CHECK (statut IN ('demandee', 'confirmee', 'annulee')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Une seule demande d'achat en cours (ou confirmée) par article : pas deux acheteuses pour la même robe
CREATE UNIQUE INDEX IF NOT EXISTS achats_un_par_article ON achats_articles (article_id) WHERE statut <> 'annulee';
DO $$ BEGIN
  ALTER TABLE articles_location ADD CONSTRAINT article_a_louer_ou_vendre CHECK (prix_jour IS NOT NULL OR prix_vente IS NOT NULL);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================= LOCATION : DEMANDES & AVANCE =================
-- Plusieurs clientes peuvent demander la même robe aux mêmes dates (« demandee »). La première qui verse l'avance
-- l'obtient (« confirmee ») : les autres demandes sur ces dates sont annulées. Sans avance dans le délai (12 h par
-- défaut), la demande est annulée automatiquement. Seules les locations confirmées / en cours bloquent les dates.
ALTER TABLE locations ADD COLUMN IF NOT EXISTS expire_le TIMESTAMPTZ;           -- fin du délai pour verser l'avance
ALTER TABLE locations ADD COLUMN IF NOT EXISTS avance NUMERIC(10,3) NOT NULL DEFAULT 0;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS avance_le TIMESTAMPTZ;
ALTER TABLE locations ADD COLUMN IF NOT EXISTS motif_annulation TEXT NOT NULL DEFAULT '';
ALTER TABLE locations ADD COLUMN IF NOT EXISTS rappel_le TIMESTAMPTZ;           -- dernier rappel envoyé

-- ================= CATÉGORIES DES ROBES & ACCESSOIRES =================
-- Créées par l'administration (« Robes de mariée », « Bijoux »…), avec une photo de couverture et un ordre d'affichage.
-- Les articles gardent le nom de leur catégorie (renommer une catégorie renomme aussi ses articles).
CREATE TABLE IF NOT EXISTS categories_articles (
  id       SERIAL PRIMARY KEY,
  nom      TEXT NOT NULL UNIQUE,
  image_id UUID REFERENCES fichiers(id) ON DELETE SET NULL,
  ordre    INTEGER NOT NULL DEFAULT 0
);
-- Catégories déjà utilisées par des articles (bases existantes)
INSERT INTO categories_articles (nom, ordre)
  SELECT DISTINCT categorie, 100 FROM articles_location ON CONFLICT (nom) DO NOTHING;

-- ================= ÉQUIPE =================
-- Employées (rôle « employe ») : compte créé par l'administration (email + mot de passe), spécialités = catégories de
-- soins (« Maquillage », « Coiffure »…). L'administratrice peut aussi faire partie de l'équipe (equipe = true).
-- La cliente choisit avec qui elle réserve ; chaque membre ne prend qu'une cliente à la fois.
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'cliente', 'employe'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipe BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS specialites TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS actif BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_id UUID REFERENCES fichiers(id) ON DELETE SET NULL;
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS employe_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS reservations_employe ON reservations (employe_id, date);
