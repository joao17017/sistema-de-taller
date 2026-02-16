import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

const AUTH_COOKIE = "str_admin_session";
const SECRET = process.env.AUTH_SECRET || "str-default-secret";

// Session token max age: 24 hours
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function validateToken(token: string): Promise<boolean> {
  if (!token || !token.includes(".")) return false;
  const [raw, hash] = token.split(".");
  if (!raw || !hash || raw.length < 10 || hash.length !== 64) return false;

  // Check token expiration
  try {
    const timestamp = parseInt(raw.split("-")[0], 10);
    if (isNaN(timestamp) || Date.now() - timestamp > SESSION_MAX_AGE_MS) return false;
  } catch {
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(raw));
    const expected = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
    return expected === hash;
  } catch {
    return false;
  }
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Rate Limiting ───
  if (pathname === "/api/auth/login") {
    const ip = getClientIP(request);
    const { allowed, retryAfterMs } = checkRateLimit(ip + ":login", 5, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfterMs / 1000)} segundos.` },
        { status: 429 }
      );
    }
  }

  if (pathname === "/api/orders/verify") {
    const ip = getClientIP(request);
    const { allowed, retryAfterMs } = checkRateLimit(ip + ":verify", 10, 5 * 60 * 1000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Demasiados intentos. Intenta de nuevo en ${Math.ceil(retryAfterMs / 1000)} segundos.` },
        { status: 429 }
      );
    }
  }

  // Allow login page without auth
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  // Protect /admin routes (auth check)
  if (pathname.startsWith("/admin")) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    if (!session || !(await validateToken(session))) {
      const loginUrl = new URL("/admin/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Public API routes: client portal verification, portal data, budget actions, public search, public settings GET
  const isPublicRoute =
    pathname === "/api/orders/verify" ||
    pathname.startsWith("/api/orders/portal/") ||
    (pathname.match(/\/api\/orders\/[^/]+\/budget/) && request.method === "POST") ||
    (pathname === "/api/orders/search" && request.method === "GET") ||
    (pathname === "/api/settings" && request.method === "GET");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // All other API routes require admin auth (GET and write)
  const isApiRoute =
    pathname.startsWith("/api/orders") ||
    pathname.startsWith("/api/settings") ||
    pathname.startsWith("/api/parts") ||
    pathname.startsWith("/api/services") ||
    pathname.startsWith("/api/notifications") ||
    pathname.startsWith("/api/export") ||
    pathname.startsWith("/api/auth/change-password");

  if (isApiRoute) {
    const session = request.cookies.get(AUTH_COOKIE)?.value;
    if (!session || !(await validateToken(session))) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/orders/:path*", "/api/settings/:path*", "/api/parts/:path*", "/api/services/:path*", "/api/notifications/:path*", "/api/export/:path*", "/api/auth/:path*"],
};
