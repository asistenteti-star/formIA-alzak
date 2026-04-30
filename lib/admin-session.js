import { cookies } from "next/headers";

export const ADMIN_COOKIE = "alzak_admin_session";
const SEVEN_DAYS = 60 * 60 * 24 * 7;

/** Verifica si la cookie de admin coincide con ADMIN_SECRET. */
export async function isAdminAuthenticated() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;
  return value === secret;
}

export function getCookieOptions() {
  return {
    name: ADMIN_COOKIE,
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SEVEN_DAYS,
  };
}
