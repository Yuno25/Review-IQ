import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { CheckCircle, Lock } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Billing" };

const PLANS = [
  {
    id: "FREE",
    name: "free",
    price: "$0",
    per: "",
    desc: "// for solo developers",
    features: [
      { text: "50 reviews / month", premium: false },
      { text: "500k tokens / month", premium: false },
      { text: "1 workspace", premium: false },
      { text: "github oauth", premium: false },
      { text: "basic issue detection", premium: false },
    ],
    accent: "#3D6B3D",
  },
  {
    id: "PRO",
    name: "pro",
    price: "$19",
    per: "/mo",
    desc: "// for serious developers",
    highlight: true,
    features: [
      { text: "500 reviews / month", premium: false },
      { text: "5M tokens / month", premium: false },
      { text: "3 workspaces", premium: false },
      { text: "webhook auto-review", premium: true },
      { text: "github pr comments", premium: true },
      { text: "priority processing", premium: true },
      { text: "email reports", premium: true },
    ],
    accent: "#00FF41",
  },
  {
    id: "TEAM",
    name: "team",
    price: "$49",
    per: "/mo",
    desc: "// for engineering teams",
    features: [
      { text: "unlimited reviews", premium: false },
      { text: "unlimited tokens", premium: false },
      { text: "unlimited workspaces", premium: false },
      { text: "custom ai review rules", premium: true },
      { text: "slack integration", premium: true },
      { text: "analytics dashboard", premium: true },
      { text: "priority support", premium: true },
      { text: "sso / saml", premium: true },
    ],
    accent: "#00CCFF",
  },
];

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "Playfair Display, Georgia, serif",
  textShadow: "none",
};

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
    <div className="p-6 space-y-6 animate-fade-in" style={M}>
      {/* Header */}
      <div className="border-b border-[#1A1A1A] pb-4">
        <div className="text-[10px] text-[#3D6B3D] mb-1">
          <span className="text-[#00FF41]">[BILLING]</span> subscription
          management
        </div>
        <h1 className="text-3xl font-black text-[#E8FFE8]" style={S}>
          Pricing Plans
        </h1>
      </div>

      {/* Usage panel */}
      {usage && (
        <div className="border border-[#1A1A1A] bg-[#080808] p-5">
          <p className="text-[10px] text-[#3D6B3D] mb-4">
            // current_month_usage
          </p>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                label: "reviews_used",
                used: usage.reviewsCount,
                limit: usage.reviewLimit,
                color: "#00FF41",
              },
              {
                label: "tokens_used",
                used: usage.tokensUsed,
                limit: usage.tokenLimit,
                color: "#00CCFF",
                fmt: (n: number) => `${(n / 1000).toFixed(1)}k`,
              },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-[10px] mb-2">
                  <span className="text-[#1F3D1F]">// {item.label}</span>
                  <span style={{ color: item.color }}>
                    {item.fmt ? item.fmt(item.used) : item.used}
                    <span className="text-[#1F3D1F]">
                      {" "}
                      / {item.fmt ? item.fmt(item.limit) : item.limit}
                    </span>
                  </span>
                </div>
                <div className="h-1 bg-[#1A1A1A] overflow-hidden">
                  <div
                    className="h-full transition-all duration-700"
                    style={{
                      width: `${Math.min((item.used / item.limit) * 100, 100)}%`,
                      background: item.color,
                      boxShadow: `0 0 6px ${item.color}`,
                    }}
                  />
                </div>
              </div>
            ))}
            <div className="flex flex-col justify-center">
              <p className="text-[10px] text-[#1F3D1F]">// resets_on</p>
              <p className="text-sm font-bold text-[#00FF41] mt-1">
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
      )}

      {/* Plan grid */}
      <div className="grid grid-cols-3 gap-px bg-[#1A1A1A]">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <div
              key={plan.id}
              className="bg-[#080808] p-7 flex flex-col relative"
              style={
                plan.highlight
                  ? {
                      outline: `1px solid rgba(0,255,65,0.2)`,
                      outlineOffset: "-1px",
                      background: "rgba(0,255,65,0.02)",
                    }
                  : {}
              }
            >
              {plan.highlight && (
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, #00FF41, transparent)",
                  }}
                />
              )}

              {/* Plan name + price */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="text-[10px] uppercase tracking-widest"
                    style={{ color: plan.accent }}
                  >
                    {plan.name}
                  </span>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 border text-[#00FF41] border-[#003B00]">
                      active
                    </span>
                  )}
                </div>
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className="text-4xl font-bold text-[#E8FFE8]"
                    style={{
                      textShadow: plan.highlight
                        ? "0 0 20px rgba(0,255,65,0.3)"
                        : "none",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-[#3D6B3D] text-sm mb-1">
                    {plan.per}
                  </span>
                </div>
                <p className="text-[10px] text-[#1F3D1F]">{plan.desc}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1 mb-6">
                {plan.features.map((f) => (
                  <li
                    key={f.text}
                    className="flex items-center gap-2 text-[10px]"
                  >
                    {f.premium ? (
                      <Lock
                        className="w-3 h-3 shrink-0"
                        style={{ color: plan.accent }}
                      />
                    ) : (
                      <span style={{ color: plan.accent }}>+</span>
                    )}
                    <span
                      style={{ color: f.premium ? plan.accent : "#3D6B3D" }}
                    >
                      {f.text}
                    </span>
                    {f.premium && (
                      <span
                        className="text-[8px] px-1 border ml-auto shrink-0"
                        style={{
                          color: plan.accent,
                          borderColor: `${plan.accent}30`,
                        }}
                      >
                        PRO
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <div className="w-full py-2.5 text-[10px] text-center border border-[#1A1A1A] text-[#1F3D1F]">
                  // current plan
                </div>
              ) : (
                <Link
                  href={`/api/billing/checkout?plan=${plan.id}`}
                  className="w-full py-2.5 text-[10px] font-bold uppercase tracking-wider text-center transition-all border block"
                  style={
                    plan.highlight
                      ? {
                          background: "#00FF41",
                          color: "#050505",
                          borderColor: "#00FF41",
                        }
                      : {
                          background: "transparent",
                          color: plan.accent,
                          borderColor: `${plan.accent}40`,
                        }
                  }
                >
                  $ ./upgrade_{plan.name}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Premium features locked notice */}
      {currentPlan === "FREE" && (
        <div className="border border-[#FFB800]/20 bg-[#3D2D00]/20 p-4">
          <p className="text-[10px] text-[#FFB800] mb-1">
            [LOCKED] premium features require Pro or Team plan
          </p>
          <p className="text-[10px] text-[#1F3D1F]">
            // webhook auto-review, github pr comments, custom rules are gated
            behind paid plans
          </p>
        </div>
      )}
    </div>
  );
}
