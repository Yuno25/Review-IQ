import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enqueueReview } from "@/lib/redis";
import crypto from "crypto";

// Verify the webhook came from GitHub
function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = `sha256=${crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex")}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export async function POST(req: NextRequest) {
  const event = req.headers.get("x-github-event");
  const signature = req.headers.get("x-hub-signature-256");
  const body = await req.text();

  // Verify webhook signature if secret is configured
  if (process.env.GITHUB_WEBHOOK_SECRET && signature) {
    if (!verifySignature(body, signature, process.env.GITHUB_WEBHOOK_SECRET)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Only handle pull_request events
  if (event !== "pull_request") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  const payload = JSON.parse(body);
  const { action, pull_request, repository } = payload;

  // Only trigger on opened or reopened PRs
  if (!["opened", "reopened", "synchronize"].includes(action)) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Skip draft PRs
  if (pull_request.draft) {
    return NextResponse.json({ ok: true, skipped: "draft PR" });
  }

  try {
    // Find the repository in our DB
    const repo = await db.repository.findUnique({
      where: { githubRepoId: repository.id },
      include: { workspace: true },
    });

    if (!repo) {
      return NextResponse.json(
        { error: "Repository not found" },
        { status: 404 },
      );
    }

    // Upsert the pull request
    const pr = await db.pullRequest.upsert({
      where: {
        repositoryId_githubPrId: {
          repositoryId: repo.id,
          githubPrId: pull_request.id,
        },
      },
      create: {
        repositoryId: repo.id,
        githubPrId: pull_request.id,
        number: pull_request.number,
        title: pull_request.title,
        description: pull_request.body,
        author: pull_request.user.login,
        authorAvatar: pull_request.user.avatar_url,
        baseBranch: pull_request.base.ref,
        headBranch: pull_request.head.ref,
        additions: pull_request.additions ?? 0,
        deletions: pull_request.deletions ?? 0,
        changedFiles: pull_request.changed_files ?? 0,
        isDraft: pull_request.draft ?? false,
        githubUrl: pull_request.html_url,
        openedAt: new Date(pull_request.created_at),
      },
      update: {
        title: pull_request.title,
        description: pull_request.body,
        additions: pull_request.additions ?? 0,
        deletions: pull_request.deletions ?? 0,
        changedFiles: pull_request.changed_files ?? 0,
      },
    });

    // Check usage limits before queuing
    const month = new Date().toISOString().slice(0, 7);
    const usage = await db.usageRecord.findUnique({
      where: { workspaceId_month: { workspaceId: repo.workspaceId, month } },
    });

    if (usage && usage.reviewsCount >= usage.reviewLimit) {
      return NextResponse.json(
        { error: "Usage limit reached" },
        { status: 402 },
      );
    }

    // Create a review record and enqueue it
    const review = await db.review.create({
      data: {
        pullRequestId: pr.id,
        triggeredBy: "webhook",
      },
    });

    await enqueueReview(review.id);

    return NextResponse.json({ ok: true, reviewId: review.id });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
