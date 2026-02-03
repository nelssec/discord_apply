import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGuildRoles, getGuildChannels, getGuildMember } from '@/lib/discord';
import { getGuild, getApplicationStats } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { guildId: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { guildId } = params;

    const member = await getGuildMember(guildId, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    const [roles, channels, guild, stats] = await Promise.all([
      getGuildRoles(guildId),
      getGuildChannels(guildId),
      getGuild(guildId),
      getApplicationStats(guildId),
    ]);

    const textChannels = channels.filter((c) => c.type === 0);
    const categories = channels.filter((c) => c.type === 4);

    return NextResponse.json({
      guild,
      roles: roles.sort((a, b) => b.position - a.position),
      channels: textChannels.sort((a, b) => a.position - b.position),
      categories: categories.sort((a, b) => a.position - b.position),
      stats,
      member: {
        roles: member.roles,
      },
    });
  } catch (error) {
    console.error('Error fetching guild data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch guild data' },
      { status: 500 }
    );
  }
}
