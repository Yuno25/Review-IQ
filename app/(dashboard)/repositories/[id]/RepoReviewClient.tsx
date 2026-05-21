"use client";

import { useState } from "react";
import {
  Zap,
  Shield,
  Gauge,
  BookOpen,
  TestTube,
  Wrench,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface RepoReviewResult {
  overallScore: number;
  healthGrade: string;
  summary: string;
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
  };
  categories: {
    security: { score: number; summary: string };
    performance: { score: number; summary: string };
    maintainability: { score: number; summary: string };
    testCoverage: { score: number; summary: string };
    documentation: { score: number; summary: string };
  };
  criticalIssues: {
    severity: string;
    category: string;
    title: string;
    description: string;
    suggestion: string;
    filePath?: string;
  }[];
  strengths: string[];
  recommendations: string[];
}

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

const SEV_COLOR: Record<string, string> = {
  CRITICAL: "#FF3333",
  HIGH: "#FFB800",
  MEDIUM: "#00CCFF",
  LOW: "#00FF41",
};

const CAT_ICONS: Record<string, React.ElementType> = {
  security: Shield,
  performance: Gauge,
  maintainability: Wrench,
  testCoverage: TestTube,
  documentation: BookOpen,
};

function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const color = score >= 80 ? "#00FF41" : score >= 60 ? "#FFB800" : "#FF3333";
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeDasharray={`${2 * Math.PI * 40}`}
            strokeDashoffset={`${2 * Math.PI * 40 * (1 - score / 100)}`}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 6px ${color})`,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="text-3xl font-bold tabular-nums"
            style={{ ...M, color, textShadow: `0 0 15px ${color}` }}
          >
            {score}
          </span>
          <span className="text-[10px] text-[#1F3D1F]" style={M}>
            /100
          </span>
        </div>
      </div>
      <div className="mt-2 text-2xl font-black" style={{ ...M, color }}>
        Grade: {grade}
      </div>
    </div>
  );
}

function CategoryBar({
  label,
  score,
  summary,
  icon: Icon,
}: {
  label: string;
  score: number;
  summary: string;
  icon: React.ElementType;
}) {
  const color = score >= 80 ? "#00FF41" : score >= 60 ? "#FFB800" : "#FF3333";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[10px]" style={M}>
        <div className="flex items-center gap-2">
          <Icon className="w-3.5 h-3.5" style={{ color }} />
          <span className="text-[#7FBF7F]">{label}</span>
        </div>
        <span className="font-bold tabular-nums" style={{ color }}>
          {score}/100
        </span>
      </div>
      <div className="h-1 bg-[#1A1A1A] overflow-hidden">
        <div
          className="h-full transition-all duration-700 rounded-none"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
      <p className="text-[10px] text-[#3D6B3D]" style={M}>
        {summary}
      </p>
    </div>
  );
}

export function RepoReviewClient({
  repositoryId,
  repoName,
}: {
  repositoryId: string;
  repoName: string;
}) {
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">(
    "idle",
  );
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<RepoReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startReview() {
    setStatus("running");
    setLogs([]);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/repositories/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryId }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.progress) setLogs((p) => [...p, data.progress]);
            if (data.done && data.result) {
              setResult(data.result);
              setStatus("done");
            }
            if (data.error) {
              setError(data.error);
              setStatus("error");
            }
          } catch {}
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
      setStatus("error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Start panel */}
      {status === "idle" && (
        <div className="border border-[#1A1A1A] bg-[#080808] p-6">
          <p className="text-[10px] text-[#3D6B3D] mb-2" style={M}>
            // full_repository_audit
          </p>
          <h2 className="text-xl font-black text-[#E8FFE8] mb-3" style={S}>
            Run AI Code Audit
          </h2>
          <p className="text-xs text-[#3D6B3D] mb-6 leading-relaxed" style={M}>
            Claude Opus 4 will scan your entire repository — reading source
            files, detecting security vulnerabilities, performance issues, code
            smells, missing tests, and architectural problems. Returns a full
            health report with an overall score and actionable recommendations.
          </p>
          <div className="grid grid-cols-3 gap-4 mb-6 text-[10px]" style={M}>
            {[
              { label: "files scanned", value: "up to 30" },
              { label: "avg review time", value: "~15s" },
              { label: "powered by", value: "Gemini 2.0 Flash" },
            ].map((s) => (
              <div key={s.label} className="border border-[#1A1A1A] p-3">
                <div className="text-[#00FF41] font-bold mb-1">{s.value}</div>
                <div className="text-[#1F3D1F]">// {s.label}</div>
              </div>
            ))}
          </div>
          <button
            onClick={startReview}
            className="flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider border border-[#003B00] text-[#050505] bg-[#00FF41] hover:bg-[#39FF14] transition-colors"
            style={M}
          >
            <Zap className="w-4 h-4" />$ reviewiq audit --repo=
            {repoName.split("/")[1]}
          </button>
        </div>
      )}

      {/* Running — terminal output */}
      {status === "running" && (
        <div className="border border-[#003B00] bg-[#050505]">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#003B00] bg-[#080808]">
            <Loader2 className="w-3.5 h-3.5 text-[#00FF41] animate-spin" />
            <span className="text-[10px] text-[#00FF41]" style={M}>
              reviewiq audit — running
            </span>
            <span
              className="ml-auto flex items-center gap-1.5 text-[10px] text-[#00FF41]"
              style={M}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse inline-block" />
              LIVE
            </span>
          </div>
          <div className="p-5 space-y-1.5 min-h-32">
            {logs.map((log, i) => (
              <div key={i} className="text-xs text-[#3D6B3D]" style={M}>
                <span className="text-[#00FF41]">&gt;</span> {log}
              </div>
            ))}
            <div className="text-[#00FF41] animate-pulse text-xs" style={M}>
              █
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {status === "error" && (
        <div className="border border-[#FF3333]/30 bg-[#3D0000]/20 p-5">
          <p className="text-[10px] text-[#FF3333] mb-1" style={M}>
            [ERROR] audit failed
          </p>
          <p className="text-xs text-[#FF3333]/70" style={M}>
            {error}
          </p>
          <button
            onClick={startReview}
            className="mt-4 px-4 py-2 text-[10px] border border-[#003B00] text-[#00FF41] hover:bg-[#003B00] transition-colors"
            style={M}
          >
            $ retry
          </button>
        </div>
      )}

      {/* Results */}
      {status === "done" && result && (
        <div className="space-y-4">
          {/* Score + stats */}
          <div className="border border-[#1A1A1A] bg-[#080808] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-[#3D6B3D] mb-1" style={M}>
                  // audit_complete
                </p>
                <h2 className="text-2xl font-black text-[#E8FFE8]" style={S}>
                  Health Report
                </h2>
                <p className="text-[10px] text-[#1F3D1F] mt-1" style={M}>
                  {repoName}
                </p>
              </div>
              <ScoreRing
                score={result.overallScore}
                grade={result.healthGrade}
              />
            </div>

            {/* Summary */}
            <div className="border-l-2 border-[#003B00] pl-4 mb-6">
              <p className="text-[10px] text-[#00FF41] mb-1" style={M}>
                // executive_summary
              </p>
              <p className="text-xs text-[#7FBF7F] leading-relaxed" style={M}>
                {result.summary}
              </p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-px bg-[#1A1A1A]">
              {[
                { k: "files_scanned", v: result.stats.totalFiles },
                {
                  k: "lines_analyzed",
                  v: result.stats.totalLines.toLocaleString(),
                },
                {
                  k: "languages",
                  v: Object.keys(result.stats.languages).join(", "),
                },
              ].map((s) => (
                <div key={s.k} className="bg-[#080808] p-3">
                  <div className="text-sm font-bold text-[#E8FFE8]" style={M}>
                    {s.v}
                  </div>
                  <div className="text-[10px] text-[#1F3D1F] mt-0.5" style={M}>
                    // {s.k}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category scores */}
          <div className="border border-[#1A1A1A] bg-[#080808] p-5">
            <p className="text-[10px] text-[#3D6B3D] mb-5" style={M}>
              // category_breakdown
            </p>
            <div className="space-y-5">
              {(
                Object.entries(result.categories) as [
                  string,
                  { score: number; summary: string },
                ][]
              ).map(([key, val]) => {
                const Icon = CAT_ICONS[key] ?? Wrench;
                return (
                  <CategoryBar
                    key={key}
                    label={key.replace(/([A-Z])/g, "_$1").toLowerCase()}
                    score={val.score}
                    summary={val.summary}
                    icon={Icon}
                  />
                );
              })}
            </div>
          </div>

          {/* Critical issues */}
          {result.criticalIssues.length > 0 && (
            <div className="border border-[#1A1A1A] bg-[#080808]">
              <div className="px-5 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A]">
                <p className="text-[10px] text-[#3D6B3D]" style={M}>
                  // critical_issues ({result.criticalIssues.length} found)
                </p>
              </div>
              <div className="divide-y divide-[#0D0D0D]">
                {result.criticalIssues.map((issue, i) => {
                  const color = SEV_COLOR[issue.severity] ?? "#3D6B3D";
                  return (
                    <div key={i} className="px-5 py-4 space-y-2">
                      <div className="flex items-start gap-3">
                        <AlertTriangle
                          className="w-3.5 h-3.5 mt-0.5 shrink-0"
                          style={{ color }}
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <span
                              className="text-xs font-bold text-[#E8FFE8]"
                              style={M}
                            >
                              {issue.title}
                            </span>
                            <span
                              className="text-[10px] px-1 border"
                              style={{ color, borderColor: `${color}30` }}
                            >
                              {issue.severity}
                            </span>
                            {issue.filePath && (
                              <span
                                className="text-[10px] text-[#1F3D1F]"
                                style={M}
                              >
                                {issue.filePath}
                              </span>
                            )}
                          </div>
                          <p
                            className="text-xs text-[#3D6B3D] leading-relaxed"
                            style={M}
                          >
                            {issue.description}
                          </p>
                          <div className="mt-2 pl-3 border-l border-[#003B00]">
                            <p
                              className="text-[10px] text-[#00FF41] mb-0.5"
                              style={M}
                            >
                              // suggestion
                            </p>
                            <p className="text-xs text-[#7FBF7F]" style={M}>
                              {issue.suggestion}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Strengths + Recommendations */}
          <div className="grid grid-cols-2 gap-4">
            <div className="border border-[#1A1A1A] bg-[#080808] p-5">
              <p className="text-[10px] text-[#3D6B3D] mb-4" style={M}>
                // strengths
              </p>
              <ul className="space-y-2">
                {result.strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#7FBF7F]"
                    style={M}
                  >
                    <CheckCircle className="w-3.5 h-3.5 text-[#00FF41] shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-[#1A1A1A] bg-[#080808] p-5">
              <p className="text-[10px] text-[#3D6B3D] mb-4" style={M}>
                // recommendations
              </p>
              <ul className="space-y-2">
                {result.recommendations.map((r, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-[#7FBF7F]"
                    style={M}
                  >
                    <span className="text-[#00FF41] shrink-0 text-[10px] mt-0.5">
                      {String(i + 1).padStart(2, "0")}.
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Re-run */}
          <button
            onClick={startReview}
            className="flex items-center gap-2 px-4 py-2 text-[10px] border border-[#1A1A1A] text-[#3D6B3D] hover:border-[#003B00] hover:text-[#00FF41] transition-colors"
            style={M}
          >
            <Zap className="w-3.5 h-3.5" /> $ re-run audit
          </button>
        </div>
      )}
    </div>
  );
}
