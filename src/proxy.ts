import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Checagem otimista: sem cookie de sessão, manda para o login.
 * A validação real (sessão no banco, tenant e permissões) acontece no servidor.
 */
const PUBLICAS = ["/login", "/esqueci-senha", "/redefinir-senha", "/convite", "/termos", "/offline"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLICAS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (!getSessionCookie(request)) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icons|manifest.webmanifest|sw.js|robots.txt).*)"],
};
