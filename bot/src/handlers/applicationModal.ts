import {
  ModalSubmitInteraction,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
  GuildMember,
} from 'discord.js';
import {
  getFormById,
  getQuestionsByForm,
  createApplication,
  upsertGuild,
} from '../database.js';
import { createTicketChannel } from '../utils/tickets.js';

export async function handleApplicationModal(
  interaction: ModalSubmitInteraction
): Promise<void> {
  const formId = parseInt(interaction.customId.replace('application_modal_', ''), 10);
  const form = getFormById(formId);

  if (!form) {
    await interaction.reply({
      content: 'This form no longer exists.',
      ephemeral: true,
    });
    return;
  }

  if (!interaction.guild || !interaction.member) {
    await interaction.reply({
      content: 'This can only be used in a server.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const questions = getQuestionsByForm(formId);
  const answers: Record<string, string> = {};

  for (const question of questions) {
    const answer = interaction.fields.getTextInputValue(`question_${question.id}`);
    answers[question.id.toString()] = answer;
  }

  const user = interaction.user;
  const member = interaction.member as GuildMember;

  upsertGuild(
    interaction.guild.id,
    interaction.guild.name,
    interaction.guild.icon,
    interaction.guild.ownerId
  );

  let ticketChannelId: string | null = null;

  if (form.ticket_category_id) {
    try {
      const ticketChannel = await createTicketChannel(
        interaction.guild,
        member,
        form
      );
      ticketChannelId = ticketChannel.id;

      const appEmbed = buildApplicationEmbed(
        member,
        form.name,
        questions,
        answers,
        0
      );

      const reviewButtons = buildReviewButtons(0);

      const msg = await ticketChannel.send({
        content: form.ping_role_ids.length > 0
          ? form.ping_role_ids.map((id: string) => `<@&${id}>`).join(' ')
          : undefined,
        embeds: [appEmbed],
        components: reviewButtons,
      });

      const applicationId = createApplication(
        formId,
        interaction.guild.id,
        user.id,
        user.username,
        answers,
        {
          discriminator: user.discriminator,
          avatar: user.avatar || undefined,
          ticketChannelId,
        }
      );

      const updatedEmbed = buildApplicationEmbed(
        member,
        form.name,
        questions,
        answers,
        applicationId
      );
      const updatedButtons = buildReviewButtons(applicationId);

      await msg.edit({
        embeds: [updatedEmbed],
        components: updatedButtons,
      });
    } catch (error) {
      console.error('Failed to create ticket channel:', error);
    }
  }

  const applicationId = ticketChannelId
    ? undefined
    : createApplication(
        formId,
        interaction.guild.id,
        user.id,
        user.username,
        answers,
        {
          discriminator: user.discriminator,
          avatar: user.avatar || undefined,
        }
      );

  if (form.log_channel_id && !ticketChannelId) {
    try {
      const logChannel = await interaction.guild.channels.fetch(form.log_channel_id);
      if (logChannel && logChannel.isTextBased()) {
        const appEmbed = buildApplicationEmbed(
          member,
          form.name,
          questions,
          answers,
          applicationId!
        );

        const reviewButtons = buildReviewButtons(applicationId!);

        await (logChannel as TextChannel).send({
          content: form.ping_role_ids.length > 0
            ? form.ping_role_ids.map((id: string) => `<@&${id}>`).join(' ')
            : undefined,
          embeds: [appEmbed],
          components: reviewButtons,
        });
      }
    } catch (error) {
      console.error('Failed to send to log channel:', error);
    }
  }

  if (form.completion_message) {
    try {
      await user.send(form.completion_message);
    } catch {
      // User may have DMs disabled
    }
  }

  await interaction.editReply({
    content: ticketChannelId
      ? `Your application has been submitted! A ticket has been created: <#${ticketChannelId}>`
      : 'Your application has been submitted! You will be notified of the decision.',
  });
}

function buildApplicationEmbed(
  member: GuildMember,
  formName: string,
  questions: { id: number; label: string }[],
  answers: Record<string, string>,
  applicationId: number
): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setTitle(`New Application: ${formName}`)
    .setAuthor({
      name: member.user.tag,
      iconURL: member.user.displayAvatarURL(),
    })
    .setColor(0xffa500)
    .setTimestamp()
    .setFooter({ text: `Application ID: ${applicationId} | User ID: ${member.id}` });

  const accountAge = Math.floor(
    (Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)
  );
  const joinAge = member.joinedTimestamp
    ? Math.floor((Date.now() - member.joinedTimestamp) / (1000 * 60 * 60 * 24))
    : 'Unknown';

  embed.addFields({
    name: 'Applicant Info',
    value: `**User:** ${member.user.tag} (<@${member.id}>)\n**Account Age:** ${accountAge} days\n**Server Member:** ${joinAge} days`,
    inline: false,
  });

  for (const question of questions) {
    const answer = answers[question.id.toString()] || 'No answer provided';
    embed.addFields({
      name: question.label.slice(0, 256),
      value: answer.slice(0, 1024) || 'No answer provided',
      inline: false,
    });
  }

  return embed;
}

function buildReviewButtons(applicationId: number): ActionRowBuilder<ButtonBuilder>[] {
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_${applicationId}`)
      .setLabel('Accept')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`deny_${applicationId}`)
      .setLabel('Deny')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`message_${applicationId}`)
      .setLabel('Message')
      .setStyle(ButtonStyle.Secondary)
  );

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_${applicationId}`)
      .setLabel('Close Ticket')
      .setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2];
}
