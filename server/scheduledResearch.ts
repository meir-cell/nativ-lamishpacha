/**
 * POST /api/scheduled/lesson-research
 *
 * Called by the AGENT cron after it finishes researching new NLP content.
 * The agent POSTs a JSON array of proposed lesson updates.
 * This handler validates, stores them as "pending", and logs the run.
 */
import type { Request, Response } from "express";
import { sdk } from "./_core/sdk";
import { insertLessonUpdates, logResearchRun } from "./db";
import { type InsertLessonUpdate } from "../drizzle/schema";

interface ProposedUpdate {
  lessonId: number;
  updateType: "section" | "keyPoint" | "exercise";
  title: string;
  body?: string;
  highlight?: string;
  source?: string;
  sourceUrl?: string;
}

export async function lessonResearchHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron request
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only endpoint" });
    }

    const { updates, summary } = req.body as {
      updates: ProposedUpdate[];
      summary?: string;
    };

    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: "updates must be an array" });
    }

    // Validate and filter
    const valid: InsertLessonUpdate[] = updates
      .filter(u =>
        typeof u.lessonId === "number" &&
        u.lessonId >= 1 && u.lessonId <= 12 &&
        ["section", "keyPoint", "exercise"].includes(u.updateType) &&
        typeof u.title === "string" && u.title.trim().length > 0
      )
      .map(u => ({
        lessonId: u.lessonId,
        updateType: u.updateType,
        title: u.title.trim().slice(0, 500),
        body: u.body?.trim() ?? null,
        highlight: u.highlight?.trim().slice(0, 500) ?? null,
        source: u.source?.trim() ?? null,
        sourceUrl: u.sourceUrl?.trim().slice(0, 1000) ?? null,
        status: "pending" as const,
        researchedAt: new Date(),
      }));

    await insertLessonUpdates(valid);

    await logResearchRun({
      taskUid: user.taskUid ?? undefined,
      updatesSubmitted: valid.length,
      summary: summary ?? `${valid.length} updates submitted`,
      status: valid.length > 0 ? "success" : "partial",
    });

    console.log(`[ResearchCron] Received ${valid.length} updates (${updates.length - valid.length} invalid)`);
    return res.json({ ok: true, stored: valid.length });

  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : String(err);
    console.error("[ResearchCron] Handler error:", error);

    await logResearchRun({
      updatesSubmitted: 0,
      error,
      status: "failed",
    }).catch(() => {});

    return res.status(500).json({
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
