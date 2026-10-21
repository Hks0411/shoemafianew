import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CUSTOMER_COOKIE = "sm_customer";

function loginRedirect(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/account/login";
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicAdmin = pathname === "/admin/login" || pathname === "/admin/setup";

  if (pathname.startsWith("/admin") && !isPublicAdmin) {
    const token = request.cookies.get("sm_admin")?.value;
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  const customerSignedIn = Boolean(request.cookies.get(CUSTOMER_COOKIE)?.value);

  if (pathname === "/checkout" && !customerSignedIn) {
    return loginRedirect(request, "/checkout");
  }

  if (pathname.startsWith("/account") && pathname !== "/account/login" && !customerSignedIn) {
    return loginRedirect(request, pathname);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/checkout", "/account", "/account/:path*"],
};
