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

  // HYP payment endpoint — creates a payment page and returns the URL
  app.post("/api/hyp/create-payment", async (req, res) => {
    try {
      const { amount, description, successUrl, errorUrl } = req.body as {
        amount?: number;
        description?: string;
        successUrl?: string;
        errorUrl?: string;
      };

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "amount is required and must be positive" });
      }

      const { ENV } = await import("./env.js");
      const terminalNumber = ENV.hypTerminalNumber;
      const username = ENV.hypUsername;
      const password = ENV.hypPassword;

      if (!terminalNumber || !username || !password) {
        return res.status(500).json({ error: "HYP credentials not configured" });
      }

      // Amount in agorot (cents) — multiply by 100
      const totalAgorot = Math.round(amount * 100);
      const uniqueId = `nativ-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const origin = successUrl ? new URL(successUrl).origin : "https://www.nativ-lamishpacha.com";
      const successRedirect = successUrl || `${origin}/payment-success`;
      const errorRedirect = errorUrl || `${origin}/payment-error`;
      const cancelRedirect = `${origin}/payment-cancel`;

      const xmlPayload = `<?xml version="1.0" encoding="UTF-8"?>
<ashrait>
  <request>
    <version>2000</version>
    <language>HEB</language>
    <command>doDeal</command>
    <doDeal>
      <terminalNumber>${terminalNumber}</terminalNumber>
      <cardNo>CGMPI</cardNo>
      <total>${totalAgorot}</total>
      <transactionType>Debit</transactionType>
      <creditType>RegularCredit</creditType>
      <currency>ILS</currency>
      <transactionCode>Internet</transactionCode>
      <validation>TxnSetup</validation>
      <uniqueid>${uniqueId}</uniqueid>
      <mpiValidation>AutoComm</mpiValidation>
      <successUrl>${successRedirect}</successUrl>
      <errorUrl>${errorRedirect}</errorUrl>
      <cancelUrl>${cancelRedirect}</cancelUrl>
    </doDeal>
  </request>
</ashrait>`;

      const formData = new URLSearchParams();
      formData.append("user", username);
      formData.append("password", password);
      formData.append("int_in", xmlPayload);

      // Production URL: https://pps.creditguard.co.il/xpo/Relay
      // Note: requires HYP to whitelist the server IP for SSLHTTP access (error 405 until approved)
      const hypBaseUrl = process.env.HYP_API_URL || "https://pps.creditguard.co.il/xpo/Relay";
      const hypResponse = await fetch(hypBaseUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      const responseText = await hypResponse.text();

      // Extract mpiHostedPageUrl from XML response
      const urlMatch = responseText.match(/<mpiHostedPageUrl>([^<]+)<\/mpiHostedPageUrl>/);
      const resultMatch = responseText.match(/<result>([^<]+)<\/result>/);
      const messageMatch = responseText.match(/<message>([^<]+)<\/message>/);

      if (!urlMatch || resultMatch?.[1] !== "000") {
        console.error("HYP error response:", responseText.slice(0, 500));
        return res.status(502).json({
          error: "HYP payment page creation failed",
          message: messageMatch?.[1] || "Unknown error",
        });
      }

      const paymentUrl = urlMatch[1].trim();
      return res.json({ paymentUrl, uniqueId });
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
