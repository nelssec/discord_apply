import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import { getEnabledFormsByGuild } from '../database.js';

export async function handlePanelCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guildId || !interaction.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  const member = await interaction.guild.members.fetch(interaction.user.id);

  if (!member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    await interaction.reply({
      content: 'You need the Manage Server permission to use this command.',
      ephemeral: true,
    });
    return;
  }

  const forms = getEnabledFormsByGuild(interaction.guildId);

  if (forms.length === 0) {
    await interaction.reply({
      content: 'There are no enabled application forms. Create one in the web dashboard first.',
      ephemeral: true,
    });
    return;
  }

  const title = interaction.options.getString('title') || `${interaction.guild.name} Applications`;
  const description = interaction.options.getString('description') ||
    'Select an application form from the dropdown below to apply.';

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(0x5865f2)
    .setFooter({ text: `${forms.length} form${forms.length !== 1 ? 's' : ''} available` })
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('panel_form_select')
    .setPlaceholder('Choose an application form...')
    .addOptions(
      forms.map((form) => ({
        label: form.name,
        description: form.description?.slice(0, 100) || 'Click to apply',
        value: form.id.toString(),
        emoji: '📝',
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.deferReply({ ephemeral: true });

  try {
    const channel = interaction.channel as TextChannel;
    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({
      content: 'Application panel posted successfully!',
    });
  } catch (error) {
    console.error('Failed to post panel:', error);
    await interaction.editReply({
      content: 'Failed to post the panel. Make sure I have permission to send messages in this channel.',
    });
  }
}
