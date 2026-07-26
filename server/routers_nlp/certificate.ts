// Certificate router: check completion, generate PDF certificate, list certificates
// Uses puppeteer to render an HTML template to PDF, uploads to S3, saves to DB.

import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { registrations, moduleExamResults, certificates } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { storagePut } from "../storage";

/** Total number of modules in the course */
const TOTAL_MODULES = 5;

/** Helper: look up a registration by token, throw if not found */
async function getRegByToken(token: string) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  const rows = await db.select().from(registrations).where(eq(registrations.token, token)).limit(1);
  if (rows.length === 0) throw new TRPCError({ code: "UNAUTHORIZED", message: "Token לא תקין" });
  return { db, reg: rows[0] };
}

/** Generate a unique certificate number like NLP-2026-00042 */
async function generateCertNumber(db: Awaited<ReturnType<typeof getDb>>): Promise<string> {
  if (!db) throw new Error("DB unavailable");
  const year = new Date().getFullYear();
  // Count existing certificates to get next sequence
  const rows = await db.select({ id: certificates.id }).from(certificates);
  const seq = String(rows.length + 1).padStart(5, "0");
  return `NLP-${year}-${seq}`;
}

/** Build the certificate HTML template */
function buildCertificateHtml(params: {
  fullName: string;
  totalHours: number;
  moduleCount: number;
  lessonCount: number;
  certNumber: string;
  issuedDate: string;
}): string {
  const { fullName, totalHours, moduleCount, lessonCount, certNumber, issuedDate } = params;

  return `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>תעודת הסמכה - NLP Practitioner</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;600;700;800;900&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Heebo', Arial, sans-serif;
    background: #fff;
    width: 297mm;
    height: 210mm;
    overflow: hidden;
    direction: rtl;
  }

  .certificate {
    width: 297mm;
    height: 210mm;
    background: linear-gradient(135deg, #fffdf5 0%, #fff9e6 40%, #fffdf5 100%);
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 14mm 20mm;
  }

  /* Outer border */
  .certificate::before {
    content: '';
    position: absolute;
    inset: 6mm;
    border: 3px solid #C9A84C;
    border-radius: 4px;
    pointer-events: none;
  }

  /* Inner border */
  .certificate::after {
    content: '';
    position: absolute;
    inset: 9mm;
    border: 1px solid rgba(201,168,76,0.45);
    border-radius: 2px;
    pointer-events: none;
  }

  /* Corner ornaments */
  .corner {
    position: absolute;
    width: 18mm;
    height: 18mm;
    color: #C9A84C;
    font-size: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
  }
  .corner-tl { top: 4mm; right: 4mm; }
  .corner-tr { top: 4mm; left: 4mm; transform: scaleX(-1); }
  .corner-bl { bottom: 4mm; right: 4mm; transform: scaleY(-1); }
  .corner-br { bottom: 4mm; left: 4mm; transform: scale(-1,-1); }

  .header-logo {
    font-size: 11px;
    font-weight: 700;
    color: #8a6d20;
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 3mm;
  }

  .title-main {
    font-size: 36px;
    font-weight: 900;
    color: #1a1a1a;
    text-align: center;
    line-height: 1.1;
    margin-bottom: 2mm;
  }

  .title-sub {
    font-size: 16px;
    font-weight: 400;
    color: #5a4a1a;
    text-align: center;
    margin-bottom: 6mm;
    letter-spacing: 1px;
  }

  .divider {
    width: 80mm;
    height: 2px;
    background: linear-gradient(to left, transparent, #C9A84C, transparent);
    margin: 0 auto 6mm;
  }

  .presented-to {
    font-size: 12px;
    color: #7a6a3a;
    text-align: center;
    margin-bottom: 2mm;
    font-weight: 400;
    letter-spacing: 2px;
  }

  .student-name {
    font-size: 32px;
    font-weight: 800;
    color: #1a1a1a;
    text-align: center;
    margin-bottom: 5mm;
    border-bottom: 2px solid #C9A84C;
    padding-bottom: 2mm;
    min-width: 120mm;
  }

  .completion-text {
    font-size: 13px;
    color: #3a3a3a;
    text-align: center;
    line-height: 1.7;
    max-width: 200mm;
    margin-bottom: 5mm;
  }

  .stats-row {
    display: flex;
    gap: 12mm;
    justify-content: center;
    margin-bottom: 7mm;
  }

  .stat-box {
    text-align: center;
    background: linear-gradient(135deg, rgba(201,168,76,0.12), rgba(201,168,76,0.06));
    border: 1px solid rgba(201,168,76,0.4);
    border-radius: 6px;
    padding: 3mm 6mm;
    min-width: 28mm;
  }

  .stat-value {
    font-size: 22px;
    font-weight: 900;
    color: #8a6d20;
    line-height: 1;
  }

  .stat-label {
    font-size: 9px;
    color: #7a6a3a;
    margin-top: 1mm;
    letter-spacing: 0.5px;
  }

  .footer-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    width: 100%;
    margin-top: auto;
    padding-top: 4mm;
    border-top: 1px solid rgba(201,168,76,0.3);
  }

  .signature-block {
    text-align: center;
    min-width: 55mm;
  }

  .signature-line {
    width: 50mm;
    height: 1px;
    background: #C9A84C;
    margin: 0 auto 1.5mm;
  }

  .signature-name {
    font-size: 11px;
    font-weight: 700;
    color: #1a1a1a;
  }

  .signature-title {
    font-size: 9px;
    color: #7a6a3a;
    margin-top: 0.5mm;
  }

  .cert-meta {
    text-align: center;
  }

  .cert-number {
    font-size: 9px;
    color: #9a8a5a;
    font-family: monospace;
    letter-spacing: 1px;
  }

  .cert-date {
    font-size: 10px;
    color: #5a4a1a;
    font-weight: 600;
    margin-top: 1mm;
  }

  .seal {
    width: 22mm;
    height: 22mm;
    border-radius: 50%;
    border: 2px solid #C9A84C;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05));
    text-align: center;
  }

  .seal-text {
    font-size: 7px;
    font-weight: 800;
    color: #8a6d20;
    letter-spacing: 0.5px;
    line-height: 1.3;
  }
</style>
</head>
<body>
<div class="certificate">
  <!-- Corner ornaments -->
  <div class="corner corner-tl">✦</div>
  <div class="corner corner-tr">✦</div>
  <div class="corner corner-bl">✦</div>
  <div class="corner corner-br">✦</div>

  <!-- Header -->
  <div class="header-logo">מכללת YNR — לימודי NLP</div>

  <div class="title-main">תעודת הסמכה</div>
  <div class="title-sub">NLP Practitioner — תכנות נוירו-לשוני</div>

  <div class="divider"></div>

  <div class="presented-to">מוענקת בגאווה ל</div>
  <div class="student-name">${fullName}</div>

  <div class="completion-text">
    על השלמה מוצלחת של קורס NLP Practitioner המלא,<br>
    הכולל ${moduleCount} מודולים, ${lessonCount} שיעורים ו-${totalHours} שעות לימוד,<br>
    ועמידה בכל המבחנים המסכמים בהצלחה.
  </div>

  <div class="stats-row">
    <div class="stat-box">
      <div class="stat-value">${totalHours}</div>
      <div class="stat-label">שעות לימוד</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${moduleCount}</div>
      <div class="stat-label">מודולים</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${lessonCount}</div>
      <div class="stat-label">שיעורים</div>
    </div>
  </div>

  <div class="footer-row">
    <div class="signature-block">
      <div class="signature-line"></div>
      <div class="signature-name">מאיר שמעון עשור</div>
      <div class="signature-title">NLP Trainer מוסמך | מכללת YNR</div>
    </div>

    <div class="cert-meta">
      <div class="cert-number">${certNumber}</div>
      <div class="cert-date">${issuedDate}</div>
    </div>

    <div class="seal">
      <div class="seal-text">מכללת<br>YNR<br>✦<br>מוסמך</div>
    </div>
  </div>
</div>
</body>
</html>`;
}

export const certificateRouter = router({
  /**
   * Check whether the student has passed all module exams.
   * Returns { allPassed: boolean, passedModules: number[] }
   */
  checkCompletion: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      // Get all passed exam results for this student (latest attempt per module)
      const results = await db
        .select()
        .from(moduleExamResults)
        .where(
          and(
            eq(moduleExamResults.registrationId, reg.id),
            eq(moduleExamResults.passed, true)
          )
        );

      // Unique module IDs that were passed
      const passedSet = new Set(results.map((r) => r.moduleId));
      const passedModules = Array.from(passedSet).sort((a, b) => a - b);
      const allPassed = passedModules.length >= TOTAL_MODULES;

      // Check if a certificate already exists for current completion level
      const existingCerts = await db
        .select()
        .from(certificates)
        .where(eq(certificates.registrationId, reg.id))
        .orderBy(desc(certificates.issuedAt))
        .limit(1);

      const latestCert = existingCerts[0] ?? null;

      return {
        allPassed,
        passedModules,
        passedCount: passedModules.length,
        totalModules: TOTAL_MODULES,
        latestCertificate: latestCert
          ? {
              id: latestCert.id,
              certNumber: latestCert.certNumber,
              pdfUrl: latestCert.pdfUrl,
              issuedAt: latestCert.issuedAt,
              totalHours: latestCert.totalHours,
              moduleCount: latestCert.moduleCount,
            }
          : null,
      };
    }),

  /**
   * Generate a PDF certificate for the student.
   * Requires all TOTAL_MODULES exams to be passed.
   * Returns the certificate record with PDF URL.
   */
  generateCertificate: publicProcedure
    .input(
      z.object({
        token: z.string(),
        /** Total learning hours to snapshot (passed from client based on courseData) */
        totalHours: z.number().int().min(1),
        /** Number of lessons completed to snapshot */
        lessonCount: z.number().int().min(1),
      })
    )
    .mutation(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      // Verify all modules passed
      const results = await db
        .select()
        .from(moduleExamResults)
        .where(
          and(
            eq(moduleExamResults.registrationId, reg.id),
            eq(moduleExamResults.passed, true)
          )
        );

      const passedSet = new Set(results.map((r) => r.moduleId));
      if (passedSet.size < TOTAL_MODULES) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `יש לעבור את כל ${TOTAL_MODULES} המבחנים המסכמים לפני קבלת תעודה`,
        });
      }

      const moduleCount = TOTAL_MODULES;
      const certNumber = await generateCertNumber(db);

      // Format Hebrew date
      const now = new Date();
      const issuedDate = now.toLocaleDateString("he-IL", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Build HTML
      const html = buildCertificateHtml({
        fullName: reg.fullName,
        totalHours: input.totalHours,
        moduleCount,
        lessonCount: input.lessonCount,
        certNumber,
        issuedDate,
      });

      // Generate PDF with puppeteer
      let pdfKey: string | null = null;
      let pdfUrl: string | null = null;

      try {
        const puppeteer = await import("puppeteer");
        const browser = await puppeteer.default.launch({
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--font-render-hinting=none",
          ],
        });

        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: "load", timeout: 30000 });

        const pdfBuffer = await page.pdf({
          format: "A4",
          landscape: true,
          printBackground: true,
          margin: { top: "0", right: "0", bottom: "0", left: "0" },
        });

        await browser.close();

        // Upload to S3
        const fileKey = `certificates/${reg.id}-${certNumber}.pdf`;
        const stored = await storagePut(fileKey, pdfBuffer, "application/pdf");
        pdfKey = stored.key;
        pdfUrl = stored.url;
      } catch (err) {
        console.error("[certificate] PDF generation failed:", err);
        // Re-throw so the client knows generation failed
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "יצירת ה-PDF נכשלה. אנא נסה שוב מאוחר יותר.",
        });
      }

      // Only save if we have a valid PDF URL
      if (!pdfUrl) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "לא ניתן ליצור את קובץ התעודה. אנא נסה שוב.",
        });
      }

      // Save certificate record to DB
      await db.insert(certificates).values({
        registrationId: reg.id,
        fullName: reg.fullName,
        totalHours: input.totalHours,
        moduleCount,
        lessonCount: input.lessonCount,
        certNumber,
        pdfKey: pdfKey ?? undefined,
        pdfUrl,
        emailSent: false,
      });

      // Fetch the newly created record
      const [cert] = await db
        .select()
        .from(certificates)
        .where(eq(certificates.certNumber, certNumber))
        .limit(1);

      return {
        success: true,
        certificate: {
          id: cert.id,
          certNumber: cert.certNumber,
          pdfUrl: cert.pdfUrl,
          issuedAt: cert.issuedAt,
          totalHours: cert.totalHours,
          moduleCount: cert.moduleCount,
          lessonCount: cert.lessonCount,
        },
      };
    }),

  /**
   * List all certificates for the authenticated student.
   */
  getCertificates: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const { db, reg } = await getRegByToken(input.token);

      const certs = await db
        .select()
        .from(certificates)
        .where(eq(certificates.registrationId, reg.id))
        .orderBy(desc(certificates.issuedAt));

      return certs.map((c) => ({
        id: c.id,
        certNumber: c.certNumber,
        pdfUrl: c.pdfUrl,
        issuedAt: c.issuedAt,
        totalHours: c.totalHours,
        moduleCount: c.moduleCount,
        lessonCount: c.lessonCount,
      }));
    }),
});
