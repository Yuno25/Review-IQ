"use client";

import { useState } from "react";
import { GitPullRequest, Plus, Loader2, ExternalLink } from "lucide-react";

interface PR {
  id: string;
  title: string;
  number: number;
  author: string;
  authorAvatar?: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  openedAt: Date;
  repository: { fullName: string; name: string };
}

function timeAgo(date: Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function PRReviewQueue({ prs }: { prs: PR[] }) {
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  async function triggerReview(prId: string) {
    setReviewing(prId);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pullRequestId: prId }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done: streamDone, value } = await reader.read();
        if (streamDone) break;
        const text = decoder.decode(value);
        const lines = text.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const data = JSON.parse(line.slice(6));
          if (data.done || data.error) {
            setDone((prev) => new Set([...prev, prId]));
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReviewing(null);
    }
  }

  if (prs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <GitPullRequest className="w-8 h-8 text-text-muted mb-3" />
        <p className="text-sm text-text-secondary">No pending PRs</p>
        <p className="text-xs text-text-muted mt-1">All pull requests have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-surface-border">
      {prs.map((pr) => (
        <div
          key={pr.id}
          className="flex items-center gap-4 px-5 py-3.5 hover:bg-surface-hover transition-colors group"
        >
          {/* Avatar */}
          <div className="w-7 h-7 rounded-full bg-surface-overlay border border-surface-border overflow-hidden shrink-0">
            {pr.authorAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={pr.authorAvatar} alt={pr.author} className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xs font-mono text-text-muted">
                {pr.author[0].toUpperCase()}
              </span>
            )}
          </div>

          {/* PR Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-text-muted shrink-0">
                #{pr.number}
              </span>
              <p className="text-sm text-text-primary truncate font-medium">
                {pr.title}
              </p>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-text-muted">
              <span>{pr.repository.name}</span>
              <span>·</span>
              <span>by {pr.author}</span>
              <span>·</span>
              <span>{timeAgo(pr.openedAt)}</span>
            </div>
          </div>

          {/* Diff stats */}
          <div className="flex items-center gap-2 shrink-0 text-xs font-mono">
            <span className="text-success">+{pr.additions}</span>
            <span className="text-danger">-{pr.deletions}</span>
            <span className="text-text-muted">{pr.changedFiles}f</span>
          </div>

          {/* Action */}
          <div className="shrink-0">
            {done.has(pr.id) ? (
              <span className="badge badge-success">Done</span>
            ) : reviewing === pr.id ? (
              <button disabled className="btn-secondary text-xs px-3 py-1.5 opacity-60">
                <Loader2 className="w-3 h-3 animate-spin" />
                Reviewing…
              </button>
            ) : (
              <button
                onClick={() => triggerReview(pr.id)}
                className="btn-primary text-xs px-3 py-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Plus className="w-3 h-3" />
                Review
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
