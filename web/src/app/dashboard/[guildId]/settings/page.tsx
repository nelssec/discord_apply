'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Form } from '@/types';

interface GuildData {
  guild: { id: string; name: string } | null;
  roles: Array<{ id: string; name: string; color: number }>;
  channels: Array<{ id: string; name: string }>;
  categories: Array<{ id: string; name: string }>;
}

interface FormWithQuestions extends Form {
  questions: unknown[];
}

export default function SettingsPage() {
  const params = useParams();
  const guildId = params.guildId as string;

  const [guildData, setGuildData] = useState<GuildData | null>(null);
  const [forms, setForms] = useState<FormWithQuestions[]>([]);
  const [selectedForm, setSelectedForm] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [logChannelId, setLogChannelId] = useState('');
  const [ticketCategoryId, setTicketCategoryId] = useState('');
  const [managerRoleIds, setManagerRoleIds] = useState<string[]>([]);
  const [acceptRoleIds, setAcceptRoleIds] = useState<string[]>([]);
  const [denyRoleIds, setDenyRoleIds] = useState<string[]>([]);
  const [pingRoleIds, setPingRoleIds] = useState<string[]>([]);
  const [completionMessage, setCompletionMessage] = useState('');
  const [acceptMessage, setAcceptMessage] = useState('');
  const [denyMessage, setDenyMessage] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    async function fetchData() {
      try {
        const [guildRes, formsRes] = await Promise.all([
          fetch(`/api/guilds/${guildId}`),
          fetch(`/api/forms?guildId=${guildId}`),
        ]);

        if (!guildRes.ok) throw new Error('Failed to fetch guild');
        if (!formsRes.ok) throw new Error('Failed to fetch forms');

        const [guild, formsData] = await Promise.all([guildRes.json(), formsRes.json()]);
        setGuildData(guild);
        setForms(formsData);

        if (formsData.length > 0) {
          setSelectedForm(formsData[0].id);
          loadFormSettings(formsData[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [guildId]);

  function loadFormSettings(form: Form) {
    setLogChannelId(form.log_channel_id || '');
    setTicketCategoryId(form.ticket_category_id || '');
    setManagerRoleIds(form.manager_role_ids || []);
    setAcceptRoleIds(form.accept_role_ids || []);
    setDenyRoleIds(form.deny_role_ids || []);
    setPingRoleIds(form.ping_role_ids || []);
    setCompletionMessage(form.completion_message || '');
    setAcceptMessage(form.accept_message || '');
    setDenyMessage(form.deny_message || '');
    setCooldownSeconds(form.cooldown_seconds || 0);
  }

  function handleFormChange(formId: number) {
    setSelectedForm(formId);
    const form = forms.find((f) => f.id === formId);
    if (form) loadFormSettings(form);
  }

  function toggleRole(roleId: string, list: string[], setter: (v: string[]) => void) {
    if (list.includes(roleId)) {
      setter(list.filter((id) => id !== roleId));
    } else {
      setter([...list, roleId]);
    }
  }

  async function handleSave() {
    if (!selectedForm) return;

    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch(`/api/forms/${selectedForm}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          log_channel_id: logChannelId || null,
          ticket_category_id: ticketCategoryId || null,
          manager_role_ids: managerRoleIds,
          accept_role_ids: acceptRoleIds,
          deny_role_ids: denyRoleIds,
          ping_role_ids: pingRoleIds,
          completion_message: completionMessage || null,
          accept_message: acceptMessage || null,
          deny_message: denyMessage || null,
          cooldown_seconds: cooldownSeconds,
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-discord-dark">
        <Navbar guildId={guildId} guildName={guildData?.guild?.name} />
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-discord-blurple"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={guildData?.guild?.name} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Form Settings</h1>

        {error && (
          <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-discord-green/20 border border-discord-green text-discord-green px-4 py-3 rounded mb-6">
            Settings saved successfully!
          </div>
        )}

        {forms.length === 0 ? (
          <div className="text-center py-12 bg-discord-darker rounded-lg border border-gray-700">
            <p className="text-gray-400">No forms created yet. Create a form first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Form to Configure
              </label>
              <select
                value={selectedForm || ''}
                onChange={(e) => handleFormChange(parseInt(e.target.value))}
                className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
              >
                {forms.map((form) => (
                  <option key={form.id} value={form.id}>
                    {form.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Channels</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Log Channel
                  </label>
                  <select
                    value={logChannelId}
                    onChange={(e) => setLogChannelId(e.target.value)}
                    className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
                  >
                    <option value="">None</option>
                    {guildData?.channels.map((channel) => (
                      <option key={channel.id} value={channel.id}>
                        #{channel.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Where applications will be posted for review
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ticket Category
                  </label>
                  <select
                    value={ticketCategoryId}
                    onChange={(e) => setTicketCategoryId(e.target.value)}
                    className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
                  >
                    <option value="">None (no tickets)</option>
                    {guildData?.categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Category where ticket channels will be created
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Roles</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Manager Roles (can accept/deny)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {guildData?.roles.slice(0, 20).map((role) => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id, managerRoleIds, setManagerRoleIds)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          managerRoleIds.includes(role.id)
                            ? 'bg-discord-blurple text-white'
                            : 'bg-discord-dark text-gray-400 hover:text-white'
                        }`}
                      >
                        @{role.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Accept Roles (given on accept)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {guildData?.roles.slice(0, 20).map((role) => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id, acceptRoleIds, setAcceptRoleIds)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          acceptRoleIds.includes(role.id)
                            ? 'bg-discord-green text-white'
                            : 'bg-discord-dark text-gray-400 hover:text-white'
                        }`}
                      >
                        @{role.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Ping Roles (notified on new applications)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {guildData?.roles.slice(0, 20).map((role) => (
                      <button
                        key={role.id}
                        onClick={() => toggleRole(role.id, pingRoleIds, setPingRoleIds)}
                        className={`px-3 py-1 rounded text-sm transition-colors ${
                          pingRoleIds.includes(role.id)
                            ? 'bg-discord-yellow text-black'
                            : 'bg-discord-dark text-gray-400 hover:text-white'
                        }`}
                      >
                        @{role.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Messages</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Completion Message
                  </label>
                  <textarea
                    value={completionMessage}
                    onChange={(e) => setCompletionMessage(e.target.value)}
                    placeholder="Sent to user after submitting application"
                    rows={2}
                    className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Accept Message
                  </label>
                  <textarea
                    value={acceptMessage}
                    onChange={(e) => setAcceptMessage(e.target.value)}
                    placeholder="Sent to user when application is accepted"
                    rows={2}
                    className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Deny Message
                  </label>
                  <textarea
                    value={denyMessage}
                    onChange={(e) => setDenyMessage(e.target.value)}
                    placeholder="Sent to user when application is denied"
                    rows={2}
                    className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
              <h2 className="text-lg font-semibold text-white mb-4">Other Settings</h2>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cooldown (hours)
                </label>
                <input
                  type="number"
                  min="0"
                  value={Math.floor(cooldownSeconds / 3600)}
                  onChange={(e) => setCooldownSeconds(parseInt(e.target.value || '0') * 3600)}
                  className="w-32 bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  How long users must wait before applying again (0 = no cooldown)
                </p>
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
