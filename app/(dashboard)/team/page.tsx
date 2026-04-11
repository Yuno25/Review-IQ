import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Users, Crown, Shield, Eye, UserPlus } from "lucide-react";

export const metadata = { title: "Team" };

const ROLE_CONFIG = {
  OWNER: { label: "Owner", icon: Crown, cls: "badge-warning" },
  ADMIN: { label: "Admin", icon: Shield, cls: "badge-info" },
  MEMBER: { label: "Member", icon: Users, cls: "badge-muted" },
  VIEWER: { label: "Viewer", icon: Eye, cls: "badge-muted" },
};

export default async function TeamPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const members = await db.workspaceMember.findMany({
    where: { workspaceId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

  return (
    <div className="p-6 animate-fade-in space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Team
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            {members.length} members
          </p>
        </div>
        <button className="btn-primary">
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Members table */}
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto] text-2xs font-semibold uppercase tracking-widest text-text-muted border-b border-surface-border px-5 py-3 gap-4">
          <span>Member</span>
          <span></span>
          <span>Role</span>
          <span>Joined</span>
        </div>

        <div className="divide-y divide-surface-border">
          {members.map((member) => {
            const cfg = ROLE_CONFIG[member.role];
            const RoleIcon = cfg.icon;
            const isCurrentUser = member.userId === user.id;
            return (
              <div
                key={member.id}
                className="grid grid-cols-[auto_1fr_auto_auto] items-center px-5 py-3.5 gap-4 hover:bg-surface-hover transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-surface-overlay border border-surface-border overflow-hidden">
                  {member.user.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.user.avatarUrl}
                      alt={member.user.username}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-mono text-text-muted">
                      {member.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>

                {/* Name + username */}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-primary">
                      {member.user.name ?? member.user.username}
                    </p>
                    {isCurrentUser && (
                      <span className="badge badge-muted">You</span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted">
                    @{member.user.username}
                  </p>
                </div>

                {/* Role */}
                <span className={`badge ${cfg.cls} gap-1`}>
                  <RoleIcon className="w-3 h-3" />
                  {cfg.label}
                </span>

                {/* Joined */}
                <span className="text-xs font-mono text-text-muted">
                  {new Date(member.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite card */}
      <div className="card p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary">
            Invite your team
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            Share the workspace with your colleagues
          </p>
        </div>
        <button className="btn-secondary">
          <UserPlus className="w-4 h-4" />
          Send Invite Link
        </button>
      </div>
    </div>
  );
}
