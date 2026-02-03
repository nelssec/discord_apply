'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import type { Form, Question, QuestionType } from '@/types';

interface FormData {
  form: Form;
  questions: Question[];
}

interface QuestionInput {
  id?: number;
  label: string;
  type: QuestionType;
  placeholder: string;
  required: boolean;
  options: string[];
}

export default function EditFormPage() {
  const params = useParams();
  const router = useRouter();
  const guildId = params.guildId as string;
  const formId = params.formId as string;

  const [data, setData] = useState<FormData | null>(null);
  const [guildName, setGuildName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [questions, setQuestions] = useState<QuestionInput[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [formRes, guildRes] = await Promise.all([
          fetch(`/api/forms/${formId}`),
          fetch(`/api/guilds/${guildId}`),
        ]);

        if (!formRes.ok) throw new Error('Failed to fetch form');
        if (!guildRes.ok) throw new Error('Failed to fetch guild');

        const [formData, guildData] = await Promise.all([formRes.json(), guildRes.json()]);
        setData(formData);
        setGuildName(guildData.guild?.name || '');

        setName(formData.form.name);
        setDescription(formData.form.description || '');
        setEnabled(formData.form.enabled);
        setQuestions(
          formData.questions.map((q: Question) => ({
            id: q.id,
            label: q.label,
            type: q.type,
            placeholder: q.placeholder || '',
            required: q.required,
            options: q.options || [],
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [formId, guildId]);

  function addQuestion() {
    if (questions.length >= 5) {
      setError('Maximum 5 questions allowed (Discord modal limit)');
      return;
    }
    setQuestions([
      ...questions,
      { label: '', type: 'text', placeholder: '', required: true, options: [] },
    ]);
  }

  function removeQuestion(index: number) {
    setQuestions(questions.filter((_, i) => i !== index));
  }

  function updateQuestion(index: number, updates: Partial<QuestionInput>) {
    setQuestions(
      questions.map((q, i) => (i === index ? { ...q, ...updates } : q))
    );
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/forms/${formId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description: description || null,
          enabled,
          questions: questions.map((q) => ({
            label: q.label,
            type: q.type,
            placeholder: q.placeholder || null,
            required: q.required,
            options: q.type === 'choice' ? q.options : null,
          })),
        }),
      });

      if (!res.ok) throw new Error('Failed to save form');

      router.push(`/dashboard/${guildId}/forms`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this form? This cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/forms/${formId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete form');
      router.push(`/dashboard/${guildId}/forms`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
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

  return (
    <div className="min-h-screen bg-discord-dark">
      <Navbar guildId={guildId} guildName={guildName} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-white">Edit Form</h1>
          <button
            onClick={handleDelete}
            className="text-discord-red hover:text-discord-red/80 text-sm"
          >
            Delete Form
          </button>
        </div>

        {error && (
          <div className="bg-discord-red/20 border border-discord-red text-discord-red px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-6">
          <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Settings</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Form Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-discord-dark text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-discord-blurple focus:outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enabled"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-gray-600 text-discord-blurple focus:ring-discord-blurple"
                />
                <label htmlFor="enabled" className="text-sm text-gray-300">
                  Form is active and accepting applications
                </label>
              </div>
            </div>
          </div>

          <div className="bg-discord-darker rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Questions</h2>
              <button
                onClick={addQuestion}
                disabled={questions.length >= 5}
                className="text-discord-blurple hover:text-discord-blurple/80 text-sm font-medium disabled:opacity-50"
              >
                + Add Question
              </button>
            </div>

            {questions.length === 0 && (
              <p className="text-gray-400 text-sm">
                No questions yet. Add questions to your form.
              </p>
            )}

            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className="bg-discord-dark rounded-lg p-4 border border-gray-600"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm text-gray-400">Question {index + 1}</span>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-discord-red hover:text-discord-red/80 text-sm"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <input
                        type="text"
                        value={question.label}
                        onChange={(e) => updateQuestion(index, { label: e.target.value.slice(0, 45) })}
                        placeholder="Question text"
                        maxLength={45}
                        className="w-full bg-discord-darker text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-blurple focus:outline-none"
                      />
                      <p className={`text-xs mt-1 ${question.label.length >= 40 ? 'text-discord-yellow' : 'text-gray-500'}`}>
                        {question.label.length}/45 characters
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, { type: e.target.value as QuestionType })}
                        className="bg-discord-darker text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-blurple focus:outline-none"
                      >
                        <option value="text">Short Text</option>
                        <option value="paragraph">Paragraph</option>
                      </select>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`required-${index}`}
                          checked={question.required}
                          onChange={(e) => updateQuestion(index, { required: e.target.checked })}
                          className="rounded border-gray-600 text-discord-blurple focus:ring-discord-blurple"
                        />
                        <label htmlFor={`required-${index}`} className="text-sm text-gray-300">
                          Required
                        </label>
                      </div>
                    </div>

                    <input
                      type="text"
                      value={question.placeholder}
                      onChange={(e) => updateQuestion(index, { placeholder: e.target.value.slice(0, 100) })}
                      placeholder="Placeholder text (optional)"
                      maxLength={100}
                      className="w-full bg-discord-darker text-white px-3 py-2 rounded border border-gray-600 focus:border-discord-blurple focus:outline-none text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Discord limits: Max 5 questions, 45 chars per question label, 100 chars per placeholder.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => router.back()}
              className="flex-1 bg-discord-darker hover:bg-gray-700 text-white px-4 py-3 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !name || questions.some((q) => !q.label)}
              className="flex-1 bg-discord-blurple hover:bg-discord-blurple/80 text-white px-4 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
