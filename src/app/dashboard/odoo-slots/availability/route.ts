import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  findAvailableReservationTimes,
} from "@/lib/odoo/placeholder";

export const dynamic =
  "force-dynamic";

export async function GET(
  request: NextRequest
) {
  try {
    const {
      searchParams,
    } = request.nextUrl;

    const date =
      searchParams.get(
        "date"
      );

    const partySizeRaw =
      searchParams.get(
        "partySize"
      );

    if (!date) {
      return NextResponse.json(
        {
          error:
            "date is required.",
        },

        {
          status: 400,
        }
      );
    }

    const partySize =
      Number(
        partySizeRaw
      );

    if (
      !Number.isInteger(
        partySize
      ) ||
      partySize <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "partySize must be a positive integer.",
        },

        {
          status: 400,
        }
      );
    }

    const times =
      await findAvailableReservationTimes(
        date,
        partySize
      );

    return NextResponse.json({
      date,

      partySize,

      times,
    });
  } catch (error) {
    console.error(
      "Failed to load Odoo availability:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load availability.",
      },

      {
        status: 500,
      }
    );
  }
}