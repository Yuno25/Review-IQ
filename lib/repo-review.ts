import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RepoFile {
  path: string;
  content: string;
  size: number;
}

export interface RepoReviewResult {
  overallScore: number;
  summary: string;
  healthGrade: "A" | "B" | "C" | "D" | "F";
  stats: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
  };
  categories: {
    security:        { score: number; summary: string };
    performance:     { score: number; summary: string };
    maintainability: { score: number; summary: string };
    testCoverage:    { score: number; summary: string };
    documentation:   { score: number; summary: string };
  };
  criticalIssues: {
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
    category: string;
    title: string;
    description: string;
    suggestion: string;
    filePath?: string;
  }[];
  strengths: string[];
  recommendations: string[];
}

// ─── Fetch repo file tree from GitHub ────────────────────────────────────────

export async function fetchRepoTree(
  fullName: string,
  branch: string,
  token: string
): Promise<{ path: string; type: string; size: number; sha: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) throw new Error(`GitHub tree API error: ${res.status}`);
  const data = await res.json();
  return data.tree ?? [];
}

// ─── Fetch file content ───────────────────────────────────────────────────────

async function fetchFileContent(
  fullName: string,
  path: string,
  token: string
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github.v3+json" } }
  );
  if (!res.ok) return "";
  const data = await res.json();
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return "";
}

// ─── Pick important files to review ──────────────────────────────────────────

const IMPORTANT_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java",
  ".rb", ".php", ".cs", ".cpp", ".c", ".swift", ".kt",
]);

const SKIP_PATTERNS = [
  "node_modules", ".next", "dist", "build", ".git",
  "coverage", "__pycache__", ".venv", "vendor",
  "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
];

function shouldSkip(path: string): boolean {
  return SKIP_PATTERNS.some((p) => path.includes(p));
}

function isCodeFile(path: string): boolean {
  const ext = "." + path.split(".").pop()?.toLowerCase();
  return IMPORTANT_EXTENSIONS.has(ext);
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "unknown";
  const map: Record<string, string> = {
    ts: "TypeScript", tsx: "TypeScript", js: "JavaScript", jsx: "JavaScript",
    py: "Python", go: "Go", rs: "Rust", java: "Java", rb: "Ruby",
    php: "PHP", cs: "C#", cpp: "C++", c: "C", swift: "Swift", kt: "Kotlin",
  };
  return map[ext] ?? ext.toUpperCase();
}

// ─── Main repo review function ────────────────────────────────────────────────

export async function runRepoReview(
  fullName: string,
  branch: string,
  token: string,
  onProgress?: (msg: string) => void
): Promise<RepoReviewResult> {

  onProgress?.(`[INIT] Fetching repository tree for ${fullName}...`);

  // Get file tree
  const tree = await fetchRepoTree(fullName, branch, token);
  const codeFiles = tree
    .filter((f) => f.type === "blob" && !shouldSkip(f.path) && isCodeFile(f.path) && f.size < 100000)
    .slice(0, 30); // Max 30 files

  onProgress?.(`[OK] Found ${codeFiles.length} source files to analyze`);

  // Count languages
  const languages: Record<string, number> = {};
  for (const f of codeFiles) {
    const lang = getLanguage(f.path);
    languages[lang] = (languages[lang] ?? 0) + 1;
  }

  // Fetch file contents (batch of 15 most important)
  const filesToRead = codeFiles.slice(0, 15);
  onProgress?.(`[SCAN] Reading ${filesToRead.length} key files...`);

  const fileContents: RepoFile[] = [];
  for (const f of filesToRead) {
    const content = await fetchFileContent(fullName, f.path, token);
    if (content) {
      fileContents.push({ path: f.path, content: content.slice(0, 3000), size: f.size });
    }
  }

  // Count total lines
  const totalLines = fileContents.reduce((sum, f) => sum + f.content.split("\n").length, 0);

  onProgress?.(`[AI] Sending to Claude Opus 4 for analysis...`);

  // Build prompt
  const filesSummary = fileContents.map((f) =>
    `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``
  ).join("\n\n");

  const prompt = `You are ReviewIQ performing a comprehensive code quality audit of the repository: ${fullName}

Repository stats:
- Files analyzed: ${fileContents.length}
- Languages: ${Object.entries(languages).map(([l, c]) => `${l}(${c})`).join(", ")}
- Total lines sampled: ${totalLines}

Source files:
${filesSummary}

Perform a thorough code quality audit and return ONLY valid JSON matching this exact schema:
{
  "overallScore": number (0-100),
  "healthGrade": "A" | "B" | "C" | "D" | "F",
  "summary": "3-5 sentence executive summary of the codebase quality",
  "categories": {
    "security":        { "score": number, "summary": "2 sentence assessment" },
    "performance":     { "score": number, "summary": "2 sentence assessment" },
    "maintainability": { "score": number, "summary": "2 sentence assessment" },
    "testCoverage":    { "score": number, "summary": "2 sentence assessment" },
    "documentation":   { "score": number, "summary": "2 sentence assessment" }
  },
  "criticalIssues": [
    {
      "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW",
      "category": "SECURITY"|"PERFORMANCE"|"MAINTAINABILITY"|"BUG"|"STYLE"|"DOCUMENTATION"|"TEST_COVERAGE",
      "title": "short title",
      "description": "clear description",
      "suggestion": "concrete fix",
      "filePath": "path/to/file or null"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3", "recommendation 4"]
}

Be thorough, specific, and actionable. Return JSON only.`;

  const response = await anthropic.messages.create({
    model: "claude-opus-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  onProgress?.(`[OK] Analysis complete`);

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => (b as any).text)
    .join("");

  const clean = text.replace(/```json\n?|```/g, "").trim();
  const result = JSON.parse(clean) as Omit<RepoReviewResult, "stats">;

  return {
    ...result,
    stats: { totalFiles: codeFiles.length, totalLines, languages },
  };
}