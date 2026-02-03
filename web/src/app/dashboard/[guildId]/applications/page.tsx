'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ApplicationCard from '@/components/ApplicationCard';
import type { Application } from '@/types';

interface ApplicationWithForm extends Application {
  form_name: string;
}

export default function ApplicationsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const guildId = params.guildId as string;
  const statusFilter = searchParams.get('status') || '';

  const [applications, setApplications] = useState<ApplicationWithForm[]>([]);
  const [guildName, setGuildName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [appsRes, guildRes] = await Promise.all([
          fetch(`/api/applications?guildId=${guildId}${statusFilter ? `&status=${statusFilter}` : ''}`),
          fetch(`/api/guilds/${guildId}`),
        ]);

        if (!appsRes.ok) throw new Error('Failed to fetch applications');
        if (!guildRes.ok) throw new Error('Failed to fetch guild');

        const [apps, guild] = await Promise.all([appsRes.json(), guildRes.json()]);
        setApplications(apps);
        setGuildName(guild.guild?.name || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId, statusFilter]);

  const statusTabs = [
    { label: 'All', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Accepted', value: 'accepted' },
    { label: 'Denied', value: 'denied' },
  ];

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={guildName} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Applications</h1>
        </div>

        <div className="flex gap-2 mb-6">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={`/dashboard/${guildId}/applications${tab.value ? `?status=${tab.value}` : ''}`}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-discord-blurple text-white'
                  : 'bg-discord-darker text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </Link>
          ))}
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

        {!loading && !error && applications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400">No applications found.</p>
          </div>
        )}

        {!loading && !error && applications.length > 0 && (
          <div className="space-y-4">
            {applications.map((app) => (
              <ApplicationCard
                key={app.id}
                application={app}
                formName={app.form_name}
                guildId={guildId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
