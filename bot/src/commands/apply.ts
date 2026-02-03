import {
  ChatInputCommandInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { getEnabledFormsByGuild, getFormByName } from '../database.js';
import { buildApplicationModal } from '../handlers/applyButton.js';

export async function handleApplyCommand(
  interaction: ChatInputCommandInteraction
): Promise<void> {
  if (!interaction.guildId) {
    await interaction.reply({
      content: 'This command can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  const formName = interaction.options.getString('form');
  const forms = getEnabledFormsByGuild(interaction.guildId);

  if (forms.length === 0) {
    await interaction.reply({
      content: 'There are no application forms available in this server.',
      ephemeral: true,
    });
    return;
  }

  if (formName) {
    const form = getFormByName(interaction.guildId, formName);

    if (!form) {
      await interaction.reply({
        content: `No form found with name "${formName}".`,
        ephemeral: true,
      });
      return;
    }

    if (!form.enabled) {
      await interaction.reply({
        content: 'This form is currently disabled.',
        ephemeral: true,
      });
      return;
    }

    const modal = await buildApplicationModal(form.id, interaction.member, interaction.guildId);
    if (typeof modal === 'string') {
      await interaction.reply({ content: modal, ephemeral: true });
      return;
    }
    await interaction.showModal(modal);
    return;
  }

  if (forms.length === 1) {
    const modal = await buildApplicationModal(forms[0].id, interaction.member, interaction.guildId);
    if (typeof modal === 'string') {
      await interaction.reply({ content: modal, ephemeral: true });
      return;
    }
    await interaction.showModal(modal);
    return;
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('apply_form_select')
    .setPlaceholder('Select a form to apply to')
    .addOptions(
      forms.map((form) => ({
        label: form.name,
        description: form.description?.slice(0, 100) || undefined,
        value: form.id.toString(),
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  await interaction.reply({
    content: 'Please select which form you would like to apply to:',
    components: [row],
    ephemeral: true,
  });
}

export function buildApplyEmbed(guildName: string, forms: { id: number; name: string; description: string | null }[]): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`${guildName} Applications`)
    .setDescription('Click a button below to apply.')
    .setColor(0x5865f2)
    .setTimestamp();

  if (forms.length === 1 && forms[0].description) {
    embed.setDescription(forms[0].description);
  }

  return embed;
}

export function buildApplyButtons(forms: { id: number; name: string }[]): ActionRowBuilder<ButtonBuilder>[] {
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  let currentRow = new ActionRowBuilder<ButtonBuilder>();

  for (let i = 0; i < forms.length; i++) {
    if (currentRow.components.length === 5) {
      rows.push(currentRow);
      currentRow = new ActionRowBuilder<ButtonBuilder>();
    }

    currentRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`apply_${forms[i].id}`)
        .setLabel(forms[i].name)
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (currentRow.components.length > 0) {
    rows.push(currentRow);
  }

  return rows;
}
