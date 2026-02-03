import {
  ButtonInteraction,
  StringSelectMenuInteraction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  GuildMember,
  APIInteractionGuildMember,
} from 'discord.js';
import {
  getFormById,
  getQuestionsByForm,
  getLastApplicationByUserAndForm,
  getPendingApplicationByUserAndForm,
} from '../database.js';
import type { Form, Question } from '../types.js';

export async function handleApplyButton(
  interaction: ButtonInteraction | StringSelectMenuInteraction
): Promise<void> {
  let formId: number;

  if (interaction.isButton()) {
    formId = parseInt(interaction.customId.replace('apply_', ''), 10);
  } else {
    formId = parseInt(interaction.values[0], 10);
  }

  const modal = await buildApplicationModal(formId, interaction.member, interaction.guildId!);

  if (typeof modal === 'string') {
    await interaction.reply({ content: modal, ephemeral: true });
    return;
  }

  await interaction.showModal(modal);
}

export async function buildApplicationModal(
  formId: number,
  member: GuildMember | APIInteractionGuildMember | null,
  guildId: string
): Promise<ModalBuilder | string> {
  const form = getFormById(formId);

  if (!form) {
    return 'This form no longer exists.';
  }

  if (!form.enabled) {
    return 'This form is currently disabled.';
  }

  if (!member) {
    return 'Unable to verify your membership.';
  }

  const userId = 'user' in member ? (member as GuildMember).user.id : (member as APIInteractionGuildMember).user.id;
  const memberRoles: string[] = Array.isArray(member.roles)
    ? member.roles as string[]
    : (member as GuildMember).roles.cache.map((r) => r.id);

  const hasRestricted = form.restricted_role_ids.some((roleId: string) =>
    memberRoles.includes(roleId)
  );
  if (hasRestricted) {
    return 'You have a role that prevents you from applying to this form.';
  }

  const hasAllRequired = form.required_role_ids.every((roleId: string) =>
    memberRoles.includes(roleId)
  );
  if (!hasAllRequired && form.required_role_ids.length > 0) {
    return 'You do not have all the required roles to apply to this form.';
  }

  const pendingApp = getPendingApplicationByUserAndForm(userId, formId);
  if (pendingApp) {
    return 'You already have a pending application for this form.';
  }

  if (form.cooldown_seconds > 0) {
    const lastApp = getLastApplicationByUserAndForm(userId, formId);
    if (lastApp) {
      const cooldownEnd = new Date(lastApp.created_at).getTime() + form.cooldown_seconds * 1000;
      if (Date.now() < cooldownEnd) {
        const remainingMs = cooldownEnd - Date.now();
        const remainingHours = Math.ceil(remainingMs / (1000 * 60 * 60));
        return `You must wait ${remainingHours} hour(s) before applying again.`;
      }
    }
  }

  const questions = getQuestionsByForm(formId);

  if (questions.length === 0) {
    return 'This form has no questions configured.';
  }

  if (questions.length > 5) {
    return 'This form has too many questions for a modal (max 5). Please contact an administrator.';
  }

  const modal = new ModalBuilder()
    .setCustomId(`application_modal_${formId}`)
    .setTitle(form.name.slice(0, 45));

  for (const question of questions) {
    const style =
      question.type === 'paragraph' ? TextInputStyle.Paragraph : TextInputStyle.Short;

    const input = new TextInputBuilder()
      .setCustomId(`question_${question.id}`)
      .setLabel(question.label.slice(0, 45))
      .setStyle(style)
      .setRequired(question.required);

    if (question.placeholder) {
      input.setPlaceholder(question.placeholder.slice(0, 100));
    }

    if (question.type === 'paragraph') {
      input.setMaxLength(1000);
    } else {
      input.setMaxLength(500);
    }

    const row = new ActionRowBuilder<TextInputBuilder>().addComponents(input);
    modal.addComponents(row);
  }

  return modal;
}
