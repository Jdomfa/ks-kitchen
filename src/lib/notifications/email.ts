import { Resend } from 'resend';
import { siteConfig } from '@/lib/site-config';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

type ReservationEmailArgs = {
  to: string;
  name: string;
  partySize: number;
  date: string;
  time: string;
};

function formatDisplayDate(dateISO: string): string {
  const d = new Date(`${dateISO}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Lagos',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(d);
}

function formatDisplayTime(time: string): string {
  const [hoursStr, minutesStr] = time.split(':');
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  const displayMinutes = minutes === 0 ? '' : `:${String(minutes).padStart(2, '0')}`;
  return `${displayHour}${displayMinutes} ${period}`;
}

function buildEmailHtml(args: ReservationEmailArgs): string {
  const displayDate = formatDisplayDate(args.date);
  const displayTime = formatDisplayTime(args.time);

  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0; padding:0; background-color:#f5ece0; font-family: Georgia, 'Times New Roman', serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5ece0; padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:#c1502e; padding:28px 32px; text-align:center;">
                <p style="margin:0; color:#f5ece0; font-size:22px; font-weight:bold; letter-spacing:0.5px;">
                  K's Kitchen Gourmet
                </p>
                <p style="margin:4px 0 0; color:#f5ece0; opacity:0.85; font-size:13px;">
                  Reservation Confirmed
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <p style="margin:0 0 20px; font-size:16px; color:#3b2a20;">
                  Hi ${args.name}, we're looking forward to having you.
                </p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8dcc8; border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px; border-bottom:1px solid #e8dcc8;">
                      <p style="margin:0; font-size:12px; color:#a08b6f; text-transform:uppercase; letter-spacing:0.5px;">Date</p>
                      <p style="margin:4px 0 0; font-size:16px; color:#3b2a20; font-weight:bold;">${displayDate}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px; border-bottom:1px solid #e8dcc8;">
                      <p style="margin:0; font-size:12px; color:#a08b6f; text-transform:uppercase; letter-spacing:0.5px;">Time</p>
                      <p style="margin:4px 0 0; font-size:16px; color:#3b2a20; font-weight:bold;">${displayTime}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:16px 20px;">
                      <p style="margin:0; font-size:12px; color:#a08b6f; text-transform:uppercase; letter-spacing:0.5px;">Party Size</p>
                      <p style="margin:4px 0 0; font-size:16px; color:#3b2a20; font-weight:bold;">${args.partySize} guest${args.partySize === 1 ? '' : 's'}</p>
                    </td>
                  </tr>
                </table>

                <p style="margin:24px 0 0; font-size:14px; color:#6b5847; line-height:1.6;">
                  Need to change or cancel your reservation? Just reply to this email or reach out to us directly.
                </p>
              </td>
            </tr>
            <tr>
              <td style="background-color:#f5ece0; padding:20px 32px; text-align:center;">
                <p style="margin:0; font-size:12px; color:#a08b6f;">
                  ${siteConfig.address.line1}, ${siteConfig.address.line2}
                </p>
                <p style="margin:4px 0 0; font-size:12px; color:#a08b6f;">
                  ${siteConfig.reservationPhone} · ${siteConfig.reservationEmail}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export async function sendReservationConfirmationEmail(
  args: ReservationEmailArgs
): Promise<{ success: boolean; error?: string }> {
  try {
    const result = await resend.emails.send({
      from: `K's Kitchen Gourmet <${FROM_EMAIL}>`,
      to: args.to,
      subject: `Your reservation is confirmed — ${formatDisplayDate(args.date)}`,
      html: buildEmailHtml(args),
    });

    if (result.error) {
      return { success: false, error: result.error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown email error.',
    };
  }
}