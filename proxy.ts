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

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isGated = pathname.startsWith("/dashboard") || pathname.startsWith("/expert") || pathname.startsWith("/admin");

  let response: NextResponse;

  if (!user && isGated) {
    response = NextResponse.redirect(new URL("/login", request.url));
  } else if (user && pathname === "/login") {
    response = NextResponse.redirect(new URL("/dashboard", request.url));
  } else {
    response = supabaseResponse;

    if (user && (pathname.startsWith("/expert") || pathname.startsWith("/admin"))) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      const role = profile?.role ?? "user";

      if (pathname.startsWith("/admin") && role !== "admin") {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
      } else if (pathname.startsWith("/expert") && role !== "expert" && role !== "admin") {
        response = NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }
  }

  // Auto-detect language by country on first visit (only if not chosen yet)
  if (!request.cookies.get("NEXT_LOCALE")) {
    const country = request.headers.get("x-vercel-ip-country");
    const locale = country && country !== "BR" ? "en" : "pt";
    response.cookies.set("NEXT_LOCALE", locale, { path: "/", maxAge: 31536000 });
  }

  return response;
}

export const config = {
  matcher: ["/", "/dashboard/:path*", "/login", "/expert/:path*", "/admin/:path*"],
};
