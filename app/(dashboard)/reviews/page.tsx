import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Reviews" };

const STATUS = {
  COMPLETED: { label: "[DONE]  ", color: "#00FF41" },
  IN_PROGRESS: { label: "[RUNNING]", color: "#FFB800" },
  PENDING: { label: "[QUEUE] ", color: "#3D6B3D" },
  FAILED: { label: "[ERROR] ", color: "#FF3333" },
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#FF3333",
  HIGH: "#FFB800",
  MEDIUM: "#00CCFF",
  LOW: "#00FF41",
  INFO: "#3D6B3D",
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
    <div
      className="p-6 space-y-5 animate-fade-in"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
        <div>
          <div className="text-[10px] text-[#3D6B3D] mb-1">
            <span className="text-[#00FF41]">[REVIEWS]</span> {reviews.length}{" "}
            total records
          </div>
          <h1
            className="text-3xl font-black text-[#E8FFE8]"
            style={{
              fontFamily: "Playfair Display, Georgia, serif",
              textShadow: "none",
            }}
          >
            Review Log
          </h1>
        </div>
        <div className="text-[10px] text-[#1F3D1F]">
          $ reviewiq list --workspace=current
        </div>
      </div>

      {/* Table */}
      <div className="border border-[#1A1A1A] bg-[#080808]">
        {/* Table header */}
        <div className="grid grid-cols-[60px_40px_1fr_80px_60px_80px_90px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#1F3D1F] uppercase tracking-widest">
          <span>status</span>
          <span>pr</span>
          <span>title</span>
          <span>repo</span>
          <span>score</span>
          <span>issues</span>
          <span>date</span>
        </div>

        {reviews.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <GitPullRequest className="w-8 h-8 text-[#1F3D1F] mb-3" />
            <p className="text-xs text-[#3D6B3D]">// no reviews found</p>
            <p className="text-[10px] text-[#1F3D1F] mt-1">
              connect a repository to start getting AI reviews
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#0D0D0D]">
            {reviews.map((review) => {
              const st = STATUS[review.status];
              return (
                <Link
                  key={review.id}
                  href={`/reviews/${review.id}`}
                  className="grid grid-cols-[60px_40px_1fr_80px_60px_80px_90px] gap-4 items-center px-4 py-3 hover:bg-[#0A0A0A] transition-colors group"
                >
                  <span className="text-[10px]" style={{ color: st.color }}>
                    {st.label}
                  </span>
                  <span className="text-[10px] text-[#3D6B3D]">
                    #{review.pullRequest.number}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs text-[#E8FFE8] truncate group-hover:text-[#00FF41] transition-colors">
                      {review.pullRequest.title}
                    </p>
                  </div>
                  <span className="text-[10px] text-[#3D6B3D] truncate">
                    {review.pullRequest.repository.name}
                  </span>
                  <span
                    className="text-xs font-bold tabular-nums"
                    style={{
                      color:
                        (review.overallScore ?? 0) >= 80
                          ? "#00FF41"
                          : (review.overallScore ?? 0) >= 60
                            ? "#FFB800"
                            : "#FF3333",
                      textShadow: "0 0 10px currentColor",
                    }}
                  >
                    {review.overallScore ?? "—"}
                  </span>
                  <span className="text-[10px] text-[#3D6B3D]">
                    {review._count.issues} found
                  </span>
                  <span className="text-[10px] text-[#1F3D1F]">
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
