import Groq from "groq-sdk";
import { db } from "@/lib/db";
import { postReviewComment } from "@/lib/github-comment";
import { IssueSeverity, IssueCategory, ReviewStatus } from "@prisma/client";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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

const SYSTEM_PROMPT = `You are ReviewIQ, an expert code reviewer. Analyze pull request diffs and return ONLY valid JSON — no markdown, no backticks, no prose.

JSON schema:
{
  "summary": "2-4 sentence overview of what this PR does and overall quality",
  "overallScore": number 0-100,
  "issues": [
    {
      "severity": "CRITICAL" or "HIGH" or "MEDIUM" or "LOW" or "INFO",
      "category": "SECURITY" or "PERFORMANCE" or "MAINTAINABILITY" or "BUG" or "STYLE" or "DOCUMENTATION" or "TEST_COVERAGE",
      "title": "short issue title",
      "description": "clear explanation of the problem",
      "suggestion": "concrete fix",
      "filePath": "string or null",
      "lineStart": number or null,
      "lineEnd": number or null,
      "codeSnippet": "string or null"
    }
  ]
}

Severity guide:
- CRITICAL: security vulnerabilities, data loss, crashes
- HIGH: bugs, logic errors, major performance issues
- MEDIUM: missing error handling, minor performance
- LOW: style issues, naming conventions
- INFO: suggestions, best practices

Return raw JSON only. No backticks. No explanation.`;

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

  return `# Pull Request: ${title}\nDescription: ${description || "None"}\n\n${diffText}\n\nReturn JSON analysis only.`;
}

async function isPremium(workspaceId: string): Promise<boolean> {
  const sub = await db.subscription.findUnique({ where: { workspaceId } });
  return (
    sub?.plan === "PRO" || sub?.plan === "TEAM" || sub?.plan === "ENTERPRISE"
  );
}

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

    // Stream from Groq
    const stream = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 4096,
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? "";
      fullResponse += text;
      if (text) onChunk?.(text);
    }

    const durationMs = Date.now() - startTime;
    const clean = fullResponse.replace(/```json\n?|```/g, "").trim();
    const result: ReviewResult = JSON.parse(clean);
    const tokensUsed =
      Math.ceil(prompt.length / 4) + Math.ceil(fullResponse.length / 4);

    const updatedReview = await db.review.update({
      where: { id: reviewId },
      data: {
        status: ReviewStatus.COMPLETED,
        summary: result.summary,
        overallScore: result.overallScore,
        tokensUsed,
        durationMs,
        modelVersion: "llama-3.3-70b-versatile",
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

    const premium = await isPremium(
      updatedReview.pullRequest.repository.workspaceId,
    );
    if (premium) {
      try {
        await postReviewComment(reviewId);
      } catch (e) {
        console.error(e);
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
