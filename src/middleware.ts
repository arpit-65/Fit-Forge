import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let user = null;

  // Only attempt auth check if Supabase is properly configured
  if (
    supabaseUrl &&
    supabaseKey &&
    !supabaseUrl.includes("YOUR_PROJECT_REF")
  ) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      });

      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      user = authUser;
    } catch {
      // Ignore auth errors in dev when credentials not yet active
    }
  }

  const { pathname } = request.nextUrl;

  // Public paths — landing, analytics dashboard, squads, challenges, auth pages, and all API endpoints
  const isPublic =
    pathname === "/" ||
    pathname === "/analytics" ||
    pathname === "/squads" ||
    pathname.startsWith("/squads/") ||
    pathname === "/challenges" ||
    pathname.startsWith("/challenges/") ||
    pathname === "/login" ||
    pathname === "/register" ||
    pathname.startsWith("/api/");

  // Redirect unauthenticated users away from protected web app pages (e.g. /dashboard, /admin)
  // Only enforce redirect if user is definitely absent AND it's not a public or API route
  if (!user && !isPublic) {
    // If Supabase is not yet configured with real credentials in dev, allow access to prototype
    const isMockEnv = !supabaseUrl || supabaseUrl.includes("YOUR_PROJECT_REF");
    if (!isMockEnv) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
