import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { redis } from "@/lib/redis";
import {
  exchangeCodeForToken,
  getGithubUser,
  setSession,
} from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(new URL("/login?error=missing_params", req.url));
  }

  // Validate CSRF state
  const storedState = await redis.get(`oauth:state:${state}`);
  if (!storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", req.url));
  }
  await redis.del(`oauth:state:${state}`);

  try {
    // Exchange code for GitHub access token
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(accessToken);

    // Upsert user in DB
    const user = await db.user.upsert({
      where: { githubId: githubUser.id },
      create: {
        githubId: githubUser.id,
        username: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        githubToken: accessToken,
      },
      update: {
        username: githubUser.login,
        email: githubUser.email,
        name: githubUser.name,
        avatarUrl: githubUser.avatar_url,
        githubToken: accessToken,
      },
    });

    // Create default workspace if user is new
    let workspace = await db.workspace.findFirst({
      where: { ownerId: user.id },
    });

    if (!workspace) {
      const slug = `${githubUser.login}-workspace`;
      workspace = await db.workspace.create({
        data: {
          name: `${githubUser.name ?? githubUser.login}'s Workspace`,
          slug,
          ownerId: user.id,
          members: {
            create: { userId: user.id, role: "OWNER" },
          },
          subscription: {
            create: { plan: "FREE" },
          },
          usageRecords: {
            create: {
              month: new Date().toISOString().slice(0, 7),
              reviewLimit: 50,
              tokenLimit: 500000,
            },
          },
        },
      });
    }

    // Set JWT session cookie
    await setSession({
      userId: user.id,
      username: user.username,
      workspaceId: workspace.id,
    });

    return NextResponse.redirect(new URL("/dashboard", req.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/login?error=auth_failed", req.url));
  }
}
