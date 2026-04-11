"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GitPullRequest,
  Database,
  Settings,
  CreditCard,
  Users,
  ChevronRight,
  Zap,
  LogOut,
  Bell,
} from "lucide-react";
import { clsx } from "clsx";

const NAV_ITEMS = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reviews", href: "/reviews", icon: GitPullRequest, badge: "12" },
      { label: "Repositories", href: "/repositories", icon: Database },
    ],
  },
  {
    group: "Workspace",
    items: [
      { label: "Team", href: "/team", icon: Users },
      { label: "Billing", href: "/billing", icon: CreditCard },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

interface SidebarProps {
  user?: { name?: string | null; username: string; avatarUrl?: string | null };
  usage?: { reviewsCount: number; reviewLimit: number };
}

export function Sidebar({ user, usage }: SidebarProps) {
  const pathname = usePathname();
  const usagePct = usage ? (usage.reviewsCount / usage.reviewLimit) * 100 : 0;

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-surface-raised border-r border-surface-border">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-surface-border">
        <div className="w-7 h-7 rounded-md bg-brand-gradient flex items-center justify-center shadow-glow">
          <Zap className="w-4 h-4 text-black" strokeWidth={2.5} />
        </div>
        <span className="font-display font-bold text-lg text-text-primary tracking-tight">
          Review<span className="text-gradient">IQ</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
        {NAV_ITEMS.map((group) => (
          <div key={group.group}>
            <p className="px-2 mb-1.5 text-2xs font-semibold uppercase tracking-widest text-text-muted">
              {group.group}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-150 group",
                        isActive
                          ? "bg-brand-muted text-brand border border-brand-border"
                          : "text-text-secondary hover:text-text-primary hover:bg-surface-hover",
                      )}
                    >
                      <Icon
                        className={clsx(
                          "w-4 h-4 shrink-0",
                          isActive
                            ? "text-brand"
                            : "text-text-muted group-hover:text-text-secondary",
                        )}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="badge badge-muted">{item.badge}</span>
                      )}
                      {isActive && (
                        <ChevronRight className="w-3 h-3 text-brand opacity-60" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usage quota */}
      {usage && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-surface-overlay border border-surface-border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-secondary font-medium">
              Monthly Reviews
            </span>
            <span className="text-xs font-mono text-text-primary">
              {usage.reviewsCount}
              <span className="text-text-muted">/{usage.reviewLimit}</span>
            </span>
          </div>
          <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
            <div
              className={clsx(
                "h-full rounded-full transition-all duration-500",
                usagePct >= 90
                  ? "bg-danger"
                  : usagePct >= 70
                    ? "bg-warning"
                    : "bg-brand",
              )}
              style={{ width: `${Math.min(usagePct, 100)}%` }}
            />
          </div>
          {usagePct >= 80 && (
            <p className="mt-1.5 text-2xs text-warning">
              Approaching limit — consider upgrading
            </p>
          )}
        </div>
      )}

      {/* User profile */}
      {user && (
        <div className="flex items-center gap-3 px-4 py-3 border-t border-surface-border">
          <div className="w-8 h-8 rounded-full bg-surface-overlay border border-surface-border overflow-hidden shrink-0">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-mono text-text-secondary">
                {user.username[0].toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">
              {user.name ?? user.username}
            </p>
            <p className="text-2xs text-text-muted truncate">
              @{user.username}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button className="btn-ghost p-1.5" title="Notifications">
              <Bell className="w-4 h-4" />
            </button>
            <Link
              href="/api/auth/logout"
              className="btn-ghost p-1.5"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
