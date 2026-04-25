import { NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  createSessionToken,
  validateLoginCredentials
} from "@/modules/auth/application/AuthSession";

type LoginPayload = {
  username?: string;
  password?: string;
};

export async function POST(request: Request): Promise<Response> {
  const payload = (await request.json().catch(() => ({}))) as LoginPayload;
  if (!validateLoginCredentials(payload)) {
    return NextResponse.json(
      { error: "Invalid username or password." },
      { status: 401 }
    );
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: createSessionToken(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12
  });
  return response;
}
