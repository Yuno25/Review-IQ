import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { postReviewComment } from "@/lib/github-comments";
import { IssueSeverity, IssueCategory, ReviewStatus } from "@prisma/client";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface PRDiff {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch?: string;
}

export interface ReviewResult {
  summary: string;
  overallScore: number;
  issues: {
    severity: IssueSeverity;
    category: IssueCategory;
    title: string;
    description: string;
    suggestion?: string;
    filePath?: string;
    lineStart?: number;
    lineEnd?: number;
    codeSnippet?: string;
  }[];
}

const SYSTEM_PROMPT = `You are ReviewIQ, an expert code reviewer. Analyze pull request diffs and return ONLY valid JSON — no markdown, no prose.

JSON schema:
{
  "summary": "2-4 sentence overview of what this PR does and overall quality",
  "overallScore": 0-100,
  "issues": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "SECURITY" | "PERFORMANCE" | "MAINTAINABILITY" | "BUG" | "STYLE" | "DOCUMENTATION" | "TEST_COVERAGE",
      "title": "short issue title",
      "description": "clear explanation of the problem",
      "suggestion": "concrete fix",
      "filePath": "string | null",
      "lineStart": "number | null",
      "lineEnd": "number | null",
      "codeSnippet": "string | null"
    }
  ]
}

Severity guide:
- CRITICAL: security vulnerabilities, data loss, crashes
- HIGH: bugs, logic errors, major performance issues
- MEDIUM: missing error handling, minor performance
- LOW: style issues, naming conventions
- INFO: suggestions, best practices`;

function buildPrompt(
  title: string,
  description: string | null,
  diffs: PRDiff[],
): string {
  const diffText = diffs
    .slice(0, 20)
    .map((d) => {
      const patch = d.patch?.slice(0, 3000) ?? "(binary or no changes)";
      return `### File: ${d.filename} (+${d.additions} -${d.deletions})\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");

  return `# Pull Request: ${title}\n**Description:** ${description || "No description"}\n\n${diffText}\n\nReturn JSON analysis only.`;
}

// ─── Check if workspace has premium plan ──────────────────────────────────────
async function isPremium(workspaceId: string): Promise<boolean> {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  return (
    sub?.plan === "PRO" || sub?.plan === "TEAM" || sub?.plan === "ENTERPRISE"
  );
}

// ─── Main review function ─────────────────────────────────────────────────────
export async function runReview(
  reviewId: string,
  prTitle: string,
  prDescription: string | null,
  diffs: PRDiff[],
  onChunk?: (chunk: string) => void,
): Promise<ReviewResult> {
  const startTime = Date.now();

  await db.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.IN_PROGRESS },
  });

  try {
    const prompt = buildPrompt(prTitle, prDescription, diffs);
    let fullResponse = "";
    let tokensUsed = 0;

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    });

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        fullResponse += chunk.delta.text;
        onChunk?.(chunk.delta.text);
      }
    }

    const finalMessage = await stream.finalMessage();
    tokensUsed =
      (finalMessage.usage?.input_tokens ?? 0) +
      (finalMessage.usage?.output_tokens ?? 0);

    const cleanJson = fullResponse.replace(/```json\n?|```/g, "").trim();
    const result: ReviewResult = JSON.parse(cleanJson);
    const durationMs = Date.now() - startTime;

    // Save review + issues
    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.COMPLETED,
        summary: result.summary,
        overallScore: result.overallScore,
        tokensUsed,
        durationMs,
        completedAt: new Date(),
        issues: {
          create: result.issues.map((issue) => ({
            severity: issue.severity,
            category: issue.category,
            title: issue.title,
            description: issue.description,
            suggestion: issue.suggestion,
            filePath: issue.filePath,
            lineStart: issue.lineStart,
            lineEnd: issue.lineEnd,
            codeSnippet: issue.codeSnippet,
          })),
        },
      },
      include: { pullRequest: { include: { repository: true } } },
    });

    // Post GitHub comment if workspace is on premium plan
    const premium = await isPremium(
      updatedReview.pullRequest.repository.workspaceId,
    );
    if (premium) {
      try {
        await postReviewComment(reviewId);
      } catch (e) {
        console.error("Failed to post GitHub comment:", e);
        // Non-fatal — review is still saved
      }
    }

    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    await db.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });
    throw err;
  }
}

// ─── Fetch PR diffs from GitHub ───────────────────────────────────────────────
export async function fetchPRDiffs(
  repoFullName: string,
  prNumber: number,
  githubToken: string,
): Promise<PRDiff[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/files`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}
