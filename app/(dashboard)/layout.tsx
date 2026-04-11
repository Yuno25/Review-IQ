import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspace = user.memberships[0]?.workspace;
  if (!workspace) redirect("/onboarding");

  const usage = await db.usageRecord.findUnique({
    where: {
      workspaceId_month: {
        workspaceId: workspace.id,
        month: new Date().toISOString().slice(0, 7),
      },
    },
  });

  return (
    <div className="flex min-h-screen bg-surface-base">
      <Sidebar
        user={{
          name: user.name,
          username: user.username,
          avatarUrl: user.avatarUrl,
        }}
        usage={
          usage
            ? { reviewsCount: usage.reviewsCount, reviewLimit: usage.reviewLimit }
            : { reviewsCount: 0, reviewLimit: 50 }
        }
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
