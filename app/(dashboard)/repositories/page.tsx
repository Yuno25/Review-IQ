import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { GitBranch, Lock, Globe, Plus, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Repositories" };

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

export default async function RepositoriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const repos = await db.repository.findMany({
    where: { workspaceId },
    include: { _count: { select: { pullRequests: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="p-6 space-y-5 animate-fade-in" style={M}>
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
        <div>
          <div className="text-[10px] text-[#3D6B3D] mb-1">
            <span className="text-[#00FF41]">[REPOS]</span> {repos.length}{" "}
            connected
          </div>
          <h1 className="text-3xl font-black text-[#E8FFE8]" style={S}>
            Repositories
          </h1>
        </div>
        <Link
          href="/repositories/connect"
          className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider border border-[#003B00] text-[#00FF41] hover:bg-[#003B00] transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> $ connect --repo
        </Link>
      </div>

      {repos.length === 0 ? (
        <div className="border border-[#1A1A1A] bg-[#080808] py-20 flex flex-col items-center text-center">
          <p className="text-[10px] text-[#3D6B3D] mb-2">
            // no repositories connected
          </p>
          <p className="text-xs text-[#1F3D1F] mb-6">
            connect a github repo to start getting AI code reviews
          </p>
          <Link
            href="/repositories/connect"
            className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-bold uppercase border border-[#003B00] text-[#00FF41] hover:bg-[#003B00] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> $ git remote add reviewiq
          </Link>
        </div>
      ) : (
        <div className="border border-[#1A1A1A] bg-[#080808]">
          <div className="grid grid-cols-[20px_1fr_80px_60px_80px_100px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#1F3D1F] uppercase tracking-widest">
            <span></span>
            <span>repository</span>
            <span>branch</span>
            <span>prs</span>
            <span>language</span>
            <span>action</span>
          </div>
          <div className="divide-y divide-[#0D0D0D]">
            {repos.map((repo) => (
              <div
                key={repo.id}
                className="grid grid-cols-[20px_1fr_80px_60px_80px_100px] gap-4 items-center px-4 py-3 hover:bg-[#0A0A0A] transition-colors group"
              >
                {repo.private ? (
                  <Lock className="w-3 h-3 text-[#FFB800]" />
                ) : (
                  <Globe className="w-3 h-3 text-[#3D6B3D]" />
                )}
                <div>
                  <p className="text-xs text-[#E8FFE8] group-hover:text-[#00FF41] transition-colors">
                    {repo.fullName}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#3D6B3D]">
                  <GitBranch className="w-3 h-3" />
                  {repo.defaultBranch}
                </div>
                <span className="text-[10px] text-[#3D6B3D]">
                  {repo._count.pullRequests}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: repo.language ? "#00CCFF" : "#1F3D1F" }}
                >
                  {repo.language ?? "—"}
                </span>
                <Link
                  href={`/repositories/${repo.id}`}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-[#00FF41] border border-[#003B00] px-2 py-1 hover:bg-[#003B00] transition-colors"
                >
                  <Zap className="w-3 h-3" /> audit
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
