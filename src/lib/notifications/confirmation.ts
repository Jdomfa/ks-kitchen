import {
  sendReservationConfirmationEmail,
} from "./email";

import {
  sendReservationConfirmationSms,
  normalizePhoneNumber,
} from "./sms";

import {
  sendWhatsAppMessage,
  sendReservationConfirmationTemplate,
  sendReservationUpdatedTemplate,
} from "@/lib/whatsapp/client";

/* ============================================================
 * Types
 * ========================================================== */

type SendConfirmationsArgs = {
  name: string;

  email?: string;

  phone?: string;

  partySize: number;

  date: string;

  time: string;

  reservationCode?: string;

  originChannel:
    | "website"
    | "whatsapp";
};

type SendUpdateConfirmationArgs = {
  name: string;

  phone?: string;

  partySize: number;

  date: string;

  time: string;

  reservationCode: string;

  originChannel:
    | "website"
    | "whatsapp";
};

type ChannelOutcome = {
  success: boolean;

  error?: string;

  skipped?: boolean;
};

export type ConfirmationOutcome = {
  email:
    ChannelOutcome;

  sms:
    ChannelOutcome;

  whatsapp:
    ChannelOutcome;
};

/* ============================================================
 * Helpers
 * ========================================================== */

function formatDisplayTime(
  time: string
): string {
  const [
    hoursString,
    minutesString,
  ] = time.split(":");

  const hours =
    Number(
      hoursString
    );

  const minutes =
    Number(
      minutesString
    );

  const period =
    hours >= 12
      ? "PM"
      : "AM";

  const displayHour =
    hours % 12 === 0
      ? 12
      : hours % 12;

  const displayMinutes =
    minutes === 0
      ? ""
      : `:${String(
          minutes
        ).padStart(
          2,
          "0"
        )}`;

  return `${displayHour}${displayMinutes} ${period}`;
}

function buildWhatsAppConfirmationMessage(
  args: SendConfirmationsArgs
): string {
  const codeLine =
    args.reservationCode
      ? `\nReservation code: ${args.reservationCode}`
      : "";

  return (
    `Hi ${args.name}, your reservation at K's Kitchen Gourmet is confirmed ✅\n\n` +
    `Guests: ${args.partySize}\n` +
    `Date: ${args.date}\n` +
    `Time: ${formatDisplayTime(
      args.time
    )}` +
    `${codeLine}\n\n` +
    `We look forward to welcoming you.`
  );
}

function buildWhatsAppUpdateMessage(
  args: SendUpdateConfirmationArgs
): string {
  return (
    `Hi ${args.name}, your reservation at K's Kitchen Gourmet has been updated ✅\n\n` +
    `Guests: ${args.partySize}\n` +
    `New date: ${args.date}\n` +
    `New time: ${formatDisplayTime(
      args.time
    )}\n` +
    `Reservation code: ${args.reservationCode}\n\n` +
    `We look forward to welcoming you.`
  );
}

/* ============================================================
 * New reservation confirmation
 * ========================================================== */

export async function sendReservationConfirmations(
  args: SendConfirmationsArgs
): Promise<ConfirmationOutcome> {
  const normalizedPhone =
    args.phone
      ? normalizePhoneNumber(
          args.phone
        )
      : null;

  /* ----------------------------------------------------------
   * Email
   * -------------------------------------------------------- */

  const emailPromise =
    args.email
      ? sendReservationConfirmationEmail({
          to:
            args.email,

          name:
            args.name,

          partySize:
            args.partySize,

          date:
            args.date,

          time:
            args.time,
        })
      : Promise.resolve({
          success:
            false,

          skipped:
            true,
        });

  /* ----------------------------------------------------------
   * SMS
   * -------------------------------------------------------- */

  const smsPromise =
    normalizedPhone
      ? sendReservationConfirmationSms({
          to:
            normalizedPhone,

          name:
            args.name,

          partySize:
            args.partySize,

          date:
            args.date,

          time:
            args.time,
        })
      : Promise.resolve({
          success:
            false,

          skipped:
            true,
        });

  /* ----------------------------------------------------------
   * WhatsApp
   *
   * Website:
   * use an approved utility template.
   *
   * WhatsApp:
   * conversation is already active, so use normal text.
   * -------------------------------------------------------- */

  let whatsappPromise:
    Promise<ChannelOutcome>;

  if (!normalizedPhone) {
    whatsappPromise =
      Promise.resolve({
        success:
          false,

        skipped:
          true,
      });
  } else if (
    args.originChannel ===
    "website"
  ) {
    if (
      !args.reservationCode
    ) {
      whatsappPromise =
        Promise.resolve({
          success:
            false,

          skipped:
            true,

          error:
            "Reservation code missing for WhatsApp confirmation template.",
        });
    } else {
      whatsappPromise =
        sendReservationConfirmationTemplate({
          to:
            normalizedPhone,

          name:
            args.name,

          partySize:
            args.partySize,

          date:
            args.date,

          time:
            formatDisplayTime(
              args.time
            ),

          reservationCode:
            args.reservationCode,
        })
          .then(
            () => ({
              success:
                true,
            })
          )
          .catch(
            (
              error
            ) => ({
              success:
                false,

              error:
                error instanceof
                  Error
                  ? error.message
                  : "Unknown WhatsApp template error.",
            })
          );
    }
  } else {
    whatsappPromise =
      sendWhatsAppMessage(
        normalizedPhone,

        buildWhatsAppConfirmationMessage(
          args
        )
      )
        .then(
          () => ({
            success:
              true,
          })
        )
        .catch(
          (
            error
          ) => ({
            success:
              false,

            error:
              error instanceof
                Error
                ? error.message
                : "Unknown WhatsApp error.",
          })
        );
  }

  const [
    email,
    sms,
    whatsapp,
  ] =
    await Promise.all([
      emailPromise,
      smsPromise,
      whatsappPromise,
    ]);

  return {
    email,
    sms,
    whatsapp,
  };
}

/* ============================================================
 * Edited reservation confirmation
 * ========================================================== */

export async function sendReservationUpdateConfirmation(
  args: SendUpdateConfirmationArgs
): Promise<ChannelOutcome> {
  const normalizedPhone =
    args.phone
      ? normalizePhoneNumber(
          args.phone
        )
      : null;

  if (!normalizedPhone) {
    return {
      success:
        false,

      skipped:
        true,
    };
  }

  try {
    /**
     * Website edit:
     *
     * customer may not have an active WhatsApp conversation,
     * therefore use the approved update template.
     */
    if (
      args.originChannel ===
      "website"
    ) {
      await sendReservationUpdatedTemplate({
        to:
          normalizedPhone,

        name:
          args.name,

        partySize:
          args.partySize,

        date:
          args.date,

        time:
          formatDisplayTime(
            args.time
          ),

        reservationCode:
          args.reservationCode,
      });

      return {
        success:
          true,
      };
    }

    /**
     * WhatsApp edit:
     *
     * the user is already inside the WhatsApp conversation.
     */
    await sendWhatsAppMessage(
      normalizedPhone,

      buildWhatsAppUpdateMessage(
        args
      )
    );

    return {
      success:
        true,
    };
  } catch (
    error
  ) {
    return {
      success:
        false,

      error:
        error instanceof
          Error
          ? error.message
          : "Unknown WhatsApp update confirmation error.",
    };
  }
}