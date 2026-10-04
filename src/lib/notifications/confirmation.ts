import {
  sendReservationConfirmationTemplate,
  sendReservationUpdatedTemplate,
  sendWhatsAppMessage,
} from '@/lib/whatsapp/client';

export type SendConfirmationsArgs = {
  name: string;

  phone: string;

  partySize: number;

  date: string;

  time: string;

  reservationCode?: string;

  originChannel:
    | 'website'
    | 'whatsapp';
};

function formatDisplayTime(
  time: string
): string {
  const [
    hourRaw,
    minuteRaw,
  ] =
    time
      .slice(
        0,
        5
      )
      .split(':');

  const hour =
    Number(
      hourRaw
    );

  const minute =
    minuteRaw ||
    '00';

  const suffix =
    hour >= 12
      ? 'PM'
      : 'AM';

  const displayHour =
    hour % 12 ||
    12;

  return minute ===
    '00'
    ? `${displayHour}:00 ${suffix}`
    : `${displayHour}:${minute} ${suffix}`;
}

function formatDisplayDate(
  date: string
): string {
  const [
    year,
    month,
    day,
  ] =
    date
      .split('-')
      .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return date;
  }

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day:
        'numeric',

      month:
        'long',

      year:
        'numeric',

      timeZone:
        'Africa/Lagos',
    }
  ).format(
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )
  );
}

/* ============================================================
 * New reservation
 * ========================================================== */

export async function sendReservationConfirmations({
  name,
  phone,
  partySize,
  date,
  time,
  reservationCode,
  originChannel,
}: SendConfirmationsArgs) {
  const displayDate =
    formatDisplayDate(
      date
    );

  const displayTime =
    formatDisplayTime(
      time
    );

  /**
   * Website booking:
   *
   * Use approved utility template because the
   * customer may not have an active WhatsApp
   * conversation window.
   */
  if (
    originChannel ===
    'website'
  ) {
    if (
      !reservationCode
    ) {
      throw new Error(
        'Reservation code is required for the WhatsApp confirmation template.'
      );
    }

    return sendReservationConfirmationTemplate({
      to:
        phone,

      name,

      partySize,

      date:
        displayDate,

      time:
        displayTime,

      reservationCode,
    });
  }

  /**
   * WhatsApp booking:
   *
   * The customer is already talking to us,
   * so a normal message can be used.
   */
  const codeLine =
    reservationCode
      ? `\nReservation code: ${reservationCode}`
      : '';

  return sendWhatsAppMessage({
    to:
      phone,

    text:
      `Reservation confirmed ✅\n\n` +
      `Name: ${name}\n` +
      `Guests: ${partySize}\n` +
      `Date: ${displayDate}\n` +
      `Time: ${displayTime}` +
      `${codeLine}\n\n` +
      `We look forward to welcoming you to K's Kitchen Gourmet.`,
  });
}

/* ============================================================
 * Updated reservation
 * ========================================================== */

export async function sendReservationUpdateConfirmation({
  name,
  phone,
  partySize,
  date,
  time,
  reservationCode,
  originChannel,
}: SendConfirmationsArgs) {
  const displayDate =
    formatDisplayDate(
      date
    );

  const displayTime =
    formatDisplayTime(
      time
    );

  if (
    originChannel ===
    'website'
  ) {
    if (
      !reservationCode
    ) {
      throw new Error(
        'Reservation code is required for the reservation update template.'
      );
    }

    return sendReservationUpdatedTemplate({
      to:
        phone,

      name,

      partySize,

      date:
        displayDate,

      time:
        displayTime,

      reservationCode,
    });
  }

  const codeLine =
    reservationCode
      ? `\nReservation code: ${reservationCode}`
      : '';

  return sendWhatsAppMessage({
    to:
      phone,

    text:
      `Reservation updated ✅\n\n` +
      `Name: ${name}\n` +
      `Guests: ${partySize}\n` +
      `New date: ${displayDate}\n` +
      `New time: ${displayTime}` +
      `${codeLine}\n\n` +
      `We look forward to welcoming you to K's Kitchen Gourmet.`,
  });
}