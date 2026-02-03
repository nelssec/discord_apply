import type { Client } from 'discord.js';
import { upsertGuild } from '../database.js';

export async function handleReady(client: Client<true>): Promise<void> {
  console.log(`Logged in as ${client.user.tag}`);
  console.log(`Serving ${client.guilds.cache.size} guilds`);

  for (const guild of client.guilds.cache.values()) {
    upsertGuild(guild.id, guild.name, guild.icon, guild.ownerId);
  }
}
