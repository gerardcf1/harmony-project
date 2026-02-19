import Link from 'next/link';

export function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="rounded-3xl bg-gradient-to-br from-indigo-500/30 via-sky-500/20 to-emerald-500/20 p-10 shadow-2xl">
        <h1 className="text-4xl font-bold md:text-6xl">Harmony Factor</h1>
        <p className="mt-4 max-w-2xl text-lg text-slate-200">Track holistic well-being across life categories with beautiful analytics and guided progress.</p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link href="/auth" className="rounded-xl bg-indigo-500 px-6 py-3 font-semibold hover:bg-indigo-400">Login</Link>
          <Link href="/auth?mode=signup" className="rounded-xl border border-slate-200/40 px-6 py-3 font-semibold hover:bg-slate-800">Sign Up</Link>
        </div>
      </div>
    </section>
  );
}
