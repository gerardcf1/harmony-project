'use client';

import { useEffect, useMemo, useState } from 'react';
import { api } from '../../lib/api';

type User = { id: string; firstName: string; lastName: string; email: string; phone?: string; isBlocked: boolean; submissions: any[] };

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [query, setQuery] = useState('');
  const [showPhone, setShowPhone] = useState(true);

  async function load() {
    const token = localStorage.getItem('token');
    const res = await api('/admin/users', { headers: { Authorization: `Bearer ${token}` } });
    setUsers(await res.json());
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => users.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(query.toLowerCase())), [users, query]);

  async function toggleBlock(userId: string, current: boolean) {
    const token = localStorage.getItem('token');
    await api(`/admin/users/${userId}/block`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ isBlocked: !current }),
    });
    load();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <input placeholder="Search users" className="rounded bg-slate-900 p-2" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={showPhone} onChange={(e) => setShowPhone(e.target.checked)} /> Show phone</label>
        <a href={`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/admin/export/csv`} className="rounded bg-emerald-600 px-3 py-2 text-sm">Export CSV</a>
      </div>
      <div className="mt-6 overflow-auto rounded-xl bg-slate-900 p-4">
        <table className="w-full text-left text-sm">
          <thead><tr><th>Name</th><th>Email</th>{showPhone && <th>Phone</th>}<th>Submissions</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-slate-800">
                <td>{u.firstName} {u.lastName}</td>
                <td>{u.email}</td>
                {showPhone && <td>{u.phone ?? '-'}</td>}
                <td>{u.submissions.length}</td>
                <td className="space-x-2 py-2">
                  <button className="rounded bg-amber-600 px-2 py-1" onClick={() => toggleBlock(u.id, u.isBlocked)}>{u.isBlocked ? 'Unblock' : 'Block'}</button>
                  <button className="rounded bg-sky-700 px-2 py-1">Edit</button>
                  {/* <button className="rounded bg-rose-700 px-2 py-1">Delete</button> */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
