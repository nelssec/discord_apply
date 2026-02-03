import {
  Client,
  GatewayIntentBits,
  Events,
  Partials,
} from 'discord.js';
import { BOT_TOKEN } from './config.js';
import { getDb } from './database.js';
import { handleReady } from './events/ready.js';
import { handleInteraction } from './events/interactionCreate.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Channel],
});

getDb();

client.once(Events.ClientReady, handleReady);
client.on(Events.InteractionCreate, handleInteraction);

client.on(Events.GuildCreate, async (guild) => {
  console.log(`Joined guild: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildDelete, (guild) => {
  console.log(`Left guild: ${guild.name} (${guild.id})`);
});

client.login(BOT_TOKEN);
