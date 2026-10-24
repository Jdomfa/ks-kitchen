import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const normalized = pathname.toLowerCase();

  if (
    normalized === "/reservation" ||
    normalized === "/reservations"
  ) {
    if (pathname !== "/reservation") {
      const url = request.nextUrl.clone();
      url.pathname = "/reservation";

      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/reservation",
    "/reservations",
    "/Reservation",
    "/Reservations",
    "/RESERVATION",
    "/RESERVATIONS",
  ],
};