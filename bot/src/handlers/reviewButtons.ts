import {
  ButtonInteraction,
  ModalSubmitInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  GuildMember,
  TextChannel,
} from 'discord.js';
import {
  getApplicationById,
  updateApplicationStatus,
  getFormById,
  updateApplicationTicket,
} from '../database.js';

export async function handleReviewButtons(
  interaction: ButtonInteraction | ModalSubmitInteraction
): Promise<void> {
  const customId = interaction.customId;

  if (interaction.isButton()) {
    if (customId.startsWith('accept_')) {
      await showReasonModal(interaction, 'accept');
    } else if (customId.startsWith('deny_')) {
      await showReasonModal(interaction, 'deny');
    } else if (customId.startsWith('message_')) {
      await showMessageModal(interaction);
    } else if (customId.startsWith('close_')) {
      await handleCloseTicket(interaction);
    }
  } else if (interaction.isModalSubmit()) {
    if (customId.startsWith('accept_reason_')) {
      await handleAcceptDeny(interaction, 'accepted');
    } else if (customId.startsWith('deny_reason_')) {
      await handleAcceptDeny(interaction, 'denied');
    } else if (customId.startsWith('message_modal_')) {
      await handleMessage(interaction);
    }
  }
}

async function showReasonModal(
  interaction: ButtonInteraction,
  action: 'accept' | 'deny'
): Promise<void> {
  const applicationId = parseInt(
    interaction.customId.replace(`${action}_`, ''),
    10
  );
  const application = getApplicationById(applicationId);

  if (!application) {
    await interaction.reply({
      content: 'Application not found.',
      ephemeral: true,
    });
    return;
  }

  if (application.status !== 'pending') {
    await interaction.reply({
      content: `This application has already been ${application.status}.`,
      ephemeral: true,
    });
    return;
  }

  const form = getFormById(application.form_id);
  if (!form) {
    await interaction.reply({
      content: 'Form not found.',
      ephemeral: true,
    });
    return;
  }

  const member = interaction.member as GuildMember;
  const hasPermission =
    form.manager_role_ids.length === 0 ||
    form.manager_role_ids.some((roleId) => member.roles.cache.has(roleId)) ||
    member.permissions.has('Administrator');

  if (!hasPermission) {
    await interaction.reply({
      content: 'You do not have permission to review this application.',
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`${action}_reason_${applicationId}`)
    .setTitle(action === 'accept' ? 'Accept Application' : 'Deny Application');

  const reasonInput = new TextInputBuilder()
    .setCustomId('reason')
    .setLabel('Reason (optional)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(false)
    .setMaxLength(1000)
    .setPlaceholder(
      action === 'accept'
        ? 'Enter a message to send to the applicant (optional)'
        : 'Enter a reason for denial (optional)'
    );

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(reasonInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function showMessageModal(interaction: ButtonInteraction): Promise<void> {
  const applicationId = parseInt(
    interaction.customId.replace('message_', ''),
    10
  );
  const application = getApplicationById(applicationId);

  if (!application) {
    await interaction.reply({
      content: 'Application not found.',
      ephemeral: true,
    });
    return;
  }

  const modal = new ModalBuilder()
    .setCustomId(`message_modal_${applicationId}`)
    .setTitle('Message Applicant');

  const messageInput = new TextInputBuilder()
    .setCustomId('message')
    .setLabel('Message')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000)
    .setPlaceholder('Enter a message to send to the applicant');

  const row = new ActionRowBuilder<TextInputBuilder>().addComponents(messageInput);
  modal.addComponents(row);

  await interaction.showModal(modal);
}

async function handleAcceptDeny(
  interaction: ModalSubmitInteraction,
  status: 'accepted' | 'denied'
): Promise<void> {
  const applicationId = parseInt(
    interaction.customId.replace(`${status === 'accepted' ? 'accept' : 'deny'}_reason_`, ''),
    10
  );

  const application = getApplicationById(applicationId);

  if (!application) {
    await interaction.reply({
      content: 'Application not found.',
      ephemeral: true,
    });
    return;
  }

  if (application.status !== 'pending') {
    await interaction.reply({
      content: `This application has already been ${application.status}.`,
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const reason = interaction.fields.getTextInputValue('reason') || undefined;
  const reviewer = interaction.user;

  updateApplicationStatus(
    applicationId,
    status,
    reviewer.id,
    reviewer.username,
    reason
  );

  const form = getFormById(application.form_id);
  if (!form) {
    await interaction.editReply({ content: 'Form not found.' });
    return;
  }

  const guild = interaction.guild!;

  try {
    const member = await guild.members.fetch(application.user_id);

    if (status === 'accepted' && form.accept_role_ids.length > 0) {
      for (const roleId of form.accept_role_ids) {
        await member.roles.add(roleId).catch(console.error);
      }
    }

    if (status === 'denied' && form.deny_role_ids.length > 0) {
      for (const roleId of form.deny_role_ids) {
        await member.roles.add(roleId).catch(console.error);
      }
    }

    if (form.remove_role_ids.length > 0) {
      for (const roleId of form.remove_role_ids) {
        await member.roles.remove(roleId).catch(console.error);
      }
    }

    const dmMessage =
      status === 'accepted'
        ? form.accept_message || `Your application to **${form.name}** has been accepted!`
        : form.deny_message || `Your application to **${form.name}** has been denied.`;

    const fullMessage = reason
      ? `${dmMessage}\n\n**Reason:** ${reason}`
      : dmMessage;

    await member.send(fullMessage).catch(() => {
      // User may have DMs disabled
    });
  } catch {
    // Member may have left the server
  }

  if (form.log_channel_id) {
    try {
      const logChannel = await guild.channels.fetch(form.log_channel_id);
      if (logChannel && logChannel.isTextBased()) {
        const logEmbed = new EmbedBuilder()
          .setTitle(`Application ${status.charAt(0).toUpperCase() + status.slice(1)}`)
          .setColor(status === 'accepted' ? 0x00ff00 : 0xff0000)
          .addFields(
            { name: 'Applicant', value: `<@${application.user_id}>`, inline: true },
            { name: 'Reviewer', value: `<@${reviewer.id}>`, inline: true },
            { name: 'Form', value: form.name, inline: true }
          )
          .setTimestamp();

        if (reason) {
          logEmbed.addFields({ name: 'Reason', value: reason });
        }

        await (logChannel as TextChannel).send({ embeds: [logEmbed] });
      }
    } catch (error) {
      console.error('Failed to send to log channel:', error);
    }
  }

  if (application.ticket_channel_id) {
    try {
      const ticketChannel = await guild.channels.fetch(application.ticket_channel_id);
      if (ticketChannel) {
        const closeEmbed = new EmbedBuilder()
          .setTitle(`Application ${status.charAt(0).toUpperCase() + status.slice(1)}`)
          .setDescription(
            `This ticket will be deleted in 10 seconds.\n\n**Reviewer:** <@${reviewer.id}>${reason ? `\n**Reason:** ${reason}` : ''}`
          )
          .setColor(status === 'accepted' ? 0x00ff00 : 0xff0000)
          .setTimestamp();

        await (ticketChannel as TextChannel).send({ embeds: [closeEmbed] });

        setTimeout(async () => {
          try {
            await ticketChannel.delete();
            updateApplicationTicket(applicationId, null);
          } catch {
            // Channel may already be deleted
          }
        }, 10000);
      }
    } catch {
      // Channel may not exist
    }
  }

  if (interaction.message) {
    try {
      const originalEmbed = interaction.message.embeds[0];
      if (originalEmbed) {
        const updatedEmbed = EmbedBuilder.from(originalEmbed)
          .setColor(status === 'accepted' ? 0x00ff00 : 0xff0000)
          .setFooter({
            text: `${status.charAt(0).toUpperCase() + status.slice(1)} by ${reviewer.username}`,
          });

        await interaction.message.edit({
          embeds: [updatedEmbed],
          components: [],
        });
      }
    } catch {
      // Message may not be editable
    }
  }

  await interaction.editReply({
    content: `Application has been ${status}. The applicant has been notified.`,
  });
}

async function handleMessage(interaction: ModalSubmitInteraction): Promise<void> {
  const applicationId = parseInt(
    interaction.customId.replace('message_modal_', ''),
    10
  );

  const application = getApplicationById(applicationId);

  if (!application) {
    await interaction.reply({
      content: 'Application not found.',
      ephemeral: true,
    });
    return;
  }

  const message = interaction.fields.getTextInputValue('message');

  await interaction.deferReply({ ephemeral: true });

  const guild = interaction.guild!;
  let dmSent = false;
  let ticketMessageSent = false;

  try {
    const member = await guild.members.fetch(application.user_id);
    await member.send(
      `**Message from ${guild.name} staff regarding your application:**\n\n${message}`
    );
    dmSent = true;
  } catch {
    // User may have DMs disabled or left server
  }

  if (application.ticket_channel_id) {
    try {
      const ticketChannel = await guild.channels.fetch(application.ticket_channel_id);
      if (ticketChannel && ticketChannel.isTextBased()) {
        const messageEmbed = new EmbedBuilder()
          .setDescription(message)
          .setAuthor({
            name: interaction.user.username,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor(0x5865f2)
          .setTimestamp();

        await (ticketChannel as TextChannel).send({ embeds: [messageEmbed] });
        ticketMessageSent = true;
      }
    } catch {
      // Channel may not exist
    }
  }

  if (!dmSent && !ticketMessageSent) {
    await interaction.editReply({
      content: 'Failed to send message. The user may have DMs disabled and no ticket channel exists.',
    });
    return;
  }

  const statusParts: string[] = [];
  if (dmSent) statusParts.push('sent via DM');
  if (ticketMessageSent) statusParts.push('posted in ticket');

  await interaction.editReply({
    content: `Message ${statusParts.join(' and ')}.`,
  });
}

async function handleCloseTicket(interaction: ButtonInteraction): Promise<void> {
  const applicationId = parseInt(
    interaction.customId.replace('close_', ''),
    10
  );

  const application = getApplicationById(applicationId);

  if (!application) {
    await interaction.reply({
      content: 'Application not found.',
      ephemeral: true,
    });
    return;
  }

  if (!application.ticket_channel_id) {
    await interaction.reply({
      content: 'No ticket channel associated with this application.',
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: 'Closing ticket in 5 seconds...',
  });

  setTimeout(async () => {
    try {
      const channel = await interaction.guild!.channels.fetch(
        application.ticket_channel_id!
      );
      if (channel) {
        await channel.delete();
        updateApplicationTicket(applicationId, null);
      }
    } catch {
      // Channel may already be deleted
    }
  }, 5000);
}
