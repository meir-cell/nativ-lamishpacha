/**
 * Seed script: imports all articles from the static Articles.tsx array into the DB.
 * Run with: node scripts/seed-articles.mjs
 */
import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { config } from "dotenv";

config();

const __dirname = dirname(fileURLToPath(import.meta.url));

// Parse the articles array from the TypeScript file using regex
const articlesFile = readFileSync(
  join(__dirname, "../client/src/pages/Articles.tsx"),
  "utf-8"
);

// Extract the articles array content
const startMarker = "export const articles = [";
const startIdx = articlesFile.indexOf(startMarker);
if (startIdx === -1) throw new Error("Could not find articles array");

// Find the matching closing bracket
let depth = 0;
let endIdx = startIdx + startMarker.length - 1;
for (let i = startIdx + startMarker.length - 1; i < articlesFile.length; i++) {
  if (articlesFile[i] === "[") depth++;
  else if (articlesFile[i] === "]") {
    depth--;
    if (depth === 0) {
      endIdx = i;
      break;
    }
  }
}

const arrayContent = articlesFile.slice(startIdx + startMarker.length - 1, endIdx + 1);

// Use a safer approach: eval the array in a controlled way
// Replace template literals with regular strings for parsing
let jsContent = arrayContent
  // Remove TypeScript type assertions
  .replace(/as\s+\w+/g, "")
  // Convert backtick template literals to regular strings (simple ones without expressions)
  .replace(/`([^`]*)`/gs, (match, content) => {
    // Escape double quotes inside
    const escaped = content.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return `"${escaped}"`;
  });

let articles;
try {
  // Use Function constructor to evaluate the array
  articles = new Function(`return ${jsContent}`)();
} catch (e) {
  console.error("Failed to parse articles:", e.message);
  // Try a different approach - extract each article manually
  process.exit(1);
}

console.log(`Found ${articles.length} articles to seed`);

const db = await createConnection(process.env.DATABASE_URL);

let inserted = 0;
let skipped = 0;
let errors = 0;

for (let i = 0; i < articles.length; i++) {
  const a = articles[i];
  if (!a.slug || !a.title) {
    console.log(`  [${i}] Skipping article without slug/title`);
    skipped++;
    continue;
  }
  
  try {
    // Check if already exists
    const [existing] = await db.execute(
      "SELECT id FROM articles WHERE slug = ?",
      [a.slug]
    );
    
    if (existing.length > 0) {
      // Update existing
      await db.execute(
        `UPDATE articles SET title=?, excerpt=?, content=?, img=?, audioSrc=?, category=?, date=?, readTime=?, published=1, sortOrder=? WHERE slug=?`,
        [
          a.title || "",
          a.excerpt || "",
          a.content || "",
          a.img || "",
          a.audioSrc || "",
          a.category || "",
          a.date || "",
          a.readTime || "",
          i,
          a.slug,
        ]
      );
      console.log(`  [${i}] Updated: ${a.slug}`);
    } else {
      // Insert new
      await db.execute(
        `INSERT INTO articles (slug, title, excerpt, content, img, audioSrc, category, date, readTime, published, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
        [
          a.slug,
          a.title || "",
          a.excerpt || "",
          a.content || "",
          a.img || "",
          a.audioSrc || "",
          a.category || "",
          a.date || "",
          a.readTime || "",
          i,
        ]
      );
      console.log(`  [${i}] Inserted: ${a.slug}`);
    }
    inserted++;
  } catch (err) {
    console.error(`  [${i}] Error for ${a.slug}:`, err.message);
    errors++;
  }
}

await db.end();
console.log(`\nDone! Inserted/updated: ${inserted}, Skipped: ${skipped}, Errors: ${errors}`);
