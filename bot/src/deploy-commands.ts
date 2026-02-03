import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import { BOT_TOKEN, CLIENT_ID } from './config.js';

const commands = [
  new SlashCommandBuilder()
    .setName('apply')
    .setDescription('Apply to a form')
    .addStringOption((option) =>
      option
        .setName('form')
        .setDescription('The form to apply to (optional if only one form exists)')
        .setRequired(false)
    )
    .toJSON(),
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Post an application panel with a dropdown menu')
    .addStringOption((option) =>
      option
        .setName('title')
        .setDescription('Title for the panel embed')
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName('description')
        .setDescription('Description for the panel embed')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(0)
    .toJSON(),
];

const rest = new REST().setToken(BOT_TOKEN);

async function deploy(): Promise<void> {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(Routes.applicationCommands(CLIENT_ID), {
      body: commands,
    });

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
}

deploy();
