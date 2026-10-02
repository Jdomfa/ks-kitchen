import { NextRequest, NextResponse } from "next/server";

import {
  getAllPlaceholders,
  findAvailablePlaceholders,
  claimPlaceholder,
} from "@/lib/odoo/placeholder";

/**
 * GET /api/dev/test-placeholders
 *
 * Returns ALL calendar events whose name contains
 * "placeholder".
 *
 * Example:
 *
 * curl "http://localhost:3000/api/dev/test-placeholders"
 *
 *
 * GET /api/dev/test-placeholders?date=2026-10-02&time=19:00&partySize=4
 *
 * Returns only available placeholders that:
 *
 * - contain "placeholder" in their name
 * - start at the requested time
 * - are available
 * - have enough capacity
 */
export async function GET(
  request: NextRequest
) {
  try {
    const { searchParams } =
      new URL(request.url);

    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const partySizeParam =
      searchParams.get("partySize");

    /*
     * No filters:
     *
     * Return ALL placeholder events.
     */
    if (
      !date &&
      !time &&
      !partySizeParam
    ) {
      const placeholders =
        await getAllPlaceholders();

      return NextResponse.json({
        count: placeholders.length,
        placeholders,
      });
    }

    /*
     * If filtering is requested,
     * all three parameters are required.
     */
    if (
      !date ||
      !time ||
      !partySizeParam
    ) {
      return NextResponse.json(
        {
          error:
            "Provide date, time, and partySize together, or provide no query parameters to get all placeholders.",
        },
        { status: 400 }
      );
    }

    const partySize =
      Number(partySizeParam);

    if (
      !Number.isInteger(partySize) ||
      partySize <= 0
    ) {
      return NextResponse.json(
        {
          error:
            "partySize must be a positive number.",
        },
        { status: 400 }
      );
    }

    const results =
      await findAvailablePlaceholders(
        date,
        time,
        partySize
      );

    return NextResponse.json({
      count: results.length,
      date,
      time,
      partySize,
      placeholders: results,
    });
  } catch (error) {
    console.error(
      "test-placeholders GET error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dev/test-placeholders
 *
 * Claims a placeholder.
 *
 * Body:
 *
 * {
 *   "eventId": 123,
 *   "name": "Test Customer",
 *   "phone": "08012345678",
 *   "partySize": 4,
 *   "reservationCode": "RES-001"
 * }
 */
export async function POST(
  request: NextRequest
) {
  try {
    const body =
      await request.json();

    const {
      eventId,
      name,
      phone,
      partySize,
      reservationCode,
    } = body;

    if (
      !eventId ||
      !name ||
      !partySize
    ) {
      return NextResponse.json(
        {
          error:
            "eventId, name, and partySize are required in the request body.",
        },
        { status: 400 }
      );
    }

    const result =
      await claimPlaceholder(
        eventId,
        {
          name,
          phone,
          partySize,
          reservationCode,
        }
      );

    return NextResponse.json(result);
  } catch (error) {
    console.error(
      "test-placeholders POST error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unknown error",
      },
      { status: 500 }
    );
  }
}