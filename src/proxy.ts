import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect /api/ingest/*, /api/brief/*, and /api/ml/* endpoints
  if (pathname.startsWith("/api/ingest") || pathname.startsWith("/api/brief") || pathname.startsWith("/api/ml")) {
    const authHeader = request.headers.get("Authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    // 1. Allow internal authorized calls (like run-all, crons)
    const isInternalService = authHeader === `Bearer ${internalSecret}`;
    const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (isInternalService || isVercelCron) {
      return response;
    }

    // 2. Otherwise, enforce user authentication (from browser settings trigger or brief load)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Protect settings route
  if (request.nextUrl.pathname.startsWith("/settings") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from login
  if (request.nextUrl.pathname.startsWith("/login") && user) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
