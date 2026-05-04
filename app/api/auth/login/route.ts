import { NextResponse } from "next/server";
import { getGithubAuthUrl } from "@/lib/auth";
import crypto from "crypto";

// In-memory fallback when Redis is unavailable
const stateStore = new Map<string, number>();

export async function GET() {
  const state = crypto.randomBytes(16).toString("hex");

  try {
    const { redis } = await import("@/lib/redis");
    await redis.set(`oauth:state:${state}`, "1", "EX", 600);
  } catch {
    // Redis down — use in-memory store with 10 min expiry
    stateStore.set(state, Date.now() + 600000);
    for (const [k, exp] of stateStore.entries()) {
      if (Date.now() > exp) stateStore.delete(k);
    }
  }

  const url = getGithubAuthUrl(state);
  return NextResponse.redirect(url);
}
