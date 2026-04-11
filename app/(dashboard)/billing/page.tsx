import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import {
  CheckCircle,
  Zap,
  Shield,
  Users,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const metadata = { title: "Billing" };

const PLANS = [
  {
    name: "Free",
    tier: "FREE",
    price: 0,
    description: "For solo developers getting started",
    icon: Zap,
    accent: "#8B949E",
    features: [
      "50 reviews / month",
      "500k tokens / month",
      "1 workspace",
      "GitHub OAuth",
      "Basic issue detection",
    ],
  },
  {
    name: "Pro",
    tier: "PRO",
    price: 19,
    description: "For serious developers who ship fast",
    icon: Shield,
    accent: "#00D4FF",
    highlight: true,
    features: [
      "500 reviews / month",
      "5M tokens / month",
      "3 workspaces",
      "Priority processing",
      "Advanced security scan",
      "Webhook auto-review",
      "Email reports",
    ],
  },
  {
    name: "Team",
    tier: "TEAM",
    price: 49,
    description: "For engineering teams that move fast",
    icon: Users,
    accent: "#3FB950",
    features: [
      "Unlimited reviews",
      "Unlimited tokens",
      "Unlimited workspaces",
      "Unlimited team members",
      "Custom AI rules",
      "Slack integration",
      "Priority support",
      "Analytics dashboard",
    ],
  },
];

export default async function BillingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workspaceId = user.memberships[0]?.workspaceId;
  if (!workspaceId) redirect("/onboarding");

  const [subscription, usage] = await Promise.all([
    db.subscription.findUnique({ where: { workspaceId } }),
    db.usageRecord.findUnique({
      where: {
        workspaceId_month: {
          workspaceId,
          month: new Date().toISOString().slice(0, 7),
        },
      },
    }),
  ]);

  const currentPlan = subscription?.plan ?? "FREE";

  return (
    <div
      className="min-h-screen p-8 animate-fade-in"
      style={{
        background:
          "radial-gradient(ellipse at 20% 20%, rgba(0,212,255,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(63,185,80,0.04) 0%, transparent 60%), #0A0C10",
      }}
    >
      {/* Header */}
      <div className="max-w-6xl mx-auto mb-10 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-muted border border-brand-border text-brand text-xs font-mono mb-4">
          <Sparkles className="w-3 h-3" />
          Simple, transparent pricing
        </div>
        <h1 className="font-display text-4xl font-bold text-text-primary mb-2">
          Choose your <span className="text-gradient">plan</span>
        </h1>
        <p className="text-text-secondary text-sm">
          Current plan:{" "}
          <span className="text-brand font-semibold font-mono">
            {currentPlan}
          </span>
        </p>
      </div>

      {/* Usage card */}
      {usage && (
        <div className="max-w-6xl mx-auto mb-8">
          <div
            className="rounded-2xl border border-surface-border p-6"
            style={{
              background: "rgba(15,17,23,0.8)",
              backdropFilter: "blur(20px)",
            }}
          >
            <h2 className="text-sm font-semibold text-text-primary mb-5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse inline-block" />
              This Month&apos;s Usage
            </h2>
            <div className="grid grid-cols-3 gap-8">
              {[
                {
                  label: "Reviews Used",
                  used: usage.reviewsCount,
                  limit: usage.reviewLimit,
                  color: "#00D4FF",
                },
                {
                  label: "Tokens Used",
                  used: usage.tokensUsed,
                  limit: usage.tokenLimit,
                  color: "#58A6FF",
                  format: (n: number) => `${(n / 1000).toFixed(1)}k`,
                },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-text-muted">{item.label}</span>
                    <span className="font-mono" style={{ color: item.color }}>
                      {item.format ? item.format(item.used) : item.used}
                      <span className="text-text-muted">
                        {" "}
                        / {item.format ? item.format(item.limit) : item.limit}
                      </span>
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.min((item.used / item.limit) * 100, 100)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="flex flex-col justify-center">
                <p className="text-xs text-text-muted">Resets on</p>
                <p className="text-base font-display font-bold text-text-primary mt-1">
                  {new Date(
                    new Date().getFullYear(),
                    new Date().getMonth() + 1,
                    1,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto grid grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = currentPlan === plan.tier;

          return (
            <div key={plan.tier} className="relative group">
              {plan.highlight && (
                <div
                  className="absolute -inset-px rounded-2xl opacity-40 blur-lg"
                  style={{
                    background: `linear-gradient(135deg, ${plan.accent}, transparent)`,
                  }}
                />
              )}
              <div
                className="relative flex flex-col h-full rounded-2xl border p-7 transition-all duration-300 group-hover:-translate-y-1"
                style={{
                  background: plan.highlight
                    ? "rgba(0,212,255,0.05)"
                    : "rgba(15,17,23,0.7)",
                  backdropFilter: "blur(20px)",
                  borderColor: plan.highlight ? plan.accent : "#21262D",
                  boxShadow: plan.highlight
                    ? `0 0 40px ${plan.accent}20, inset 0 1px 0 ${plan.accent}20`
                    : "inset 0 1px 0 rgba(255,255,255,0.04)",
                }}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className="px-3 py-1 rounded-full text-2xs font-bold uppercase tracking-widest font-mono"
                      style={{ background: plan.accent, color: "#000" }}
                    >
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{
                      background: `${plan.accent}18`,
                      border: `1px solid ${plan.accent}30`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: plan.accent }} />
                  </div>
                  <h3 className="font-display text-2xl font-bold text-text-primary">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {plan.description}
                  </p>
                </div>

                <div className="mb-6 pb-6 border-b border-surface-border">
                  <div className="flex items-end gap-1">
                    <span
                      className="font-display text-5xl font-black"
                      style={{
                        color: plan.price === 0 ? "#E6EDF3" : plan.accent,
                      }}
                    >
                      ${plan.price}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-sm text-text-muted mb-2">
                        /month
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    {plan.price === 0
                      ? "Free forever, no credit card"
                      : "Billed monthly, cancel anytime"}
                  </p>
                </div>

                <ul className="space-y-2.5 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2.5 text-sm text-text-secondary"
                    >
                      <CheckCircle
                        className="w-4 h-4 shrink-0"
                        style={{ color: plan.accent }}
                      />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  disabled={isCurrent}
                  className="w-full py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200"
                  style={
                    isCurrent
                      ? {
                          background: "rgba(255,255,255,0.05)",
                          color: "#484F58",
                          cursor: "default",
                        }
                      : plan.highlight
                        ? {
                            background: plan.accent,
                            color: "#000",
                            boxShadow: `0 0 20px ${plan.accent}40`,
                          }
                        : {
                            background: `${plan.accent}15`,
                            color: plan.accent,
                            border: `1px solid ${plan.accent}30`,
                          }
                  }
                >
                  {isCurrent ? (
                    "Current Plan"
                  ) : (
                    <>
                      Upgrade to {plan.name} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
