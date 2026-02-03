'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function NewFormPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/forms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guildId, name, description }),
      });

      if (!res.ok) throw new Error('Failed to create form');

      const data = await res.json();
      router.push(`/dashboard/${guildId}/forms/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Create New Form</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Form Name
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 45))}
              required
              maxLength={45}
              placeholder="e.g., Staff Application"
              className="w-full bg-discord-darker text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
            />
            <p className={`text-xs mt-1 ${name.length >= 40 ? 'text-discord-yellow' : 'text-gray-500'}`}>
              {name.length}/45 characters
            </p>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of what this form is for"
              rows={3}
              className="w-full bg-discord-darker text-white px-4 py-3 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 bg-discord-darker hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name}
              className="flex-1 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Form'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
