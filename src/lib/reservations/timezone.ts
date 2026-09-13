const RESTAURANT_TIMEZONE = 'Africa/Lagos';
const SHORT_WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Resolves the day-of-week (0 = Sunday ... 6 = Saturday) for a
 * YYYY-MM-DD date string, anchored to the restaurant's timezone
 * (Africa/Lagos) rather than the server's local timezone.
 *
 * This is the single source of truth for weekday resolution —
 * both availability.ts and hours.ts must use this, so they can
 * never disagree on what day a given date string falls on.
 */
export function getWeekdayInRestaurantTimezone(date: string): number {
  const utcMidnight = new Date(`${date}T00:00:00Z`);

  if (Number.isNaN(utcMidnight.getTime())) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD.');
  }

  const weekdayName = new Intl.DateTimeFormat('en-US', {
    timeZone: RESTAURANT_TIMEZONE,
    weekday: 'short',
  }).format(utcMidnight);

  return SHORT_WEEKDAY_NAMES.indexOf(weekdayName);
}