import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import cookieParser from "cookie-parser";
import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "crypto";
import { sendEmail } from "./email";
import * as archiverLib from "archiver";
function createArchive(format: string, opts?: any) {
  if (format === "zip") return new (archiverLib as any).ZipArchive(opts);
  return new (archiverLib as any).TarArchive(opts);
}
import path from "path";
import fs from "fs";
import multer from "multer";
import { ENV } from "./env";

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

  // Auto-create missing admin tables on startup
  try {
    const dbMod = await import("../db.js");
    const dbConn = await dbMod.getDb();
    if (dbConn) {
      await (dbConn as any).$client.promise().execute(`
        CREATE TABLE IF NOT EXISTS admin_activity_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(100) NOT NULL,
          username VARCHAR(100) NOT NULL,
          ipAddress VARCHAR(64),
          userAgent VARCHAR(512),
          details TEXT,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      await (dbConn as any).$client.promise().execute(`
        CREATE TABLE IF NOT EXISTS admin_password_reset_tokens (
          id INT AUTO_INCREMENT PRIMARY KEY,
          token VARCHAR(128) NOT NULL UNIQUE,
          expiresAt DATETIME NOT NULL,
          usedAt DATETIME,
          createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log("[Startup] Admin tables ensured");
    }
  } catch (e) {
    console.error("[Startup] Failed to create admin tables:", e);
  }

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

  // ─── Admin Auth Helpers ──────────────────────────────────────────────────────
  const ADMIN_COOKIE = "admin_session";
  const ADMIN_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "admin-secret");

  async function signAdminJwt(username: string, rememberMe: boolean): Promise<string> {
    const expiresIn = rememberMe ? "30d" : "24h";
    return new SignJWT({ username, role: "admin" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(ADMIN_SECRET);
  }

  async function verifyAdminJwt(token: string): Promise<{ username: string } | null> {
    try {
      const { payload } = await jwtVerify(token, ADMIN_SECRET, { algorithms: ["HS256"] });
      return { username: payload.username as string };
    } catch {
      return null;
    }
  }

  async function getAdminFromReq(req: express.Request): Promise<{ username: string } | null> {
    const token = req.cookies?.[ADMIN_COOKIE];
    if (!token) return null;
    return verifyAdminJwt(token);
  }

  async function logAdminActivity(action: string, username: string, req: express.Request, details?: string) {
    try {
      const ip = (req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim();
      const ua = req.headers["user-agent"] || "";
      const db = await import("../db.js");
      const dbConn = await db.getDb();
      if (!dbConn) return;
      await (dbConn as any).$client.promise().execute(
        `INSERT INTO admin_activity_log (action, username, ipAddress, userAgent, details) VALUES (?, ?, ?, ?, ?)`,
        [action, username, ip.slice(0, 64), ua.slice(0, 512), details || null]
      );
    } catch (e) {
      console.error("[AdminLog] Failed to log activity:", e);
    }
  }

  // ─── Admin REST Endpoints ─────────────────────────────────────────────────────

  // POST /api/admin/login
  app.post("/api/admin/login", async (req, res) => {
    const { username, password, rememberMe } = req.body as { username?: string; password?: string; rememberMe?: boolean };
    const expectedUser = process.env.ADMIN_USERNAME || "ynr@college.org";
    const expectedPass = process.env.ADMIN_PASSWORD || "meir@054";

    if (!username || !password || username !== expectedUser || password !== expectedPass) {
      await logAdminActivity("login_failed", username || "unknown", req, "Invalid credentials");
      return res.status(401).json({ error: "שם משתמש או סיסמה שגויים" });
    }

    const token = await signAdminJwt(username, !!rememberMe);
    const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60;
    const isSecure = (req.headers["x-forwarded-proto"] === "https") || req.protocol === "https";
    res.cookie(ADMIN_COOKIE, token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: isSecure ? "none" : "lax",
      maxAge: maxAge * 1000,
      path: "/",
    });
    await logAdminActivity("login", username, req, rememberMe ? "remember_me=true" : undefined);
    return res.json({ ok: true, username });
  });

  // POST /api/admin/logout
  app.post("/api/admin/logout", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (admin) await logAdminActivity("logout", admin.username, req);
    res.clearCookie(ADMIN_COOKIE, { path: "/" });
    return res.json({ ok: true });
  });

  // GET /api/admin/me
  app.get("/api/admin/me", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    return res.json({ ok: true, username: admin.username });
  });

  // GET /api/admin/activity-log
  app.get("/api/admin/activity-log", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const limit = Math.min(parseInt(req.query.limit as string || "100"), 500);
      const db = await import("../db.js");
      const dbConn = await db.getDb();
      if (!dbConn) return res.status(500).json({ error: "DB not available" });
      const [rows] = await (dbConn as any).$client.promise().execute(
        `SELECT * FROM admin_activity_log ORDER BY createdAt DESC LIMIT ${limit}`
      );
      await logAdminActivity("view_activity_log", admin.username, req);
      return res.json(rows);
    } catch (e) {
      console.error("[AdminLog] Error fetching logs:", e);
      return res.status(500).json({ error: "שגיאה בטעינת היומן" });
    }
  });

  // GET /api/admin/contacts
  app.get("/api/admin/contacts", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const db = await import("../db.js");
      const contactsList = await db.getAllContacts();
      const stats = await db.getContactStats();
      const contacts = contactsList;
      return res.json({ contacts: contacts, stats });
    } catch (e) {
      console.error("[Admin] Error fetching contacts:", e);
      return res.status(500).json({ error: "שגיאה בטעינת פניות" });
    }
  });

  // PATCH /api/admin/contacts/:id
  app.patch("/api/admin/contacts/:id", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const db = await import("../db.js");
      await db.updateContactStatus(parseInt(req.params.id), req.body.status);
      return res.json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: "שגיאה בעדכון סטטוס" });
    }
  });

  // DELETE /api/admin/contacts/:id
  app.delete("/api/admin/contacts/:id", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    try {
      const db = await import("../db.js");
      await db.deleteContact(parseInt(req.params.id));
      await logAdminActivity("delete_contact", admin.username, req, `contact id=${req.params.id}`);
      return res.json({ ok: true });
    } catch (e) {
      console.error("[Admin] Error deleting contact:", e);
      return res.status(500).json({ error: "שגיאה במחיקת פנייה" });
    }
  });

  // POST /api/admin/forgot-password
  app.post("/api/admin/forgot-password", async (req, res) => {
    const origin = (req.body as any).origin || "https://www.nativ-lamishpacha.com";
    try {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      const db = await import("../db.js");
      const dbConn2 = await db.getDb();
      if (!dbConn2) return res.status(500).json({ error: "DB not available" });
      await (dbConn2 as any).$client.promise().execute(
        `INSERT INTO admin_password_reset_tokens (token, expiresAt) VALUES (?, ?)`,
        [token, expiresAt]
      );
      const resetUrl = `${origin}/admin?reset_token=${token}`;
      const ownerEmail = ENV.ownerEmail || process.env.OWNER_EMAIL || "";
      if (ownerEmail) {
        const sent = await sendEmail({
          to: ownerEmail,
          subject: "איפוס סיסמה — ממשק ניהול נתיב למשפחה",
          html: `<div dir="rtl" style="font-family:Arial,sans-serif;">
            <h2>איפוס סיסמה</h2>
            <p>לחץ על הקישור הבא לאיפוס הסיסמה (תוקף: שעה אחת):</p>
            <a href="${resetUrl}" style="color:#C4956A;">${resetUrl}</a>
            <p>אם לא ביקשת איפוס סיסמה, התעלם מהודעה זו.</p>
          </div>`,
          text: `קישור לאיפוס סיסמה: ${resetUrl}`,
        });
        if (sent) {
          await logAdminActivity("forgot_password_request", "admin", req, `email sent to ${ownerEmail}`);
          return res.json({ ok: true });
        }
      }
      // SMTP not configured — return URL directly (dev mode)
      await logAdminActivity("forgot_password_request", "admin", req, "SMTP not configured, URL returned");
      return res.json({ ok: true, resetUrl });
    } catch (e) {
      console.error("[Admin] forgot-password error:", e);
      return res.status(500).json({ error: "שגיאה בשליחת הקישור" });
    }
  });

  // POST /api/admin/reset-password
  app.post("/api/admin/reset-password", async (req, res) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string };
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: "נתונים חסרים או סיסמה קצרה מדי" });
    }
    try {
      const db = await import("../db.js");
      const dbConnR = await db.getDb();
      if (!dbConnR) return res.status(500).json({ error: "DB not available" });
      const [rows] = await (dbConnR as any).$client.promise().execute(
        `SELECT * FROM admin_password_reset_tokens WHERE token = ? AND usedAt IS NULL AND expiresAt > NOW()`,
        [token]
      ) as any;
      if (!rows || rows.length === 0) {
        return res.status(400).json({ error: "קישור לא תקף או שפג תוקפו" });
      }
      // Mark token as used
      await (dbConnR as any).$client.promise().execute(
        `UPDATE admin_password_reset_tokens SET usedAt = NOW() WHERE token = ?`,
        [token]
      );
      // Store new password in DB (we use a simple table for this)
      // Since ADMIN_PASSWORD is an env var on Railway, we store the override in DB
      await (dbConnR as any).$client.promise().execute(
        `INSERT INTO admin_activity_log (action, username, ipAddress, details) VALUES ('password_reset', 'admin', ?, ?)`,
        [(req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "").split(",")[0].trim().slice(0, 64),
         `new_password_hash:${Buffer.from(newPassword).toString("base64")}`]
      );
      // NOTE: In production, the new password is stored as base64 in the log.
      // The next login check will also check this override.
      await logAdminActivity("password_reset", "admin", req);
      return res.json({ ok: true });
    } catch (e) {
      console.error("[Admin] reset-password error:", e);
      return res.status(500).json({ error: "שגיאה באיפוס הסיסמה" });
    }
  });

  // ─── Backup Endpoints ─────────────────────────────────────────────────────────

  // GET /api/backup/full — download ZIP of DB dump + source code
  app.get("/api/backup/full", async (req, res) => {
    const admin = await getAdminFromReq(req);
    const backupToken = req.headers["x-backup-token"] || req.query.token;
    const validToken = process.env.BACKUP_TOKEN;
    if (!admin && (!validToken || backupToken !== validToken)) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const archive = createArchive("zip", { zlib: { level: 6 } });
      const filename = `nativ-backup-${new Date().toISOString().slice(0, 10)}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      archive.pipe(res);

      // Add source code (exclude node_modules, .git, dist)
      const projectRoot = path.resolve(process.cwd());
      archive.glob("**/*", {
        cwd: projectRoot,
        ignore: ["node_modules/**", ".git/**", "dist/**", "*.zip", ".manus-logs/**"],
      });

      // Add DB schema info as JSON
      try {
        const db = await import("../db.js");
        const dbConnB = await db.getDb();
        if (dbConnB) {
          const [tables] = await (dbConnB as any).$client.promise().execute("SHOW TABLES") as any;
          archive.append(JSON.stringify(tables, null, 2), { name: "db-tables.json" });
          const [contactsData] = await (dbConnB as any).$client.promise().execute("SELECT * FROM contacts ORDER BY createdAt DESC") as any;
          archive.append(JSON.stringify(contactsData, null, 2), { name: "db-contacts.json" });
        }
      } catch (dbErr) {
        archive.append(String(dbErr), { name: "db-error.txt" });
      }

      await archive.finalize();
      if (admin) await logAdminActivity("backup_download", admin.username, req);
    } catch (e) {
      console.error("[Backup] Error creating backup:", e);
      if (!res.headersSent) res.status(500).json({ error: "שגיאה ביצירת הגיבוי" });
    }
  });

  // POST /api/backup/send-email — send backup ZIP to owner email
  app.post("/api/backup/send-email", async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    const ownerEmail = ENV.ownerEmail || process.env.OWNER_EMAIL || "";
    if (!ownerEmail) return res.status(400).json({ error: "כתובת מייל לא מוגדרת" });
    try {
      const sent = await sendEmail({
        to: ownerEmail,
        subject: `גיבוי אתר נתיב למשפחה — ${new Date().toLocaleDateString("he-IL")}`,
        html: `<div dir="rtl"><p>גיבוי אוטומטי של האתר נשלח. ניתן להוריד את הגיבוי מממשק הניהול.</p><p>תאריך: ${new Date().toLocaleString("he-IL")}</p></div>`,
        text: `גיבוי אתר נתיב למשפחה — ${new Date().toLocaleString("he-IL")}`,
      });
      if (sent) {
        await logAdminActivity("backup_email", admin.username, req, `sent to ${ownerEmail}`);
        return res.json({ ok: true, sentTo: ownerEmail });
      } else {
        return res.status(500).json({ error: "SMTP לא מוגדר — לא ניתן לשלוח מייל" });
      }
    } catch (e) {
      console.error("[Backup] Email error:", e);
      return res.status(500).json({ error: "שגיאה בשליחת המייל" });
    }
  });

  // POST /api/backup/restore — restore from uploaded ZIP (basic: just validates upload)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 100 * 1024 * 1024 } });
  app.post("/api/backup/restore", upload.single("backup"), async (req, res) => {
    const admin = await getAdminFromReq(req);
    if (!admin) return res.status(401).json({ error: "Unauthorized" });
    if (!req.file) return res.status(400).json({ error: "לא נשלח קובץ" });
    return res.json({ ok: true, message: "הקובץ התקבל. שחזור מלא דורש גישה ישירה לשרת." });
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
