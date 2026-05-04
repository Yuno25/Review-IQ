import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { z } from "zod";

const Schema = z.object({
  githubRepoId: z.number(),
  fullName: z.string(),
  name: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  language: z.string().nullable(),
  workspaceId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Schema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const data = body.data;

  // Verify user belongs to workspace
  const membership = await db.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: data.workspaceId,
        userId: session.userId,
      },
    },
  });
  if (!membership)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Upsert repo
  const repo = await db.repository.upsert({
    where: { githubRepoId: data.githubRepoId },
    create: {
      workspaceId: data.workspaceId,
      githubRepoId: data.githubRepoId,
      fullName: data.fullName,
      name: data.name,
      private: data.private,
      defaultBranch: data.defaultBranch,
      language: data.language,
    },
    update: {
      fullName: data.fullName,
      defaultBranch: data.defaultBranch,
      language: data.language,
    },
  });

  return NextResponse.json({ ok: true, repoId: repo.id });
}
