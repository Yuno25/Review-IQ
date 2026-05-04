import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { UserPlus } from "lucide-react";

export const metadata = { title: "Team" };

const ROLE_COLOR: Record<string, string> = {
  OWNER: "#00FF41",
  ADMIN: "#00CCFF",
  MEMBER: "#3D6B3D",
  VIEWER: "#1F3D1F",
};

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
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
    <div className="p-6 space-y-5 animate-fade-in" style={M}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-4">
        <div>
          <div className="text-[10px] text-[#3D6B3D] mb-1">
            <span className="text-[#00FF41]">[TEAM]</span> {members.length}{" "}
            members
          </div>
          <h1 className="text-3xl font-black text-[#E8FFE8]" style={S}>
            Team
          </h1>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider border border-[#003B00] text-[#00FF41] hover:bg-[#003B00] transition-colors">
          <UserPlus className="w-3.5 h-3.5" /> $ invite --member
        </button>
      </div>

      {/* Members table */}
      <div className="border border-[#1A1A1A] bg-[#080808]">
        <div className="grid grid-cols-[32px_1fr_80px_100px_80px] gap-4 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A] text-[10px] text-[#1F3D1F] uppercase tracking-widest">
          <span>#</span>
          <span>member</span>
          <span>role</span>
          <span>joined</span>
          <span>status</span>
        </div>

        <div className="divide-y divide-[#0D0D0D]">
          {members.map((member, idx) => {
            const roleColor = ROLE_COLOR[member.role] ?? "#3D6B3D";
            const isMe = member.userId === user.id;
            return (
              <div
                key={member.id}
                className="grid grid-cols-[32px_1fr_80px_100px_80px] gap-4 items-center px-4 py-3 hover:bg-[#0A0A0A] transition-colors"
              >
                <span className="text-[10px] text-[#1F3D1F]">
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-7 h-7 border border-[#1A1A1A] overflow-hidden shrink-0 flex items-center justify-center bg-[#050505]"
                    style={{ borderColor: `${roleColor}30` }}
                  >
                    {member.user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.user.avatarUrl}
                        alt={member.user.username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span
                        className="text-[10px] font-bold"
                        style={{ color: roleColor }}
                      >
                        {member.user.username[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-[#E8FFE8] truncate">
                        @{member.user.username}
                      </p>
                      {isMe && (
                        <span className="text-[8px] px-1 border border-[#003B00] text-[#00FF41]">
                          you
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#1F3D1F] truncate">
                      {member.user.email ?? "—"}
                    </p>
                  </div>
                </div>

                <span
                  className="text-[10px] font-bold"
                  style={{ color: roleColor }}
                >
                  [{member.role.toLowerCase()}]
                </span>

                <span className="text-[10px] text-[#1F3D1F]">
                  {new Date(member.joinedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "2-digit",
                  })}
                </span>

                <span className="text-[10px] text-[#00FF41]">[OK] active</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Invite panel */}
      <div className="border border-[#1A1A1A] bg-[#080808] p-5">
        <p className="text-[10px] text-[#3D6B3D] mb-3">// invite_via_link</p>
        <div className="flex gap-3">
          <input
            readOnly
            value={`https://reviewiq.dev/invite/${Math.random().toString(36).slice(2, 10)}`}
            className="flex-1 bg-[#050505] border border-[#1A1A1A] px-3 py-2 text-[10px] text-[#3D6B3D] focus:outline-none"
            style={M}
          />
          <button className="px-4 py-2 text-[10px] font-bold uppercase bg-[#00FF41] text-[#050505] hover:bg-[#39FF14] transition-colors">
            copy
          </button>
        </div>
        <p className="text-[10px] text-[#1F3D1F] mt-2">
          // link expires in 7 days · max 10 uses
        </p>
      </div>
    </div>
  );
}
