// Charge server/.env quel que soit le dossier d'où le serveur est lancé
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('.env', import.meta.url)), quiet: true });
