import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);
const COOKIE_NAME = "ReviewIQ_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  userId: string;
  username: string;
  workspaceId?: string;
}

// ─── Token creation ───────────────────────────────────────────────────────────

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

// ─── Token verification ───────────────────────────────────────────────────────

export async function verifyToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

// ─── Session management ───────────────────────────────────────────────────────

export async function setSession(payload: SessionPayload): Promise<void> {
  const token = await createToken(payload);
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function clearSession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

// ─── Get session from request (for middleware / API routes) ───────────────────

export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ─── Get current user with workspace ─────────────────────────────────────────

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: {
      memberships: {
        include: { workspace: true },
        orderBy: { joinedAt: "asc" },
        take: 1,
      },
    },
  });

  return user;
}

// ─── GitHub OAuth URLs ────────────────────────────────────────────────────────

export function getGithubAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/github`,
    scope: "read:user user:email repo",
    state,
  });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("GitHub OAuth failed");
  return data.access_token;
}

export async function getGithubUser(accessToken: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return res.json();
}
