import Link from 'next/link';

export function Hero() {
  return (
    <section className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-8 px-6 py-16 md:grid-cols-2">
      <div>
        <p className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">Holistic wellness intelligence</p>
        <h1 className="mt-5 text-5xl font-bold leading-tight text-slate-900 md:text-6xl">Harmony Factor</h1>
        <p className="mt-5 text-lg text-slate-600">
          A modern platform to understand life balance, measure progress, and take action with guided forms and meaningful insights.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/auth" className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white shadow hover:bg-indigo-500">
            Login
          </Link>
          <Link href="/auth?mode=signup" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-100">
            Sign Up
          </Link>
        </div>
      </div>
      <div className="rounded-3xl border border-indigo-100 bg-white p-7 shadow-xl">
        <h2 className="text-xl font-semibold text-slate-900">Why teams choose Harmony Factor</h2>
        <ul className="mt-4 space-y-3 text-slate-600">
          <li>• Beautiful dashboards for trends and category score breakdowns.</li>
          <li>• Flexible form builder with weighted categories and answer mappings.</li>
          <li>• Role-based administration with exports and user controls.</li>
        </ul>
      </div>
    </section>
  );
}
