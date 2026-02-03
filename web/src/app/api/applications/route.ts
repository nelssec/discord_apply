import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGuildMember } from '@/lib/discord';
import {
  getApplicationsByGuild,
  getApplicationsByUser,
  getFormById,
  getQuestionsByForm,
} from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const guildId = searchParams.get('guildId');
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    if (!guildId) {
      return NextResponse.json(
        { error: 'guildId is required' },
        { status: 400 }
      );
    }

    const member = await getGuildMember(guildId, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    let applications;

    if (userId && userId !== session.user.id) {
      const forms = await Promise.all(
        (await getApplicationsByGuild(guildId)).map(async (app) => {
          const form = getFormById(app.form_id);
          return form;
        })
      );

      const isManager = forms.some((form) => {
        if (!form) return false;
        if (form.manager_role_ids.length === 0) return true;
        return form.manager_role_ids.some((roleId) =>
          member.roles.includes(roleId)
        );
      });

      if (!isManager) {
        return NextResponse.json(
          { error: 'You do not have permission to view these applications' },
          { status: 403 }
        );
      }

      applications = getApplicationsByUser(userId, guildId);
    } else if (userId === session.user.id) {
      applications = getApplicationsByUser(session.user.id, guildId);
    } else {
      applications = getApplicationsByGuild(guildId, status || undefined);
    }

    const applicationsWithDetails = applications.map((app) => {
      const form = getFormById(app.form_id);
      const questions = form ? getQuestionsByForm(form.id) : [];
      return {
        ...app,
        form_name: form?.name || 'Unknown Form',
        questions,
      };
    });

    return NextResponse.json(applicationsWithDetails);
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch applications' },
      { status: 500 }
    );
  }
}
