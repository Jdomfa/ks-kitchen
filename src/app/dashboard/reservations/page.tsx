import { createClient } from '@/lib/supabase/server';
import { getDashboardSummary, getDashboardGrid } from '@/lib/reservations/dashboard';
import { getTablesConfig } from '@/lib/reservations/tables';
import {
  updateReservationStatus,
  deleteReservation,
  assignTableAction,
  unassignTableAction,
  checkInAction,
} from './actions';

type ReservationStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

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
  checked_in_at: string | null;
};

function getLagosTodayISO(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export default async function DashboardReservationsPage() {
  const supabase = await createClient();
  const today = getLagosTodayISO();

  const [{ data: reservations, error }, summary, grid, tables] = await Promise.all([
    supabase.from('reservations').select('*').order('reservation_date', { ascending: true }).order('reservation_time', { ascending: true }),
    getDashboardSummary(today),
    getDashboardGrid(today),
    getTablesConfig(),
  ]);

  if (error) throw new Error(error.message);

  const items = (reservations ?? []) as Reservation[];
  const assignedIds = new Set(
    Object.values(grid.cells)
      .flatMap((byTime) => Object.values(byTime).map((c) => c.reservationId))
      .filter(Boolean)
  );

  const pending = items.filter((r) => r.status === 'pending');
  const confirmed = items.filter((r) => r.status === 'confirmed');
  const completed = items.filter((r) => r.status === 'completed');
  const cancelled = items.filter((r) => r.status === 'cancelled');
  const noShow = items.filter((r) => r.status === 'no_show');

  return (
    <div className="space-y-8">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard label="Expected guests today" value={summary.expectedGuests} />
        <MetricCard label="Open slots today" value={summary.openSlotsToday} />
        <MetricCard
          label="Not checked in"
          value={summary.notCheckedIn.length}
          tone={summary.notCheckedIn.length > 0 ? 'warning' : 'default'}
        />
      </div>

      <section>
        <h2 className="mb-3 text-[15px] font-medium text-admin-ink">Today's floor</h2>
        <FloorGrid grid={grid} />
      </section>

      {summary.notCheckedIn.length > 0 && (
        <section>
          <h2 className="mb-3 text-[15px] font-medium text-admin-ink">Call to reconfirm</h2>
          <div className="divide-y divide-admin-border rounded-xl border border-admin-border bg-admin-surface">
            {summary.notCheckedIn.map((entry) => (
              <div key={entry.reservationId} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-admin-ink">
                    {entry.name} · party of {entry.partySize}
                  </p>
                  <p className="text-[13px] text-terracotta">
                    {entry.time} · {entry.overdueMinutes} min overdue
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {entry.phone && (
                    <a
                      href={`tel:${entry.phone}`}
                      className="rounded-lg border border-admin-border px-3 py-1.5 text-[13px] text-admin-muted transition-colors hover:border-admin-subtle hover:text-admin-ink"
                    >
                      Call
                    </a>
                  )}
                  <form action={checkInAction}>
                    <input type="hidden" name="reservationId" value={entry.reservationId} />
                    <input type="hidden" name="checkedIn" value="true" />
                    <button
                      type="submit"
                      className="rounded-lg bg-curry-leaf px-3 py-1.5 text-[13px] font-medium text-coconut-cream hover:opacity-90"
                    >
                      Mark arrived
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-8">
        <ReservationSection title="Pending" reservations={pending} tables={tables} today={today} assignedIds={assignedIds} />
        <ReservationSection title="Confirmed" reservations={confirmed} tables={tables} today={today} assignedIds={assignedIds} />
        <ReservationSection title="Completed" reservations={completed} tables={tables} today={today} assignedIds={assignedIds} />
        <ReservationSection title="Cancelled" reservations={cancelled} tables={tables} today={today} assignedIds={assignedIds} />
        <ReservationSection title="No-shows" reservations={noShow} tables={tables} today={today} assignedIds={assignedIds} />
      </section>
    </div>
  );
}

function MetricCard({ label, value, tone = 'default' }: { label: string; value: number; tone?: 'default' | 'warning' }) {
  return (
    <div className={`rounded-xl px-4 py-3.5 ${tone === 'warning' ? 'bg-terracotta/10' : 'bg-admin-surface'}`}>
      <p className="text-[13px] text-admin-subtle">{label}</p>
      <p className={`mt-1 text-2xl font-medium ${tone === 'warning' ? 'text-terracotta' : 'text-admin-ink'}`}>{value}</p>
    </div>
  );
}

function FloorGrid({ grid }: { grid: Awaited<ReturnType<typeof getDashboardGrid>> }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-admin-border">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-admin-border bg-admin-surface">
            <th className="w-16 px-3 py-2 text-left font-medium text-admin-muted"></th>
            {grid.tables.map((t) => (
              <th key={t.number} className="px-2 py-2 text-center font-medium text-admin-muted">
                T{t.number}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.timeSlots.map((slot) => {
            const skip = new Set<number>();
            return (
              <tr key={slot} className="border-b border-admin-border last:border-0">
                <td className="px-3 py-2 text-admin-muted">{slot}</td>
                {grid.tables.map((t) => {
                  if (skip.has(t.number)) return null;
                  const cell = grid.cells[t.number][slot];

                  if (cell.status === 'open') {
                    return (
                      <td key={t.number} className="p-1">
                        <div className="h-7 rounded-md bg-curry-leaf/15" />
                      </td>
                    );
                  }

                  if (cell.mergeGroup && !cell.isMergeStart) return null;

                  const colSpan = cell.mergeGroup?.length ?? 1;
                  if (cell.mergeGroup) {
                    for (const n of cell.mergeGroup) if (n !== t.number) skip.add(n);
                  }

                  return (
                    <td key={t.number} colSpan={colSpan} className="p-1">
                      <div
                        className="flex h-7 items-center justify-center rounded-md bg-terracotta/15 px-2 text-[11px] font-medium text-terracotta"
                        title={`${cell.guestName} · party of ${cell.partySize}`}
                      >
                        {cell.half ? `${cell.guestName} (${cell.half})` : cell.guestName}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ReservationSection({
  title,
  reservations,
  tables,
  today,
  assignedIds,
}: {
  title: string;
  reservations: Reservation[];
  tables: Awaited<ReturnType<typeof getTablesConfig>>;
  today: string;
  assignedIds: Set<string | undefined>;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[15px] font-medium text-admin-ink">{title}</h2>
        <span className="rounded-full bg-admin-surface px-2.5 py-0.5 text-xs text-admin-muted">{reservations.length}</span>
      </div>

      {reservations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-admin-border px-6 py-8 text-center text-sm text-admin-subtle">
          Nothing here.
        </div>
      ) : (
        <div className="space-y-2">
          {reservations.map((r) => (
            <ReservationRow key={r.id} reservation={r} tables={tables} today={today} isAssigned={assignedIds.has(r.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReservationRow({
  reservation,
  tables,
  today,
  isAssigned,
}: {
  reservation: Reservation;
  tables: Awaited<ReturnType<typeof getTablesConfig>>;
  today: string;
  isAssigned: boolean;
}) {
  const canAssign = reservation.status === 'confirmed' && reservation.reservation_date === today;

  return (
    <div className="rounded-xl border border-admin-border bg-admin-surface p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-medium text-admin-ink">{reservation.name}</h3>
            <StatusBadge status={reservation.status} />
            {reservation.reservation_code && (
              <span className="rounded-full border border-admin-border px-2 py-0.5 font-mono text-[10px] text-admin-subtle">
                {reservation.reservation_code}
              </span>
            )}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-admin-muted">
            <span>{formatDate(reservation.reservation_date)}</span>
            <span>{formatTime(reservation.reservation_time)}</span>
            <span>
              {reservation.party_size} {reservation.party_size === 1 ? 'guest' : 'guests'}
            </span>
          </div>
        </div>

        <div className="text-[13px] text-admin-muted">
          {reservation.phone && <p>{reservation.phone}</p>}
          {reservation.email && <p>{reservation.email}</p>}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {canAssign && !isAssigned && (
            <form action={assignTableAction} className="flex items-center gap-1.5">
              <input type="hidden" name="reservationId" value={reservation.id} />
              <input type="hidden" name="date" value={today} />
              <select name="tableNumbers" className="rounded-lg border border-admin-border bg-admin-bg px-2 py-1.5 text-[13px] text-admin-ink">
                {tables.map((t) => (
                  <option key={t.number} value={t.number}>
                    Table {t.number}
                  </option>
                ))}
              </select>
              <button type="submit" className="rounded-lg bg-clay-pot px-3 py-1.5 text-[13px] font-medium text-coconut-cream hover:opacity-90">
                Seat
              </button>
            </form>
          )}

          {canAssign && isAssigned && (
            <form action={unassignTableAction}>
              <input type="hidden" name="reservationId" value={reservation.id} />
              <button type="submit" className="rounded-lg border border-admin-border px-3 py-1.5 text-[13px] text-admin-muted hover:text-admin-ink">
                Unseat
              </button>
            </form>
          )}

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
            <button type="submit" className="rounded-lg border border-terracotta/30 px-3 py-1.5 text-[13px] text-terracotta hover:bg-terracotta/5">
              Delete
            </button>
          </form>
        </div>
      </div>

      {reservation.note && (
        <div className="mt-4 border-t border-admin-border pt-3">
          <p className="text-[11px] uppercase tracking-wide text-admin-subtle">Note</p>
          <p className="mt-1 text-[13px] text-admin-muted">{reservation.note}</p>
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
            ? 'rounded-lg bg-clay-pot px-3 py-1.5 text-[13px] font-medium text-coconut-cream hover:opacity-90'
            : 'rounded-lg border border-admin-border px-3 py-1.5 text-[13px] text-admin-muted hover:border-admin-subtle hover:text-admin-ink'
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
    cancelled: 'bg-admin-border text-admin-muted',
    no_show: 'bg-terracotta/15 text-terracotta',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[11px] ${styles[status]}`}>{status.replace('_', ' ')}</span>;
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(`${date}T00:00:00`)
  );
}

function formatTime(time: string) {
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
}