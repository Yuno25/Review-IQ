import { NextResponse } from "next/server";
import { getGithubAuthUrl } from "@/lib/auth";
import { redis } from "@/lib/redis";
import crypto from "crypto";

export async function GET() {
  // Generate and store CSRF state token
  const state = crypto.randomBytes(16).toString("hex");
  await redis.set(`oauth:state:${state}`, "1", "EX", 600); // 10 min TTL

  const url = getGithubAuthUrl(state);
  return NextResponse.redirect(url);
}
