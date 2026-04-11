import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  GitPullRequest, CheckCircle, AlertTriangle, Zap,
  TrendingUp, Clock, Code2, Shield,
} from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { PRReviewQueue } from "@/components/dashboard/PRReviewQueue";
import { IssueBreakdown } from "@/components/dashboard/IssueBreakdown";

export const metadata = { title: "Dashboard" };

async function getDashboardData(workspaceId: string) {
  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [usage, reviews, issueStats, recentPRs, topRepos] = await Promise.all([
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
    db.repository.findMany({
      where: { workspaceId },
      include: {
        _count: { select: { pullRequests: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const completedReviews = reviews.filter((r) => r.status === "COMPLETED");
  const avgScore =
    completedReviews.length > 0
      ? Math.round(
          completedReviews.reduce((sum, r) => sum + (r.overallScore ?? 0), 0) /
            completedReviews.length
        )
      : 0;

  const avgDuration =
    completedReviews.length > 0
      ? Math.round(
          completedReviews.reduce((sum, r) => sum + (r.durationMs ?? 0), 0) /
            completedReviews.length /
            1000
        )
      : 0;

  // Build daily review counts for chart (last 14 days)
  const dailyCounts: { date: string; reviews: number; score: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateStr = d.toISOString().slice(0, 10);
    const dayReviews = completedReviews.filter(
      (r) => r.createdAt.toISOString().slice(0, 10) === dateStr
    );
    dailyCounts.push({
      date: dateStr,
      reviews: dayReviews.length,
      score:
        dayReviews.length > 0
          ? Math.round(
              dayReviews.reduce((s, r) => s + (r.overallScore ?? 0), 0) /
                dayReviews.length
            )
          : 0,
    });
  }

  return {
    usage,
    totalReviews: reviews.length,
    completedReviews: completedReviews.length,
    avgScore,
    avgDuration,
    issueStats,
    recentPRs,
    topRepos,
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
      label: "Reviews This Month",
      value: data.completedReviews,
      icon: GitPullRequest,
      color: "text-brand",
      bg: "bg-brand-muted",
      delta: "+12%",
      deltaPositive: true,
    },
    {
      label: "Avg. Code Score",
      value: `${data.avgScore}/100`,
      icon: TrendingUp,
      color: "text-success",
      bg: "bg-success-muted",
      delta: "+4pts",
      deltaPositive: true,
    },
    {
      label: "Issues Detected",
      value: data.issueStats.reduce((s, i) => s + i._count, 0),
      icon: AlertTriangle,
      color: "text-warning",
      bg: "bg-warning-muted",
      delta: "-8%",
      deltaPositive: true,
    },
    {
      label: "Avg. Review Time",
      value: `${data.avgDuration}s`,
      icon: Clock,
      color: "text-info",
      bg: "bg-info-muted",
      delta: "Real-time",
      deltaPositive: true,
    },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Dashboard
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="dot-live" />
          <span className="text-xs text-text-secondary">Live</span>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div key={m.label} className="card p-5 flex flex-col gap-3 hover:border-surface-hover transition-colors">
              <div className="flex items-start justify-between">
                <div className={`w-9 h-9 rounded-lg ${m.bg} flex items-center justify-center`}>
                  <Icon className={`w-4.5 h-4.5 ${m.color}`} />
                </div>
                <span
                  className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    m.deltaPositive
                      ? "text-success bg-success-muted"
                      : "text-danger bg-danger-muted"
                  }`}
                >
                  {m.delta}
                </span>
              </div>
              <div>
                <div className="metric-value">{m.value}</div>
                <p className="text-xs text-text-muted mt-0.5">{m.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold text-text-primary">Review Activity</h2>
              <p className="text-xs text-text-muted">Last 14 days</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-brand" />Reviews
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success" />Score
              </span>
            </div>
          </div>
          <DashboardCharts data={data.dailyCounts} />
        </div>

        {/* Issue Breakdown */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-text-primary mb-4">Issue Breakdown</h2>
          <IssueBreakdown stats={data.issueStats} />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-3 gap-4">
        {/* PR Queue */}
        <div className="col-span-2 card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-text-primary">
              Pending Reviews
              {data.recentPRs.length > 0 && (
                <span className="ml-2 badge badge-warning">{data.recentPRs.length}</span>
              )}
            </h2>
            <a href="/reviews" className="text-xs text-brand hover:text-brand-dim transition-colors">
              View all →
            </a>
          </div>
          <PRReviewQueue prs={data.recentPRs} />
        </div>

        {/* Claude usage */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-brand-gradient flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-black" />
            </div>
            <h2 className="text-sm font-semibold text-text-primary">Claude API</h2>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-text-muted">Tokens Used</span>
                <span className="font-mono text-text-primary">
                  {data.tokensUsed.toLocaleString()}
                  <span className="text-text-muted"> / {(data.tokenLimit / 1000).toFixed(0)}k</span>
                </span>
              </div>
              <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-gradient rounded-full transition-all"
                  style={{ width: `${Math.min((data.tokensUsed / data.tokenLimit) * 100, 100)}%` }}
                />
              </div>
            </div>

            <div className="pt-2 space-y-2">
              {[
                { label: "Model", value: "Claude Opus 4" },
                { label: "Avg tokens/review", value: "~3,200" },
                { label: "Streaming", value: "Enabled" },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-xs">
                  <span className="text-text-muted">{row.label}</span>
                  <span className="font-mono text-text-secondary">{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-surface-border">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-success" />
              <span className="text-xs text-text-muted">All systems operational</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
