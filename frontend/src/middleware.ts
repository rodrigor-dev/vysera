import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/admin"];
const authRoutes = ["/auth/login", "/auth/register", "/auth/forgot-password"];

function isRouteMatch(pathname: string, routes: string[]): boolean {
  return routes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessToken = request.cookies.get("accessToken")?.value;
  const isAuthenticated = !!accessToken;
  const isProtectedRoute = isRouteMatch(pathname, protectedRoutes);
  const isAuthRoute = isRouteMatch(pathname, authRoutes);

  if (isProtectedRoute && !isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && isAuthenticated) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
