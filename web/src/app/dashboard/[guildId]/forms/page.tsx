'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import type { Form, Question } from '@/types';

interface FormWithQuestions extends Form {
  questions: Question[];
}

export default function FormsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [forms, setForms] = useState<FormWithQuestions[]>([]);
  const [guildName, setGuildName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [formsRes, guildRes] = await Promise.all([
          fetch(`/api/forms?guildId=${guildId}`),
          fetch(`/api/guilds/${guildId}`),
        ]);

        if (!formsRes.ok) throw new Error('Failed to fetch forms');
        if (!guildRes.ok) throw new Error('Failed to fetch guild');

        const [formsData, guildData] = await Promise.all([formsRes.json(), guildRes.json()]);
        setForms(formsData);
        setGuildName(guildData.guild?.name || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId]);

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={guildName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Application Forms</h1>
          <Link
            href={`/dashboard/${guildId}/forms/new`}
            className="bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Create Form
          </Link>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-blurple"></div>
          </div>
        )}

        {error && (
          <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded">
            {error}
          </div>
        )}

        {!loading && !error && forms.length === 0 && (
          <div className="text-center py-12 bg-discord-darker rounded-lg border border-gray-700">
            <p className="text-gray-400 mb-4">No forms created yet.</p>
            <Link
              href={`/dashboard/${guildId}/forms/new`}
              className="text-discord-blurple hover:underline"
            >
              Create your first form
            </Link>
          </div>
        )}

        {!loading && !error && forms.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {forms.map((form) => (
              <Link
                key={form.id}
                href={`/dashboard/${guildId}/forms/${form.id}`}
                className="bg-discord-darker rounded-lg p-6 border border-gray-700 hover:border-discord-blurple transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white">{form.name}</h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      form.enabled
                        ? 'bg-discord-green/20 text-discord-green'
                        : 'bg-gray-600/20 text-gray-400'
                    }`}
                  >
                    {form.enabled ? 'Active' : 'Disabled'}
                  </span>
                </div>
                {form.description && (
                  <p className="text-sm text-gray-400 mb-3">{form.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  {form.questions.length} question{form.questions.length !== 1 ? 's' : ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
