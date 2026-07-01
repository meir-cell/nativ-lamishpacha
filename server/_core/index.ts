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

function isPortAvailable(port: number): Promise<boolean> {
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // Open Graph tags for article sharing (Facebook, WhatsApp, etc.)
  // Must be registered BEFORE Vite/static middleware so bots get proper OG HTML
  app.get("/articles/:slug", async (req, res, next) => {
    const { ARTICLES_BY_SLUG } = await import("../../shared/articles-data.js");
    const article = ARTICLES_BY_SLUG[req.params.slug];
    // Only intercept bot/crawler requests; let browsers through to the SPA
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
    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  });

  // Open Graph tags for /books page (Facebook, WhatsApp, etc.)
  // Static OG image endpoint — serves the image directly (no presigned redirect) so Facebook can fetch it
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

  // HYP Pay payment endpoint — uses HYP Pay API (pay.hyp.co.il)
  // Flow: backend calls APISign → gets signed params → frontend redirects to pay.hyp.co.il
  app.post("/api/hyp/create-payment", async (req, res) => {
    try {
      const { amount, description, successUrl, errorUrl, origin: clientOrigin } = req.body as {
        amount?: number;
        description?: string;
        successUrl?: string;
        errorUrl?: string;
        origin?: string;
      };

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "amount is required and must be positive" });
      }

      const { ENV } = await import("./env.js");
      const terminalNumber = ENV.hypTerminalNumber;
      const apiKey = ENV.hypApiToken;   // API Key (KEY param)
      const passP = ENV.hypPassword;    // PassP param

      if (!terminalNumber || !apiKey || !passP) {
        return res.status(500).json({ error: "HYP credentials not configured" });
      }

      const siteOrigin = clientOrigin || "https://www.nativ-lamishpacha.com";
      const successRedirect = successUrl || `${siteOrigin}/payment-success`;
      const errorRedirect = errorUrl || `${siteOrigin}/payment-error`;
      const cancelRedirect = `${siteOrigin}/payment`;
      const orderId = `nativ-${Date.now()}`;

      // Build APISign request URL
      const params = new URLSearchParams({
        action: "APISign",
        What: "SIGN",
        Sign: "True",
        KEY: apiKey,
        PassP: passP,
        Masof: terminalNumber,
        Amount: String(amount),
        Coin: "1",           // ILS
        PageLang: "HEB",
        Order: orderId,
        SuccessUrl: successRedirect,
        ErrorUrl: errorRedirect,
        CancelUrl: cancelRedirect,
      });

      // Only add Info if description is non-empty (avoids garbled text on HYP page)
      if (description && description.trim()) {
        params.set("Info", description.trim());
      }

      const apiSignUrl = `https://pay.hyp.co.il/p/?${params.toString()}`;
      const hypResponse = await fetch(apiSignUrl, { method: "GET" });
      const responseText = await hypResponse.text();

      if (!hypResponse.ok || !responseText.includes("signature=")) {
        console.error("HYP APISign error:", responseText.slice(0, 500));
        return res.status(502).json({
          error: "HYP payment page creation failed",
          message: responseText.slice(0, 200) || "Unknown error",
        });
      }

      // The response is query params — append to pay.hyp.co.il/p/ for redirect
      const paymentUrl = `https://pay.hyp.co.il/p/?${responseText}`;
      return res.json({ paymentUrl, orderId });
    } catch (err) {
      console.error("HYP payment error:", err);
      res.status(500).json({ error: "Payment service error" });
    }
  });

  // TTS proxy endpoint — uses Google Translate TTS (no API key needed)
  // Splits long text into chunks of max 200 chars and returns base64 MP3
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "text is required" });
      }

      // Split into chunks of max 200 chars at word boundaries
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

      // Fetch each chunk from Google Translate TTS
      const audioBuffers: Buffer[] = [];
      for (const chunk of chunks) {
        const encoded = encodeURIComponent(chunk);
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encoded}&tl=he&client=tw-ob`;
        const response = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; nativ-lamishpacha/1.0)" },
        });
        if (!response.ok) continue;
        const buf = Buffer.from(await response.arrayBuffer());
        audioBuffers.push(buf);
      }

      if (audioBuffers.length === 0) {
        return res.status(502).json({ error: "TTS service unavailable" });
      }

      // Concatenate all MP3 buffers and return as base64
      const combined = Buffer.concat(audioBuffers);
      res.json({ audio: combined.toString("base64"), mimeType: "audio/mpeg" });
    } catch (err) {
      console.error("TTS error:", err);
      res.status(500).json({ error: "TTS failed" });
    }
  });

  // development mode uses Vite, production mode uses static files
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
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
