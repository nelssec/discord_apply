import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getGuildMember } from '@/lib/discord';
import {
  getApplicationById,
  getFormById,
  getQuestionsByForm,
  updateApplicationStatus,
} from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = parseInt(params.id, 10);
    const application = getApplicationById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    const member = await getGuildMember(application.guild_id, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    const form = getFormById(application.form_id);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const isOwner = application.user_id === session.user.id;
    const isManager =
      form.manager_role_ids.length === 0 ||
      form.manager_role_ids.some((roleId) => member.roles.includes(roleId));

    if (!isOwner && !isManager) {
      return NextResponse.json(
        { error: 'You do not have permission to view this application' },
        { status: 403 }
      );
    }

    const questions = getQuestionsByForm(form.id);

    return NextResponse.json({
      application,
      form,
      questions,
      canReview: isManager,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch application' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const applicationId = parseInt(params.id, 10);
    const application = getApplicationById(applicationId);

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.status !== 'pending') {
      return NextResponse.json(
        { error: 'Application has already been reviewed' },
        { status: 400 }
      );
    }

    const member = await getGuildMember(application.guild_id, session.user.id);

    if (!member) {
      return NextResponse.json(
        { error: 'You are not a member of this guild' },
        { status: 403 }
      );
    }

    const form = getFormById(application.form_id);

    if (!form) {
      return NextResponse.json({ error: 'Form not found' }, { status: 404 });
    }

    const isManager =
      form.manager_role_ids.length === 0 ||
      form.manager_role_ids.some((roleId) => member.roles.includes(roleId));

    if (!isManager) {
      return NextResponse.json(
        { error: 'You do not have permission to review this application' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { status, reason } = body;

    if (status !== 'accepted' && status !== 'denied') {
      return NextResponse.json(
        { error: 'Invalid status. Must be "accepted" or "denied"' },
        { status: 400 }
      );
    }

    updateApplicationStatus(
      applicationId,
      status,
      session.user.id,
      session.user.name || 'Unknown',
      reason
    );

    const updatedApplication = getApplicationById(applicationId);

    return NextResponse.json({ application: updatedApplication });
  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
