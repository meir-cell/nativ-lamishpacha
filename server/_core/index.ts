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
