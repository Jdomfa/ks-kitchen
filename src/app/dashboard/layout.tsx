import Link from 'next/link';

const navigation = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/dashboard/reservations', label: 'Reservations' },
  { href: '/dashboard/menu', label: 'Menu' },
  { href: '/dashboard/store', label: 'Store' },
  { href: '/dashboard/contacts', label: 'Contacts' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f5f1ea] text-[#2f2924]">
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-black/10 bg-[#ebe3d7] lg:flex lg:flex-col">
          <div className="border-b border-black/10 px-6 py-6">
            <Link
              href="/dashboard"
              className="text-xl font-medium tracking-tight"
            >
              K's Kitchen
            </Link>

            <p className="mt-1 text-xs text-black/45">
              Admin Dashboard
            </p>
          </div>

          <nav className="flex-1 px-4 py-6">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/40">
              Management
            </p>

            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block rounded-lg px-3 py-2.5 text-sm text-black/65 transition hover:bg-black/5 hover:text-black"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>

          <div className="border-t border-black/10 p-4">
            <Link
              href="/"
              className="block rounded-lg px-3 py-2.5 text-sm text-black/50 transition hover:bg-black/5 hover:text-black"
            >
              ← View website
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-black/10 bg-[#f5f1ea] px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium">K's Kitchen</p>
              <p className="text-xs text-black/45">
                Administration
              </p>
            </div>

            <Link
              href="/"
              className="text-sm text-black/50 transition hover:text-black"
            >
              View site
            </Link>
          </header>

          <main className="px-6 py-8 lg:px-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}