'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import { getUserAvatarUrl } from '@/lib/discord';
import type { Application, Form, Question } from '@/types';

interface ApplicationData {
  application: Application;
  form: Form;
  questions: Question[];
  canReview: boolean;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  const applicationId = params.id as string;

  const [data, setData] = useState<ApplicationData | null>(null);
  const [guildName, setGuildName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState<'accept' | 'deny' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [appRes, guildRes] = await Promise.all([
          fetch(`/api/applications/${applicationId}`),
          fetch(`/api/guilds/${guildId}`),
        ]);

        if (!appRes.ok) throw new Error('Failed to fetch application');
        if (!guildRes.ok) throw new Error('Failed to fetch guild');

        const [appData, guildData] = await Promise.all([appRes.json(), guildRes.json()]);
        setData(appData);
        setGuildName(guildData.guild?.name || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [applicationId, guildId]);

  async function handleReview(status: 'accepted' | 'denied') {
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, reason: reason || undefined }),
      });

      if (!res.ok) throw new Error('Failed to update application');

      router.push(`/dashboard/${guildId}/applications`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setReviewLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-dark">
        <Navbar guildId={guildId} guildName={guildName} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-blurple"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-discord-dark">
        <Navbar guildId={guildId} guildName={guildName} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded">
            {error || 'Application not found'}
          </div>
        </main>
      </div>
    );
  }

  const { application, form, questions, canReview } = data;
  const avatarUrl = getUserAvatarUrl(
    application.user_id,
    application.avatar,
    application.discriminator || undefined
  );

  const statusColors = {
    pending: 'bg-discord-yellow/20 text-discord-yellow border-discord-yellow',
    accepted: 'bg-discord-green/20 text-discord-green border-discord-green',
    denied: 'bg-discord-red/20 text-discord-red border-discord-red',
  };

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={guildName} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-discord-darker rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Image
                  src={avatarUrl}
                  alt={application.username}
                  width={64}
                  height={64}
                  className="rounded-full"
                />
                <div>
                  <h1 className="text-xl font-bold text-white">
                    {application.username}
                  </h1>
                  <p className="text-gray-400">{form.name}</p>
                  <p className="text-sm text-gray-500">
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span
                className={`px-4 py-2 rounded-full text-sm font-medium border ${
                  statusColors[application.status]
                }`}
              >
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {questions.map((question) => (
              <div key={question.id}>
                <h3 className="text-sm font-medium text-gray-400 mb-2">
                  {question.label}
                </h3>
                <p className="text-white bg-discord-dark p-3 rounded-lg">
                  {application.answers[question.id.toString()] || 'No answer provided'}
                </p>
              </div>
            ))}
          </div>

          {application.status !== 'pending' && (
            <div className="p-6 border-t border-gray-700 bg-discord-dark/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">
                    Reviewed by <span className="text-white">{application.reviewer_username}</span>
                  </p>
                  {application.reason && (
                    <p className="text-sm text-gray-400 mt-1">
                      Reason: <span className="text-white">{application.reason}</span>
                    </p>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {application.resolved_at && new Date(application.resolved_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {canReview && application.status === 'pending' && (
            <div className="p-6 border-t border-gray-700">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowReasonModal('accept')}
                  disabled={reviewLoading}
                  className="flex-1 bg-discord-green hover:bg-discord-green/80 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Accept
                </button>
                <button
                  onClick={() => setShowReasonModal('deny')}
                  disabled={reviewLoading}
                  className="flex-1 bg-discord-red hover:bg-discord-red/80 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  Deny
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {showReasonModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-discord-darker rounded-lg p-6 max-w-md w-full border border-gray-700">
            <h2 className="text-lg font-bold text-white mb-4">
              {showReasonModal === 'accept' ? 'Accept Application' : 'Deny Application'}
            </h2>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full bg-discord-dark text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
              rows={4}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setShowReasonModal(null);
                  setReason('');
                }}
                className="flex-1 bg-discord-dark hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReview(showReasonModal === 'accept' ? 'accepted' : 'denied')}
                disabled={reviewLoading}
                className={`flex-1 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                  showReasonModal === 'accept'
                    ? 'bg-discord-green hover:bg-discord-green/80'
                    : 'bg-discord-red hover:bg-discord-red/80'
                }`}
              >
                {reviewLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
