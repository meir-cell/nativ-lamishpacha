import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number ): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Encode Hebrew text for Hyp APISign: Hyp expects ISO-8859-8 (Windows-1255) percent-encoding
// Standard URLSearchParams uses UTF-8 which causes garbled Hebrew in Hyp invoices
function encodeHebrew(text: string): string {
  let result = "";
  for (const char of text) {
    const code = char.charCodeAt(0);
    if (code >= 0x05D0 && code <= 0x05EA) {
      const win1255 = code - 0x05D0 + 0xE0;
      result += "%" + win1255.toString(16).toUpperCase();
    } else if (code >= 0x05F0 && code <= 0x05F4) {
      const win1255 = code - 0x05F0 + 0xFB;
      result += "%" + win1255.toString(16).toUpperCase();
    } else {
      result += encodeURIComponent(char);
    }
  }
  return result;
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.use(cookieParser());
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // ACME HTTP-01 challenge passthrough - Railway needs this to issue SSL certificates
  // Do NOT redirect these requests to HTTPS
  app.get('/.well-known/acme-challenge/:token', (req, res) => {
    // Railway's load balancer intercepts this before it reaches the app
    // but we return 200 to prevent any redirect loops
    res.status(200).send(req.params.token);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.get("/articles/:slug", async (req, res, next) => {
    const { ARTICLES_BY_SLUG } = await import("../../shared/articles-data.js");
    const article = ARTICLES_BY_SLUG[req.params.slug];
    const ua = req.headers["user-agent"] || "";
    const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Google|Bingbot|Applebot|Googlebot|crawler|spider|bot/i.test(ua);
    if (!article || !isBot) {
      return next();
    }
    const siteUrl = "https://www.nativ-lamishpacha.com";
    const articleUrl = `${siteUrl}/articles/${article.slug}`;
    const imgUrl = article.img || `${siteUrl}/og-default.jpg`;
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${article.title} | נתיב למשפחה</title>
  <meta name="description" content="${article.excerpt}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${articleUrl}" />
  <meta property="og:title" content="${article.title}" />
  <meta property="og:description" content="${article.excerpt}" />
  <meta property="og:image" content="${imgUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="נתיב למשפחה" />
  <meta property="og:locale" content="he_IL" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${article.title}" />
  <meta name="twitter:description" content="${article.excerpt}" />
  <meta name="twitter:image" content="${imgUrl}" />
  <meta http-equiv="refresh" content="0; url=${articleUrl}" />
</head>
<body>
  <a href="${articleUrl}">${article.title}</a>
</body>
</html>`;
    res.status(200 ).set({ "Content-Type": "text/html" }).end(html);
  });

    // Open Graph tags for /books page (Facebook, WhatsApp, etc.)
  app.get("/og-books-image.jpg", async (req, res) => {
    try {
      const { ENV } = await import("./env.js");
      const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
      const forgeKey = ENV.forgeApiKey;
      const key = "book_lalecet_bedarkav_375f6007.jpg";
      const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
      forgeUrl.searchParams.set("path", key);
      const forgeResp = await fetch(forgeUrl.toString(), {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });
      if (!forgeResp.ok) { res.status(502).end(); return; }
      const { url } = await forgeResp.json() as { url: string };
      const imgResp = await fetch(url);
      if (!imgResp.ok) { res.status(502).end(); return; }
      const buf = await imgResp.arrayBuffer();
      res.set({
        "Content-Type": imgResp.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      }).end(Buffer.from(buf));
    } catch { res.status(500).end(); }
  });

  app.get("/books", async (req, res, next) => {
    const ua = req.headers["user-agent"] || "";
    const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Google|Bingbot|Applebot|Googlebot|crawler|spider|bot/i.test(ua);
    if (!isBot) return next();
    const siteUrl = "https://www.nativ-lamishpacha.com";
    const booksUrl = `${siteUrl}/books`;
    const imgUrl = `${siteUrl}/og-books-image.jpg`;
    const title = "הספרים שלי | נתיב למשפחה — מאיר שמעון עשור";
    const description = "שבעה ספרים ומחקרים בתחומי הפסיכולוגיה היהודית, הגישור, הייעוץ המשפחתי והאמונה. כולם זמינים להורדה חינם כקובץ PDF.";
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${description}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${booksUrl}" />
  <meta property="og:title" content="${title}" />
  <meta property="og:description" content="${description}" />
  <meta property="og:image" content="${imgUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="נתיב למשפחה" />
  <meta property="og:locale" content="he_IL" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${title}" />
  <meta name="twitter:description" content="${description}" />
  <meta name="twitter:image" content="${imgUrl}" />
  <meta http-equiv="refresh" content="0; url=${booksUrl}" />
</head>
<body>
  <a href="${booksUrl}">${title}</a>
</body>
</html>`;
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });

  // Per-book OG image proxy
  app.get("/og-book-image/:slug.jpg", async (req, res) => {
    try {
      const { BOOKS_BY_SLUG } = await import("../../shared/books-data.js");
      const book = BOOKS_BY_SLUG[req.params.slug];
      if (!book) { res.status(404).end(); return; }
      const { ENV } = await import("./env.js");
      const forgeBaseUrl = (ENV.forgeApiUrl || "").replace(/\/+$/, "");
      const forgeKey = ENV.forgeApiKey;
      const forgeUrl = new URL("v1/storage/presign/get", forgeBaseUrl + "/");
      forgeUrl.searchParams.set("path", book.imageStorageKey);
      const forgeResp = await fetch(forgeUrl.toString(), {
        headers: { Authorization: `Bearer ${forgeKey}` },
      });
      if (!forgeResp.ok) { res.status(502).end(); return; }
      const { url } = await forgeResp.json() as { url: string };
      const imgResp = await fetch(url);
      if (!imgResp.ok) { res.status(502).end(); return; }
      const buf = await imgResp.arrayBuffer();
      res.set({
        "Content-Type": imgResp.headers.get("content-type") || "image/jpeg",
        "Cache-Control": "public, max-age=86400",
      }).end(Buffer.from(buf));
    } catch { res.status(500).end(); }
  });

  // Open Graph tags for /books/:slug — each book gets its own OG metadata
  app.get("/books/:slug", async (req, res, next) => {
    const { BOOKS_BY_SLUG } = await import("../../shared/books-data.js");
    const book = BOOKS_BY_SLUG[req.params.slug];
    const ua = req.headers["user-agent"] || "";
    const isBot = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Pinterest|Google|Bingbot|Applebot|Googlebot|crawler|spider|bot/i.test(ua);
    if (!book || !isBot) {
      return next();
    }
    const siteUrl = "https://www.nativ-lamishpacha.com";
    const bookUrl = `${siteUrl}/books/${book.slug}`;
    const imgUrl = `${siteUrl}/og-book-image/${book.slug}.jpg`;
    const title = `${book.title} — ${book.subtitle} | נתיב למשפחה`;
    const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <title>${title}</title>
  <meta name="description" content="${book.description}" />
  <meta property="og:type" content="book" />
  <meta property="og:url" content="${bookUrl}" />
  <meta property="og:title" content="${book.title}" />
  <meta property="og:description" content="${book.description}" />
  <meta property="og:image" content="${imgUrl}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="נתיב למשפחה" />
  <meta property="og:locale" content="he_IL" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${book.title}" />
  <meta name="twitter:description" content="${book.description}" />
  <meta name="twitter:image" content="${imgUrl}" />
  <meta http-equiv="refresh" content="0; url=${bookUrl}" />
</head>
<body>
  <a href="${bookUrl}">${book.title}</a>
</body>
</html>`;
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });

  // Legacy GET endpoint used by ynrclinics.co.il
  // ── STANDALONE ADMIN AUTH (no Manus OAuth) ───────────────────────────────────
  const ADMIN_COOKIE = "nativ_admin_session";

  // POST /api/admin/login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password } = req.body as { username?: string; password?: string };
    const envUser = process.env.ADMIN_USERNAME || "admin";
    const envPass = process.env.ADMIN_PASSWORD || "";
    if (!envPass || username !== envUser || password !== envPass) {
      return res.status(401).json({ error: "שם משתמש או סיסמא שגויים" });
    }
    const { SignJWT } = await import("jose");
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
    const token = await new SignJWT({ role: "admin", sub: username })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(secret);
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/",
    });
    res.json({ ok: true });
  });

  // POST /api/admin/logout
  app.post("/api/admin/logout", (_req, res) => {
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    res.json({ ok: true });
  });

  // GET /api/admin/me
  app.get("/api/admin/me", async (req, res) => {
    try {
      const { jwtVerify } = await import("jose");
      const cookie = req.cookies?.[ADMIN_COOKIE] ||
        (req.headers.cookie || "").split(";").find(c => c.trim().startsWith(ADMIN_COOKIE + "="))?.split("=").slice(1).join("=") || "";
      if (!cookie) return res.status(401).json({ error: "Not authenticated" });
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
      const { payload } = await jwtVerify(cookie, secret);
      res.json({ ok: true, username: payload.sub, role: payload.role });
    } catch {
      res.status(401).json({ error: "Invalid or expired session" });
    }
  });

  // Middleware helper to protect admin API routes
  async function requireAdminSession(req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const { jwtVerify } = await import("jose");
      const cookie = req.cookies?.[ADMIN_COOKIE] ||
        (req.headers.cookie || "").split(";").find(c => c.trim().startsWith(ADMIN_COOKIE + "="))?.split("=").slice(1).join("=") || "";
      if (!cookie) return res.status(401).json({ error: "Not authenticated" });
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
      await jwtVerify(cookie, secret);
      next();
    } catch {
      res.status(401).json({ error: "Invalid or expired session" });
    }
  }

  // GET /api/admin/contacts — list all contact form submissions
  app.get("/api/admin/contacts", requireAdminSession, async (_req, res) => {
    try {
      const { getAllContacts, getContactStats } = await import("../db.js");
      const [contacts, stats] = await Promise.all([getAllContacts(), getContactStats()]);
      res.json({ contacts, stats });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  // PATCH /api/admin/contacts/:id — update contact status
  app.patch("/api/admin/contacts/:id", requireAdminSession, async (req, res) => {
    try {
      const { updateContactStatus } = await import("../db.js");
      const id = parseInt(req.params.id);
      const { status } = req.body as { status: string };
      await updateContactStatus(id, status as "new" | "read" | "replied");
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ error: String(err) });
    }
  });

  app.get("/api/payment/create", async (req, res) => {
    try {
      const amount = parseFloat(req.query.amount as string);
      const description = (req.query.description as string) || "";
      const successUrl = req.query.successUrl as string | undefined;
      const errorUrl = req.query.errorUrl as string | undefined;
      const email = req.query.email as string | undefined;
      const phone = req.query.phone as string | undefined;
      const firstName = req.query.firstName as string | undefined;
      const lastName = req.query.lastName as string | undefined;
      const clientOrigin = req.query.origin as string | undefined;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "amount is required and must be positive" });
      }

      const { ENV } = await import("./env.js");
      const terminalNumber = ENV.hypTerminalNumber;
      const apiKey = ENV.hypApiToken;
      const passP = ENV.hypPassword;

      if (!terminalNumber || !apiKey || !passP) {
        return res.status(500).json({ error: "HYP credentials not configured" });
      }

      const siteOrigin = clientOrigin || "https://www.nativ-lamishpacha.com";
      const successRedirect = successUrl || `${siteOrigin}/payment-success`;
      const errorRedirect = errorUrl || `${siteOrigin}/payment-error`;
      const cancelRedirect = `${siteOrigin}/payment`;
      const orderId = `ynr-${Date.now( )}`;

      const params = new URLSearchParams({
        action: "APISign",
        What: "SIGN",
        Sign: "True",
        KEY: apiKey,
        PassP: passP,
        Masof: terminalNumber,
        Amount: String(amount),
        Coin: "1",
        PageLang: "HEB",
        Order: orderId,
        SuccessUrl: successRedirect,
        ErrorUrl: errorRedirect,
        CancelUrl: cancelRedirect,
      });

      if (description && description.trim()) {
        params.set("Info", description.trim());
      }
      if (email && email.trim()) {
        params.set("email", email.trim());
        params.set("SendHesh", "True");
      }
      if (phone && phone.trim()) {
        params.set("cell", phone.trim());
      }

      let apiSignUrl = `https://pay.hyp.co.il/p/?${params.toString( )}`;
      if (firstName && firstName.trim()) {
        apiSignUrl += `&ClientName=${encodeHebrew(firstName.trim())}`;
      }
      if (lastName && lastName.trim()) {
        apiSignUrl += `&ClientLName=${encodeHebrew(lastName.trim())}`;
      }

      const hypResponse = await fetch(apiSignUrl, { method: "GET" });
      const responseText = await hypResponse.text();

      if (!hypResponse.ok || !responseText.includes("signature=")) {
        console.error("HYP APISign error (payment/create):", responseText.slice(0, 500));
        return res.status(502).json({
          error: "HYP payment page creation failed",
          message: responseText.slice(0, 200) || "Unknown error",
        });
      }

      const paymentUrl = `https://pay.hyp.co.il/p/?${responseText}`;
      return res.json({ url: paymentUrl, paymentUrl, orderId } );
    } catch (err) {
      console.error("HYP payment/create error:", err);
      res.status(500).json({ error: "Payment service error" });
    }
  });

  // HYP Pay POST endpoint
  app.post("/api/hyp/create-payment", async (req, res) => {
    try {
      const { amount, description, successUrl, errorUrl, origin: clientOrigin, email, phone, firstName, lastName } = req.body as {
        amount?: number;
        description?: string;
        successUrl?: string;
        errorUrl?: string;
        origin?: string;
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
      };

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "amount is required and must be positive" });
      }

      const { ENV } = await import("./env.js");
      const terminalNumber = ENV.hypTerminalNumber;
      const apiKey = ENV.hypApiToken;
      const passP = ENV.hypPassword;

      if (!terminalNumber || !apiKey || !passP) {
        return res.status(500).json({ error: "HYP credentials not configured" });
      }

      const siteOrigin = clientOrigin || "https://www.nativ-lamishpacha.com";
      const successRedirect = successUrl || `${siteOrigin}/payment-success`;
      const errorRedirect = errorUrl || `${siteOrigin}/payment-error`;
      const cancelRedirect = `${siteOrigin}/payment`;
      const orderId = `nativ-${Date.now( )}`;

      const params = new URLSearchParams({
        action: "APISign",
        What: "SIGN",
        Sign: "True",
        KEY: apiKey,
        PassP: passP,
        Masof: terminalNumber,
        Amount: String(amount),
        Coin: "1",
        PageLang: "HEB",
        Order: orderId,
        SuccessUrl: successRedirect,
        ErrorUrl: errorRedirect,
        CancelUrl: cancelRedirect,
      });

      if (description && description.trim()) {
        params.set("Info", description.trim());
      }
      if (email && email.trim()) {
        params.set("email", email.trim());
        params.set("SendHesh", "True");
      }
      if (phone && phone.trim()) {
        params.set("cell", phone.trim());
      }

      let apiSignUrl = `https://pay.hyp.co.il/p/?${params.toString( )}`;
      if (firstName && firstName.trim()) {
        apiSignUrl += `&ClientName=${encodeHebrew(firstName.trim())}`;
      }
      if (lastName && lastName.trim()) {
        apiSignUrl += `&ClientLName=${encodeHebrew(lastName.trim())}`;
      }

      const hypResponse = await fetch(apiSignUrl, { method: "GET" });
      const responseText = await hypResponse.text();

      if (!hypResponse.ok || !responseText.includes("signature=")) {
        console.error("HYP APISign error:", responseText.slice(0, 500));
        return res.status(502).json({
          error: "HYP payment page creation failed",
          message: responseText.slice(0, 200) || "Unknown error",
        });
      }

      const paymentUrl = `https://pay.hyp.co.il/p/?${responseText}`;
      return res.json({ paymentUrl, orderId } );
    } catch (err) {
      console.error("HYP payment error:", err);
      res.status(500).json({ error: "Payment service error" });
    }
  });

    // ── BACKUP ENDPOINT ─────────────────────────────────────────────────────────
  // Protected: requires the same owner/admin token used by the NLP admin panel
  // Accepts: x-owner-token header (registration JWT for OWNER_EMAIL) OR admin OAuth cookie
  app.get("/api/backup/full", async (req, res) => {
    try {
      const { ENV } = await import("./env.js");
      const { getDb } = await import("../db.js");
      const { registrations } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const jwt = await import("jose");

      let authorized = false;

      // Path 1: x-owner-token header (NLP course JWT for OWNER_EMAIL)
      const ownerToken = req.headers["x-owner-token"] as string | undefined;
      if (ownerToken && ENV.ownerEmail) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || "nlp-course-secret");
          const { payload } = await jwt.jwtVerify(ownerToken, secret) as { payload: { id: number; email: string } };
          const db = await getDb();
          if (db) {
            const rows = await db
              .select({ email: registrations.email })
              .from(registrations)
              .where(eq(registrations.id, payload.id))
              .limit(1);
            if (rows.length > 0 && rows[0].email.toLowerCase() === ENV.ownerEmail.toLowerCase()) {
              authorized = true;
            }
          }
        } catch {
          // invalid token
        }
      }

      // Path 2: admin-secret header (plain text admin secret stored in env)
      const adminSecret = req.headers["x-admin-secret"] as string | undefined;
      const envAdminSecret = process.env.ADMIN_SECRET || "";
      if (!authorized && adminSecret && envAdminSecret && adminSecret === envAdminSecret) {
        authorized = true;
      }

      // Path 3: simple BACKUP_TOKEN query param (for convenience)
      const backupToken = process.env.BACKUP_TOKEN || "";
      const providedToken = req.query.token as string | undefined;
      if (!authorized && backupToken && providedToken === backupToken) {
        authorized = true;
      }

      // Path 4: standalone admin session cookie
      if (!authorized) {
        try {
          const { jwtVerify } = await import("jose");
          const adminCookieVal = req.cookies?.["nativ_admin_session"] ||
            (req.headers.cookie || "").split(";").find(c => c.trim().startsWith("nativ_admin_session="))?.split("=").slice(1).join("=") || "";
          if (adminCookieVal) {
            const secret = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");
            await jwtVerify(adminCookieVal, secret);
            authorized = true;
          }
        } catch { /* invalid cookie */ }
      }

      if (!authorized) {
        return res.status(401).json({ error: "Unauthorized — owner or admin access required" });
      }

      const { execSync } = await import("child_process");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const archiverCreate = (await import("archiver") as any).default ?? (await import("archiver"));
      const path = await import("path");
      const fs = await import("fs");

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const tmpDir = `/tmp/backup-${timestamp}`;
      fs.mkdirSync(tmpDir, { recursive: true });

      // 1. MySQL dump
      const dbUrl = ENV.databaseUrl; // mysql://user:pass@host:port/db
      let dbDumpPath = "";
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          const host = url.hostname;
          const port = url.port || "3306";
          const user = url.username;
          const pass = url.password;
          const db = url.pathname.replace(/^\//, "");
          dbDumpPath = path.join(tmpDir, `db-${timestamp}.sql`);
          const cmd = `mysqldump --host=${host} --port=${port} --user=${user} --password=${pass} --single-transaction --routines --triggers ${db} > ${dbDumpPath}`;
          execSync(cmd, { timeout: 120_000 });
        } catch (dbErr) {
          console.error("DB dump error:", dbErr);
          // Continue even if DB dump fails — still deliver code backup
        }
      }

      // 2. Stream ZIP response
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="nativ-backup-${timestamp}.zip"`);

      const archive = archiverCreate("zip", { zlib: { level: 6 } });
      archive.pipe(res);

      // Add DB dump if it was created
      if (dbDumpPath && fs.existsSync(dbDumpPath)) {
        archive.file(dbDumpPath, { name: `db-${timestamp}.sql` });
      }

      // Add source code (exclude node_modules, dist, .git, tmp)
      const projectRoot = process.cwd();
      archive.glob("**/*", {
        cwd: projectRoot,
        ignore: [
          "node_modules/**",
          "dist/**",
          ".git/**",
          ".manus-logs/**",
          "*.log",
        ],
      });

      await archive.finalize();

      // Cleanup tmp
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    } catch (err) {
      console.error("Backup error:", err);
      if (!res.headersSent) {
        res.status(500).json({ error: "Backup failed", details: String(err) });
      }
    }
  });

  // ── BACKUP RESTORE ENDPOINT ────────────────────────────────────────────────
  // POST /api/backup/restore — accepts a ZIP file, restores DB (SQL files) and/or code
  app.post("/api/backup/restore", async (req, res) => {
    try {
      const { ENV } = await import("./env.js");
      const { getDb } = await import("../db.js");
      const { registrations } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const jwtLib = await import("jose");
      const fs = await import("fs");
      const path = await import("path");
      const { execSync } = await import("child_process");

      let authorized = false;

      // Same auth as backup download
      const ownerToken = req.headers["x-owner-token"] as string | undefined;
      if (ownerToken && ENV.ownerEmail) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || "nlp-course-secret");
          const { payload } = await jwtLib.jwtVerify(ownerToken, secret) as { payload: { id: number; email: string } };
          const db = await getDb();
          if (db) {
            const rows = await db.select({ email: registrations.email }).from(registrations)
              .where(eq(registrations.id, payload.id)).limit(1);
            if (rows.length > 0 && rows[0].email.toLowerCase() === ENV.ownerEmail.toLowerCase()) authorized = true;
          }
        } catch { /* invalid token */ }
      }
      const adminSecret = req.headers["x-admin-secret"] as string | undefined;
      if (!authorized && adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) authorized = true;
      const backupToken = process.env.BACKUP_TOKEN || "";
      const providedToken = req.query.token as string | undefined;
      if (!authorized && backupToken && providedToken === backupToken) authorized = true;

      // Admin cookie session
      if (!authorized) {
        try {
          const { jwtVerify } = await import("jose");
          const adminCookieVal = req.cookies?.["nativ_admin_session"] ||
            (req.headers.cookie || "").split(";").find(c => c.trim().startsWith("nativ_admin_session="))?.split("=").slice(1).join("=") || "";
          if (adminCookieVal) { await jwtVerify(adminCookieVal, new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret")); authorized = true; }
        } catch { /* invalid */ }
      }

      if (!authorized) return res.status(401).json({ error: "Unauthorized" });

      // Parse multipart upload
      const multer = (await import("multer") as any).default ?? (await import("multer"));
      const upload = multer({ dest: "/tmp/restore-uploads/", limits: { fileSize: 500 * 1024 * 1024 } });

      await new Promise<void>((resolve, reject) => {
        upload.single("backup")(req as any, res as any, (err: unknown) => {
          if (err) reject(err); else resolve();
        });
      });

      const file = (req as any).file;
      if (!file) return res.status(400).json({ error: "No backup file uploaded" });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const extractDir = `/tmp/restore-${timestamp}`;
      fs.mkdirSync(extractDir, { recursive: true });

      // Extract ZIP
      execSync(`unzip -o "${file.path}" -d "${extractDir}"`, { timeout: 60_000 });

      const results: string[] = [];

      // Restore DB: find .sql files
      const sqlFiles = fs.readdirSync(extractDir).filter((f: string) => f.endsWith(".sql"));
      if (sqlFiles.length > 0) {
        const dbUrl = ENV.databaseUrl;
        if (dbUrl) {
          const url = new URL(dbUrl);
          const host = url.hostname;
          const port = url.port || "3306";
          const user = url.username;
          const pass = url.password;
          const db = url.pathname.replace(/^\//, "");
          for (const sqlFile of sqlFiles) {
            const sqlPath = path.join(extractDir, sqlFile);
            execSync(`mysql --host=${host} --port=${port} --user=${user} --password=${pass} ${db} < "${sqlPath}"`, { timeout: 120_000 });
            results.push(`DB restored from ${sqlFile}`);
          }
        }
      }

      // Restore code: copy files to project root (excluding node_modules, dist, .git)
      const projectRoot = process.cwd();
      const codeFiles = fs.readdirSync(extractDir).filter((f: string) => !f.endsWith(".sql"));
      if (codeFiles.length > 0) {
        execSync(`rsync -a --exclude=node_modules --exclude=dist --exclude=.git "${extractDir}/" "${projectRoot}/"`, { timeout: 120_000 });
        results.push(`Code restored (${codeFiles.length} items)`);
      }

      // Cleanup
      try { fs.rmSync(extractDir, { recursive: true, force: true }); } catch {}
      try { fs.unlinkSync(file.path); } catch {}

      res.json({ ok: true, restored: results });
    } catch (err) {
      console.error("Restore error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Restore failed", details: String(err) });
    }
  });

  // ── BACKUP EMAIL ENDPOINT ────────────────────────────────────────────────────
  // POST /api/backup/send-email — creates backup ZIP and emails it to owner
  app.post("/api/backup/send-email", async (req, res) => {
    try {
      const { ENV } = await import("./env.js");
      const { getDb } = await import("../db.js");
      const { registrations } = await import("../../drizzle/schema.js");
      const { eq } = await import("drizzle-orm");
      const jwtLib = await import("jose");
      const fs = await import("fs");
      const path = await import("path");
      const { execSync } = await import("child_process");

      let authorized = false;

      const ownerToken = req.headers["x-owner-token"] as string | undefined;
      if (ownerToken && ENV.ownerEmail) {
        try {
          const secret = new TextEncoder().encode(process.env.JWT_SECRET || "nlp-course-secret");
          const { payload } = await jwtLib.jwtVerify(ownerToken, secret) as { payload: { id: number; email: string } };
          const db = await getDb();
          if (db) {
            const rows = await db.select({ email: registrations.email }).from(registrations)
              .where(eq(registrations.id, payload.id)).limit(1);
            if (rows.length > 0 && rows[0].email.toLowerCase() === ENV.ownerEmail.toLowerCase()) authorized = true;
          }
        } catch { /* invalid token */ }
      }
      const adminSecret = req.headers["x-admin-secret"] as string | undefined;
      if (!authorized && adminSecret && process.env.ADMIN_SECRET && adminSecret === process.env.ADMIN_SECRET) authorized = true;
      const backupToken = process.env.BACKUP_TOKEN || "";
      const providedToken = req.query.token as string | undefined;
      if (!authorized && backupToken && providedToken === backupToken) authorized = true;

      // Admin cookie session
      if (!authorized) {
        try {
          const { jwtVerify } = await import("jose");
          const adminCookieVal = req.cookies?.["nativ_admin_session"] ||
            (req.headers.cookie || "").split(";").find(c => c.trim().startsWith("nativ_admin_session="))?.split("=").slice(1).join("=") || "";
          if (adminCookieVal) { await jwtVerify(adminCookieVal, new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret")); authorized = true; }
        } catch { /* invalid */ }
      }

      if (!authorized) return res.status(401).json({ error: "Unauthorized" });

      const ownerEmail = ENV.ownerEmail;
      if (!ownerEmail) return res.status(400).json({ error: "OWNER_EMAIL not configured" });

      // Check SMTP is configured
      if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        return res.status(400).json({ error: "SMTP not configured — add SMTP_HOST, SMTP_USER, SMTP_PASS to Railway Variables" });
      }

      // Create backup ZIP in tmp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const tmpDir = `/tmp/backup-email-${timestamp}`;
      fs.mkdirSync(tmpDir, { recursive: true });
      const zipPath = path.join(tmpDir, `nativ-backup-${timestamp}.zip`);

      // DB dump
      let dbDumpPath = "";
      const dbUrl = ENV.databaseUrl;
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          dbDumpPath = path.join(tmpDir, `db-${timestamp}.sql`);
          execSync(`mysqldump --host=${url.hostname} --port=${url.port || "3306"} --user=${url.username} --password=${url.password} --single-transaction --routines --triggers ${url.pathname.replace(/^\//, "")} > "${dbDumpPath}"`, { timeout: 120_000 });
        } catch (dbErr) { console.error("DB dump error:", dbErr); }
      }

      // Create ZIP
      const archiverCreate = (await import("archiver") as any).default ?? (await import("archiver"));
      const archiveStream = fs.createWriteStream(zipPath);
      const archive = archiverCreate("zip", { zlib: { level: 6 } });
      archive.pipe(archiveStream);
      if (dbDumpPath && fs.existsSync(dbDumpPath)) archive.file(dbDumpPath, { name: `db-${timestamp}.sql` });
      const projectRoot = process.cwd();
      archive.glob("**/*", { cwd: projectRoot, ignore: ["node_modules/**", "dist/**", ".git/**", ".manus-logs/**", "*.log"] });
      await archive.finalize();
      await new Promise<void>((resolve, reject) => { archiveStream.on("close", resolve); archiveStream.on("error", reject); });

      const zipSize = fs.statSync(zipPath).size;
      const zipSizeMB = (zipSize / 1024 / 1024).toFixed(1);

      // Send email with attachment
      const nodemailer = (await import("nodemailer") as any).default ?? (await import("nodemailer"));
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587", 10),
        secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const dateStr = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
      await transporter.sendMail({
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to: ownerEmail,
        subject: `גיבוי אתר נתיב למשפחה — ${dateStr}`,
        html: `<div dir="rtl" style="font-family:Arial,sans-serif;">
          <h2 style="color:#C9A84C;">גיבוי אתר נתיב למשפחה</h2>
          <p>מצורף גיבוי מלא של האתר מתאריך <strong>${dateStr}</strong>.</p>
          <p>הגיבוי כולל:</p>
          <ul>
            <li>מסד נתונים מלא (MySQL dump)</li>
            <li>קוד מקור האתר</li>
          </ul>
          <p style="color:#888;">גודל הגיבוי: ${zipSizeMB} MB</p>
          <p style="color:#888;">שמור את הקובץ במקום בטוח.</p>
        </div>`,
        attachments: [{ filename: `nativ-backup-${timestamp}.zip`, path: zipPath }],
      });

      // Cleanup
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      res.json({ ok: true, sentTo: ownerEmail, sizeMB: zipSizeMB });
    } catch (err) {
      console.error("Email backup error:", err);
      if (!res.headersSent) res.status(500).json({ error: "Email backup failed", details: String(err) });
    }
  });

  // ── SCHEDULED BACKUP HANDLER ────────────────────────────────────────────────
  // POST /api/scheduled/weekly-backup — triggered by Heartbeat cron every Sunday
  app.post("/api/scheduled/weekly-backup", async (req, res) => {
    try {
      const { sdk } = await import("./sdk.js");
      const user = await sdk.authenticateRequest(req);
      if (!user.isCron) return res.status(403).json({ error: "cron-only" });

      const { ENV } = await import("./env.js");
      const fs = await import("fs");
      const path = await import("path");
      const { execSync } = await import("child_process");

      const ownerEmail = ENV.ownerEmail;
      if (!ownerEmail) return res.json({ ok: false, reason: "OWNER_EMAIL not set" });

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const tmpDir = `/tmp/backup-weekly-${timestamp}`;
      fs.mkdirSync(tmpDir, { recursive: true });
      const zipPath = path.join(tmpDir, `nativ-backup-${timestamp}.zip`);

      // DB dump
      let dbDumpPath = "";
      const dbUrl = ENV.databaseUrl;
      if (dbUrl) {
        try {
          const url = new URL(dbUrl);
          dbDumpPath = path.join(tmpDir, `db-${timestamp}.sql`);
          execSync(`mysqldump --host=${url.hostname} --port=${url.port || "3306"} --user=${url.username} --password=${url.password} --single-transaction --routines --triggers ${url.pathname.replace(/^\//, "")} > "${dbDumpPath}"`, { timeout: 120_000 });
        } catch (dbErr) { console.error("[weekly-backup] DB dump error:", dbErr); }
      }

      // Create ZIP
      const archiverCreate = (await import("archiver") as any).default ?? (await import("archiver"));
      const archiveStream = fs.createWriteStream(zipPath);
      const archive = archiverCreate("zip", { zlib: { level: 6 } });
      archive.pipe(archiveStream);
      if (dbDumpPath && fs.existsSync(dbDumpPath)) archive.file(dbDumpPath, { name: `db-${timestamp}.sql` });
      archive.glob("**/*", { cwd: process.cwd(), ignore: ["node_modules/**", "dist/**", ".git/**", ".manus-logs/**", "*.log"] });
      await archive.finalize();
      await new Promise<void>((resolve, reject) => { archiveStream.on("close", resolve); archiveStream.on("error", reject); });

      const zipSizeMB = (fs.statSync(zipPath).size / 1024 / 1024).toFixed(1);

      // Send email if SMTP configured
      let emailSent = false;
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const nodemailer = (await import("nodemailer") as any).default ?? (await import("nodemailer"));
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || "587", 10),
            secure: parseInt(process.env.SMTP_PORT || "587", 10) === 465,
            auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          });
          const dateStr = new Date().toLocaleDateString("he-IL", { year: "numeric", month: "long", day: "numeric" });
          await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: ownerEmail,
            subject: `גיבוי שבועי אוטומטי — נתיב למשפחה — ${dateStr}`,
            html: `<div dir="rtl" style="font-family:Arial,sans-serif;"><h2 style="color:#C9A84C;">גיבוי שבועי אוטומטי</h2><p>מצורף גיבוי מלא של האתר מתאריך <strong>${dateStr}</strong>.</p><p>גודל הגיבוי: ${zipSizeMB} MB</p><p style="color:#888;">שמור את הקובץ במקום בטוח.</p></div>`,
            attachments: [{ filename: `nativ-backup-${timestamp}.zip`, path: zipPath }],
          });
          emailSent = true;
        } catch (emailErr) { console.error("[weekly-backup] Email error:", emailErr); }
      }

      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

      res.json({ ok: true, timestamp, sizeMB: zipSizeMB, emailSent });
    } catch (err) {
      console.error("[weekly-backup] Error:", err);
      res.status(500).json({ error: "Weekly backup failed", details: String(err), timestamp: new Date().toISOString() });
    }
  });

  // TTS proxy endpoint
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }

      const chunks: string[] = [];
      const sentences = text.split(/(?<=[.!?\n])\s+|\n+/);
      let current = "";
      for (const s of sentences) {
        if ((current + " " + s).length > 200 && current) {
          chunks.push(current.trim());
          current = s;
        } else {
          current = current ? current + " " + s : s;
        }
      }
      if (current.trim()) chunks.push(current.trim());

      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const encoded = encodeURIComponent(chunk);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=he&client=tw-ob`;
        const response = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; nativ-lamishpacha/1.0 )" },
        });
        if (!response.ok) continue;
        const buf = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(buf);
      }

      if (audioBuffers.length === 0) {
        return res.status(502).json({ error: "TTS service unavailable" });
      }

      const combined = Buffer.concat(audioBuffers);
      res.json({ audio: combined.toString("base64"), mimeType: "audio/mpeg" });
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "3000");
  console.log(`Starting server on port ${port}...`);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

startServer().catch(console.error);
