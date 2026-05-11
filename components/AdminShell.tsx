import Link from 'next/link';

const adminNav = [
  { label: 'Dashboard', href: '/admin' },
  { label: 'Homepage', href: '/admin/homepage' },
  { label: 'Folders', href: '/admin/folders' },
  { label: 'Galleries', href: '/admin/galleries' },
  { label: 'Media', href: '/admin/media' },
  { label: 'View Site', href: '/' },
];

export function AdminShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <main className="min-h-screen px-5 py-6 text-[#f8f0e3] md:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-white/40">Pixilens Admin</p>
          <h1 className="font-art gold-text mt-2 text-4xl font-light tracking-[0.1em]">{title}</h1>
        </div>
        <nav className="flex flex-wrap gap-2">
          {adminNav.map((item) => <Link key={item.href} href={item.href} className="glass-button">{item.label}</Link>)}
          <form action="/api/admin/logout" method="post">
            <button className="glass-button" type="submit">Logout</button>
          </form>
        </nav>
      </header>
      {children}
    </main>
  );
}
