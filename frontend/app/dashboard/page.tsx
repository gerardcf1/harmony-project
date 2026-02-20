'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, authHeaders, getSession } from '../../lib/api';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/DashboardShell';

type Submission = { id: string; normalizedScore: number; label: string; createdAt: string; form: { title: string }; computedScoresJson?: Record<string, { weighted: number }> };
type Form = { id: string; title: string; description?: string; categories: Array<{ name: string; questions: Array<{ id: string; prompt: string; answers: Array<{ id: string; label: string }> }> }> };

export default function DashboardPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [stats, setStats] = useState({ averageScore: 0, totalSubmissions: 0 });
  const [backendOk, setBackendOk] = useState(false);
  const router = useRouter();

  async function load() {
    const session = getSession();
    if (!session) return router.push('/auth');
    if (session.role === 'ADMIN') return router.push('/admin');

    const headers = authHeaders();
    const health = await api('/health');
    setBackendOk(health.ok);

    const mySubsRes = await api('/forms/my-submissions', { headers });
    if (mySubsRes.status === 401 || mySubsRes.status === 403) return router.push('/auth');
    const mySubsJson = await mySubsRes.json();
    setSubmissions(mySubsJson.submissions);
    setStats(mySubsJson.stats);

    const formRes = await api('/forms/my-assigned', { headers });
    setForms(await formRes.json());
  }

  useEffect(() => {
    load();
  }, []);

  const trendData = useMemo(() => submissions.slice().reverse().map((s, i) => ({ n: i + 1, score: s.normalizedScore })), [submissions]);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      Object.entries(s.computedScoresJson ?? {}).forEach(([k, v]) => {
        map[k] = (map[k] ?? 0) + v.weighted;
      });
    });
    return Object.entries(map).map(([name, score]) => ({ name, score: Number(score.toFixed(2)) }));
  }, [submissions]);

  async function submitSingle(formId: string, questionId: string, answerOptionId: string) {
    await api(`/forms/${formId}/submit`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ responses: [{ questionId, answerOptionId }] }),
    });
    load();
  }

  return (
    <DashboardShell>
      <main className="space-y-4">
        <section className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">Average Score: <strong>{stats.averageScore}</strong></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">Submissions: <strong>{stats.totalSubmissions}</strong></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">Assigned Forms: <strong>{forms.length}</strong></div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">Backend: <strong className={backendOk ? 'text-emerald-600' : 'text-rose-600'}>{backendOk ? 'Connected' : 'Down'}</strong></div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Progress trend</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}><CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="n" /><YAxis /><Tooltip /><Line type="monotone" dataKey="score" stroke="#4f46e5" /></LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-lg font-semibold">Category weighted totals</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData}><CartesianGrid stroke="#e2e8f0" /><XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} /><YAxis /><Tooltip /><Bar dataKey="score" fill="#0ea5e9" /></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Generate/fill forms</h2>
          <div className="mt-4 space-y-4">
            {forms.map((form) => (
              <div key={form.id} className="rounded-xl border p-3">
                <p className="font-semibold text-slate-900">{form.title}</p>
                <p className="text-sm text-slate-500">{form.description}</p>
                {form.categories[0]?.questions[0] && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.categories[0].questions[0].answers.map((ans) => (
                      <button key={ans.id} onClick={() => submitSingle(form.id, form.categories[0].questions[0].id, ans.id)} className="rounded-lg bg-indigo-600 px-3 py-1 text-sm text-white">
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
    </DashboardShell>
  );
}
