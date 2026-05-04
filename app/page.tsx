"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Terminal,
  Zap,
  Shield,
  GitPullRequest,
  ArrowRight,
  CheckCircle,
  Star,
  TrendingUp,
  Clock,
  Users,
  Code2,
} from "lucide-react";

function useTypewriter(text: string, speed = 14, active = false) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    if (!active) return;
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed, active]);
  return displayed;
}

function useInView(threshold = 0.3) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

const BOOT_LINES = [
  {
    delay: 0,
    status: "[BOOT]",
    msg: "initializing reviewiq kernel v1.0.0...",
    color: "#3D6B3D",
  },
  {
    delay: 300,
    status: "[OK]  ",
    msg: "claude opus 4 engine mounted",
    color: "#00FF41",
  },
  {
    delay: 600,
    status: "[OK]  ",
    msg: "github integration layer ready",
    color: "#00FF41",
  },
  {
    delay: 900,
    status: "[OK]  ",
    msg: "postgresql + redis connected",
    color: "#00FF41",
  },
  {
    delay: 1200,
    status: "[OK]  ",
    msg: "streaming review engine online",
    color: "#00FF41",
  },
  {
    delay: 1500,
    status: "[READY]",
    msg: "system operational — awaiting input_",
    color: "#00FF41",
  },
];

const FAKE_REVIEW = `> analyzing pull_request #47 "add-jwt-auth"
> files changed: 3 | +124 -12 lines

[SCANNING] security vulnerabilities...
[FOUND]    CRITICAL: hardcoded secret on line 3
           → jwt.sign(payload, 'mysecret123')
           → fix: use process.env.JWT_SECRET

[SCANNING] performance issues...
[FOUND]    HIGH: N+1 query in getUsers()
           → loop calls fetchUserById() per iteration
           → fix: batch with findMany({ id: { in: ids } })

[SCANNING] error handling...
[FOUND]    MEDIUM: 3 async fns missing try/catch
           → unhandled rejections crash the server
           → fix: add global error middleware

[SCORE]    74/100 — needs fixes before merge
[DONE]     review complete in 2.1s`;

const FEATURES = [
  {
    icon: Zap,
    title: "Sub-3s Reviews",
    desc: "Claude Opus 4 reads your entire diff and returns structured JSON feedback before your team refreshes the page.",
    accent: "#00FF41",
  },
  {
    icon: Shield,
    title: "Security Scanner",
    desc: "Catches hardcoded secrets, SQL injection, XSS, and insecure deps. Every. Single. Push.",
    accent: "#FF3333",
  },
  {
    icon: Code2,
    title: "Line-Level Precision",
    desc: "Every issue is pinned to an exact file and line number. Not vibes — precise, actionable feedback.",
    accent: "#00CCFF",
  },
  {
    icon: GitPullRequest,
    title: "GitHub Native",
    desc: "OAuth in 60 seconds. Reviews post as PR comments automatically. Your team sees nothing new.",
    accent: "#FFB800",
  },
  {
    icon: TrendingUp,
    title: "Quality Tracking",
    desc: "0–100 score per PR. Watch your codebase quality trend up as your team internalises the feedback.",
    accent: "#00FF41",
  },
  {
    icon: Users,
    title: "Team Workspaces",
    desc: "Roles, permissions, unified PR feed across all repos. Built for teams that actually collaborate.",
    accent: "#00CCFF",
  },
];

const STATS = [
  { value: "2.4s", label: "avg_review_time", icon: Clock },
  { value: "94%", label: "issue_detection", icon: Shield },
  { value: "12k+", label: "prs_reviewed", icon: GitPullRequest },
  { value: "3.2k", label: "bugs_caught", icon: TrendingUp },
];

const TESTIMONIALS = [
  {
    quote:
      "ReviewIQ caught a critical SQL injection our entire team missed. It paid for itself in the first week.",
    name: "Sarah Chen",
    role: "CTO @ Dataflow",
    avatar: "SC",
  },
  {
    quote:
      "Went from 45 min code reviews to 8 minutes. The AI handles obvious stuff so we focus on architecture.",
    name: "Marcus Webb",
    role: "Lead Eng @ Shipfast",
    avatar: "MW",
  },
  {
    quote:
      "It feels like pair programming with a senior who never gets tired, never misses anything, and never argues.",
    name: "Priya Sharma",
    role: "Staff Eng @ Amplitude",
    avatar: "PS",
  },
];

const M = { fontFamily: "'JetBrains Mono', monospace" };
const S = {
  fontFamily: "'Playfair Display', Georgia, serif",
  textShadow: "none",
};

export default function LandingPage() {
  const { ref: demoRef, inView: demoInView } = useInView(0.3);
  const reviewText = useTypewriter(FAKE_REVIEW, 14, demoInView);
  const [bootLines, setBootLines] = useState<number[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    BOOT_LINES.forEach((_, i) => {
      setTimeout(() => setBootLines((p) => [...p, i]), BOOT_LINES[i].delay);
    });
  }, []);

  return (
    <div
      className="min-h-screen bg-[#050505] text-[#E8FFE8] overflow-x-hidden"
      style={M}
    >
      {/* Grid bg */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        {/* Scanlines */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)",
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(0,255,65,0.03) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-50 flex items-center justify-between px-8 py-4 border-b border-[#1A1A1A]"
        style={{ background: "rgba(5,5,5,0.95)", backdropFilter: "blur(10px)" }}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-[#00FF41]" />
          <span
            className="text-[#00FF41] font-bold tracking-widest text-sm"
            style={M}
          >
            ReviewIQ
          </span>
          <span className="text-[#1F3D1F] text-xs ml-1" style={M}>
            v1.0.0
          </span>
        </div>
        <div
          className="hidden md:flex items-center gap-8 text-xs text-[#3D6B3D]"
          style={M}
        >
          {["features", "demo", "pricing"].map((item) => (
            <a
              key={item}
              href={`#${item}`}
              className="hover:text-[#00FF41] transition-colors"
            >
              <span className="text-[#1F3D1F]">~/</span>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs text-[#3D6B3D] hover:text-[#00FF41] transition-colors px-3 py-1.5"
            style={M}
          >
            $ login
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 text-xs font-bold px-4 py-2 uppercase tracking-wider transition-all border border-[#00FF41] text-[#050505] bg-[#00FF41] hover:bg-transparent hover:text-[#00FF41]"
            style={{ ...M, boxShadow: "0 0 15px rgba(0,255,65,0.2)" }}
          >
            get_started <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 pt-20 pb-16">
        {/* Boot sequence */}
        <div
          className={`mb-10 text-left w-full max-w-xl border border-[#1A1A1A] bg-[#080808] transition-all duration-500 ${mounted ? "opacity-100" : "opacity-0"}`}
        >
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[#1A1A1A] bg-[#0A0A0A]">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]/50" />
              <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]/50" />
            </div>
            <span className="text-[10px] text-[#1F3D1F] ml-2" style={M}>
              terminal — reviewiq boot
            </span>
          </div>
          <div className="p-4 space-y-1 text-xs" style={M}>
            {BOOT_LINES.map((line, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 transition-all duration-300 ${bootLines.includes(i) ? "opacity-100" : "opacity-0"}`}
              >
                <span style={{ color: line.color, minWidth: "56px" }}>
                  {line.status}
                </span>
                <span
                  style={{
                    color: i < BOOT_LINES.length - 1 ? "#3D6B3D" : "#00FF41",
                  }}
                >
                  {line.msg}
                  {i === BOOT_LINES.length - 1 && bootLines.includes(i) && (
                    <span className="animate-blink">█</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Headline */}
        <h1
          className={`font-black text-5xl md:text-7xl leading-none mb-6 max-w-4xl transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          style={{ ...S, transitionDelay: "800ms" }}
        >
          The AI code reviewer
          <br />
          <span
            style={{
              color: "#00FF41",
              textShadow: "0 0 40px rgba(0,255,65,0.4)",
            }}
          >
            your senior engineer
          </span>
          <br />
          never had time to be.
        </h1>

        <p
          className={`text-sm text-[#7FBF7F] max-w-lg mb-10 leading-relaxed transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ ...M, transitionDelay: "1000ms" }}
        >
          {
            "// ReviewIQ hooks into every PR and runs a Claude Opus 4 review in under 3 seconds. Security, performance, bugs — all caught before merge."
          }
        </p>

        <div
          className={`flex items-center gap-4 mb-10 transition-all duration-700 ${mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
          style={{ transitionDelay: "1200ms" }}
        >
          <Link
            href="/login"
            className="flex items-center gap-2 px-6 py-3 text-sm font-bold uppercase tracking-wider transition-all border border-[#00FF41] text-[#050505] bg-[#00FF41] hover:bg-transparent hover:text-[#00FF41]"
            style={{ ...M, boxShadow: "0 0 25px rgba(0,255,65,0.25)" }}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            $ ./start --free
          </Link>
          <a
            href="#demo"
            className="flex items-center gap-2 px-6 py-3 text-sm text-[#3D6B3D] hover:text-[#00FF41] border border-[#1A1A1A] hover:border-[#003B00] transition-all"
            style={M}
          >
            <Terminal className="w-4 h-4" /> view demo↓
          </a>
        </div>

        <div
          className={`flex items-center gap-6 text-xs text-[#1F3D1F] transition-all duration-700 ${mounted ? "opacity-100" : "opacity-0"}`}
          style={{ ...M, transitionDelay: "1400ms" }}
        >
          {["no credit card", "60s setup", "50 free reviews/mo"].map((t) => (
            <span key={t} className="flex items-center gap-1.5">
              <CheckCircle className="w-3 h-3 text-[#00FF41]" />
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section
        className="relative z-10 border-y border-[#1A1A1A] py-8"
        style={{ background: "#080808" }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-4 gap-0 divide-x divide-[#1A1A1A]">
          {STATS.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="flex flex-col items-center py-4">
                <Icon className="w-3.5 h-3.5 text-[#00FF41] mb-2 opacity-50" />
                <span
                  className="text-3xl font-bold text-[#00FF41] tabular-nums"
                  style={{ ...M, textShadow: "0 0 20px rgba(0,255,65,0.3)" }}
                >
                  {s.value}
                </span>
                <span className="text-[10px] text-[#1F3D1F] mt-1" style={M}>
                  // {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Demo */}
      <section id="demo" className="relative z-10 py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p
              className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-2"
              style={M}
            >
              // live_demo
            </p>
            <h2 className="font-black text-4xl text-[#E8FFE8]" style={S}>
              Watch it work in real time
            </h2>
          </div>

          <div ref={demoRef} className="grid grid-cols-2 gap-4">
            {/* Code panel */}
            <div
              className="border border-[#1A1A1A]"
              style={{ background: "#080808" }}
            >
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1A1A1A] bg-[#0A0A0A]">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]/50" />
                </div>
                <span className="text-[10px] text-[#1F3D1F] ml-2" style={M}>
                  src/auth/jwt.ts — PR #47
                </span>
              </div>
              <pre
                className="p-5 text-xs leading-relaxed overflow-auto"
                style={{ ...M, maxHeight: "380px" }}
              >
                <span style={{ color: "#3D6B3D" }}>1 </span>
                <span style={{ color: "#FF7B72" }}>import </span>
                <span style={{ color: "#E8FFE8" }}>jwt </span>
                <span style={{ color: "#FF7B72" }}>from </span>
                <span style={{ color: "#A5D6FF" }}>
                  &apos;jsonwebtoken&apos;
                </span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>2 </span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>3 </span>
                <span style={{ color: "#FF7B72" }}>const </span>
                <span style={{ color: "#7FBF7F" }}>SECRET </span>
                <span style={{ color: "#E8FFE8" }}>=</span>
                <span style={{ color: "#A5D6FF" }}>
                  {" "}
                  &apos;mysecret123&apos;{" "}
                </span>
                <span style={{ color: "#FF3333" }}>// ⚠ CRITICAL</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>4 </span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>5 </span>
                <span style={{ color: "#FF7B72" }}>export async function </span>
                <span style={{ color: "#00FF41" }}>getUsers</span>
                <span style={{ color: "#E8FFE8" }}>(ids: string[]) {"{"}</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>6 </span>
                <span style={{ color: "#E8FFE8" }}> const users = []</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>7 </span>
                <span style={{ color: "#FF7B72" }}> for </span>
                <span style={{ color: "#E8FFE8" }}>
                  (const id of ids) {"{"}
                </span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>8 </span>
                <span style={{ color: "#FFB800" }}> {"// ⚠ N+1 query"}</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>9 </span>
                <span style={{ color: "#E8FFE8" }}> users.push(</span>
                <span style={{ color: "#FF7B72" }}>await </span>
                <span style={{ color: "#00FF41" }}>fetchUserById</span>
                <span style={{ color: "#E8FFE8" }}>(id))</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>10 </span>
                <span style={{ color: "#E8FFE8" }}> {"}"}</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>11 </span>
                <span style={{ color: "#FF7B72" }}> return </span>
                <span style={{ color: "#E8FFE8" }}>users</span>
                {"\n"}
                <span style={{ color: "#3D6B3D" }}>12 </span>
                <span style={{ color: "#E8FFE8" }}>{"}"}</span>
                {"\n"}
              </pre>
            </div>

            {/* Review stream */}
            <div
              className="border border-[#00FF41]/20]"
              style={{
                background: "#050505",
                borderColor: "rgba(0,255,65,0.15)",
                borderWidth: "1px",
                borderStyle: "solid",
              }}
            >
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{
                  borderColor: "rgba(0,255,65,0.1)",
                  background: "rgba(0,255,65,0.03)",
                }}
              >
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#00FF41]" />
                  <span className="text-[10px] text-[#00FF41]" style={M}>
                    reviewiq — streaming output
                  </span>
                </div>
                {demoInView && (
                  <span
                    className="flex items-center gap-1.5 text-[10px] text-[#00FF41]"
                    style={M}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00FF41] animate-pulse inline-block" />
                    LIVE
                  </span>
                )}
              </div>
              <pre
                className="p-5 text-xs leading-relaxed overflow-auto"
                style={{ ...M, maxHeight: "380px" }}
              >
                {reviewText.split("\n").map((line, i) => {
                  const color = line.includes("CRITICAL")
                    ? "#FF3333"
                    : line.includes("HIGH")
                      ? "#FFB800"
                      : line.includes("MEDIUM")
                        ? "#00CCFF"
                        : line.includes("SCORE")
                          ? "#00FF41"
                          : line.includes("DONE")
                            ? "#00FF41"
                            : line.includes("[OK]")
                              ? "#00FF41"
                              : line.includes("→")
                                ? "#7FBF7F"
                                : line.startsWith(">")
                                  ? "#3D6B3D"
                                  : "#3D6B3D";
                  return (
                    <div key={i} style={{ color }}>
                      {line || " "}
                    </div>
                  );
                })}
                {demoInView && reviewText.length < FAKE_REVIEW.length && (
                  <span className="text-[#00FF41] animate-blink">█</span>
                )}
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 py-20 px-8 border-t border-[#1A1A1A]"
      >
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p
              className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-2"
              style={M}
            >
              // features
            </p>
            <h2 className="font-black text-4xl text-[#E8FFE8]" style={S}>
              Built for developers who care.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#1A1A1A]">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="p-6 transition-all hover:bg-[#0A0A0A] group cursor-default"
                  style={{ background: "#080808" }}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Icon
                      className="w-4 h-4 transition-colors"
                      style={{ color: f.accent }}
                    />
                    <span
                      className="text-[10px] uppercase tracking-widest"
                      style={{ ...M, color: f.accent }}
                    >
                      {f.title.toLowerCase().replace(" ", "_")}
                    </span>
                  </div>
                  <p
                    className="text-xs text-[#3D6B3D] leading-relaxed"
                    style={M}
                  >
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-20 px-8 border-t border-[#1A1A1A]">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <p
              className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-2"
              style={M}
            >
              // testimonials.log
            </p>
            <h2 className="font-black text-4xl text-[#E8FFE8]" style={S}>
              What engineers say.
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className="border border-[#1A1A1A] p-6 hover:border-[#003B00] transition-colors"
                style={{ background: "#080808" }}
              >
                <div className="flex gap-0.5 mb-4">
                  {Array(5)
                    .fill(0)
                    .map((_, j) => (
                      <span key={j} className="text-[#00FF41] text-xs">
                        ★
                      </span>
                    ))}
                </div>
                <p
                  className="text-xs text-[#3D6B3D] leading-relaxed mb-5"
                  style={M}
                >
                  <span className="text-[#1F3D1F]">/* </span>
                  {t.quote}
                  <span className="text-[#1F3D1F]"> */</span>
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#1A1A1A]">
                  <div
                    className="w-8 h-8 border border-[#003B00] flex items-center justify-center text-[10px] font-bold text-[#00FF41]"
                    style={M}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs text-[#7FBF7F]" style={M}>
                      {t.name}
                    </p>
                    <p className="text-[10px] text-[#1F3D1F]" style={M}>
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section
        id="pricing"
        className="relative z-10 py-20 px-8 border-t border-[#1A1A1A]"
      >
        <div className="max-w-5xl mx-auto">
          <div className="mb-12 text-center">
            <p
              className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-2"
              style={M}
            >
              // pricing.config
            </p>
            <h2 className="font-black text-4xl text-[#E8FFE8] mb-3" style={S}>
              Start free. Scale when ready.
            </h2>
            <p className="text-xs text-[#3D6B3D]" style={M}>
              // 50 free reviews every month, no credit card required
            </p>
          </div>
          <div className="grid grid-cols-3 gap-px bg-[#1A1A1A]">
            {[
              {
                name: "free",
                price: "$0",
                per: "",
                desc: "// for solo devs",
                features: [
                  "50 reviews/mo",
                  "500k tokens",
                  "1 workspace",
                  "github oauth",
                ],
                highlight: false,
              },
              {
                name: "pro",
                price: "$19",
                per: "/mo",
                desc: "// for serious devs",
                features: [
                  "500 reviews/mo",
                  "5M tokens",
                  "3 workspaces",
                  "webhook auto-review",
                  "priority support",
                ],
                highlight: true,
              },
              {
                name: "team",
                price: "$49",
                per: "/mo",
                desc: "// for engineering teams",
                features: [
                  "unlimited reviews",
                  "unlimited tokens",
                  "unlimited workspaces",
                  "custom ai rules",
                  "slack + email",
                ],
                highlight: false,
              },
            ].map((plan) => (
              <div
                key={plan.name}
                className="p-7 flex flex-col"
                style={{
                  background: plan.highlight
                    ? "rgba(0,255,65,0.03)"
                    : "#080808",
                  outline: plan.highlight
                    ? "1px solid rgba(0,255,65,0.2)"
                    : "none",
                  outlineOffset: "-1px",
                }}
              >
                <p
                  className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-1"
                  style={M}
                >
                  {plan.name}
                </p>
                <div className="flex items-end gap-1 mb-1">
                  <span
                    className="text-4xl font-bold text-[#E8FFE8]"
                    style={{
                      ...M,
                      textShadow: plan.highlight
                        ? "0 0 20px rgba(0,255,65,0.3)"
                        : "none",
                    }}
                  >
                    {plan.price}
                  </span>
                  <span className="text-[#3D6B3D] text-sm mb-1" style={M}>
                    {plan.per}
                  </span>
                </div>
                <p className="text-[10px] text-[#1F3D1F] mb-6" style={M}>
                  {plan.desc}
                </p>
                <ul className="space-y-2 flex-1 mb-7">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-xs text-[#3D6B3D]"
                      style={M}
                    >
                      <span className="text-[#00FF41]">+</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/login"
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-all border"
                  style={
                    plan.highlight
                      ? {
                          ...M,
                          background: "#00FF41",
                          color: "#050505",
                          borderColor: "#00FF41",
                        }
                      : {
                          ...M,
                          background: "transparent",
                          color: "#00FF41",
                          borderColor: "#003B00",
                        }
                  }
                >
                  $ ./install_{plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 py-20 px-8 border-t border-[#1A1A1A]">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="border border-[#003B00] p-16 relative"
            style={{ background: "rgba(0,255,65,0.02)" }}
          >
            {/* Corner decorations */}
            {[
              "top-0 left-0",
              "top-0 right-0",
              "bottom-0 left-0",
              "bottom-0 right-0",
            ].map((pos) => (
              <div
                key={pos}
                className={`absolute ${pos} w-4 h-4 border-[#00FF41]`}
                style={{
                  borderTopWidth: pos.includes("top") ? "2px" : "0",
                  borderBottomWidth: pos.includes("bottom") ? "2px" : "0",
                  borderLeftWidth: pos.includes("left") ? "2px" : "0",
                  borderRightWidth: pos.includes("right") ? "2px" : "0",
                }}
              />
            ))}
            <p
              className="text-[10px] text-[#00FF41] uppercase tracking-widest mb-4"
              style={M}
            >
              // ready to deploy?
            </p>
            <h2 className="font-black text-5xl text-[#E8FFE8] mb-4" style={S}>
              Ship better code.
              <br />
              <span
                style={{
                  color: "#00FF41",
                  textShadow: "0 0 30px rgba(0,255,65,0.4)",
                }}
              >
                Starting now.
              </span>
            </h2>
            <p className="text-xs text-[#3D6B3D] mb-10" style={M}>
              {"// join engineers who catch bugs before they reach production"}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-3 px-8 py-4 text-sm font-bold uppercase tracking-wider transition-all border border-[#00FF41] text-[#050505] bg-[#00FF41] hover:bg-transparent hover:text-[#00FF41]"
              style={{ ...M, boxShadow: "0 0 30px rgba(0,255,65,0.2)" }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
              $ ./start --free --github
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#1A1A1A] py-8 px-8">
        <div
          className="max-w-6xl mx-auto flex items-center justify-between text-[10px] text-[#1F3D1F]"
          style={M}
        >
          <span>
            <span className="text-[#00FF41]">ReviewIQ</span> — built with Claude
            AI, Next.js 14, PostgreSQL
          </span>
          <span className="text-[#00FF41] animate-blink">█</span>
          <div className="flex items-center gap-6">
            {["privacy", "terms", "github"].map((t) => (
              <a
                key={t}
                href="#"
                className="hover:text-[#3D6B3D] transition-colors"
              >
                ~/{t}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
