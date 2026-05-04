import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { runRepoReview } from "@/lib/repo-review";
import { z } from "zod";

const Schema = z.object({ repositoryId: z.string() });

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = Schema.safeParse(await req.json());
  if (!body.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const repo = await db.repository.findUnique({
    where: { id: body.data.repositoryId },
    include: {
      workspace: { include: { owner: { select: { githubToken: true } } } },
    },
  });

  if (!repo)
    return NextResponse.json(
      { error: "Repository not found" },
      { status: 404 },
    );

  const token = repo.workspace.owner.githubToken;
  if (!token)
    return NextResponse.json({ error: "No GitHub token" }, { status: 400 });

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      try {
        const result = await runRepoReview(
          repo.fullName,
          repo.defaultBranch,
          token,
          (msg) => send({ progress: msg }),
        );

        send({ done: true, result });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Review failed";
        send({ error: message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
