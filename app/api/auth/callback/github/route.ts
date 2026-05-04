import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exchangeCodeForToken, getGithubUser, setSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  if (!code || !state) {
    return NextResponse.redirect(
      new URL("/login?error=missing_params", req.url),
    );
  }

  // Validate state via Redis (skip if unavailable)
  try {
    const { redis } = await import("@/lib/redis");
    const stored = await redis.get(`oauth:state:${state}`);
    if (!stored) {
      return NextResponse.redirect(
        new URL("/login?error=invalid_state", req.url),
      );
    }
    await redis.del(`oauth:state:${state}`);
  } catch {
    console.warn("Redis unavailable — skipping state validation");
  }

  try {
    const accessToken = await exchangeCodeForToken(code);
    const githubUser = await getGithubUser(accessToken);

    // Try to find existing user by githubId first
    let user = await db.user.findUnique({ where: { githubId: githubUser.id } });

    if (user) {
      // Update existing user
      user = await db.user.update({
        where: { githubId: githubUser.id },
        data: {
          username: githubUser.login,
          email: githubUser.email,
          name: githubUser.name,
          avatarUrl: githubUser.avatar_url,
          githubToken: accessToken,
        },
      });
    } else {
      // Check if username already taken (from seed data)
      const existingByUsername = await db.user.findUnique({
        where: { username: githubUser.login },
      });

      if (existingByUsername) {
        // Update the seed user with real GitHub ID
        user = await db.user.update({
          where: { username: githubUser.login },
          data: {
            githubId: githubUser.id,
            email: githubUser.email,
            name: githubUser.name,
            avatarUrl: githubUser.avatar_url,
            githubToken: accessToken,
          },
        });
      } else {
        // Create new user
        user = await db.user.create({
          data: {
            githubId: githubUser.id,
            username: githubUser.login,
            email: githubUser.email,
            name: githubUser.name,
            avatarUrl: githubUser.avatar_url,
            githubToken: accessToken,
          },
        });
      }
    }

    // Create default workspace if none exists
    let workspace = await db.workspace.findFirst({
      where: { ownerId: user.id },
    });

    if (!workspace) {
      workspace = await db.workspace.create({
        data: {
          name: `${githubUser.name ?? githubUser.login}'s Workspace`,
          slug: `${githubUser.login}-workspace`,
          ownerId: user.id,
          members: { create: { userId: user.id, role: "OWNER" } },
          subscription: { create: { plan: "FREE" } },
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
