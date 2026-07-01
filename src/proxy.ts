// Middleware that runs on every request. Redirects unauthenticated users away
// from protected routes and authenticated users away from auth pages.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
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
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/rent-check")) {
    return NextResponse.redirect(new URL("/compare", request.url));
  }

  // Routes that require auth
  const protectedRoutes = ["/dashboard", "/analyze", "/compare", "/dispute-assistant"];

  // Routes accessible during password recovery (skip auth redirect)
  const recoveryRoutes = ["/auth/reset-password"];

  // Routes only for unauthenticated users
  const authRoutes = ["/login", "/signup"];

  if (!user && protectedRoutes.some((r) => pathname.startsWith(r)) && !recoveryRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && authRoutes.some((r) => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
