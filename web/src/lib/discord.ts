export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordRole {
  id: string;
  name: string;
  color: number;
  position: number;
  permissions: string;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: number;
  parent_id: string | null;
  position: number;
}

export interface DiscordMember {
  user: {
    id: string;
    username: string;
    discriminator: string;
    avatar: string | null;
  };
  roles: string[];
  nick: string | null;
}

const DISCORD_API_BASE = 'https://discord.com/api/v10';

export async function getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user guilds');
  }

  return response.json();
}

export async function getGuildRoles(guildId: string): Promise<DiscordRole[]> {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/roles`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch guild roles');
  }

  return response.json();
}

export async function getGuildChannels(guildId: string): Promise<DiscordChannel[]> {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/channels`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch guild channels');
  }

  return response.json();
}

export async function getGuildMember(guildId: string, userId: string): Promise<DiscordMember | null> {
  const response = await fetch(`${DISCORD_API_BASE}/guilds/${guildId}/members/${userId}`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('Failed to fetch guild member');
  }

  return response.json();
}

export async function getBotGuilds(): Promise<DiscordGuild[]> {
  const response = await fetch(`${DISCORD_API_BASE}/users/@me/guilds`, {
    headers: {
      Authorization: `Bot ${process.env.DISCORD_BOT_TOKEN}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch bot guilds');
  }

  return response.json();
}

export function hasManageGuildPermission(permissions: string): boolean {
  const permissionsBigInt = BigInt(permissions);
  const MANAGE_GUILD = BigInt(0x20);
  const ADMINISTRATOR = BigInt(0x8);
  return (permissionsBigInt & MANAGE_GUILD) === MANAGE_GUILD ||
         (permissionsBigInt & ADMINISTRATOR) === ADMINISTRATOR;
}

export function getGuildIconUrl(guildId: string, icon: string | null, size: number = 128): string | null {
  if (!icon) return null;
  const ext = icon.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=${size}`;
}

export function getUserAvatarUrl(userId: string, avatar: string | null, discriminator?: string, size: number = 128): string {
  if (avatar) {
    const ext = avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.${ext}?size=${size}`;
  }
  const defaultAvatar = discriminator ? parseInt(discriminator) % 5 : 0;
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatar}.png`;
}
