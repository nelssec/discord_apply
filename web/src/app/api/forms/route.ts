import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGuildMember } from '@/lib/discord';
import {
  getFormsByGuild,
  createForm,
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

    const forms = getFormsByGuild(guildId);
    const formsWithQuestions = forms.map((form) => ({
      ...form,
      questions: getQuestionsByForm(form.id),
    }));

    return NextResponse.json(formsWithQuestions);
  } catch (error) {
    console.error('Error fetching forms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch forms' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { guildId, name, description } = body;

    if (!guildId || !name) {
      return NextResponse.json(
        { error: 'guildId and name are required' },
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

    const formId = createForm(guildId, name, description);

    return NextResponse.json({ id: formId }, { status: 201 });
  } catch (error) {
    console.error('Error creating form:', error);
    return NextResponse.json(
      { error: 'Failed to create form' },
      { status: 500 }
    );
  }
}
