import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

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
    security: { score: number; summary: string };
    performance: { score: number; summary: string };
    maintainability: { score: number; summary: string };
    testCoverage: { score: number; summary: string };
    documentation: { score: number; summary: string };
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

const IMPORTANT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".py",
  ".go",
  ".rs",
  ".java",
  ".rb",
  ".php",
  ".cs",
  ".cpp",
  ".c",
  ".swift",
  ".kt",
]);

const SKIP_PATTERNS = [
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "coverage",
  "__pycache__",
  ".venv",
  "vendor",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
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
    ts: "TypeScript",
    tsx: "TypeScript",
    js: "JavaScript",
    jsx: "JavaScript",
    py: "Python",
    go: "Go",
    rs: "Rust",
    java: "Java",
    rb: "Ruby",
    php: "PHP",
    cs: "C#",
    cpp: "C++",
    c: "C",
    swift: "Swift",
    kt: "Kotlin",
  };
  return map[ext] ?? ext.toUpperCase();
}

// ─── Priority scoring — higher priority = read first ─────────────────────────
function getFilePriority(path: string): number {
  const p = path.toLowerCase();

  // Highest priority — core business logic
  if (p.includes("route") || p.includes("routes")) return 0;
  if (p.includes("api/")) return 0;
  if (p.includes("service") || p.includes("services")) return 1;
  if (p.includes("lib/") || p.includes("utils/")) return 2;
  if (p.includes("middleware")) return 2;
  if (p.includes("auth") || p.includes("jwt")) return 2;
  if (p.includes("db") || p.includes("database")) return 2;
  if (p.includes("model") || p.includes("schema")) return 3;
  if (p.includes("controller") || p.includes("handler")) return 3;
  if (p.includes("hook") || p.includes("hooks")) return 4;
  if (p.includes("context")) return 4;
  if (p.includes("component") || p.includes("components")) return 5;
  if (p.includes("page") || p.includes("pages")) return 5;
  if (p.includes("test") || p.includes("spec")) return 6;
  if (p.includes("type") || p.includes("types")) return 7;
  if (p.includes("config")) return 7;
  if (p.includes("constant") || p.includes("constants")) return 8;
  if (p.includes("style") || p.includes("css")) return 9;

  return 6; // default
}

export async function fetchRepoTree(
  fullName: string,
  branch: string,
  token: string,
): Promise<{ path: string; type: string; size: number; sha: string }[]> {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/git/trees/${branch}?recursive=1`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );
  if (!res.ok) throw new Error(`GitHub tree API error: ${res.status}`);
  const data = await res.json();
  return data.tree ?? [];
}

async function fetchFileContent(
  fullName: string,
  path: string,
  token: string,
): Promise<string> {
  const res = await fetch(
    `https://api.github.com/repos/${fullName}/contents/${path}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    },
  );
  if (!res.ok) return "";
  const data = await res.json();
  if (data.encoding === "base64" && data.content) {
    return Buffer.from(data.content, "base64").toString("utf-8");
  }
  return "";
}

export async function runRepoReview(
  fullName: string,
  branch: string,
  token: string,
  onProgress?: (msg: string) => void,
): Promise<RepoReviewResult> {
  onProgress?.(`[INIT] Fetching repository tree for ${fullName}...`);

  const tree = await fetchRepoTree(fullName, branch, token);

  // Filter to source files only
  const codeFiles = tree
    .filter(
      (f) =>
        f.type === "blob" &&
        !shouldSkip(f.path) &&
        isCodeFile(f.path) &&
        f.size < 100000,
    )
    .slice(0, 50); // keep top 50 candidates

  onProgress?.(`[OK] Found ${codeFiles.length} source files`);

  // ── PRIORITY SORT — most important files first ──────────────────────────────
  const prioritized = [...codeFiles].sort((a, b) => {
    const pa = getFilePriority(a.path);
    const pb = getFilePriority(b.path);
    if (pa !== pb) return pa - pb;
    // Within same priority — prefer smaller files (more focused code)
    return a.size - b.size;
  });

  const languages: Record<string, number> = {};
  for (const f of codeFiles) {
    const lang = getLanguage(f.path);
    languages[lang] = (languages[lang] ?? 0) + 1;
  }

  // Read top 8 prioritized files
  const filesToRead = prioritized.slice(0, 8);

  onProgress?.(`[SCAN] Reading ${filesToRead.length} priority files:`);
  filesToRead.forEach((f, i) => {
    onProgress?.(`[FILE] ${String(i + 1).padStart(2, "0")}. ${f.path}`);
  });

  const fileContents: RepoFile[] = [];
  for (const f of filesToRead) {
    const content = await fetchFileContent(fullName, f.path, token);
    if (content) {
      fileContents.push({
        path: f.path,
        content: content.slice(0, 1500), // truncate to stay under token limit
        size: f.size,
      });
    }
  }

  const totalLines = fileContents.reduce(
    (sum, f) => sum + f.content.split("\n").length,
    0,
  );

  onProgress?.(`[AI] Sending ${fileContents.length} files to Llama 3.3 70B...`);

  const filesSummary = fileContents
    .map((f) => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
    .join("\n\n");

  const prompt = `You are ReviewIQ performing a comprehensive code quality audit of: ${fullName}

Repository stats:
- Source files found: ${codeFiles.length}
- Files analyzed: ${fileContents.length} (highest priority selected)
- Languages: ${Object.entries(languages)
    .map(([l, c]) => `${l}(${c})`)
    .join(", ")}
- Total lines sampled: ${totalLines}
- Priority order: API routes → Services → Lib/Utils → Middleware → Models → Components

Files analyzed (in priority order):
${filesSummary}

Return ONLY valid JSON. No markdown. No backticks. No explanation. Raw JSON only:
{
  "overallScore": number between 0 and 100,
  "healthGrade": "A" or "B" or "C" or "D" or "F",
  "summary": "3-5 sentence executive summary of codebase quality",
  "categories": {
    "security":        { "score": number, "summary": "2 sentence assessment" },
    "performance":     { "score": number, "summary": "2 sentence assessment" },
    "maintainability": { "score": number, "summary": "2 sentence assessment" },
    "testCoverage":    { "score": number, "summary": "2 sentence assessment" },
    "documentation":   { "score": number, "summary": "2 sentence assessment" }
  },
  "criticalIssues": [
    {
      "severity": "CRITICAL" or "HIGH" or "MEDIUM" or "LOW",
      "category": "SECURITY" or "PERFORMANCE" or "MAINTAINABILITY" or "BUG" or "STYLE" or "DOCUMENTATION" or "TEST_COVERAGE",
      "title": "short title",
      "description": "clear description",
      "suggestion": "concrete fix",
      "filePath": "path or null"
    }
  ],
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "recommendations": ["rec 1", "rec 2", "rec 3", "rec 4"]
}`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 2048,
  });

  const text = completion.choices[0]?.message?.content ?? "";

  onProgress?.(`[OK] Analysis complete`);

  const clean = text.replace(/```json\n?|```/g, "").trim();
  const result = JSON.parse(clean) as Omit<RepoReviewResult, "stats">;

  return {
    ...result,
    stats: { totalFiles: codeFiles.length, totalLines, languages },
  };
}
