import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../../.env') });

export const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN!;
export const CLIENT_ID = process.env.DISCORD_CLIENT_ID!;
export const DATABASE_PATH = process.env.DATABASE_PATH || resolve(__dirname, '../../data/guild_apps.db');

if (!BOT_TOKEN) {
  throw new Error('DISCORD_BOT_TOKEN is required');
}

if (!CLIENT_ID) {
  throw new Error('DISCORD_CLIENT_ID is required');
}
