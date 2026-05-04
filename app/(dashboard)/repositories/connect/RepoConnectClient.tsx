"use client";

import { useState } from "react";
import {
  Search,
  Lock,
  Globe,
  GitBranch,
  Loader2,
  CheckCircle,
  ChevronLeft,
} from "lucide-react";
import Link from "next/link";

interface Repo {
  id: number;
  full_name: string;
  name: string;
  private: boolean;
  default_branch: string;
  language: string | null;
  updated_at: string;
  description: string | null;
}

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

export function RepoConnectClient({
  repos,
  connectedIds,
  workspaceId,
}: {
  repos: Repo[];
  connectedIds: number[];
  workspaceId: string;
}) {
  const [search, setSearch] = useState("");
  const [connecting, setConnecting] = useState<number | null>(null);
  const [connected, setConnected] = useState<Set<number>>(
    new Set(connectedIds),
  );

  const filtered = repos.filter((r) =>
    r.full_name.toLowerCase().includes(search.toLowerCase()),
  );

  async function connectRepo(repo: Repo) {
    setConnecting(repo.id);
    try {
      const res = await fetch("/api/repositories/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          githubRepoId: repo.id,
          fullName: repo.full_name,
          name: repo.name,
          private: repo.private,
          defaultBranch: repo.default_branch,
          language: repo.language,
          workspaceId,
        }),
      });
      if (res.ok) setConnected((prev) => new Set([...prev, repo.id]));
    } catch (e) {
      console.error(e);
    } finally {
      setConnecting(null);
    }
  }

  return (
    <div className="p-6 space-y-5 max-w-3xl animate-fade-in" style={M}>
      {/* Header */}
      <div>
        <Link
          href="/repositories"
          className="inline-flex items-center gap-1.5 text-[10px] text-[#3D6B3D] hover:text-[#00FF41] transition-colors mb-4"
        >
          <ChevronLeft className="w-3 h-3" /> cd ../repositories
        </Link>
        <div className="text-[10px] text-[#3D6B3D] mb-1">
          <span className="text-[#00FF41]">[CONNECT]</span> select repositories
          to monitor
        </div>
        <h1 className="text-3xl font-black text-[#E8FFE8]" style={S}>
          Connect Repo
        </h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#1F3D1F]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="$ search repositories..."
          className="w-full bg-[#080808] border border-[#1A1A1A] pl-9 pr-4 py-2.5 text-xs text-[#E8FFE8] placeholder:text-[#1F3D1F] focus:outline-none focus:border-[#003B00] transition-colors"
          style={M}
        />
      </div>

      {/* Repo list */}
      <div className="border border-[#1A1A1A] bg-[#080808]">
        <div className="grid grid-cols-[20px_1fr_70px_80px_90px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#1F3D1F] uppercase tracking-widest">
          <span></span>
          <span>repository</span>
          <span>branch</span>
          <span>language</span>
          <span>action</span>
        </div>

        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[10px] text-[#1F3D1F]">
              // no repositories found
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#0D0D0D] max-h-[500px] overflow-y-auto">
            {filtered.map((repo) => {
              const isConnected = connected.has(repo.id);
              const isConnecting = connecting === repo.id;
              return (
                <div
                  key={repo.id}
                  className="grid grid-cols-[20px_1fr_70px_80px_90px] gap-4 items-center px-4 py-3 hover:bg-[#0A0A0A] transition-colors"
                >
                  {repo.private ? (
                    <Lock className="w-3 h-3 text-[#FFB800]" />
                  ) : (
                    <Globe className="w-3 h-3 text-[#3D6B3D]" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-[#E8FFE8] truncate">
                      {repo.full_name}
                    </p>
                    {repo.description && (
                      <p className="text-[10px] text-[#1F3D1F] truncate mt-0.5">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-[#3D6B3D]">
                    <GitBranch className="w-3 h-3" />
                    {repo.default_branch}
                  </div>
                  <span
                    className="text-[10px]"
                    style={{ color: repo.language ? "#00CCFF" : "#1F3D1F" }}
                  >
                    {repo.language ?? "—"}
                  </span>
                  <button
                    onClick={() => !isConnected && connectRepo(repo)}
                    disabled={isConnected || isConnecting}
                    className="text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 border transition-all flex items-center gap-1.5"
                    style={
                      isConnected
                        ? {
                            borderColor: "#003B00",
                            color: "#00FF41",
                            cursor: "default",
                          }
                        : isConnecting
                          ? { borderColor: "#1A1A1A", color: "#3D6B3D" }
                          : {
                              borderColor: "#003B00",
                              color: "#00FF41",
                              cursor: "pointer",
                            }
                    }
                  >
                    {isConnected ? (
                      <>
                        <CheckCircle className="w-3 h-3" /> done
                      </>
                    ) : isConnecting ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" /> wait
                      </>
                    ) : (
                      "+ connect"
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-[10px] text-[#1F3D1F]">
        // {filtered.length} repos shown · {connected.size} connected
      </p>
    </div>
  );
}
