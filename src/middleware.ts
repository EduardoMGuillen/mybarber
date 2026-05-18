import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { isReservedSlug } from "@/lib/seo/reserved-slugs";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role !== "superadmin") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  if (pathname.startsWith("/dashboard") || pathname.startsWith("/onboarding")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (role === "superadmin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

  if ((pathname === "/login" || pathname === "/registro") && session) {
    if (role === "superadmin") {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 1 && !isReservedSlug(segments[0]!)) {
    // Public shop landing — resolved in page
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/((?!api|_next/static|_next/image|favicon.ico|brand|icons).*)",
  ],
};
