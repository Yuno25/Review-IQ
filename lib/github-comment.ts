import { db } from "@/lib/db";

// ─── Post review summary as GitHub PR comment ─────────────────────────────────

export async function postReviewComment(reviewId: string): Promise<void> {
  const review = await db.review.findUnique({
    where: { id: reviewId },
    include: {
      pullRequest: {
        include: {
          repository: { include: { workspace: { include: { owner: true } } } },
        },
      },
      issues: { orderBy: { severity: "asc" } },
    },
  });

  if (!review || review.status !== "COMPLETED") return;

  const token = review.pullRequest.repository.workspace.owner.githubToken;
  if (!token) return;

  const { fullName } = review.pullRequest.repository;
  const { number } = review.pullRequest;

  // Build comment markdown
  const body = buildCommentBody(review);

  // Post to GitHub
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/issues/${number}/comments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    console.error("Failed to post GitHub comment:", await res.text());
    return;
  }

  const comment = await res.json();

  // Save comment record
  await db.reviewComment.create({
    data: {
      reviewId,
      githubCommentId: comment.id,
      body,
      postedAt: new Date(),
    },
  });
}

// ─── Build markdown comment ───────────────────────────────────────────────────

function buildCommentBody(review: any): string {
  const score = review.overallScore ?? 0;
  const scoreEmoji = score >= 80 ? "🟢" : score >= 60 ? "🟡" : "🔴";
  const scoreBar = buildScoreBar(score);

  const sevCounts = {
    CRITICAL: review.issues.filter((i: any) => i.severity === "CRITICAL")
      .length,
    HIGH: review.issues.filter((i: any) => i.severity === "HIGH").length,
    MEDIUM: review.issues.filter((i: any) => i.severity === "MEDIUM").length,
    LOW: review.issues.filter((i: any) => i.severity === "LOW").length,
  };

  const issueLines = review.issues
    .slice(0, 10) // Max 10 issues in comment
    .map((issue: any) => {
      const severityIcons: Record<string, string> = {
        CRITICAL: "🔴",
        HIGH: "🟠",
        MEDIUM: "🔵",
        LOW: "🟢",
        INFO: "⚪",
      };
      const icon = severityIcons[issue.severity] ?? "⚪";
      const file = issue.filePath
        ? `\`${issue.filePath}${issue.lineStart ? `:${issue.lineStart}` : ""}\``
        : "";
      return [
        `### ${icon} ${issue.title}`,
        `**Severity:** ${issue.severity} · **Category:** ${issue.category.replace("_", " ")}${file ? ` · ${file}` : ""}`,
        "",
        issue.description,
        issue.suggestion ? `\n> 💡 **Suggestion:** ${issue.suggestion}` : "",
      ].join("\n");
    })
    .join("\n\n---\n\n");

  return `##  ReviewIQ Analysis

${scoreEmoji} **Overall Score: ${score}/100**

\`\`\`
${scoreBar}
\`\`\`

**Summary:** ${review.summary ?? "Review completed."}

---

### Issue Summary

| Severity | Count |
|----------|-------|
| 🔴 Critical | ${sevCounts.CRITICAL} |
| 🟠 High | ${sevCounts.HIGH} |
| 🔵 Medium | ${sevCounts.MEDIUM} |
| 🟢 Low | ${sevCounts.LOW} |

---

${
  review.issues.length === 0
    ? "**No issues found!** This PR looks clean."
    : `###  Issues Found\n\n${issueLines}`
}

${review.issues.length > 10 ? `\n_...and ${review.issues.length - 10} more issues. [View full report](${process.env.NEXT_PUBLIC_APP_URL}/reviews/${review.id})_` : ""}

---

<sub>Reviewed by [ReviewIQ](${process.env.NEXT_PUBLIC_APP_URL}) · Powered by Claude Opus 4 · [View Dashboard](${process.env.NEXT_PUBLIC_APP_URL}/dashboard)</sub>`;
}

function buildScoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return `Score: [${"█".repeat(filled)}${"░".repeat(empty)}] ${score}/100`;
}
