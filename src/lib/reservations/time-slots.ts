/** Length of one reservation. Hourly slots never overlap themselves at 1h. */
export const RESERVATION_DURATION_HOURS = 1;

/** 4:00 PM to 10:00 PM, hourly, inclusive. Lagos local time. */
export const RESERVATION_TIMES: string[] = Array.from({ length: 7 }, (_, i) =>
  `${String(16 + i).padStart(2, "0")}:00`,
);

export function isValidReservationTime(time: string): boolean {
  return RESERVATION_TIMES.includes(time);
}

export function formatTimeLabel(time: string): string {
  const hour = Number(time.split(":")[0]);
  return `${hour % 12 || 12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

export type TimeOption = { value: string; label: string; disabled: boolean };

/**
 * Every hourly slot, with the ones not in `available` disabled.
 * Lets the UI build the dropdown from the session's `alternatives`
 * even if the API response carries no `timeOptions`.
 */
export function buildTimeOptions(available: string[] = []): TimeOption[] {
  return RESERVATION_TIMES.map((value) => ({
    value,
    label: formatTimeLabel(value),
    disabled: !available.includes(value),
  }));
}