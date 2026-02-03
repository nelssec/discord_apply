'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';

interface GuildData {
  guild: {
    id: string;
    name: string;
    icon: string | null;
  } | null;
  stats: {
    pending: number;
    accepted: number;
    denied: number;
  };
}

export default function GuildDashboardPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [data, setData] = useState<GuildData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/guilds/${guildId}`);
        if (!res.ok) throw new Error('Failed to fetch guild data');
        const guildData = await res.json();
        setData(guildData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-dark">
        <Navbar />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-blurple"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-discord-dark">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded">
            {error}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={data?.guild?.name} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Pending</h3>
            <p className="text-3xl font-bold text-discord-yellow">
              {data?.stats.pending || 0}
            </p>
          </div>
          <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Accepted</h3>
            <p className="text-3xl font-bold text-discord-green">
              {data?.stats.accepted || 0}
            </p>
          </div>
          <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
            <h3 className="text-gray-400 text-sm font-medium mb-2">Denied</h3>
            <p className="text-3xl font-bold text-discord-red">
              {data?.stats.denied || 0}
            </p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Link
            href={`/dashboard/${guildId}/applications`}
            className="bg-discord-darker rounded-lg p-6 border border-gray-700 hover:border-discord-blurple transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              View Applications
            </h3>
            <p className="text-gray-400 text-sm">
              Review pending applications and manage applicants
            </p>
          </Link>

          <Link
            href={`/dashboard/${guildId}/forms`}
            className="bg-discord-darker rounded-lg p-6 border border-gray-700 hover:border-discord-blurple transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">
              Manage Forms
            </h3>
            <p className="text-gray-400 text-sm">
              Create and configure application forms
            </p>
          </Link>

          <Link
            href={`/dashboard/${guildId}/settings`}
            className="bg-discord-darker rounded-lg p-6 border border-gray-700 hover:border-discord-blurple transition-colors"
          >
            <h3 className="text-lg font-semibold text-white mb-2">Settings</h3>
            <p className="text-gray-400 text-sm">
              Configure channels, roles, and messages
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
