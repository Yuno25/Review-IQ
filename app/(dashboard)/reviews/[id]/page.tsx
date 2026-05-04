import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import {
  ChevronLeft,
  AlertTriangle,
  Shield,
  Zap,
  Wrench,
  BookOpen,
  TestTube,
  Code2,
} from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Review Detail" };

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const;

const SEV_CONFIG: Record<string, { color: string; bg: string; label: string }> =
  {
    CRITICAL: {
      color: "#FF3333",
      bg: "rgba(255,51,51,0.06)",
      label: "[CRITICAL]",
    },
    HIGH: { color: "#FFB800", bg: "rgba(255,184,0,0.06)", label: "[HIGH]    " },
    MEDIUM: {
      color: "#00CCFF",
      bg: "rgba(0,204,255,0.06)",
      label: "[MEDIUM]  ",
    },
    LOW: { color: "#00FF41", bg: "rgba(0,255,65,0.06)", label: "[LOW]     " },
    INFO: { color: "#3D6B3D", bg: "rgba(61,107,61,0.06)", label: "[INFO]    " },
  };

const CAT_ICONS: Record<string, React.ElementType> = {
  SECURITY: Shield,
  PERFORMANCE: Zap,
  MAINTAINABILITY: Wrench,
  BUG: AlertTriangle,
  STYLE: Code2,
  DOCUMENTATION: BookOpen,
  TEST_COVERAGE: TestTube,
};

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

export default async function ReviewDetailPage({
  params,
}: {
  params: { id: string };
}) {
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

  const grouped = SEVERITY_ORDER.reduce(
    (acc, sev) => {
      acc[sev] = review.issues.filter((i) => i.severity === sev);
      return acc;
    },
    {} as Record<string, typeof review.issues>,
  );

  const scoreColor =
    (review.overallScore ?? 0) >= 80
      ? "#00FF41"
      : (review.overallScore ?? 0) >= 60
        ? "#FFB800"
        : "#FF3333";

  return (
    <div className="p-6 space-y-5 max-w-4xl animate-fade-in" style={M}>
      {/* Back */}
      <Link
        href="/reviews"
        className="inline-flex items-center gap-1.5 text-[10px] text-[#3D6B3D] hover:text-[#00FF41] transition-colors mb-2"
      >
        <ChevronLeft className="w-3 h-3" /> cd ../reviews
      </Link>

      {/* Header */}
      <div className="border border-[#1A1A1A] bg-[#080808] p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 mr-6">
            <div className="flex items-center gap-3 mb-2 text-[10px]">
              <span className="text-[#00FF41]">[REVIEW]</span>
              <span className="text-[#3D6B3D]">
                pr #{review.pullRequest.number}
              </span>
              <span className="text-[#1F3D1F]">
                {review.pullRequest.repository.fullName}
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#E8FFE8] mb-2" style={S}>
              {review.pullRequest.title}
            </h1>
            <div className="flex items-center gap-4 text-[10px] text-[#1F3D1F]">
              <span>
                completed:{" "}
                {review.completedAt
                  ? new Date(review.completedAt).toLocaleString()
                  : "in progress"}
              </span>
              <span>tokens: {review.tokensUsed.toLocaleString()}</span>
              <span>
                duration:{" "}
                {review.durationMs
                  ? `${(review.durationMs / 1000).toFixed(1)}s`
                  : "—"}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div
              className="text-6xl font-black tabular-nums"
              style={{
                ...M,
                color: scoreColor,
                textShadow: `0 0 30px ${scoreColor}`,
              }}
            >
              {review.overallScore ?? "—"}
            </div>
            <p className="text-[10px] text-[#1F3D1F] mt-1">// overall_score</p>
          </div>
        </div>
      </div>

      {/* Summary */}
      {review.summary && (
        <div
          className="border border-[#003B00] bg-[#050505] p-4"
          style={{ boxShadow: "inset 0 0 20px rgba(0,255,65,0.03)" }}
        >
          <p className="text-[10px] text-[#00FF41] mb-2">// ai_summary</p>
          <p className="text-xs text-[#7FBF7F] leading-relaxed">
            {review.summary}
          </p>
        </div>
      )}

      {/* Issue counts */}
      <div className="grid grid-cols-5 gap-px bg-[#1A1A1A]">
        {SEVERITY_ORDER.map((sev) => {
          const cfg = SEV_CONFIG[sev];
          const count = grouped[sev]?.length ?? 0;
          return (
            <div key={sev} className="bg-[#080808] p-3 text-center">
              <div
                className="text-xl font-bold tabular-nums"
                style={{ color: cfg.color }}
              >
                {count}
              </div>
              <div
                className="text-[10px] mt-1"
                style={{ color: cfg.color, opacity: 0.6 }}
              >
                {sev.toLowerCase()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Issues */}
      <div className="space-y-3">
        {SEVERITY_ORDER.map((sev) => {
          const issues = grouped[sev];
          if (!issues?.length) return null;
          const cfg = SEV_CONFIG[sev];
          return (
            <div
              key={sev}
              className="border bg-[#080808]"
              style={{ borderColor: `${cfg.color}20` }}
            >
              <div
                className="flex items-center gap-3 px-4 py-2.5 border-b"
                style={{ borderColor: `${cfg.color}15`, background: cfg.bg }}
              >
                <span
                  className="text-[10px] font-bold"
                  style={{ color: cfg.color }}
                >
                  {cfg.label}
                </span>
                <span className="text-[10px] text-[#1F3D1F]">
                  {issues.length} issue{issues.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="divide-y divide-[#0D0D0D]">
                {issues.map((issue) => {
                  const Icon = CAT_ICONS[issue.category] ?? AlertTriangle;
                  return (
                    <div key={issue.id} className="px-4 py-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <Icon
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color: cfg.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap mb-1">
                            <span className="text-xs font-bold text-[#E8FFE8]">
                              {issue.title}
                            </span>
                            <span className="text-[10px] text-[#3D6B3D]">
                              {issue.category.replace("_", " ").toLowerCase()}
                            </span>
                            {issue.filePath && (
                              <span className="text-[10px] text-[#1F3D1F]">
                                {issue.filePath}
                                {issue.lineStart ? `:${issue.lineStart}` : ""}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#3D6B3D] leading-relaxed">
                            {issue.description}
                          </p>
                          {issue.suggestion && (
                            <div className="mt-2 pl-3 border-l border-[#003B00]">
                              <p className="text-[10px] text-[#00FF41] mb-0.5">
                                // suggestion
                              </p>
                              <p className="text-xs text-[#7FBF7F]">
                                {issue.suggestion}
                              </p>
                            </div>
                          )}
                          {issue.codeSnippet && (
                            <pre className="mt-2 p-3 bg-[#050505] border border-[#1A1A1A] text-[10px] text-[#3D6B3D] overflow-x-auto">
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
