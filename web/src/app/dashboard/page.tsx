'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import GuildCard from '@/components/GuildCard';
import type { GuildWithBot } from '@/types';

export default function DashboardPage() {
  const [guilds, setGuilds] = useState<GuildWithBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGuilds() {
      try {
        const res = await fetch('/api/guilds');
        if (!res.ok) throw new Error('Failed to fetch guilds');
        const data = await res.json();
        setGuilds(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchGuilds();
  }, []);

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Your Servers</h1>

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

        {!loading && !error && guilds.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">
              No servers found. You need to be a member of a server where the bot is installed.
            </p>
          </div>
        )}

        {!loading && !error && guilds.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => (
              <GuildCard
                key={guild.id}
                id={guild.id}
                name={guild.name}
                icon={guild.icon}
                hasBot={guild.hasBot}
                isAdmin={guild.isAdmin}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
