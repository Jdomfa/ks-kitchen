'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: 'grid' },
  { href: '/dashboard/reservations', label: 'Reservations', icon: 'calendar' },
  { href: '/dashboard/menu', label: 'Menu', icon: 'utensils' },
  { href: '/dashboard/store', label: 'Store', icon: 'store' },
  { href: '/dashboard/contacts', label: 'Messages', icon: 'message' },
];

const SIDEBAR_EXPANDED = 248;
const SIDEBAR_COLLAPSED = 72;
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

function Icon({ name, size = 18 }: { name: string; size?: number }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (name) {
    case 'grid':
      return (
        <svg {...props}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case 'calendar':
      return (
        <svg {...props}>
          <rect x="3" y="4.5" width="18" height="17" rx="2" />
          <path d="M16 2.5v4M8 2.5v4M3 9h18" />
        </svg>
      );
    case 'utensils':
      return (
        <svg {...props}>
          <path d="M7 3v8M4.5 3v5a2.5 2.5 0 0 0 5 0V3" />
          <path d="M7 10.5V21" />
          <path d="M17 3v18M17 3c-2.2 1.5-3 4-3 6.5 0 1.8 1.2 3 3 3" />
        </svg>
      );
    case 'store':
      return (
        <svg {...props}>
          <path d="M4 10v10h16V10" />
          <path d="M3 10l2-6h14l2 6" />
          <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
          <path d="M9 20v-5h6v5" />
        </svg>
      );
    case 'message':
      return (
        <svg {...props}>
          <path d="M20 11.5a8 8 0 0 1-8 8H5l-2 2v-5.5a8 8 0 1 1 17-4.5Z" />
          <path d="M8 11h.01M12 11h.01M16 11h.01" />
        </svg>
      );
    case 'external':
      return (
        <svg {...props}>
          <path d="M14 4h6v6" />
          <path d="M10 14 20 4" />
          <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
        </svg>
      );
    case 'chevron-left':
      return (
        <svg {...props}>
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
    default:
      return null;
  }
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  // Restore the saved preference after mount only, so server and
  // first client render match (avoids a hydration flash/mismatch).
  useEffect(() => {
    const saved = window.localStorage.getItem('kk-sidebar-collapsed');
    if (saved === 'true') setIsCollapsed(true);
    setHasMounted(true);
  }, []);

  function toggleCollapsed() {
    setIsCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem('kk-sidebar-collapsed', String(next));
      return next;
    });
  }

  const activeItem = [...navigation]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) => (item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)));

  const pageTitle = activeItem?.label ?? 'Overview';
  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED;

  return (
    <div className="min-h-screen bg-admin-bg text-admin-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-lg focus:bg-terracotta focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-coconut-cream"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden flex-col bg-admin-surface lg:flex motion-reduce:transition-none"
        style={{
          width: sidebarWidth,
          transition: hasMounted ? `width 200ms ${EASE_OUT}` : 'none',
        }}
      >
        <div className="relative flex items-center justify-between px-5 pt-7 pb-6">
          <Link href="/dashboard" className="block overflow-hidden">
            <div className="font-display text-xl leading-none tracking-tight whitespace-nowrap">
              {isCollapsed ? 'K' : "K's Kitchen"}
            </div>
            {!isCollapsed && (
              <div className="mt-1.5 whitespace-nowrap text-[13px] text-admin-subtle">
                Restaurant admin
              </div>
            )}
          </Link>
        </div>

        <nav className="flex-1 space-y-0.5 px-3">
          {navigation.map((item) => {
            const active = item === activeItem;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                title={isCollapsed ? item.label : undefined}
                className={[
                  'group relative flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 text-[14px] transition-colors duration-150',
                  isCollapsed ? 'justify-center px-0' : '',
                  active
                    ? 'bg-terracotta/10 font-medium text-terracotta'
                    : 'text-admin-muted hover:bg-admin-border/60 hover:text-admin-ink',
                ].join(' ')}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-terracotta" />
                )}
                <Icon name={item.icon} size={18} />
                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 pb-4">
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={[
              'flex w-full items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 text-[13px] text-admin-muted transition-colors duration-150 hover:bg-admin-border/60 hover:text-admin-ink active:scale-[0.98]',
              isCollapsed ? 'justify-center px-0' : '',
            ].join(' ')}
          >
            <span
              className="flex shrink-0"
              style={{
                transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: `transform 180ms ${EASE_OUT}`,
              }}
            >
              <Icon name="chevron-left" size={16} />
            </span>
            {!isCollapsed && <span className="whitespace-nowrap">Collapse</span>}
          </button>
        </div>

        <div className="px-3 pb-5">
          <div className="mb-3 h-px bg-admin-border" />
          <Link
            href="/"
            title={isCollapsed ? 'View website' : undefined}
            className={[
              'flex items-center gap-3 rounded-lg py-2.5 pl-3.5 pr-3 text-[13px] text-admin-muted transition-colors duration-150 hover:bg-admin-border/60 hover:text-admin-ink',
              isCollapsed ? 'justify-center px-0' : '',
            ].join(' ')}
          >
            <Icon name="external" size={16} />
            {!isCollapsed && <span className="whitespace-nowrap">View website</span>}
          </Link>
        </div>
      </aside>

      {/* Main area */}
      <div
        className="motion-reduce:transition-none"
        style={{
          paddingLeft: 0,
          transition: hasMounted ? `padding-left 200ms ${EASE_OUT}` : 'none',
        }}
      >
        <style>{`
          @media (min-width: 1024px) {
            .kk-main-area { padding-left: ${sidebarWidth}px; }
          }
        `}</style>

        <div className="kk-main-area">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-admin-bg/90 px-5 shadow-[0_1px_0_0_rgba(75,58,46,0.06)] backdrop-blur-md sm:px-8">
            <h1 className="text-[15px] font-medium text-admin-ink">{pageTitle}</h1>

            <Link
              href="/"
              aria-label="View website"
              className="hidden items-center gap-2 rounded-lg px-2.5 py-1.5 text-admin-muted transition-colors duration-150 hover:bg-admin-border/60 hover:text-admin-ink sm:flex"
            >
              <Icon name="external" size={16} />
            </Link>
          </header>

          {/* Mobile navigation */}
          <div className="bg-admin-bg px-5 py-3 shadow-[0_1px_0_0_rgba(75,58,46,0.06)] lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {navigation.map((item) => {
                const active = item === activeItem;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-[13px] transition-colors duration-150',
                      active ? 'bg-terracotta/10 font-medium text-terracotta' : 'bg-admin-surface text-admin-muted',
                    ].join(' ')}
                  >
                    <Icon name={item.icon} size={15} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <main id="main-content" className="min-h-[calc(100vh-64px)] px-5 py-7 sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="mx-auto max-w-[1400px]">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}