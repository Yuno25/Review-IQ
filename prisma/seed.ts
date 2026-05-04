import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

async function main() {
  console.log("🌱 Seeding ReviewIQ database...");

  // ── Clean existing data ──────────────────────────────────────────────────────
  await db.reviewComment.deleteMany();
  await db.reviewIssue.deleteMany();
  await db.review.deleteMany();
  await db.pullRequest.deleteMany();
  await db.repository.deleteMany();
  await db.usageRecord.deleteMany();
  await db.subscription.deleteMany();
  await db.workspaceMember.deleteMany();
  await db.workspace.deleteMany();
  await db.user.deleteMany();

  console.log("✅ Cleared old data");

  // ── Create user ──────────────────────────────────────────────────────────────
  const user = await db.user.create({
    data: {
      githubId: 99999999,
      username: "Yuno25",
      email: "mohit@example.com",
      name: "Mohit Shrivastava",
      avatarUrl: "https://avatars.githubusercontent.com/u/99999999",
    },
  });

  // ── Create workspace ─────────────────────────────────────────────────────────
  const workspace = await db.workspace.create({
    data: {
      name: "Mohit's Workspace",
      slug: "yuno25-workspace",
      ownerId: user.id,
      members: { create: { userId: user.id, role: "OWNER" } },
      subscription: { create: { plan: "PRO" } },
      usageRecords: {
        create: {
          month: new Date().toISOString().slice(0, 7),
          reviewsCount: 38,
          tokensUsed: 142800,
          reviewLimit: 500,
          tokenLimit: 5000000,
        },
      },
    },
  });

  // ── Create repos ─────────────────────────────────────────────────────────────
  const repos = await Promise.all([
    db.repository.create({
      data: {
        workspaceId: workspace.id,
        githubRepoId: 111111111,
        fullName: "Yuno25/review-iq",
        name: "review-iq",
        private: false,
        defaultBranch: "main",
        language: "TypeScript",
      },
    }),
    db.repository.create({
      data: {
        workspaceId: workspace.id,
        githubRepoId: 222222222,
        fullName: "Yuno25/portfolio-api",
        name: "portfolio-api",
        private: true,
        defaultBranch: "main",
        language: "Python",
      },
    }),
    db.repository.create({
      data: {
        workspaceId: workspace.id,
        githubRepoId: 333333333,
        fullName: "Yuno25/next-ecommerce",
        name: "next-ecommerce",
        private: false,
        defaultBranch: "develop",
        language: "TypeScript",
      },
    }),
  ]);

  console.log("✅ Created 3 repositories");

  // ── PR + Review data ─────────────────────────────────────────────────────────
  const prData = [
    {
      repo: repos[0],
      number: 47,
      title: "feat: add JWT authentication middleware",
      author: "Yuno25",
      additions: 234,
      deletions: 18,
      changedFiles: 6,
      score: 74,
      summary:
        "Solid JWT implementation with good structure. Critical security issue with hardcoded secret that must be fixed before merge. N+1 query in user lookup will cause performance issues at scale.",
      issues: [
        {
          sev: "CRITICAL",
          cat: "SECURITY",
          title: "JWT secret hardcoded in source",
          desc: "The JWT secret 'mysecret123' is hardcoded on line 42. Anyone with repo access can forge tokens.",
          sug: "Use process.env.JWT_SECRET instead.",
          file: "src/auth/jwt.ts",
          line: 42,
        },
        {
          sev: "HIGH",
          cat: "PERFORMANCE",
          title: "N+1 query in user lookup",
          desc: "fetchUserById() is called inside a loop causing N database queries per request.",
          sug: "Batch with db.user.findMany({ where: { id: { in: ids } } })",
          file: "src/auth/middleware.ts",
          line: 67,
        },
        {
          sev: "MEDIUM",
          cat: "MAINTAINABILITY",
          title: "Missing error handling in async routes",
          desc: "3 async functions lack try/catch blocks — unhandled rejections crash the server.",
          sug: "Add global error middleware or wrap handlers.",
          file: "src/routes/auth.ts",
          line: 23,
        },
        {
          sev: "LOW",
          cat: "STYLE",
          title: "Inconsistent naming convention",
          desc: "Mix of camelCase and snake_case in the same file.",
          sug: "Standardize on camelCase throughout.",
          file: "src/auth/jwt.ts",
          line: 15,
        },
      ],
    },
    {
      repo: repos[0],
      number: 46,
      title: "fix: resolve memory leak in WebSocket handler",
      author: "Yuno25",
      additions: 45,
      deletions: 89,
      changedFiles: 3,
      score: 91,
      summary:
        "Excellent fix. Properly cleans up event listeners and intervals. Small improvement possible in the cleanup timing but overall this is well-written code.",
      issues: [
        {
          sev: "LOW",
          cat: "PERFORMANCE",
          title: "Cleanup could be more aggressive",
          desc: "The 5000ms timeout before cleanup could leave stale connections longer than needed.",
          sug: "Consider reducing to 2000ms or making it configurable.",
        },
        {
          sev: "INFO",
          cat: "DOCUMENTATION",
          title: "Missing JSDoc for public methods",
          desc: "Public WebSocket methods lack documentation.",
          sug: "Add JSDoc comments for better IDE support.",
        },
      ],
    },
    {
      repo: repos[1],
      number: 23,
      title: "refactor: migrate from SQLite to PostgreSQL",
      author: "Yuno25",
      additions: 567,
      deletions: 234,
      changedFiles: 14,
      score: 82,
      summary:
        "Well-executed database migration. Good use of transactions. A few raw SQL queries that could use parameterization and some missing indexes on frequently queried columns.",
      issues: [
        {
          sev: "HIGH",
          cat: "SECURITY",
          title: "Raw SQL string interpolation",
          desc: "Line 134 uses f-string interpolation in a SQL query — potential SQL injection.",
          sug: "Use parameterized queries: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))",
          file: "db/queries.py",
          line: 134,
        },
        {
          sev: "MEDIUM",
          cat: "PERFORMANCE",
          title: "Missing index on foreign keys",
          desc: "user_id column in posts table has no index — will cause full table scans.",
          sug: "Add: CREATE INDEX idx_posts_user_id ON posts(user_id);",
          file: "db/migrations/001.sql",
          line: 45,
        },
        {
          sev: "LOW",
          cat: "MAINTAINABILITY",
          title: "Magic numbers in query limits",
          desc: "Hardcoded LIMIT 100 values should be constants.",
          sug: "Define DEFAULT_PAGE_SIZE = 100 as a constant.",
        },
      ],
    },
    {
      repo: repos[2],
      number: 31,
      title: "feat: add Stripe payment integration",
      author: "Yuno25",
      additions: 892,
      deletions: 12,
      changedFiles: 19,
      score: 68,
      summary:
        "Stripe integration functional but has significant issues. Webhook signature verification is missing which is a critical security flaw. Error handling is inconsistent and several edge cases are not handled.",
      issues: [
        {
          sev: "CRITICAL",
          cat: "SECURITY",
          title: "Webhook signature not verified",
          desc: "Stripe webhook endpoint at /api/webhooks/stripe does not verify the Stripe-Signature header. Anyone can forge webhook events.",
          sug: "Use stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)",
          file: "app/api/webhooks/stripe/route.ts",
          line: 12,
        },
        {
          sev: "HIGH",
          cat: "BUG",
          title: "Race condition in subscription update",
          desc: "Subscription status updated before payment confirmation — users may get premium access before payment clears.",
          sug: "Only update subscription after payment_intent.succeeded webhook.",
          file: "lib/billing.ts",
          line: 89,
        },
        {
          sev: "HIGH",
          cat: "PERFORMANCE",
          title: "No idempotency on payment creation",
          desc: "Duplicate checkout sessions could be created on network retry.",
          sug: "Pass idempotencyKey to stripe.checkout.sessions.create()",
          file: "app/api/checkout/route.ts",
          line: 34,
        },
        {
          sev: "MEDIUM",
          cat: "MAINTAINABILITY",
          title: "Error messages expose internal details",
          desc: "Stripe error messages are returned directly to client, exposing API internals.",
          sug: "Map Stripe errors to user-friendly messages.",
        },
        {
          sev: "LOW",
          cat: "TEST_COVERAGE",
          title: "No tests for payment flows",
          desc: "Critical payment logic has zero test coverage.",
          sug: "Add integration tests with Stripe test mode.",
        },
      ],
    },
    {
      repo: repos[0],
      number: 45,
      title: "chore: update dependencies and fix security advisories",
      author: "Yuno25",
      additions: 23,
      deletions: 23,
      changedFiles: 2,
      score: 96,
      summary:
        "Clean dependency update. All security advisories resolved. No breaking changes detected.",
      issues: [
        {
          sev: "INFO",
          cat: "MAINTAINABILITY",
          title: "Consider pinning major versions",
          desc: "Some deps use ^ which allows minor version jumps.",
          sug: "Consider using exact versions for critical dependencies.",
        },
      ],
    },
  ];

  // Create PRs and reviews
  for (const pr of prData) {
    const daysAgo = Math.floor(Math.random() * 14);
    const openedAt = new Date(Date.now() - daysAgo * 86400000);

    const dbPR = await db.pullRequest.create({
      data: {
        repositoryId: pr.repo.id,
        githubPrId: Math.floor(Math.random() * 999999),
        number: pr.number,
        title: pr.title,
        author: pr.author,
        authorAvatar: `https://avatars.githubusercontent.com/u/99999999`,
        baseBranch: "main",
        headBranch: `feature/${pr.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 30)}`,
        additions: pr.additions,
        deletions: pr.deletions,
        changedFiles: pr.changedFiles,
        githubUrl: `https://github.com/${pr.repo.fullName}/pull/${pr.number}`,
        openedAt,
      },
    });

    await db.review.create({
      data: {
        pullRequestId: dbPR.id,
        status: "COMPLETED",
        summary: pr.summary,
        overallScore: pr.score,
        tokensUsed: Math.floor(Math.random() * 4000) + 2000,
        durationMs: Math.floor(Math.random() * 3000) + 1000,
        modelVersion: "claude-opus-4-20250514",
        triggeredBy: user.id,
        completedAt: new Date(openedAt.getTime() + 5000),
        issues: {
          create: pr.issues.map((issue: any) => ({
            severity: issue.sev,
            category: issue.cat,
            title: issue.title,
            description: issue.desc,
            suggestion: issue.sug,
            filePath: issue.file ?? null,
            lineStart: issue.line ?? null,
          })),
        },
      },
    });
  }

  console.log("✅ Created 5 PRs with reviews and issues");

  // ── Pending PRs (no review yet) ──────────────────────────────────────────────
  await db.pullRequest.createMany({
    data: [
      {
        repositoryId: repos[0].id,
        githubPrId: 500001,
        number: 48,
        title: "feat: add dark mode toggle",
        author: "Yuno25",
        authorAvatar: "https://avatars.githubusercontent.com/u/99999999",
        baseBranch: "main",
        headBranch: "feat/dark-mode",
        additions: 156,
        deletions: 34,
        changedFiles: 8,
        githubUrl: `https://github.com/${repos[0].fullName}/pull/48`,
        openedAt: new Date(Date.now() - 3600000),
      },
      {
        repositoryId: repos[1].id,
        githubPrId: 500002,
        number: 24,
        title: "fix: handle null user in profile endpoint",
        author: "Yuno25",
        authorAvatar: "https://avatars.githubusercontent.com/u/99999999",
        baseBranch: "main",
        headBranch: "fix/null-user",
        additions: 12,
        deletions: 3,
        changedFiles: 1,
        githubUrl: `https://github.com/${repos[1].fullName}/pull/24`,
        openedAt: new Date(Date.now() - 7200000),
      },
      {
        repositoryId: repos[2].id,
        githubPrId: 500003,
        number: 32,
        title: "refactor: extract checkout logic to service layer",
        author: "Yuno25",
        authorAvatar: "https://avatars.githubusercontent.com/u/99999999",
        baseBranch: "main",
        headBranch: "refactor/checkout-service",
        additions: 234,
        deletions: 189,
        changedFiles: 11,
        githubUrl: `https://github.com/${repos[2].fullName}/pull/32`,
        openedAt: new Date(Date.now() - 1800000),
      },
    ],
  });

  console.log("✅ Created 3 pending PRs");
  console.log("\n🎉 Seed complete!");
  console.log(`   User:      @Yuno25`);
  console.log(`   Workspace: Mohit's Workspace (PRO plan)`);
  console.log(`   Repos:     3 connected`);
  console.log(`   Reviews:   5 completed, 3 pending`);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
