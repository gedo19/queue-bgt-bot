import dotenv from 'dotenv'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dotenvPath = path.join(__dirname, '..', '.env');

dotenv.config({ path: dotenvPath })

export const WHITELIST_PATH = path.join(__dirname, '../whiteList.json');
export const CLIENT_DIST_PATH = path.join(__dirname, '../../client/dist');

export const config = {
  BOT_TOKEN: process.env.BOT_TOKEN,
  WEBAPP_URL: process.env.WEBAPP_URL,
  ADMIN_ID: process.env.ADMIN_ID?.toString(),
  PORT: process.env.PORT || 3000,
};

// Валидация при старте
if (!config.BOT_TOKEN || !config.WEBAPP_URL) {
  throw new Error('FATAL: BOT_TOKEN or WEBAPP_URL is missing in .env');
}
