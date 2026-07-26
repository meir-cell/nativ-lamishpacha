/**
 * RAG Search — finds relevant course content chunks for a given query.
 * Uses keyword matching with relevance scoring.
 */
import { getDb } from "./db";
import { courseContentChunks } from "../drizzle/schema";
import { like, or, sql } from "drizzle-orm";

/**
 * Remove nikud and normalize Hebrew text for matching
 */
function normalizeHebrew(text: string): string {
  return text
    .replace(/[\u0591-\u05C7]/g, "") // remove nikud
    .replace(/[^\u0590-\u05FF\w\s]/g, " ") // keep Hebrew + alphanumeric
    .toLowerCase()
    .trim();
}

/**
 * Extract search terms from a query
 */
function extractSearchTerms(query: string): string[] {
  const normalized = normalizeHebrew(query);
  const words = normalized.split(/\s+/).filter(w => w.length > 2);
  // Remove common Hebrew stop words
  const stopWords = new Set([
    "של", "את", "על", "עם", "זה", "זאת", "הוא", "היא", "הם", "הן",
    "אני", "אתה", "את", "אנחנו", "לא", "כן", "גם", "רק", "אם",
    "או", "כי", "אבל", "מה", "איך", "למה", "מתי", "איפה", "כמה",
    "יש", "אין", "היה", "להיות", "יכול", "צריך", "רוצה", "אפשר",
    "כל", "הרבה", "מאוד", "עוד", "כבר", "עכשיו", "פה", "שם",
  ]);
  return words.filter(w => !stopWords.has(w));
}

interface SearchResult {
  lessonId: number;
  lessonTitle: string;
  sectionTitle: string | null;
  chunkType: string;
  content: string;
  relevanceScore: number;
}

/**
 * Search course content for relevant chunks
 * Returns top N most relevant chunks for the given query
 */
export async function searchCourseContent(
  query: string,
  maxResults: number = 5
): Promise<SearchResult[]> {
  const db = await getDb();
  if (!db) return [];

  const searchTerms = extractSearchTerms(query);
  if (searchTerms.length === 0) return [];

  // Build LIKE conditions for keyword matching
  const conditions = searchTerms.map(term =>
    or(
      like(courseContentChunks.keywords, `%${term}%`),
      like(courseContentChunks.content, `%${term}%`)
    )
  );

  // Query with at least one matching term
  const results = await db
    .select({
      lessonId: courseContentChunks.lessonId,
      lessonTitle: courseContentChunks.lessonTitle,
      sectionTitle: courseContentChunks.sectionTitle,
      chunkType: courseContentChunks.chunkType,
      content: courseContentChunks.content,
      keywords: courseContentChunks.keywords,
    })
    .from(courseContentChunks)
    .where(or(...conditions))
    .limit(50); // Get more than needed for scoring

  // Score results by number of matching terms
  const scored: SearchResult[] = results.map(r => {
    const normalizedContent = normalizeHebrew(r.content);
    const normalizedKeywords = normalizeHebrew(r.keywords || "");
    let score = 0;

    for (const term of searchTerms) {
      // Content match
      if (normalizedContent.includes(term)) score += 2;
      // Keyword match
      if (normalizedKeywords.includes(term)) score += 1;
      // Title match (bonus)
      if (normalizeHebrew(r.lessonTitle).includes(term)) score += 3;
      if (r.sectionTitle && normalizeHebrew(r.sectionTitle).includes(term)) score += 3;
    }

    // Boost certain chunk types
    if (r.chunkType === "section") score *= 1.2;
    if (r.chunkType === "highlight") score *= 1.1;
    if (r.chunkType === "example") score *= 1.0;
    if (r.chunkType === "keyPoint") score *= 1.3;

    return {
      lessonId: r.lessonId,
      lessonTitle: r.lessonTitle,
      sectionTitle: r.sectionTitle,
      chunkType: r.chunkType,
      content: r.content,
      relevanceScore: score,
    };
  });

  // Sort by relevance and return top N
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);
  return scored.slice(0, maxResults);
}

/**
 * Format search results into context string for the AI
 */
export function formatRAGContext(results: SearchResult[]): string {
  if (results.length === 0) return "";

  const lines: string[] = ["--- תוכן רלוונטי מהקורס ---"];
  
  for (const r of results) {
    const source = r.sectionTitle 
      ? `[שיעור: ${r.lessonTitle} | נושא: ${r.sectionTitle}]`
      : `[שיעור: ${r.lessonTitle}]`;
    lines.push(`${source}\n${r.content}\n`);
  }

  lines.push("--- סוף תוכן רלוונטי ---");
  return lines.join("\n");
}
