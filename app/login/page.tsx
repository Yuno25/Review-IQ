import Link from "next/link";

export const metadata = { title: "Sign In | ReviewIQ" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errors: Record<string, string> = {
    missing_params: "ERR: missing oauth parameters",
    invalid_state: "ERR: session expired — retry",
    auth_failed: "ERR: authentication failed",
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Grid bg */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#00FF41 1px, transparent 1px), linear-gradient(90deg, #00FF41 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scanlines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        }}
      />

      {/* Glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(0,255,65,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative w-full max-w-sm"
        style={{ fontFamily: "'JetBrains Mono', monospace" }}
      >
        {/* Window top bar */}
        <div className="border border-b-0 border-[#1A1A1A] px-4 py-2 flex items-center gap-2 bg-[#0A0A0A]">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#FF3333]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#FFB800]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FF41]/60" />
          </div>
          <span className="text-[10px] text-[#1F3D1F] ml-2">
            reviewiq — auth terminal
          </span>
        </div>

        {/* Main panel */}
        <div className="border border-[#1A1A1A] p-8 bg-[#080808]">
          {/* Logo */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-1 text-[10px]">
              <span className="text-[#00FF41]">[SYSTEM]</span>
              <span className="text-[#1F3D1F]">v1.0.0 initialized</span>
            </div>
            <h1
              className="text-4xl font-black text-[#00FF41] leading-none"
              style={{
                fontFamily: "Playfair Display, Georgia, serif",
                textShadow: "0 0 30px rgba(0,255,65,0.4)",
              }}
            >
              ReviewIQ
            </h1>
            <p className="text-[#1F3D1F] text-[10px] mt-2">
              // AI-powered code review terminal
            </p>
          </div>

          {/* Boot messages */}
          <div className="mb-6 space-y-1 text-[10px]">
            {[
              {
                status: "[OK]   ",
                msg: "Claude Opus 4 engine loaded",
                ok: true,
              },
              { status: "[OK]   ", msg: "GitHub integration ready", ok: true },
              {
                status: "[OK]   ",
                msg: "PostgreSQL connection established",
                ok: true,
              },
              {
                status: "[WAIT] ",
                msg: "Awaiting authentication...",
                ok: false,
              },
            ].map((line, i) => (
              <div key={i} className="flex items-center gap-3">
                <span
                  style={{
                    color: line.ok ? "#00FF41" : "#FFB800",
                    minWidth: "52px",
                  }}
                >
                  {line.status}
                </span>
                <span style={{ color: "#3D6B3D" }}>{line.msg}</span>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-[#1A1A1A] mb-6" />

          {/* Error */}
          {searchParams.error && (
            <div className="mb-4 px-3 py-2 border border-[#FF3333]/30 bg-[#3D0000]/50 text-[#FF3333] text-[10px]">
              {errors[searchParams.error] ?? "ERR: unknown error"}
            </div>
          )}

          {/* Prompt line */}
          <div className="mb-4 text-[10px] text-[#3D6B3D]">
            <span className="text-[#00FF41]">$</span> authenticate
            --provider=github
          </div>

          {/* GitHub button — using className defined in globals.css */}
          <Link href="/api/auth/login" className="gh-login-btn">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            $ login --with github
          </Link>

          <p className="mt-4 text-[10px] text-[#1F3D1F] text-center">
            // free tier: 50 reviews/month · no credit card
          </p>
        </div>

        {/* Window bottom bar */}
        <div className="border border-t-0 border-[#1A1A1A] px-4 py-2 flex justify-between text-[10px] text-[#1F3D1F] bg-[#050505]">
          <span>reviewiq.dev</span>
          <span className="text-[#00FF41] animate-pulse">█</span>
        </div>
      </div>
    </div>
  );
}
