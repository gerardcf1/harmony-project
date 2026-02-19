'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Submission = { id: string; normalizedScore: number; label: string; createdAt: string; form: { title: string } };

type Data = { submissions: Submission[]; stats: { averageScore: number; totalSubmissions: number } };

export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null);
  const [forms, setForms] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    api('/forms/my-submissions', { headers }).then((r) => r.json()).then(setData);
    api('/forms/my-assigned', { headers }).then((r) => r.json()).then(setForms);
  }, []);

  const chartData = useMemo(
    () => data?.submissions.slice().reverse().map((s, i) => ({ n: i + 1, score: s.normalizedScore })) ?? [],
    [data],
  );

  async function submitQuick(formId: string, questionId: string, answerOptionId: string) {
    const token = localStorage.getItem('token');
    await api(`/forms/${formId}/submit`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ responses: [{ questionId, answerOptionId }] }),
    });
    location.reload();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-bold">User Dashboard</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-slate-900 p-4">Average Score: {data?.stats.averageScore ?? 0}</div>
        <div className="rounded-xl bg-slate-900 p-4">Submissions: {data?.stats.totalSubmissions ?? 0}</div>
        <div className="rounded-xl bg-slate-900 p-4">Assigned Forms: {forms.length}</div>
      </div>
      <div className="mt-6 rounded-xl bg-slate-900 p-4">
        <h2 className="mb-4 text-xl font-semibold">Progress Trend</h2>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="#334155" />
              <XAxis dataKey="n" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#818cf8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <section className="mt-6 rounded-xl bg-slate-900 p-4">
        <h2 className="text-xl font-semibold">Generate and Fill New Form</h2>
        <div className="mt-4 space-y-4">
          {forms.map((form) => (
            <div className="rounded-lg border border-slate-700 p-3" key={form.id}>
              <p className="font-semibold">{form.title}</p>
              <p className="text-sm text-slate-400">{form.description}</p>
              {form.categories[0]?.questions[0] && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {form.categories[0].questions[0].answers.map((ans: any) => (
                    <button
                      key={ans.id}
                      className="rounded bg-indigo-600 px-3 py-1 text-sm"
                      onClick={() => submitQuick(form.id, form.categories[0].questions[0].id, ans.id)}
                    >
                      {ans.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
