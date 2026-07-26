/**
 * Heartbeat handler: 7-day re-engagement email.
 *
 * Triggered daily via project-level Heartbeat cron.
 * Finds all students who:
 *   1. Opted in to emails (emailOptIn = true)
 *   2. Have not received the re-engagement email yet (reEngagementEmailSent = false)
 *   3. Have a lastActivityAt that is between 7 and 30 days ago
 *      (or, if lastActivityAt is null, use createdAt as proxy)
 *
 * Sends one re-engagement email per eligible student and marks the flag.
 *
 * Mount in server/_core/index.ts:
 *   app.post("/api/scheduled/re-engagement", reEngagementHandler);
 */

import type { Request, Response } from "express";
import { getDb } from "../db";
import { registrations, lessonPositions, lessonProgress } from "../../drizzle/schema";
import { eq, and, isNull, or, lte, gte, not } from "drizzle-orm";
import { sdk } from "../_core/sdk";
import { sendEmail, buildReEngagementEmail } from "../_core/email";
// Minimal lesson title lookup — IDs and titles mirror client/src/lib/courseData.ts
const LESSON_TITLES: Record<number, string> = {
  1: "מבוא ל-NLP — מה זה ואיך זה עובד",
  2: "מפת המציאות — כיצד אנו תופסים את העולם",
  3: "מערכת הייצוג החושית (VAK)",
  4: "עוגנים — Anchoring",
  5: "כיוון מחדש — Reframing",
  6: "מצבים פנימיים ושליטה עצמית",
  7: "מטא-מודל — שפה ותקשורת",
  8: "מילטון-מודל — שפה היפנוטית",
  9: "קו הזמן — Timeline Therapy",
  10: "חלקים פנימיים — Parts Integration",
  11: "מטרות ותוצאות — Well-Formed Outcomes",
  12: "שינוי אמונות — Belief Change",
};

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function reEngagementHandler(req: Request, res: Response) {
  try {
    // Authenticate as cron-only
    const user = await sdk.authenticateRequest(req);
    if (!user.isCron) {
      return res.status(403).json({ error: "cron-only" });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database unavailable" });
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - SEVEN_DAYS_MS);
    const thirtyDaysAgo = new Date(now.getTime() - THIRTY_DAYS_MS);

    // Fetch all opted-in students who haven't received re-engagement email
    const candidates = await db
      .select()
      .from(registrations)
      .where(
        and(
          eq(registrations.emailOptIn, true),
          eq(registrations.reEngagementEmailSent, false)
        )
      );

    let sent = 0;
    let skipped = 0;

    for (const reg of candidates) {
      // Determine last activity: use lastActivityAt if set, else createdAt
      const lastActivity = reg.lastActivityAt ?? reg.createdAt;

      // Only send if last activity was between 7 and 30 days ago
      if (lastActivity > sevenDaysAgo || lastActivity < thirtyDaysAgo) {
        skipped++;
        continue;
      }

      // Find last lesson the student was viewing
      const [position] = await db
        .select()
        .from(lessonPositions)
        .where(eq(lessonPositions.registrationId, reg.id))
        .limit(1);

      let lastLessonTitle = "השיעור האחרון";
      if (position) {
        const lessonTitle = LESSON_TITLES[position.lessonId];
        if (lessonTitle) lastLessonTitle = lessonTitle;
      }

      // Build site URL from env
      const siteUrl = process.env.SITE_URL || "https://nlpcourse-5wedavl3.manus.space";

      if (!reg.unsubscribeToken) {
        skipped++;
        continue;
      }

      // Build direct link to the last lesson viewed (with slide index if available)
      let resumeUrl = siteUrl;
      if (position) {
        resumeUrl = `${siteUrl}?lesson=${position.lessonId}&slide=${position.slideIndex}`;
      }

      const { subject, html, text } = buildReEngagementEmail({
        fullName: reg.fullName,
        siteUrl,
        resumeUrl,
        lastLessonTitle,
        unsubscribeToken: reg.unsubscribeToken,
      });

      const emailSent = await sendEmail({ to: reg.email, subject, html, text });

      if (emailSent) {
        await db
          .update(registrations)
          .set({ reEngagementEmailSent: true })
          .where(eq(registrations.id, reg.id));
        sent++;
      } else {
        skipped++;
      }
    }

    return res.json({
      ok: true,
      processed: candidates.length,
      sent,
      skipped,
      timestamp: now.toISOString(),
    });
  } catch (err) {
    console.error("[reEngagement] Handler error:", err);
    return res.status(500).json({
      error: String(err),
      timestamp: new Date().toISOString(),
    });
  }
}
