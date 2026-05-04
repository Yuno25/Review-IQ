import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Github, Shield, Bell, Trash2, User, Building2 } from "lucide-react";

export const metadata = { title: "Settings" };

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-[#1A1A1A] bg-[#080808]">
      <div className="px-5 py-3 border-b border-[#1A1A1A] bg-[#0A0A0A] flex items-center gap-2">
        <span className="text-[10px] text-[#00FF41]">[CONFIG]</span>
        <span className="text-[10px] text-[#3D6B3D]">// {label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  defaultValue,
  placeholder,
}: {
  label: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] text-[#1F3D1F] block mb-1.5">
        // {label}
      </label>
      <input
        className="w-full bg-[#050505] border border-[#1A1A1A] px-3 py-2.5 text-xs text-[#E8FFE8] placeholder:text-[#1F3D1F] focus:outline-none focus:border-[#003B00] transition-colors"
        style={M}
        defaultValue={defaultValue}
        placeholder={placeholder}
      />
    </div>
  );
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");
  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  return (
    <div className="p-6 max-w-2xl space-y-5 animate-fade-in" style={M}>
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-4">
        <div className="text-[10px] text-[#3D6B3D] mb-1">
          <span className="text-[#00FF41]">[SETTINGS]</span> system
          configuration
        </div>
        <h1 className="text-3xl font-black text-[#E8FFE8]" style={S}>
          Config
        </h1>
      </div>

      {/* Profile */}
      <Section label="user.profile">
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-[#1A1A1A]">
          <div
            className="w-16 h-16 border border-[#003B00] overflow-hidden flex items-center justify-center bg-[#050505]"
            style={{ boxShadow: "0 0 15px rgba(0,255,65,0.1)" }}
          >
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-xl font-bold text-[#00FF41]">
                {user.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-[#E8FFE8]">
              {user.name ?? user.username}
            </p>
            <p className="text-[10px] text-[#3D6B3D] mt-0.5">
              @{user.username}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <Github className="w-3 h-3 text-[#1F3D1F]" />
              <span className="text-[10px] text-[#1F3D1F]">
                authenticated via github oauth
              </span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field
            label="display_name"
            defaultValue={user.name ?? ""}
            placeholder="Your name"
          />
          <Field
            label="email"
            defaultValue={user.email ?? ""}
            placeholder="your@email.com"
          />
        </div>
        <div className="flex justify-end">
          <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#00FF41] text-[#050505] hover:bg-[#39FF14] transition-colors">
            $ save_changes
          </button>
        </div>
      </Section>

      {/* Workspace */}
      <Section label="workspace.config">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <Field
            label="workspace_name"
            defaultValue={workspace?.name ?? ""}
            placeholder="My Workspace"
          />
          <Field
            label="slug"
            defaultValue={workspace?.slug ?? ""}
            placeholder="my-workspace"
          />
        </div>
        <div className="flex justify-end">
          <button className="px-5 py-2 text-[10px] font-bold uppercase tracking-wider bg-[#00FF41] text-[#050505] hover:bg-[#39FF14] transition-colors">
            $ update_workspace
          </button>
        </div>
      </Section>

      {/* Notifications */}
      <Section label="notifications.config">
        <div className="space-y-0 divide-y divide-[#0D0D0D]">
          {[
            {
              key: "review_completed",
              desc: "notify when AI review finishes",
              on: true,
            },
            {
              key: "critical_issues",
              desc: "alert on CRITICAL severity findings",
              on: true,
            },
            {
              key: "weekly_digest",
              desc: "weekly summary of review activity",
              on: false,
            },
            {
              key: "usage_warnings",
              desc: "alert when approaching plan limits",
              on: true,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3"
            >
              <div>
                <p className="text-xs text-[#7FBF7F]">{item.key}</p>
                <p className="text-[10px] text-[#1F3D1F] mt-0.5">
                  // {item.desc}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={item.on}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-[#1A1A1A] border border-[#1A1A1A] peer-checked:border-[#003B00] peer-checked:bg-[#003B00] transition-all relative">
                  <div className="absolute top-0.5 left-0.5 w-3 h-3 bg-[#3D6B3D] peer-checked:bg-[#00FF41] transition-all peer-checked:translate-x-4" />
                </div>
              </label>
            </div>
          ))}
        </div>
      </Section>

      {/* Security */}
      <Section label="security.oauth">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-4 h-4 text-[#3D6B3D]" />
            <div>
              <p className="text-xs text-[#7FBF7F]">github_connection</p>
              <p className="text-[10px] text-[#1F3D1F] mt-0.5">
                // signed in as @{user.username}
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2 py-1 border border-[#003B00] text-[#00FF41]">
            [OK] connected
          </span>
        </div>
      </Section>

      {/* Danger zone */}
      <div className="border border-[#FF3333]/20 bg-[#080808]">
        <div className="px-5 py-3 border-b border-[#FF3333]/10 bg-[#3D0000]/20 flex items-center gap-2">
          <span className="text-[10px] text-[#FF3333]">[DANGER]</span>
          <span className="text-[10px] text-[#FF3333]/50">
            // irreversible_actions
          </span>
        </div>
        <div className="p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-[#FF3333]/80">delete_workspace</p>
            <p className="text-[10px] text-[#1F3D1F] mt-0.5">
              // permanently removes all data — cannot be undone
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 text-[10px] font-bold uppercase border border-[#FF3333]/30 text-[#FF3333] hover:bg-[#FF3333] hover:text-[#050505] transition-all">
            <Trash2 className="w-3 h-3" /> rm -rf workspace
          </button>
        </div>
      </div>
    </div>
  );
}
