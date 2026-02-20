'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode } from 'react';
import { clearSession } from '../lib/api';

export function DashboardShell({ children, isAdmin = false }: { children: ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  const links = isAdmin
    ? [{ href: '/admin', label: 'Admin Dashboard' }, { href: '/dashboard', label: 'User View' }]
    : [{ href: '/dashboard', label: 'Dashboard' }];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-4 p-4 md:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border bg-white p-4 shadow-sm">
          <p className="text-lg font-semibold text-indigo-700">Harmony Factor</p>
          <nav className="mt-4 space-y-1">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className={`block rounded-lg px-3 py-2 text-sm ${pathname === link.href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
                {link.label}
              </Link>
            ))}
          </nav>
          <button
            className="mt-6 w-full rounded-lg border px-3 py-2 text-sm text-slate-600"
            onClick={() => {
              clearSession();
              router.push('/auth');
            }}
          >
            Logout
          </button>
        </aside>
        <div>
          <header className="mb-4 rounded-2xl border bg-white px-4 py-3 shadow-sm">
            <p className="text-sm text-slate-500">Home / {isAdmin ? 'Admin Dashboard' : 'User Dashboard'}</p>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}
