import Link from 'next/link';

import { createClient } from '@/lib/supabase/server';

import { updateReservationStatus, deleteReservation } from './actions';

type Reservation = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string;
  note: string | null;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
};

export default async function DashboardReservationsPage() {
  const supabase = await createClient();

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('*')
    .order('reservation_date', {
      ascending: true,
    })
    .order('reservation_time', {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const items = (reservations ?? []) as Reservation[];

  const pending = items.filter(
    (reservation) => reservation.status === 'pending',
  );

  const confirmed = items.filter(
    (reservation) => reservation.status === 'confirmed',
  );

  const cancelled = items.filter(
    (reservation) => reservation.status === 'cancelled',
  );

  return (
    <div className="min-h-screen bg-coconut-cream px-6 py-16">
      <div className="mx-auto max-w-4xl">
        {/* BACK TO DASHBOARD */}
        <Link
          href="/dashboard"
          className="font-sans text-sm text-roasted-coffee/60 hover:text-clay-pot"
        >
          ← Dashboard
        </Link>

        {/* PAGE TITLE */}
        <h1 className="mt-3 mb-8 font-display text-3xl text-roasted-coffee">
          Reservations
        </h1>

        {/* SUMMARY */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <SummaryCard label="Pending" value={pending.length} />
          <SummaryCard label="Confirmed" value={confirmed.length} />
          <SummaryCard label="Cancelled" value={cancelled.length} />
        </div>

        {/* PENDING */}
        <ReservationSection
          title="Pending Reservations"
          reservations={pending}
        />

        {/* CONFIRMED */}
        <ReservationSection
          title="Confirmed Reservations"
          reservations={confirmed}
        />

        {/* CANCELLED */}
        <ReservationSection
          title="Cancelled Reservations"
          reservations={cancelled}
        />
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* SUMMARY CARD                                                */
/* ─────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────── */
/* RESERVATION SECTION                                         */
/* ─────────────────────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────────────────── */
/* RESERVATION CARD                                            */
/* ─────────────────────────────────────────────────────────── */

function ReservationCard({ reservation }: { reservation: Reservation }) {
  const formattedDate = formatDate(reservation.reservation_date);

  const formattedTime = formatTime(reservation.reservation_time);

  return (
    <div className="rounded-2xl border border-roasted-coffee/10 bg-white/40 p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        {/* GUEST */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-sans text-sm font-medium text-roasted-coffee">
              {reservation.name}
            </h3>

            <StatusBadge status={reservation.status} />
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

        {/* CONTACT */}
        <div className="font-sans text-sm text-roasted-coffee/60">
          {reservation.phone && <p>{reservation.phone}</p>}

          {reservation.email && <p>{reservation.email}</p>}
        </div>

        {/* ACTIONS */}
        <div className="flex shrink-0 gap-2">
          {/* PENDING ACTIONS */}
          {reservation.status === 'pending' && (
            <>
              <form action={updateReservationStatus}>
                <input type="hidden" name="id" value={reservation.id} />

                <input type="hidden" name="status" value="confirmed" />

                <button
                  type="submit"
                  className="rounded-full bg-clay-pot px-4 py-2 font-sans text-xs text-coconut-cream hover:opacity-90"
                >
                  Confirm
                </button>
              </form>

              <form action={updateReservationStatus}>
                <input type="hidden" name="id" value={reservation.id} />

                <input type="hidden" name="status" value="cancelled" />

                <button
                  type="submit"
                  className="rounded-full border border-roasted-coffee/20 px-4 py-2 font-sans text-xs text-roasted-coffee hover:border-clay-pot"
                >
                  Cancel
                </button>
              </form>
            </>
          )}

          {/* CONFIRMED ACTION */}
          {reservation.status === 'confirmed' && (
            <form action={updateReservationStatus}>
              <input type="hidden" name="id" value={reservation.id} />

              <input type="hidden" name="status" value="cancelled" />

              <button
                type="submit"
                className="rounded-full border border-roasted-coffee/20 px-4 py-2 font-sans text-xs text-roasted-coffee hover:border-clay-pot"
              >
                Cancel
              </button>
            </form>
          )}

          {/* CANCELLED ACTION */}
          {reservation.status === 'cancelled' && (
            <form action={updateReservationStatus}>
              <input type="hidden" name="id" value={reservation.id} />

              <input type="hidden" name="status" value="pending" />

              <button
                type="submit"
                className="rounded-full border border-roasted-coffee/20 px-4 py-2 font-sans text-xs text-roasted-coffee hover:border-clay-pot"
              >
                Restore
              </button>
            </form>
          )}

          {/* DELETE */}
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

      {/* NOTE */}
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

/* ─────────────────────────────────────────────────────────── */
/* STATUS BADGE                                                */
/* ─────────────────────────────────────────────────────────── */

function StatusBadge({ status }: { status: Reservation['status'] }) {
  const styles = {
    pending: 'bg-brushed-brass/15 text-brushed-brass',

    confirmed: 'bg-clay-pot/10 text-clay-pot',

    cancelled: 'bg-roasted-coffee/10 text-roasted-coffee/60',
  };

  return (
    <span
      className={`rounded-full px-2.5 py-1 font-sans text-[10px] uppercase tracking-[0.12em] ${styles[status]}`}
    >
      {status}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────── */
/* DATE / TIME HELPERS                                         */
/* ─────────────────────────────────────────────────────────── */

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
