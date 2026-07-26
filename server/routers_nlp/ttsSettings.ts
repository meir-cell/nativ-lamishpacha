import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { ttsSettings } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import jwt from "jsonwebtoken";
import type { User } from "../../drizzle/schema";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

/** Verify admin access — by secret, owner token, or OAuth admin user */
function checkAdmin(input: { adminSecret?: string; ownerToken?: string }, user?: User | null) {
  // Method 1: OAuth admin user
  if (user && user.role === "admin") {
    return;
  }

  // Method 2: ADMIN_SECRET
  const secret = process.env.ADMIN_SECRET;
  if (secret && input.adminSecret && input.adminSecret === secret) {
    return;
  }

  // Method 3: Owner token (registration JWT with owner email)
  if (input.ownerToken) {
    try {
      const payload = jwt.verify(input.ownerToken, JWT_SECRET) as { id: number; email: string };
      const ownerEmail = process.env.OWNER_EMAIL || "";
      if (ownerEmail && payload.email && payload.email.toLowerCase() === ownerEmail.toLowerCase()) {
        return;
      }
    } catch {
      // Token invalid, fall through
    }
  }

  throw new TRPCError({ code: "UNAUTHORIZED", message: "גישה אסורה" });
}

const DEFAULT_SETTINGS = {
  rate: 0.88,
  pitch: 1.02,
  sentencePause: 220,
  commaPause: 100,
  prefixPause: 180,
  mergeSpacedLetters: true,
  stripNikudForTts: true,
  provider: "openai" as "browser" | "openai",
  voice: "nova",
  model: "tts-1" as "tts-1" | "tts-1-hd",
  openaiSpeed: 1.0,
};

export const ttsSettingsRouter = router({
  /** Get current TTS settings (public — used by all clients) */
  get: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return DEFAULT_SETTINGS;
    const rows = await db.select().from(ttsSettings).where(eq(ttsSettings.id, 1));
    if (rows.length === 0) return DEFAULT_SETTINGS;
    const row = rows[0];
    return {
      rate: parseFloat(row.rate),
      pitch: parseFloat(row.pitch),
      sentencePause: row.sentencePause,
      commaPause: row.commaPause,
      prefixPause: row.prefixPause,
      mergeSpacedLetters: row.mergeSpacedLetters === 1,
      stripNikudForTts: row.stripNikudForTts === 1,
      provider: (row.provider || "openai") as "browser" | "openai",
      voice: row.voice || "nova",
      model: (row.model || "tts-1") as "tts-1" | "tts-1-hd",
      openaiSpeed: parseFloat(row.openaiSpeed || "1.0"),
    };
  }),

  /** Update TTS settings (admin only — uses adminSecret or ownerToken) */
  update: publicProcedure
    .input(
      z.object({
        adminSecret: z.string().optional(),
        ownerToken: z.string().optional(),
        rate: z.number().min(0.5).max(2.0),
        pitch: z.number().min(0.5).max(2.0),
        sentencePause: z.number().int().min(50).max(1000),
        commaPause: z.number().int().min(30).max(500),
        prefixPause: z.number().int().min(50).max(500),
        mergeSpacedLetters: z.boolean(),
        stripNikudForTts: z.boolean(),
        provider: z.enum(["browser", "openai"]),
        voice: z.string().min(1).max(30),
        model: z.enum(["tts-1", "tts-1-hd"]),
        openaiSpeed: z.number().min(0.25).max(4.0),
      })
    )
    .mutation(async ({ input, ctx }) => {
      checkAdmin(input, ctx.user);
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { adminSecret, ownerToken, ...settings } = input;

      // Upsert — update the single row or insert if missing
      const existing = await db.select().from(ttsSettings).where(eq(ttsSettings.id, 1));
      if (existing.length === 0) {
        await db.insert(ttsSettings).values({
          id: 1,
          rate: settings.rate.toString(),
          pitch: settings.pitch.toString(),
          sentencePause: settings.sentencePause,
          commaPause: settings.commaPause,
          prefixPause: settings.prefixPause,
          mergeSpacedLetters: settings.mergeSpacedLetters ? 1 : 0,
          stripNikudForTts: settings.stripNikudForTts ? 1 : 0,
          provider: settings.provider,
          voice: settings.voice,
          model: settings.model,
          openaiSpeed: settings.openaiSpeed.toString(),
        });
      } else {
        await db
          .update(ttsSettings)
          .set({
            rate: settings.rate.toString(),
            pitch: settings.pitch.toString(),
            sentencePause: settings.sentencePause,
            commaPause: settings.commaPause,
            prefixPause: settings.prefixPause,
            mergeSpacedLetters: settings.mergeSpacedLetters ? 1 : 0,
            stripNikudForTts: settings.stripNikudForTts ? 1 : 0,
            provider: settings.provider,
            voice: settings.voice,
            model: settings.model,
            openaiSpeed: settings.openaiSpeed.toString(),
          })
          .where(eq(ttsSettings.id, 1));
      }
      return { success: true };
    }),
});
