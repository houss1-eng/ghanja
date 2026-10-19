// Connexion PostgreSQL partagée
import './env.js';
import pg from 'pg';

// Les colonnes DATE sont renvoyées telles quelles ("2026-10-19") au lieu d'objets Date
pg.types.setTypeParser(1082, v => v);
// NUMERIC → nombre JavaScript (prix en dinars)
pg.types.setTypeParser(1700, v => Number(v));

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});
pool.on('error', err => console.error('⚠ Connexion PostgreSQL coupée :', err.message));

export const q = (sql, params) => pool.query(sql, params).then(r => r.rows);

// Plusieurs requêtes dans une transaction : tout est enregistré, ou rien
export async function transaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await fn((sql, params) => client.query(sql, params).then(x => x.rows));
    await client.query('COMMIT');
    return r;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

// Réglages simples (clé → valeur JSON), table « parametres »
export async function parametre(cle, defaut) {
  const [r] = await q('SELECT valeur FROM parametres WHERE cle = $1', [cle]);
  return r ? r.valeur : defaut;
}
export async function definirParametre(cle, valeur) {
  await q(`INSERT INTO parametres (cle, valeur) VALUES ($1, $2::jsonb)
    ON CONFLICT (cle) DO UPDATE SET valeur = $2::jsonb`, [cle, JSON.stringify(valeur)]);
}
