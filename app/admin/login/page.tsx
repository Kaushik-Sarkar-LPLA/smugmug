export const metadata = {
  title: 'Admin Login - Pixilens',
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16 text-[#f8f0e3]">
      <form action="/api/admin/login" method="post" className="glass-panel w-full max-w-md rounded-3xl p-8">
        <p className="text-xs uppercase tracking-[0.4em] text-white/45">Pixilens</p>
        <h1 className="font-art gold-text mt-3 text-4xl font-light tracking-[0.12em]">Admin Login</h1>
        {params.error ? <p className="mt-5 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">Invalid login.</p> : null}
        <input type="hidden" name="next" value={params.next || '/admin'} />
        <label className="mt-8 block text-xs uppercase tracking-[0.22em] text-white/55">
          Username
          <input name="username" autoComplete="username" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white/40" />
        </label>
        <label className="mt-5 block text-xs uppercase tracking-[0.22em] text-white/55">
          Password
          <input name="password" type="password" autoComplete="current-password" className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-base text-white outline-none focus:border-white/40" />
        </label>
        <button className="glass-button mt-8 w-full" type="submit">Log in</button>
      </form>
    </main>
  );
}
