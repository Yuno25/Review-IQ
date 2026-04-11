"use client";

const SEVERITY_CONFIG = {
  CRITICAL: { label: "Critical", color: "bg-danger",  textColor: "text-danger"  },
  HIGH:     { label: "High",     color: "bg-warning", textColor: "text-warning" },
  MEDIUM:   { label: "Medium",  color: "bg-info",    textColor: "text-info"    },
  LOW:      { label: "Low",     color: "bg-success", textColor: "text-success" },
  INFO:     { label: "Info",    color: "bg-text-muted", textColor: "text-text-muted" },
};

interface Stat {
  severity: string;
  _count: number;
}

export function IssueBreakdown({ stats }: { stats: Stat[] }) {
  const total = stats.reduce((s, i) => s + i._count, 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center">
        <p className="text-2xl">🎉</p>
        <p className="text-sm text-text-secondary mt-2">No issues found</p>
        <p className="text-xs text-text-muted">Your code looks clean!</p>
      </div>
    );
  }

  const ordered = (["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"] as const).map(
    (sev) => ({
      severity: sev,
      count: stats.find((s) => s.severity === sev)?._count ?? 0,
      ...SEVERITY_CONFIG[sev],
    })
  );

  return (
    <div className="space-y-3">
      {ordered.map((item) => {
        const pct = total > 0 ? (item.count / total) * 100 : 0;
        return (
          <div key={item.severity}>
            <div className="flex items-center justify-between mb-1">
              <span className={`text-xs font-medium ${item.textColor}`}>
                {item.label}
              </span>
              <span className="text-xs font-mono text-text-secondary">
                {item.count}
                <span className="text-text-muted ml-1">
                  ({pct.toFixed(0)}%)
                </span>
              </span>
            </div>
            <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
              <div
                className={`h-full ${item.color} rounded-full transition-all duration-700`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}

      <div className="pt-2 border-t border-surface-border flex justify-between text-xs">
        <span className="text-text-muted">Total issues</span>
        <span className="font-mono text-text-primary">{total}</span>
      </div>
    </div>
  );
}
