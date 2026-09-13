import { createServiceClient } from '@/lib/supabase/service';
import { getWeekdayInRestaurantTimezone } from './timezone';

const WEEKDAY_NAMES = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

type OperatingHoursSuccess = {
  success: true;
  date: string;
  weekday: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  open_time_display: string | null;
  close_time_display: string | null;
  summary: string;
};

type OperatingHoursFailure = {
  success: false;
  error: string;
};

type OperatingHoursResponse = OperatingHoursSuccess | OperatingHoursFailure;

function formatTimeForCustomer(time: string | null): string | null {
  if (!time) return null;

  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;

  return `${displayHour}${displayMinutes} ${period}`;
}

export async function getOperatingHours(args: {
  date: string;
}): Promise<OperatingHoursResponse> {
  const { date } = args;

  let weekday: number;

  try {
    weekday = getWeekdayInRestaurantTimezone(date);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid date format.',
    };
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from('reservation_hours')
    .select('weekday, is_closed, open_time, close_time')
    .eq('weekday', weekday)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data) {
    return {
      success: false,
      error: 'Operating hours are not configured for this day.',
    };
  }

  const weekdayName = WEEKDAY_NAMES[weekday];

  if (data.is_closed) {
    return {
      success: true,
      date,
      weekday: weekdayName,
      is_closed: true,
      open_time: null,
      close_time: null,
      open_time_display: null,
      close_time_display: null,
      summary: `Closed on ${weekdayName}.`,
    };
  }

  const openDisplay = formatTimeForCustomer(data.open_time);
  const closeDisplay = formatTimeForCustomer(data.close_time);

  return {
    success: true,
    date,
    weekday: weekdayName,
    is_closed: false,
    open_time: data.open_time,
    close_time: data.close_time,
    open_time_display: openDisplay,
    close_time_display: closeDisplay,
    summary: `Open on ${weekdayName} from ${openDisplay} to ${closeDisplay}.`,
  };
}