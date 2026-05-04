import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { GitBranch, Lock, Globe, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { RepoReviewClient } from "./RepoReviewClient";

export const metadata = { title: "Repository Review" };

export default async function RepoDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const repo = await db.repository.findUnique({
    where: { id: params.id },
    include: { _count: { select: { pullRequests: true } } },
  });

  if (!repo) notFound();

  return (
    <div
      className="p-6 space-y-5 animate-fade-in"
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* Back */}
      <Link
        href="/repositories"
        className="inline-flex items-center gap-1.5 text-[10px] text-[#3D6B3D] hover:text-[#00FF41] transition-colors"
      >
        <ChevronLeft className="w-3 h-3" /> cd ../repositories
      </Link>

      {/* Repo header */}
      <div className="border border-[#1A1A1A] bg-[#080808] p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {repo.private ? (
                <Lock className="w-3.5 h-3.5 text-[#FFB800]" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-[#3D6B3D]" />
              )}
              <span className="text-[10px] text-[#3D6B3D]">
                {repo.private ? "private" : "public"}
              </span>
            </div>
            <h1
              className="text-2xl font-black text-[#E8FFE8] mb-1"
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                textShadow: "none",
              }}
            >
              {repo.name}
            </h1>
            <p className="text-[10px] text-[#1F3D1F]">{repo.fullName}</p>
          </div>
          <div className="text-right text-[10px] text-[#1F3D1F] space-y-1">
            <div className="flex items-center gap-1.5 justify-end">
              <GitBranch className="w-3 h-3" />
              <span>{repo.defaultBranch}</span>
            </div>
            {repo.language && (
              <div className="text-[#00CCFF]">{repo.language}</div>
            )}
            <div>{repo._count.pullRequests} pull requests</div>
          </div>
        </div>
      </div>

      {/* Repo review client */}
      <RepoReviewClient repositoryId={repo.id} repoName={repo.fullName} />
    </div>
  );
}
