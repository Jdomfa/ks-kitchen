import { createServiceClient } from '@/lib/supabase/service';

export type ReservationSettings = {
  id: boolean;
  timezone: string;
  total_capacity: number;
  reservation_capacity_percent: number;
  reservation_duration_minutes: number;
  slot_interval_minutes: number;
  advance_booking_days: number;
};

export type ReservationHours = {
  id: string;
  weekday: number;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

export type AvailabilityResult = {
  available: boolean;
  requestedDate: string;
  requestedTime: string;
  partySize: number;
  reservedCovers: number;
  maximumReservedCovers: number;
  remainingCovers: number;
  alternatives: string[];
  reason?: string;
};

function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0'
  )}:00`;
}

function overlaps(
  startA: number,
  endA: number,
  startB: number,
  endB: number
) {
  return startA < endB && endA > startB;
}

export async function getReservationConfig() {
  const supabase = createServiceClient();

  const [{ data: settings, error: settingsError }, { data: hours, error: hoursError }] =
    await Promise.all([
      supabase
        .from('reservation_settings')
        .select('*')
        .eq('id', true)
        .single(),

      supabase
        .from('reservation_hours')
        .select('*')
        .order('weekday'),
    ]);

  if (settingsError) {
    throw new Error(settingsError.message);
  }

  if (hoursError) {
    throw new Error(hoursError.message);
  }

  return {
    settings: settings as ReservationSettings,
    hours: (hours ?? []) as ReservationHours[],
  };
}

export async function checkAvailability({
  date,
  time,
  partySize,
}: {
  date: string;
  time: string;
  partySize: number;
}): Promise<AvailabilityResult> {
  const supabase = createServiceClient();

  const { settings, hours } = await getReservationConfig();

  const dateObject = new Date(`${date}T12:00:00`);

  if (Number.isNaN(dateObject.getTime())) {
    throw new Error('Invalid reservation date.');
  }

  const weekday = dateObject.getDay();

  const dayHours = hours.find(
    (item) => item.weekday === weekday
  );

  const maximumReservedCovers = Math.floor(
    settings.total_capacity *
      (settings.reservation_capacity_percent / 100)
  );

  if (!dayHours || dayHours.is_closed) {
    return {
      available: false,
      requestedDate: date,
      requestedTime: time,
      partySize,
      reservedCovers: 0,
      maximumReservedCovers,
      remainingCovers: maximumReservedCovers,
      alternatives: [],
      reason: 'Restaurant is closed on this day.',
    };
  }

  const requestedStart = timeToMinutes(time);
  const requestedEnd = requestedStart + settings.reservation_duration_minutes;

  const openingTime = timeToMinutes(dayHours.open_time!);
  const closingTime = timeToMinutes(dayHours.close_time!);

  if (requestedStart < openingTime || requestedEnd > closingTime) {
    return {
      available: false,
      requestedDate: date,
      requestedTime: time,
      partySize,
      reservedCovers: 0,
      maximumReservedCovers,
      remainingCovers: maximumReservedCovers,
      alternatives: [],
      reason: 'Requested time is outside operating hours.',
    };
  }

  const { data: reservations, error } = await supabase
    .from('reservations')
    .select('party_size, reservation_time, status')
    .eq('reservation_date', date)
    .in('status', ['pending', 'confirmed']);

  if (error) {
    throw new Error(error.message);
  }

  const reservationDuration = settings.reservation_duration_minutes;

  const coversAt = (start: number, end: number) =>
    reservations?.reduce((total, reservation) => {
      const reservationStart = timeToMinutes(reservation.reservation_time);
      const reservationEnd = reservationStart + reservationDuration;

      if (overlaps(start, end, reservationStart, reservationEnd)) {
        return total + reservation.party_size;
      }

      return total;
    }, 0) ?? 0;

  const reservedCovers = coversAt(requestedStart, requestedEnd);
  const remainingCovers = maximumReservedCovers - reservedCovers;
  const available = reservedCovers + partySize <= maximumReservedCovers;

  const alternativeCandidates: { time: string; minutesFromRequested: number }[] = [];

  if (!available) {
    const interval = settings.slot_interval_minutes;
    const windowMinutes = 4 * 60; // ±4 hours

    // Earlier times, back to the later of: opening time, or 4 hours before the request.
    const earliestCandidate = Math.max(openingTime, requestedStart - windowMinutes);

    for (
      let candidate = requestedStart - interval;
      candidate >= earliestCandidate;
      candidate -= interval
    ) {
      const candidateEnd = candidate + reservationDuration;
      if (candidateEnd > closingTime) continue;

      if (coversAt(candidate, candidateEnd) + partySize <= maximumReservedCovers) {
        alternativeCandidates.push({
          time: minutesToTime(candidate),
          minutesFromRequested: requestedStart - candidate,
        });
      }
    }

    // Later times, up to the earlier of: 4 hours after the request, or closing time.
    const latestCandidateStart = Math.min(
      closingTime - reservationDuration,
      requestedStart + windowMinutes
    );

    for (
      let candidate = requestedStart + interval;
      candidate <= latestCandidateStart;
      candidate += interval
    ) {
      const candidateEnd = candidate + reservationDuration;

      if (coversAt(candidate, candidateEnd) + partySize <= maximumReservedCovers) {
        alternativeCandidates.push({
          time: minutesToTime(candidate),
          minutesFromRequested: candidate - requestedStart,
        });
      }
    }
  }

  // Closest to the originally requested time first, regardless of
  // whether it's earlier or later.
  alternativeCandidates.sort((a, b) => a.minutesFromRequested - b.minutesFromRequested);

  const alternatives = [...new Set(alternativeCandidates.map((c) => c.time))];

  return {
    available,
    requestedDate: date,
    requestedTime: time,
    partySize,
    reservedCovers,
    maximumReservedCovers,
    remainingCovers,
    alternatives,
    reason: available
      ? undefined
      : 'Requested time does not have enough reservation capacity.',
  };
}