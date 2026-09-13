import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';

import { updateReservationStatus, deleteReservation } from './actions';

type ReservationStatus =
  | 'pending'
  | 'confirmed'
  | 'completed'
  | 'cancelled'
  | 'no_show';

type Reservation = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  note: string | null;
  status: ReservationStatus;
  reservation_code: string | null;
  created_at: string;
};

export default async function DashboardReservationsPage() {
  const supabase = await createClient();

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('reservation_time', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  const items = (reservations ?? []) as Reservation[];

  const pending = items.filter((r) => r.status === 'pending');
  const confirmed = items.filter((r) => r.status === 'confirmed');
  const completed = items.filter((r) => r.status === 'completed');
  const cancelled = items.filter((r) => r.status === 'cancelled');
  const noShow = items.filter((r) => r.status === 'no_show');

  return (
    <div className="min-h-screen bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        <Link
          href="/dashboard"
          className="font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot"
        >
          ← Dashboard
        </Link>

        <h1 className="mt-3 mb-8 font-display text-3xl text-roasted-coffee">
          Reservations
        </h1>

        <div className="mb-8 grid gap-4 sm:grid-cols-5">
          <SummaryCard label="Pending" value={pending.length} />
          <SummaryCard label="Confirmed" value={confirmed.length} />
          <SummaryCard label="Completed" value={completed.length} />
          <SummaryCard label="Cancelled" value={cancelled.length} />
          <SummaryCard label="No-shows" value={noShow.length} />
        </div>

        <ReservationSection title="Pending Reservations" reservations={pending} />
        <ReservationSection title="Confirmed Reservations" reservations={confirmed} />
        <ReservationSection title="Completed Reservations" reservations={completed} />
        <ReservationSection title="Cancelled Reservations" reservations={cancelled} />
        <ReservationSection title="No-shows" reservations={noShow} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6">
      <p className="font-sans text-xs uppercase tracking-[0.18em] text-roasted-coffee/50">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl text-roasted-coffee">{value}</p>
    </div>
  );
}

function ReservationSection({
  title,
  reservations,
}: {
  title: string;
  reservations: Reservation[];
}) {
  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl text-roasted-coffee">{title}</h2>
        <span className="rounded-full bg-roasted-coffee/5 px-3 py-1 font-sans text-xs text-roasted-coffee/60">
          {reservations.length}
        </span>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-roasted-coffee/15 bg-white/30 px-6 py-10 text-center">
          <p className="font-sans text-sm text-roasted-coffee/50">
            No reservations here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reservations.map((reservation) => (
            <ReservationCard key={reservation.id} reservation={reservation} />
          ))}
        </div>
      )}
    </section>
  );
}

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const formattedDate = formatDate(reservation.reservation_date);
  const formattedTime = formatTime(reservation.reservation_time);

  return (
    <div className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-sans text-sm font-medium text-roasted-coffee">
              {reservation.name}
            </h3>
            <StatusBadge status={reservation.status} />
            {reservation.reservation_code && (
              <span className="rounded-full border border-roasted-coffee/15 px-2 py-0.5 font-mono text-[10px] tracking-wide text-roasted-coffee/50">
                {reservation.reservation_code}
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 font-sans text-sm text-roasted-coffee/60">
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
            <span>
              {reservation.party_size}{' '}
              {reservation.party_size === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>

        <div className="font-sans text-sm text-roasted-coffee/60">
          {reservation.phone && <p>{reservation.phone}</p>}
          {reservation.email && <p>{reservation.email}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap gap-2">
          {reservation.status === 'pending' && (
            <>
              <StatusActionButton id={reservation.id} status="confirmed" label="Confirm" filled />
              <StatusActionButton id={reservation.id} status="cancelled" label="Cancel" />
            </>
          )}

          {reservation.status === 'confirmed' && (
            <>
              <StatusActionButton id={reservation.id} status="completed" label="Mark completed" filled />
              <StatusActionButton id={reservation.id} status="no_show" label="No-show" />
              <StatusActionButton id={reservation.id} status="cancelled" label="Cancel" />
            </>
          )}

          {(reservation.status === 'cancelled' || reservation.status === 'no_show') && (
            <StatusActionButton id={reservation.id} status="pending" label="Restore" />
          )}

          <form action={deleteReservation}>
            <input type="hidden" name="id" value={reservation.id} />
            <button
              type="submit"
              className="rounded-full border border-clay-pot/30 px-4 py-2 font-sans text-xs text-clay-pot hover:bg-clay-pot/5"
            >
              Delete
            </button>
          </form>
        </div>
      </div>

      {reservation.note && (
        <div className="mt-5 border-t border-roasted-coffee/10 pt-4">
          <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-roasted-coffee/40">
            Note
          </p>
          <p className="mt-1 font-sans text-sm text-roasted-coffee/70">
            {reservation.note}
          </p>
        </div>
      )}
    </div>
  );
}

function StatusActionButton({
  id,
  status,
  label,
  filled = false,
}: {
  id: string;
  status: ReservationStatus;
  label: string;
  filled?: boolean;
}) {
  return (
    <form action={updateReservationStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <button
        type="submit"
        className={
          filled
            ? 'rounded-full bg-clay-pot px-4 py-2 font-sans text-xs text-coconut-cream hover:opacity-90'
            : 'rounded-full border border-roasted-coffee/20 px-4 py-2 font-sans text-xs text-roasted-coffee hover:border-clay-pot'
        }
      >
        {label}
      </button>
    </form>
  );
}

function StatusBadge({ status }: { status: ReservationStatus }) {
  const styles: Record<ReservationStatus, string> = {
    pending: 'bg-brushed-brass/15 text-brushed-brass',
    confirmed: 'bg-clay-pot/10 text-clay-pot',
    completed: 'bg-curry-leaf/15 text-curry-leaf',
    cancelled: 'bg-roasted-coffee/10 text-roasted-coffee/60',
    no_show: 'bg-terracotta/15 text-terracotta',
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`));
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat('en-NG', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}