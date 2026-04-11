import { Github, Zap } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "Sign In | ReviewIQ" };

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; callbackUrl?: string };
}) {
  const errorMessages: Record<string, string> = {
    missing_params: "Something went wrong. Please try again.",
    invalid_state: "Session expired. Please try again.",
    auth_failed: "Authentication failed. Please try again.",
  };

  return (
    <div className="min-h-screen bg-surface-base bg-grid flex items-center justify-center p-4">
      {/* Glow blob */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-brand-gradient flex items-center justify-center shadow-glow mb-4">
            <Zap className="w-6 h-6 text-black" strokeWidth={2.5} />
          </div>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Review<span className="text-gradient">AI</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            AI-powered code review for your team
          </p>
        </div>

        {/* Card */}
        <div className="card p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-semibold text-text-primary">
              Welcome back
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Sign in with your GitHub account
            </p>
          </div>

          {searchParams.error && (
            <div className="p-3 rounded-md bg-danger-muted border border-danger/20 text-sm text-danger text-center">
              {errorMessages[searchParams.error] ?? "An error occurred."}
            </div>
          )}

          <Link
            href="/api/auth/login"
            className="flex items-center justify-center gap-3 w-full py-2.5 px-4 rounded-md bg-[#238636] hover:bg-[#2ea043] text-white text-sm font-medium transition-colors"
          >
            <Github className="w-4 h-4" />
            Continue with GitHub
          </Link>

          <p className="text-xs text-text-muted text-center leading-relaxed">
            By signing in, you agree to our{" "}
            <a href="#" className="text-brand hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="text-brand hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          Powered by <span className="text-brand font-mono">Claude AI</span>
        </p>
      </div>
    </div>
  );
}
