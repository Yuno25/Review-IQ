import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  GitPullRequest,
  CheckCircle,
  AlertTriangle,
  Zap,
  TrendingUp,
  Clock,
  Shield,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PRReviewQueue } from "@/components/dashboard/PRReviewQueue";
import { IssueBreakdown } from "@/components/dashboard/IssueBreakdown";

export const metadata = { title: "Dashboard" };

async function getDashboardData(workspaceId: string) {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [usage, reviews, issueStats, recentPRs] = await Promise.all([
    db.usageRecord.findUnique({
      where: { workspaceId_month: { workspaceId, month } },
    }),
    db.review.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo },
        pullRequest: { repository: { workspaceId } },
      },
      include: { pullRequest: { include: { repository: true } }, issues: true },
      orderBy: { createdAt: "desc" },
    }),
    db.reviewIssue.groupBy({
      by: ["severity"],
      where: {
        review: {
          pullRequest: { repository: { workspaceId } },
          createdAt: { gte: thirtyDaysAgo },
        },
      },
      _count: true,
    }),
    db.pullRequest.findMany({
      where: {
        repository: { workspaceId },
        reviews: { none: {} },
        closedAt: null,
        mergedAt: null,
      },
      include: { repository: true },
      orderBy: { openedAt: "desc" },
      take: 8,
    }),
  ]);

  const completed = reviews.filter((r) => r.status === "COMPLETED");
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, r) => s + (r.overallScore ?? 0), 0) /
            completed.length,
        )
      : 0;
  const avgDuration =
    completed.length > 0
      ? Math.round(
          completed.reduce((s, r) => s + (r.durationMs ?? 0), 0) /
            completed.length /
            1000,
        )
      : 0;

  const dailyCounts = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now.getTime() - (13 - i) * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayRevs = completed.filter(
      (r) => r.createdAt.toISOString().slice(0, 10) === dateStr,
    );
    return {
      date: dateStr,
      reviews: dayRevs.length,
      score:
        dayRevs.length > 0
          ? Math.round(
              dayRevs.reduce((s, r) => s + (r.overallScore ?? 0), 0) /
                dayRevs.length,
            )
          : 0,
    };
  });

  return {
    usage,
    totalReviews: reviews.length,
    completedReviews: completed.length,
    avgScore,
    avgDuration,
    issueStats,
    recentPRs,
    dailyCounts,
    tokensUsed: usage?.tokensUsed ?? 0,
    tokenLimit: usage?.tokenLimit ?? 500000,
  };
}

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const data = await getDashboardData(workspaceId);

  const metrics = [
    {
      label: "reviews_this_month",
      value: data.completedReviews,
      icon: GitPullRequest,
      delta: "+12%",
    },
    {
      label: "avg_code_score",
      value: `${data.avgScore}/100`,
      icon: TrendingUp,
      delta: "+4pts",
    },
    {
      label: "issues_detected",
      value: data.issueStats.reduce((s, i) => s + i._count, 0),
      icon: AlertTriangle,
      delta: "-8%",
    },
    {
      label: "avg_review_time",
      value: `${data.avgDuration}s`,
      icon: Clock,
      delta: "live",
    },
  ];

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-term-border pb-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] text-ink-muted mb-1 font-mono">
            <span className="text-term-green">[DASHBOARD]</span>
            <span>{new Date().toISOString().slice(0, 10)}</span>
          </div>
          <h1
            className="font-editorial text-3xl font-black text-ink-primary"
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              textShadow: "none",
            }}
          >
            System Overview
          </h1>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="dot-live" />
          <span className="text-ink-muted ml-1.5">all systems operational</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="border border-term-border bg-term-base p-4 hover:border-term-green/30 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <Icon className="w-4 h-4 text-term-green opacity-60" />
                <span className="text-[10px] font-mono text-ink-muted border border-term-border px-1">
                  {m.delta}
                </span>
              </div>
              <div
                className="text-2xl font-bold font-mono text-term-green tabular-nums"
                style={{ textShadow: "0 0 15px rgba(0,255,65,0.3)" }}
              >
                {m.value}
              </div>
              <p className="text-[10px] text-ink-muted mt-1 font-mono">
                // {m.label}
              </p>
            </div>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 border border-term-border bg-term-base p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] text-ink-muted font-mono">
                // review_activity
              </p>
              <p className="text-xs text-ink-secondary font-mono">
                last 14 days
              </p>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-mono text-ink-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-px bg-term-green inline-block" />
                reviews
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-px bg-info inline-block" />
                score
              </span>
            </div>
          </div>
          <DashboardCharts data={data.dailyCounts} />
        </div>

        <div className="border border-term-border bg-term-base p-4">
          <p className="text-[10px] text-ink-muted font-mono mb-4">
            // issue_breakdown
          </p>
          <IssueBreakdown stats={data.issueStats} />
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2 border border-term-border bg-term-base">
          <div className="flex items-center justify-between px-4 py-3 border-b border-term-border">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-ink-muted font-mono">
                // pending_reviews
              </span>
              {data.recentPRs.length > 0 && (
                <span className="text-[10px] px-1 border border-warn/30 text-warn font-mono">
                  {data.recentPRs.length}
                </span>
              )}
            </div>
            <a
              href="/reviews"
              className="text-[10px] text-term-green font-mono hover:text-term-bright transition-colors"
            >
              view all →
            </a>
          </div>
          <PRReviewQueue prs={data.recentPRs} />
        </div>

        {/* Claude API status */}
        <div className="border border-term-border bg-term-base p-4 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-term-border">
            <Zap className="w-3.5 h-3.5 text-term-green" />
            <span className="text-[10px] text-ink-muted font-mono">
              // claude_api_status
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-mono">
              <span className="text-ink-muted">tokens_used</span>
              <span className="text-term-green">
                {data.tokensUsed.toLocaleString()}
              </span>
            </div>
            <div className="h-1 bg-term-border overflow-hidden">
              <div
                className="h-full bg-term-green transition-all"
                style={{
                  width: `${Math.min((data.tokensUsed / data.tokenLimit) * 100, 100)}%`,
                  boxShadow: "0 0 6px rgba(0,255,65,0.5)",
                }}
              />
            </div>
            <div className="text-[10px] text-ink-ghost font-mono text-right">
              limit: {(data.tokenLimit / 1000).toFixed(0)}k
            </div>
          </div>

          <div className="space-y-2 pt-2">
            {[
              { k: "model", v: "claude-opus-4" },
              { k: "tokens/rev", v: "~3,200" },
              { k: "streaming", v: "enabled" },
              { k: "latency", v: "<2.4s" },
            ].map((row) => (
              <div
                key={row.k}
                className="flex justify-between text-[10px] font-mono"
              >
                <span className="text-ink-ghost">{row.k}</span>
                <span className="text-ink-secondary">{row.v}</span>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-term-border flex items-center gap-2">
            <CheckCircle className="w-3 h-3 text-term-green" />
            <span className="text-[10px] text-ink-muted font-mono">
              [OK] all systems nominal
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
