import Anthropic from "@anthropic-ai/sdk";
import { db } from "@/lib/db";
import { IssueSeverity, IssueCategory, ReviewStatus } from "@prisma/client";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are ReviewIQ, an expert code reviewer with deep knowledge of software engineering best practices, security vulnerabilities, performance optimization, and clean code principles.

Your job is to analyze pull request diffs and provide structured, actionable feedback.

You MUST respond with valid JSON only — no markdown, no prose outside the JSON. The JSON schema is:

{
  "summary": "string — 2-4 sentence overview of what this PR does and overall quality",
  "overallScore": number — 0 to 100 (100 = perfect code),
  "issues": [
    {
      "severity": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFO",
      "category": "SECURITY" | "PERFORMANCE" | "MAINTAINABILITY" | "BUG" | "STYLE" | "DOCUMENTATION" | "TEST_COVERAGE",
      "title": "string — short issue title",
      "description": "string — clear explanation of the problem",
      "suggestion": "string — concrete fix or improvement",
      "filePath": "string | null",
      "lineStart": number | null,
      "lineEnd": number | null,
      "codeSnippet": "string | null — relevant code snippet"
    }
  ]
}

Severity guide:
- CRITICAL: Security vulnerabilities, data loss risks, crashes
- HIGH: Bugs, logic errors, major performance issues
- MEDIUM: Code smells, missing error handling, minor performance
- LOW: Style issues, naming conventions
- INFO: Suggestions, optimizations, best practices`;

// ─── Build diff prompt ────────────────────────────────────────────────────────

function buildDiffPrompt(
  prTitle: string,
  prDescription: string | null,
  diffs: PRDiff[]
): string {
  const diffText = diffs
    .slice(0, 20) // Limit to 20 files max
    .map((d) => {
      const patch = d.patch
        ? d.patch.slice(0, 3000) // Truncate large patches
        : "(binary or no changes)";
      return `### File: ${d.filename} (+${d.additions} -${d.deletions})\n\`\`\`diff\n${patch}\n\`\`\``;
    })
    .join("\n\n");

  return `# Pull Request: ${prTitle}

**Description:** ${prDescription || "No description provided"}

**Changed Files (${diffs.length} total):**

${diffText}

Please review this pull request and return your analysis as JSON.`;
}

// ─── Main review function (streaming) ────────────────────────────────────────

export async function runReview(
  reviewId: string,
  prTitle: string,
  prDescription: string | null,
  diffs: PRDiff[],
  onChunk?: (chunk: string) => void
): Promise<ReviewResult> {
  const startTime = Date.now();

  // Mark review as in-progress
  await db.review.update({
    where: { id: reviewId },
    data: { status: ReviewStatus.IN_PROGRESS },
  });

  try {
    const prompt = buildDiffPrompt(prTitle, prDescription, diffs);
    let fullResponse = "";
    let tokensUsed = 0;

    // Stream the review
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

    // Parse the JSON response
    const cleanJson = fullResponse.replace(/```json\n?|```/g, "").trim();
    const result: ReviewResult = JSON.parse(cleanJson);

    const durationMs = Date.now() - startTime;

    // Save to DB
    await db.review.update({
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
    });

    return result;
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error";

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
  githubToken: string
): Promise<PRDiff[]> {
  const res = await fetch(
    `https://api.github.com/repos/${repoFullName}/pulls/${prNumber}/files`,
    {
      headers: {
        Authorization: `Bearer ${githubToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    }
  );

  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}
