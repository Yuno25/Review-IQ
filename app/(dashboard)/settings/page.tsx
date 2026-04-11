import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { User, Building2, Bell, Shield, Trash2, Github } from "lucide-react";

export const metadata = { title: "Settings" };

const glassCard = {
  background: "rgba(15,17,23,0.7)",
  backdropFilter: "blur(20px)",
  border: "1px solid #21262D",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)",
};

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const workspace = await db.workspace.findUnique({
    where: { id: workspaceId },
  });

  return (
    <div
      className="min-h-screen p-8 animate-fade-in"
      style={{
        background:
          "radial-gradient(ellipse at 30% 10%, rgba(0,212,255,0.03) 0%, transparent 50%), #0A0C10",
      }}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
            Settings
          </h1>
          <p className="text-sm text-text-muted">
            Manage your account and workspace preferences
          </p>
        </div>

        {/* Profile */}
        <div className="rounded-2xl p-7 space-y-6" style={glassCard}>
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              <User className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Profile
              </h2>
              <p className="text-xs text-text-muted">
                Your personal information
              </p>
            </div>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden border-2"
                style={{
                  borderColor: "rgba(0,212,255,0.3)",
                  boxShadow: "0 0 20px rgba(0,212,255,0.1)",
                }}
              >
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-display font-bold text-brand"
                    style={{ background: "rgba(0,212,255,0.1)" }}
                  >
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-success border-2 border-surface-base" />
            </div>
            <div>
              <p className="font-display text-xl font-bold text-text-primary">
                {user.name ?? user.username}
              </p>
              <p className="text-sm text-text-muted font-mono">
                @{user.username}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <Github className="w-3.5 h-3.5 text-text-muted" />
                <span className="text-xs text-text-muted">
                  Connected via GitHub
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Display Name",
                value: user.name ?? "",
                placeholder: "Your name",
              },
              {
                label: "Email",
                value: user.email ?? "",
                placeholder: "your@email.com",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-medium text-text-muted block mb-2">
                  {field.label}
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-all outline-none"
                  style={{
                    background: "rgba(22,27,34,0.8)",
                    border: "1px solid #21262D",
                  }}
                  defaultValue={field.value}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all"
              style={{
                background: "#00D4FF",
                boxShadow: "0 0 20px rgba(0,212,255,0.3)",
              }}
            >
              Save Changes
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="rounded-2xl p-7 space-y-6" style={glassCard}>
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              <Building2 className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Workspace
              </h2>
              <p className="text-xs text-text-muted">
                Configure your team workspace
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Workspace Name",
                value: workspace?.name ?? "",
                placeholder: "My Workspace",
              },
              {
                label: "Slug",
                value: workspace?.slug ?? "",
                placeholder: "my-workspace",
              },
            ].map((field) => (
              <div key={field.label}>
                <label className="text-xs font-medium text-text-muted block mb-2">
                  {field.label}
                </label>
                <input
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-all outline-none"
                  style={{
                    background: "rgba(22,27,34,0.8)",
                    border: "1px solid #21262D",
                  }}
                  defaultValue={field.value}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-black transition-all"
              style={{
                background: "#00D4FF",
                boxShadow: "0 0 20px rgba(0,212,255,0.3)",
              }}
            >
              Update Workspace
            </button>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-7 space-y-5" style={glassCard}>
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              <Bell className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Notifications
              </h2>
              <p className="text-xs text-text-muted">
                Control what alerts you receive
              </p>
            </div>
          </div>

          <div className="space-y-1">
            {[
              {
                label: "Review completed",
                desc: "Get notified when an AI review finishes",
                on: true,
              },
              {
                label: "Critical issues found",
                desc: "Alert when CRITICAL severity issues are detected",
                on: true,
              },
              {
                label: "Weekly digest",
                desc: "Weekly summary of your team's review activity",
                on: false,
              },
              {
                label: "Usage warnings",
                desc: "Alert when approaching plan limits",
                on: true,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-3.5 border-b border-surface-border last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {item.label}
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    defaultChecked={item.on}
                    className="sr-only peer"
                  />
                  <div
                    className="w-10 h-5.5 rounded-full transition-colors peer-checked:bg-brand bg-surface-border
                    after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full
                    after:h-4.5 after:w-4.5 after:transition-all peer-checked:after:translate-x-[18px]"
                    style={{ height: "22px", width: "40px" }}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="rounded-2xl p-7" style={glassCard}>
          <div className="flex items-center gap-3 pb-4 border-b border-surface-border mb-5">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(0,212,255,0.1)",
                border: "1px solid rgba(0,212,255,0.2)",
              }}
            >
              <Shield className="w-4 h-4 text-brand" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Security
              </h2>
              <p className="text-xs text-text-muted">
                Authentication and access
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Github className="w-5 h-5 text-text-secondary" />
              <div>
                <p className="text-sm font-medium text-text-primary">
                  GitHub Connection
                </p>
                <p className="text-xs text-text-muted">
                  Signed in as @{user.username}
                </p>
              </div>
            </div>
            <span
              className="px-3 py-1 rounded-full text-xs font-semibold font-mono"
              style={{
                background: "rgba(63,185,80,0.12)",
                color: "#3FB950",
                border: "1px solid rgba(63,185,80,0.2)",
              }}
            >
              ● Connected
            </span>
          </div>
        </div>

        {/* Danger zone */}
        <div
          className="rounded-2xl p-7"
          style={{ ...glassCard, borderColor: "rgba(248,81,73,0.2)" }}
        >
          <div
            className="flex items-center gap-3 pb-4 border-b mb-5"
            style={{ borderColor: "rgba(248,81,73,0.15)" }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(248,81,73,0.1)",
                border: "1px solid rgba(248,81,73,0.2)",
              }}
            >
              <Trash2 className="w-4 h-4 text-danger" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-danger">Danger Zone</h2>
              <p className="text-xs text-text-muted">Irreversible actions</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-text-primary">
                Delete Workspace
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                Permanently delete all data. This cannot be undone.
              </p>
            </div>
            <button
              className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all"
              style={{
                background: "rgba(248,81,73,0.1)",
                color: "#F85149",
                border: "1px solid rgba(248,81,73,0.3)",
              }}
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
