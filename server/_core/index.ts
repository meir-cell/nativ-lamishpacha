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
  registerStorageProxy(app);
  registerOAuthRoutes(app);
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

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/` );
  });
}

startServer().catch(console.error);
