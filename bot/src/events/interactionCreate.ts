import type { Interaction } from 'discord.js';
import { handleApplyCommand } from '../commands/apply.js';
import { handlePanelCommand } from '../commands/panel.js';
import { handleApplyButton } from '../handlers/applyButton.js';
import { handleApplicationModal } from '../handlers/applicationModal.js';
import { handleReviewButtons } from '../handlers/reviewButtons.js';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case 'apply':
          await handleApplyCommand(interaction);
          break;
        case 'panel':
          await handlePanelCommand(interaction);
          break;
      }
    } else if (interaction.isButton()) {
      const customId = interaction.customId;

      if (customId.startsWith('apply_')) {
        await handleApplyButton(interaction);
      } else if (
        customId.startsWith('accept_') ||
        customId.startsWith('deny_') ||
        customId.startsWith('message_') ||
        customId.startsWith('close_')
      ) {
        await handleReviewButtons(interaction);
      }
    } else if (interaction.isModalSubmit()) {
      const customId = interaction.customId;

      if (customId.startsWith('application_modal_')) {
        await handleApplicationModal(interaction);
      } else if (
        customId.startsWith('accept_reason_') ||
        customId.startsWith('deny_reason_') ||
        customId.startsWith('message_modal_')
      ) {
        await handleReviewButtons(interaction);
      }
    } else if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'apply_form_select' || interaction.customId === 'panel_form_select') {
        await handleApplyButton(interaction);
      }
    }
  } catch (error) {
    console.error('Error handling interaction:', error);

    const reply = {
      content: 'An error occurred while processing your request.',
      ephemeral: true,
    };

    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(reply).catch(console.error);
      } else {
        await interaction.reply(reply).catch(console.error);
      }
    }
  }
}
