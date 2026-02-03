import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getUserGuilds, getBotGuilds, hasManageGuildPermission } from '@/lib/discord';
import type { GuildWithBot } from '@/types';

export async function GET() {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [userGuilds, botGuilds] = await Promise.all([
      getUserGuilds(session.accessToken),
      getBotGuilds(),
    ]);

    const botGuildIds = new Set(botGuilds.map((g) => g.id));

    const guilds: GuildWithBot[] = userGuilds
      .filter((guild) => botGuildIds.has(guild.id))
      .map((guild) => ({
        id: guild.id,
        name: guild.name,
        icon: guild.icon,
        hasBot: true,
        isAdmin: hasManageGuildPermission(guild.permissions),
      }))
      .sort((a, b) => {
        if (a.isAdmin && !b.isAdmin) return -1;
        if (!a.isAdmin && b.isAdmin) return 1;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json(guilds);
  } catch (error) {
    console.error('Error fetching guilds:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guilds' },
      { status: 500 }
    );
  }
}
