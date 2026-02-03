import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGuildMember } from '@/lib/discord';
import {
  getFormById,
  updateForm,
  deleteForm,
  getQuestionsByForm,
  createQuestion,
  deleteQuestionsByForm,
} from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(params.formId, 10);
    const form = getFormById(formId);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const member = await getGuildMember(form.guild_id, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    const questions = getQuestionsByForm(formId);

    return NextResponse.json({ form, questions });
  } catch (error) {
    console.error('Error fetching form:', error);
    return NextResponse.json(
      { error: 'Failed to fetch form' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(params.formId, 10);
    const form = getFormById(formId);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const member = await getGuildMember(form.guild_id, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { questions, ...formUpdates } = body;

    if (Object.keys(formUpdates).length > 0) {
      updateForm(formId, formUpdates);
    }

    if (questions && Array.isArray(questions)) {
      deleteQuestionsByForm(formId);

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        createQuestion(formId, q.label, q.type || 'text', i, {
          placeholder: q.placeholder,
          required: q.required !== false,
          choices: q.options,
        });
      }
    }

    const updatedForm = getFormById(formId);
    const updatedQuestions = getQuestionsByForm(formId);

    return NextResponse.json({ form: updatedForm, questions: updatedQuestions });
  } catch (error) {
    console.error('Error updating form:', error);
    return NextResponse.json(
      { error: 'Failed to update form' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { formId: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formId = parseInt(params.formId, 10);
    const form = getFormById(formId);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const member = await getGuildMember(form.guild_id, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    deleteForm(formId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting form:', error);
    return NextResponse.json(
      { error: 'Failed to delete form' },
      { status: 500 }
    );
  }
}
