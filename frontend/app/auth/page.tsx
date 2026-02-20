'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function AuthPage() {
  const router = useRouter();
  const [signup, setSignup] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (window.location.search.includes('mode=signup')) setSignup(true);
  }, []);

  const title = useMemo(() => (signup ? 'Create your Harmony account' : 'Welcome back'), [signup]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError('');
    setMessage('');

    if (signup) {
      const registerRes = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          firstName: fd.get('firstName'),
          lastName: fd.get('lastName'),
          phone: fd.get('phone'),
          email: fd.get('email'),
          password: fd.get('password'),
        }),
      });
      const registerJson = await registerRes.json();
      if (!registerRes.ok) return setError(registerJson.message ?? 'Could not register.');
      setMessage(registerJson.message);
    }

    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    const json = await loginRes.json();
    if (!loginRes.ok) return setError(json.message ?? 'Invalid credentials');

    localStorage.setItem('token', json.accessToken);
    localStorage.setItem('role', json.role);
    router.push(json.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  async function requestReset(email: string) {
    const res = await api('/auth/request-reset', { method: 'POST', body: JSON.stringify({ email }) });
    const json = await res.json();
    setMessage(json.message);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border bg-white shadow-xl md:grid-cols-2">
        <div className="bg-gradient-to-br from-indigo-600 to-sky-500 p-8 text-white">
          <h1 className="text-3xl font-bold">Harmony Factor</h1>
          <p className="mt-4 text-indigo-50">Secure access for users and admins in one unified authentication flow.</p>
          <p className="mt-8 rounded-xl bg-white/20 p-3 text-sm">Email verification and password-reset delivery are ready but disabled in this environment.</p>
        </div>
        <form onSubmit={onSubmit} className="p-8">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          {signup && (
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input name="firstName" placeholder="First name" className="rounded-lg border p-3" required />
              <input name="lastName" placeholder="Last name" className="rounded-lg border p-3" required />
              <input name="phone" placeholder="Phone" className="rounded-lg border p-3 md:col-span-2" />
            </div>
          )}
          <div className="mt-4 grid gap-3">
            <input type="email" name="email" placeholder="Email" className="rounded-lg border p-3" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <input type="password" name="password" placeholder="Password" className="rounded-lg border p-3" required />
          </div>
          {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
          {message && <p className="mt-3 text-sm text-emerald-700">{message}</p>}
          <button className="mt-6 w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white hover:bg-indigo-500">{signup ? 'Sign Up' : 'Login'}</button>
          <button type="button" onClick={() => setSignup((s) => !s)} className="mt-3 text-sm text-indigo-700 underline">
            {signup ? 'Already have an account? Login' : 'Need an account? Sign up'}
          </button>
          <button type="button" onClick={() => requestReset(email)} className="ml-4 text-sm text-slate-500 underline">
            Forgot password
          </button>
        </form>
      </div>
    </main>
  );
}
