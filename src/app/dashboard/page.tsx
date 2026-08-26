import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

const SECTIONS = [
  { href: '/dashboard/menu', label: 'Menu', description: 'Categories & items' },
  { href: '/dashboard/store', label: 'Store', description: 'Pantry products' },
  {
    href: '/dashboard/reservations',
    label: 'Reservations',
    description: 'Incoming bookings',
  },
  {
    href: '/dashboard/contacts',
    label: 'Contacts',
    description: 'Messages from the site',
  },
];

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl text-roasted-coffee">
              Dashboard
            </h1>
            <p className="mt-1 font-sans text-sm text-roasted-coffee/60">
              Signed in as {user?.email}
            </p>
          </div>
          <form action="/dashboard/logout" method="post">
            <button className="font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot underline">
              Sign out
            </button>
          </form>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6 hover:border-clay-pot transition-colors"
            >
              <h2 className="font-display text-xl text-roasted-coffee">
                {section.label}
              </h2>
              <p className="mt-1 font-sans text-sm text-roasted-coffee/60">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
