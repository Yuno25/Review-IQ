import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rateLimit } from "@/lib/redis";
import { getSessionFromRequest } from "@/lib/auth";
import { runReview, fetchPRDiffs } from "@/lib/claude";
import { z } from "zod";

const TriggerSchema = z.object({
  pullRequestId: z.string().cuid(),
});

export async function POST(req: NextRequest) {
  // Auth
  const session = await getSessionFromRequest(req);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Rate limit: 10 reviews per minute per user
  const rl = await rateLimit(`review:${session.userId}`, 10, 60);
  if (!rl.success) {
    return NextResponse.json(
      { error: "Rate limit exceeded", resetAt: rl.resetAt },
      { status: 429 }
    );
  }

  const body = TriggerSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { pullRequestId } = body.data;

  // Load PR + repo + user token
  const pr = await db.pullRequest.findUnique({
    where: { id: pullRequestId },
    include: {
      repository: {
        include: {
          workspace: {
            include: {
              owner: { select: { githubToken: true } },
              usageRecords: {
                where: { month: new Date().toISOString().slice(0, 7) },
              },
            },
          },
        },
      },
    },
  });

  if (!pr) return NextResponse.json({ error: "PR not found" }, { status: 404 });

  // Check usage limits
  const usage = pr.repository.workspace.usageRecords[0];
  if (usage && usage.reviewsCount >= usage.reviewLimit) {
    return NextResponse.json(
      { error: "Monthly review limit reached. Please upgrade your plan." },
      { status: 402 }
    );
  }

  const githubToken = pr.repository.workspace.owner.githubToken;
  if (!githubToken) {
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });
  }

  // Create review record
  const review = await db.review.create({
    data: {
      pullRequestId,
      triggeredBy: session.userId,
    },
  });

  // Stream response back to client
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const diffs = await fetchPRDiffs(
          pr.repository.fullName,
          pr.number,
          githubToken
        );

        const result = await runReview(
          review.id,
          pr.title,
          pr.description,
          diffs,
          (chunk) => {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`));
          }
        );

        // Update usage
        await db.usageRecord.upsert({
          where: {
            workspaceId_month: {
              workspaceId: pr.repository.workspaceId,
              month: new Date().toISOString().slice(0, 7),
            },
          },
          create: {
            workspaceId: pr.repository.workspaceId,
            month: new Date().toISOString().slice(0, 7),
            reviewsCount: 1,
            tokensUsed: result.issues.length,
          },
          update: {
            reviewsCount: { increment: 1 },
          },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true, reviewId: review.id })}\n\n`)
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : "Review failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
