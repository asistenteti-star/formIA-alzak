import { NextResponse } from "next/server";
import { ADMIN_COOKIE, getCookieOptions } from "@/lib/admin-session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { token } = await params;
  const secret = process.env.ADMIN_SECRET;

  if (!secret || token !== secret) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const url = new URL("/admin", request.url);
  const res = NextResponse.redirect(url, { status: 303 });

  const opts = getCookieOptions();
  res.cookies.set({
    name: ADMIN_COOKIE,
    value: secret,
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
    secure: opts.secure,
    path: opts.path,
    maxAge: opts.maxAge,
  });

  return res;
}
