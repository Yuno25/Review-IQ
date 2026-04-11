import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import {
  AlertTriangle, Shield, Zap,
  Wrench, BookOpen, TestTube, Code2, ChevronLeft,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Review Detail" };

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;
const SEVERITY_STYLE: Record<string, string> = {
  CRITICAL: "severity-critical",
  HIGH:     "severity-high",
  MEDIUM:   "severity-medium",
  LOW:      "severity-low",
  INFO:     "severity-info",
};
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  SECURITY:        Shield,
  PERFORMANCE:     Zap,
  MAINTAINABILITY: Wrench,
  BUG:             AlertTriangle,
  STYLE:           Code2,
  DOCUMENTATION:   BookOpen,
  TEST_COVERAGE:   TestTube,
};

export default async function ReviewDetailPage({ params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const review = await db.review.findUnique({
    where: { id: params.id },
    include: {
      pullRequest: { include: { repository: true } },
      issues: { orderBy: [{ severity: "asc" }, { category: "asc" }] },
    },
  });

  if (!review) notFound();

  const grouped = SEVERITY_ORDER.reduce((acc, sev) => {
    acc[sev] = review.issues.filter((i) => i.severity === sev);
    return acc;
  }, {} as Record<string, typeof review.issues>);

  const scoreColor =
    (review.overallScore ?? 0) >= 80 ? "text-success"
    : (review.overallScore ?? 0) >= 60 ? "text-warning"
    : "text-danger";

  return (
    <div className="p-6 animate-fade-in space-y-5 max-w-5xl">
      <div>
        <Link href="/reviews" className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-4 transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back to Reviews
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="badge badge-muted">#{review.pullRequest.number}</span>
              <span className="text-xs text-text-muted">{review.pullRequest.repository.fullName}</span>
            </div>
            <h1 className="font-display text-xl font-bold text-text-primary">{review.pullRequest.title}</h1>
            <p className="text-xs text-text-muted mt-1">
              Reviewed {review.completedAt ? new Date(review.completedAt).toLocaleString() : "in progress"}
              {" · "}{review.tokensUsed.toLocaleString()} tokens used
            </p>
          </div>
          <div className="text-right shrink-0">
            <div className={`font-display text-5xl font-bold ${scoreColor}`}>{review.overallScore ?? "—"}</div>
            <p className="text-xs text-text-muted mt-0.5">Overall Score</p>
          </div>
        </div>
      </div>

      {review.summary && (
        <div className="card p-5 border-l-2 border-brand">
          <p className="text-xs font-semibold text-brand uppercase tracking-widest mb-2">AI Summary</p>
          <p className="text-sm text-text-secondary leading-relaxed">{review.summary}</p>
        </div>
      )}

      <div className="space-y-4">
        {SEVERITY_ORDER.map((sev) => {
          const issues = grouped[sev];
          if (!issues?.length) return null;
          return (
            <div key={sev} className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-surface-border">
                <span className={`badge ${SEVERITY_STYLE[sev]}`}>{sev}</span>
                <span className="text-xs text-text-muted">{issues.length} issue{issues.length > 1 ? "s" : ""}</span>
              </div>
              <div className="divide-y divide-surface-border">
                {issues.map((issue) => {
                  const Icon = CATEGORY_ICONS[issue.category] ?? AlertTriangle;
                  return (
                    <div key={issue.id} className="px-5 py-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <Icon className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-semibold text-text-primary">{issue.title}</p>
                            <span className="badge badge-muted">{issue.category.replace("_", " ")}</span>
                            {issue.filePath && (
                              <span className="text-xs font-mono text-text-muted">{issue.filePath}{issue.lineStart ? `:${issue.lineStart}` : ""}</span>
                            )}
                          </div>
                          <p className="text-sm text-text-secondary mt-1 leading-relaxed">{issue.description}</p>
                          {issue.suggestion && (
                            <div className="mt-2 p-3 rounded-md bg-success-muted border border-success/20">
                              <p className="text-xs font-semibold text-success mb-1">Suggestion</p>
                              <p className="text-xs text-text-secondary">{issue.suggestion}</p>
                            </div>
                          )}
                          {issue.codeSnippet && (
                            <pre className="mt-2 p-3 rounded-md bg-surface-overlay border border-surface-border text-xs font-mono text-text-secondary overflow-x-auto">
                              {issue.codeSnippet}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
