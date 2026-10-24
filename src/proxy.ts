import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // --------------------------------------------------
  // Reservation route normalization
  // --------------------------------------------------
  const normalizedPath = pathname.toLowerCase();

  if (
    normalizedPath === "/reservation" ||
    normalizedPath === "/reservations"
  ) {
    if (pathname !== "/reservation") {
      const url = request.nextUrl.clone();
      url.pathname = "/reservation";

      return NextResponse.redirect(url);
    }
  }

  // --------------------------------------------------
  // Supabase auth handling
  // --------------------------------------------------
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginRoute = pathname === "/dashboard/login";

  if (pathname.startsWith("/dashboard") && !isLoginRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/login";

    return NextResponse.redirect(url);
  }

  if (isLoginRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",

    "/reservation",
    "/reservations",

    "/Reservation",
    "/Reservations",

    "/RESERVATION",
    "/RESERVATIONS",
  ],
};