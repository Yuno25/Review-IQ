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
  LogOut,
  Bell,
  Terminal,
} from "lucide-react";
import { clsx } from "clsx";

const NAV = [
  {
    group: "// overview",
    items: [
      {
        label: "dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        cmd: "dash",
      },
      {
        label: "reviews",
        href: "/reviews",
        icon: GitPullRequest,
        cmd: "rev",
        badge: "12",
      },
      { label: "repos", href: "/repositories", icon: Database, cmd: "repo" },
    ],
  },
  {
    group: "// workspace",
    items: [
      { label: "team", href: "/team", icon: Users, cmd: "team" },
      { label: "billing", href: "/billing", icon: CreditCard, cmd: "bill" },
      { label: "settings", href: "/settings", icon: Settings, cmd: "conf" },
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
    <aside className="flex flex-col w-56 min-h-screen border-r border-term-border bg-term-black">
      {/* Logo / Header */}
      <div className="px-4 py-4 border-b border-term-border">
        <div className="flex items-center gap-2 mb-1">
          <Terminal className="w-3.5 h-3.5 text-term-green" />
          <span className="text-term-green text-xs font-bold tracking-widest uppercase">
            ReviewIQ
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
          <span className="dot-live" />
          <span className="ml-1.5">system online</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-5 overflow-y-auto">
        {NAV.map((group) => (
          <div key={group.group}>
            <p className="px-2 mb-2 text-[10px] text-ink-ghost tracking-widest uppercase font-mono">
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
                        "flex items-center gap-2.5 px-2 py-2 text-xs font-mono transition-all group",
                        isActive
                          ? "text-term-green border-l-2 border-term-green bg-term-dark pl-[7px]"
                          : "text-ink-secondary hover:text-term-green hover:bg-term-dim border-l-2 border-transparent pl-[7px]",
                      )}
                    >
                      {isActive ? (
                        <span className="text-term-green text-[10px]">▶</span>
                      ) : (
                        <span className="text-ink-ghost text-[10px] group-hover:text-term-green">
                          ·
                        </span>
                      )}
                      <Icon className="w-3.5 h-3.5 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] px-1 border border-term-border text-ink-muted">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Usage */}
      {usage && (
        <div className="mx-3 mb-3 p-3 border border-term-border bg-term-raised">
          <div className="flex justify-between text-[10px] font-mono mb-2">
            <span className="text-ink-muted">// reviews</span>
            <span className={usagePct >= 80 ? "text-warn" : "text-term-green"}>
              {usage.reviewsCount}/{usage.reviewLimit}
            </span>
          </div>
          <div className="h-1 bg-term-border overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${Math.min(usagePct, 100)}%`,
                background:
                  usagePct >= 90
                    ? "#FF3333"
                    : usagePct >= 70
                      ? "#FFB800"
                      : "#00FF41",
                boxShadow:
                  usagePct < 90 ? "0 0 6px rgba(0,255,65,0.5)" : undefined,
              }}
            />
          </div>
          {usagePct >= 80 && (
            <p className="mt-1.5 text-[10px] text-warn font-mono">
              ! approaching limit
            </p>
          )}
        </div>
      )}

      {/* User */}
      {user && (
        <div className="border-t border-term-border px-3 py-3 flex items-center gap-2">
          <div className="w-7 h-7 border border-term-green/30 overflow-hidden shrink-0 flex items-center justify-center bg-term-dark">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatarUrl}
                alt={user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[10px] text-term-green font-mono">
                {user.username[0].toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-ink-primary truncate font-mono leading-tight">
              @{user.username}
            </p>
            <p className="text-[10px] text-ink-ghost truncate">free tier</p>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1 text-ink-ghost hover:text-term-green transition-colors">
              <Bell className="w-3.5 h-3.5" />
            </button>
            <Link
              href="/api/auth/logout"
              className="p-1 text-ink-ghost hover:text-err transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
