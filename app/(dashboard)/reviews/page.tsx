import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GitPullRequest, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Reviews" };

const STATUS_CONFIG = {
  COMPLETED:   { label: "Completed",   icon: CheckCircle2, cls: "badge-success" },
  IN_PROGRESS: { label: "In Progress", icon: Loader2,      cls: "badge-info"    },
  PENDING:     { label: "Pending",     icon: Clock,        cls: "badge-muted"   },
  FAILED:      { label: "Failed",      icon: XCircle,      cls: "badge-danger"  },
};

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const reviews = await db.review.findMany({
    where: { pullRequest: { repository: { workspaceId } } },
    include: {
      pullRequest: { include: { repository: true } },
      _count: { select: { issues: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Reviews</h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {reviews.length} total reviews
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] text-2xs font-semibold uppercase tracking-widest text-text-muted border-b border-surface-border px-5 py-3 gap-4">
          <span>PR</span>
          <span>Title</span>
          <span>Score</span>
          <span>Issues</span>
          <span>Status</span>
          <span>Date</span>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <GitPullRequest className="w-10 h-10 text-text-muted mb-3" />
            <p className="text-sm text-text-secondary">No reviews yet</p>
            <p className="text-xs text-text-muted mt-1">
              Connect a repository to start getting AI reviews
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-border">
            {reviews.map((review) => {
              const cfg = STATUS_CONFIG[review.status];
              const StatusIcon = cfg.icon;
              return (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center px-5 py-3.5 gap-4 hover:bg-surface-hover transition-colors"
                >
                  {/* PR # */}
                  <span className="text-xs font-mono text-text-muted">
                    #{review.pullRequest.number}
                  </span>

                  {/* Title + repo */}
                  <div className="min-w-0">
                    <p className="text-sm text-text-primary font-medium truncate">
                      {review.pullRequest.title}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {review.pullRequest.repository.fullName}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    {review.overallScore != null ? (
                      <span
                        className={`text-sm font-mono font-semibold ${
                          review.overallScore >= 80
                            ? "text-success"
                            : review.overallScore >= 60
                            ? "text-warning"
                            : "text-danger"
                        }`}
                      >
                        {review.overallScore}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">—</span>
                    )}
                  </div>

                  {/* Issue count */}
                  <span className="text-xs font-mono text-text-secondary text-right">
                    {review._count.issues}
                  </span>

                  {/* Status */}
                  <span className={`badge ${cfg.cls} gap-1`}>
                    <StatusIcon className="w-3 h-3" />
                    {cfg.label}
                  </span>

                  {/* Date */}
                  <span className="text-xs font-mono text-text-muted text-right whitespace-nowrap">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
