import { createServiceClient } from '@/lib/supabase/service';
import { getSlotAvailability } from './slots';
import { getTablesConfig, getAssignmentsForDate, type TableConfig, type TableAssignment } from './tables';

type ReservationRow = {
  id: string;
  name: string;
  phone: string | null;
  party_size: number;
  reservation_date: string;
  reservation_time: string; // "HH:MM:SS"
  status: string;
  checked_in_at: string | null;
  reservation_code: string | null;
};

type SlotSettings = {
  slot_interval_minutes: number;
  reservation_duration_minutes: number;
  booking_window_start: string;
  booking_window_end: string;
};

async function getSlotSettings(): Promise<SlotSettings> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('reservation_slot_settings')
    .select('slot_interval_minutes, booking_window_start, booking_window_end')
    .single();

  if (error) throw new Error(error.message);

  const { data: durationRow, error: durationError } = await supabase
    .from('reservation_settings')
    .select('reservation_duration_minutes')
    .single();

  if (durationError) throw new Error(durationError.message);

  return {
    slot_interval_minutes: data.slot_interval_minutes,
    reservation_duration_minutes: durationRow.reservation_duration_minutes,
    booking_window_start: data.booking_window_start,
    booking_window_end: data.booking_window_end,
  };
}

async function getActiveReservationsForDate(date: string): Promise<ReservationRow[]> {
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('reservations')
    .select('id, name, phone, party_size, reservation_date, reservation_time, status, checked_in_at, reservation_code')
    .eq('reservation_date', date)
    .in('status', ['pending', 'confirmed'])
    .order('reservation_time');

  if (error) throw new Error(error.message);
  return (data ?? []) as ReservationRow[];
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function buildTimeSlots(settings: SlotSettings): string[] {
  const start = timeToMinutes(settings.booking_window_start);
  const end = timeToMinutes(settings.booking_window_end);
  const slots: string[] = [];

  for (let t = start; t <= end; t += settings.slot_interval_minutes) {
    slots.push(minutesToTime(t));
  }
  return slots;
}

export type CheckInEntry = {
  reservationId: string;
  name: string;
  phone: string | null;
  partySize: number;
  time: string;
  overdueMinutes: number;
};

export type DashboardSummary = {
  expectedGuests: number;
  openSlotsToday: number;
  notCheckedIn: CheckInEntry[];
};

const OVERDUE_THRESHOLD_MINUTES = 20;

export async function getDashboardSummary(date: string, nowMinutes?: number): Promise<DashboardSummary> {
  const [reservations, slots] = await Promise.all([
    getActiveReservationsForDate(date),
    getSlotAvailability(date),
  ]);

  const confirmed = reservations.filter((r) => r.status === 'confirmed');

  const expectedGuests = confirmed.reduce((sum, r) => sum + r.party_size, 0);
  const openSlotsToday = slots.filter((s) => s.available_covers > 0).length;

  const now = nowMinutes ?? timeToMinutes(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit', hour12: false })
      .format(new Date())
  );

  const notCheckedIn: CheckInEntry[] = confirmed
    .filter((r) => !r.checked_in_at)
    .map((r) => {
      const resMinutes = timeToMinutes(r.reservation_time.slice(0, 5));
      return {
        reservationId: r.id,
        name: r.name,
        phone: r.phone,
        partySize: r.party_size,
        time: r.reservation_time.slice(0, 5),
        overdueMinutes: now - resMinutes,
      };
    })
    .filter((entry) => entry.overdueMinutes >= OVERDUE_THRESHOLD_MINUTES)
    .sort((a, b) => b.overdueMinutes - a.overdueMinutes);

  return { expectedGuests, openSlotsToday, notCheckedIn };
}

export type GridCell = {
  status: 'open' | 'booked';
  reservationId?: string;
  guestName?: string;
  partySize?: number;
  half?: 'a' | 'b';
  mergeGroup?: number[];
  isMergeStart?: boolean;
};

export type DashboardGrid = {
  tables: TableConfig[];
  timeSlots: string[];
  cells: Record<number, Record<string, GridCell>>;
};

export async function getDashboardGrid(date: string): Promise<DashboardGrid> {
  const [settings, tables, assignments, reservations] = await Promise.all([
    getSlotSettings(),
    getTablesConfig(),
    getAssignmentsForDate(date),
    getActiveReservationsForDate(date),
  ]);

  const timeSlots = buildTimeSlots(settings);
  const reservationById = new Map(reservations.map((r) => [r.id, r]));

  const cells: Record<number, Record<string, GridCell>> = {};
  for (const table of tables) {
    cells[table.number] = {};
    for (const slot of timeSlots) {
      cells[table.number][slot] = { status: 'open' };
    }
  }

  for (const assignment of assignments) {
    const reservation = reservationById.get(assignment.reservation_id);
    if (!reservation) continue;

    const occupiedStart = timeToMinutes(reservation.reservation_time.slice(0, 5));
    const occupiedEnd = occupiedStart + settings.reservation_duration_minutes;
    const sortedTables = [...assignment.table_numbers].sort((a, b) => a - b);

    for (const slot of timeSlots) {
      const slotMinutes = timeToMinutes(slot);
      if (slotMinutes < occupiedStart || slotMinutes >= occupiedEnd) continue;

      for (const tableNumber of sortedTables) {
        if (!cells[tableNumber]) continue;
        cells[tableNumber][slot] = {
          status: 'booked',
          reservationId: reservation.id,
          guestName: reservation.name,
          partySize: reservation.party_size,
          half: assignment.half ?? undefined,
          mergeGroup: sortedTables.length > 1 ? sortedTables : undefined,
          isMergeStart: tableNumber === sortedTables[0],
        };
      }
    }
  }

  return { tables, timeSlots, cells };
}