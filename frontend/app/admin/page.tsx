'use client';

import { useEffect, useMemo, useState } from 'react';
import { api, authHeaders, getApiBaseUrl, getSession } from '../../lib/api';
import { useRouter } from 'next/navigation';
import { DashboardShell } from '../../components/DashboardShell';

type User = { id: string; firstName: string; lastName: string; email: string; phone?: string; isBlocked: boolean; submissions: any[] };
type Submission = { id: string; label: string; normalizedScore: number; createdAt: string; user: { firstName: string; lastName: string; email: string }; form: { title: string } };
type Form = { id: string; title: string; description?: string; categories: Array<{ id: string; name: string; weight: number }>; assignments: Array<{ userId: string }> };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [forms, setForms] = useState<Form[]>([]);
  const [query, setQuery] = useState('');
  const [showCols, setShowCols] = useState({ phone: true, email: true, submissions: true });
  const router = useRouter();

  async function load() {
    const session = getSession();
    if (!session || session.role !== 'ADMIN') return router.push('/auth');
    const headers = authHeaders();
    const [u, s, f] = await Promise.all([api('/admin/users', { headers }), api('/admin/submissions', { headers }), api('/admin/forms', { headers })]);
    setUsers(await u.json());
    setSubmissions(await s.json());
    setForms(await f.json());
  }

  useEffect(() => {
    load();
  }, []);

  const filteredUsers = useMemo(() => users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  async function toggleBlock(userId: string, current: boolean) {
    await api(`/admin/users/${userId}/block`, { method: 'PATCH', headers: authHeaders(), body: JSON.stringify({ isBlocked: !current }) });
    load();
  }

  async function removeSubmission(id: string) {
    await api(`/admin/submissions/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  }

  async function assignForm(userId: string, formId: string) {
    await api('/admin/assign-form', { method: 'POST', headers: authHeaders(), body: JSON.stringify({ userId, formId }) });
    load();
  }

  async function tweakWeight(form: Form, categoryId: string, weight: number) {
    const full = await (await api(`/forms/${form.id}`, { headers: authHeaders() })).json();
    full.categories = full.categories.map((c: any) => (c.id === categoryId ? { ...c, weight } : c));
    await api(`/admin/forms/${form.id}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ title: full.title, description: full.description, isDefault: full.isDefault, categories: full.categories }),
    });
    load();
  }

  return (
    <DashboardShell isAdmin>
      <main className="space-y-4">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold">Admin controls</h1>
          <p className="mt-1 text-sm text-slate-500">Manage users, form structures, submissions, exports and contact operations.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input placeholder="Search users" className="rounded-lg border px-3 py-2" value={query} onChange={(e) => setQuery(e.target.value)} />
            <button className="rounded-lg border px-3 py-2" onClick={() => setShowCols((s) => ({ ...s, phone: !s.phone }))}>Toggle Phone</button>
            <button className="rounded-lg border px-3 py-2" onClick={() => setShowCols((s) => ({ ...s, email: !s.email }))}>Toggle Email</button>
            <a href={`${getApiBaseUrl()}/admin/export/csv`} className="rounded-lg bg-emerald-600 px-3 py-2 text-white">Export CSV</a>
            <a href={`${getApiBaseUrl()}/admin/export/excel`} className="rounded-lg bg-sky-600 px-3 py-2 text-white">Export Excel</a>
            <a href={`${getApiBaseUrl()}/admin/export/pdf`} className="rounded-lg bg-slate-700 px-3 py-2 text-white">Export PDF*</a>
          </div>
        </section>

        <section className="overflow-auto rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Users</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>Name</th>{showCols.email && <th>Email</th>}{showCols.phone && <th>Phone</th>}{showCols.submissions && <th>Submissions</th>}<th>Status</th><th>Assign</th><th>Actions</th></tr></thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="py-2">{u.firstName} {u.lastName}</td>
                  {showCols.email && <td>{u.email}</td>}
                  {showCols.phone && <td>{u.phone || '-'}</td>}
                  {showCols.submissions && <td>{u.submissions.length}</td>}
                  <td>{u.isBlocked ? 'Blocked' : 'Active'}</td>
                  <td><select className="rounded border px-2 py-1" onChange={(e) => e.target.value && assignForm(u.id, e.target.value)} defaultValue=""><option value="">Assign form...</option>{forms.map((f) => <option key={f.id} value={f.id}>{f.title}</option>)}</select></td>
                  <td><button className="rounded bg-amber-500 px-2 py-1 text-white" onClick={() => toggleBlock(u.id, u.isBlocked)}>{u.isBlocked ? 'Unblock' : 'Block'}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Forms and category weights</h2>
          <div className="space-y-3">
            {forms.map((form) => (
              <div key={form.id} className="rounded-xl border p-3">
                <p className="font-semibold">{form.title}</p>
                <div className="mt-2 grid gap-2 md:grid-cols-3">
                  {form.categories.map((c) => (
                    <label key={c.id} className="text-sm">{c.name}
                      <input type="number" step="0.1" defaultValue={c.weight} className="mt-1 w-full rounded border px-2 py-1" onBlur={(e) => tweakWeight(form, c.id, Number(e.target.value))} />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-auto rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="mb-2 font-semibold">Recent submissions</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-slate-500"><th>User</th><th>Form</th><th>Score</th><th>Label</th><th>Date</th><th>Actions</th></tr></thead>
            <tbody>
              {submissions.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="py-2">{s.user.firstName} {s.user.lastName}</td>
                  <td>{s.form.title}</td><td>{s.normalizedScore}</td><td>{s.label}</td><td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td><button className="rounded bg-rose-600 px-2 py-1 text-white" onClick={() => removeSubmission(s.id)}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </DashboardShell>
  );
}
