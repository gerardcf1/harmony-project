'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '../../lib/api';

export default function AuthPage() {
  const params = useSearchParams();
  const router = useRouter();
  const initialSignup = params.get('mode') === 'signup';
  const [signup, setSignup] = useState(initialSignup);
  const [error, setError] = useState('');

  const title = useMemo(() => (signup ? 'Create Account' : 'Welcome Back'), [signup]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setError('');

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
      if (!registerRes.ok) {
        setError('Could not register.');
        return;
      }
    }

    const loginRes = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: fd.get('email'), password: fd.get('password') }),
    });
    const json = await loginRes.json();
    if (!loginRes.ok) {
      setError(json.message ?? 'Invalid credentials');
      return;
    }

    localStorage.setItem('token', json.accessToken);
    localStorage.setItem('role', json.role);
    router.push(json.role === 'ADMIN' ? '/admin' : '/dashboard');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <form onSubmit={onSubmit} className="w-full rounded-2xl bg-slate-900 p-8 shadow-2xl">
        <h1 className="text-3xl font-bold">{title}</h1>
        {signup && (
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input name="firstName" placeholder="First name" className="rounded bg-slate-800 p-3" required />
            <input name="lastName" placeholder="Last name" className="rounded bg-slate-800 p-3" required />
            <input name="phone" placeholder="Phone" className="rounded bg-slate-800 p-3 md:col-span-2" />
          </div>
        )}
        <div className="mt-4 grid gap-3">
          <input type="email" name="email" placeholder="Email" className="rounded bg-slate-800 p-3" required />
          <input type="password" name="password" placeholder="Password" className="rounded bg-slate-800 p-3" required />
        </div>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        <button className="mt-6 w-full rounded bg-indigo-500 p-3 font-semibold hover:bg-indigo-400">{signup ? 'Sign Up' : 'Login'}</button>
        <button type="button" onClick={() => setSignup((s) => !s)} className="mt-3 text-sm text-slate-300 underline">
          {signup ? 'Already have an account? Login' : 'No account? Sign up'}
        </button>
      </form>
    </main>
  );
}
