import {
  Guild,
  GuildMember,
  ChannelType,
  PermissionFlagsBits,
  TextChannel,
} from 'discord.js';
import type { Form } from '../types.js';

export async function createTicketChannel(
  guild: Guild,
  member: GuildMember,
  form: Form
): Promise<TextChannel> {
  const channelName = `apply-${member.user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .slice(0, 100);

  const permissionOverwrites: Array<{
    id: string;
    allow?: bigint[];
    deny?: bigint[];
  }> = [
    {
      id: guild.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: member.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  for (const roleId of form.manager_role_ids) {
    permissionOverwrites.push({
      id: roleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageMessages,
        PermissionFlagsBits.AttachFiles,
      ],
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: form.ticket_category_id || undefined,
    permissionOverwrites: permissionOverwrites.map((p) => ({
      id: p.id,
      allow: p.allow,
      deny: p.deny,
    })),
    topic: `Application ticket for ${member.user.tag} | Form: ${form.name}`,
  });

  return channel;
}

export async function closeTicketChannel(
  guild: Guild,
  channelId: string,
  delayMs: number = 0
): Promise<void> {
  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  try {
    const channel = await guild.channels.fetch(channelId);
    if (channel) {
      await channel.delete();
    }
  } catch {
    // Channel may already be deleted
  }
}
