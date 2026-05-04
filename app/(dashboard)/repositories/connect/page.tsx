import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { RepoConnectClient } from "./RepoConnectClient";

export const metadata = { title: "Connect Repository" };

export default async function ConnectRepoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  // Fetch user's GitHub repos
  let githubRepos: any[] = [];
  if (user.githubToken) {
    try {
      const res = await fetch(
        "https://api.github.com/user/repos?sort=updated&per_page=50&type=all",
        {
          headers: {
            Authorization: `Bearer ${user.githubToken}`,
            Accept: "application/vnd.github.v3+json",
          },
          next: { revalidate: 60 },
        },
      );
      if (res.ok) githubRepos = await res.json();
    } catch (e) {
      console.error("GitHub fetch error:", e);
    }
  }

  // Already connected repo IDs
  const connected = await db.repository.findMany({
    where: { workspaceId },
    select: { githubRepoId: true },
  });
  const connectedIds = new Set(connected.map((r) => r.githubRepoId));

  return (
    <RepoConnectClient
      repos={githubRepos}
      connectedIds={[...connectedIds]}
      workspaceId={workspaceId}
    />
  );
}
