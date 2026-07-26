/**
 * Course Content Indexer for RAG
 * Splits course lessons into searchable chunks and stores them in DB.
 * Run this whenever course content is updated.
 */
import { getDb } from "./db";
import { courseContentChunks } from "../drizzle/schema";
import { eq } from "drizzle-orm";

interface ContentSection {
  title: string;
  text: string;
  highlight?: string;
  example?: string;
}

interface LessonData {
  id: number;
  title: string;
  module: number;
  moduleTitle: string;
  description: string;
  content: {
    intro: string;
    sections: ContentSection[];
    summary: string;
  };
  keyPoints: string[];
  exercises: string[];
  reviewSummary?: string[];
}

/**
 * Extract keywords from Hebrew text for search matching
 */
function extractKeywords(text: string): string {
  // Remove nikud and punctuation, split into words
  const cleaned = text
    .replace(/[\u0591-\u05C7]/g, "") // remove nikud
    .replace(/[^\u0590-\u05FF\w\s]/g, " ") // keep Hebrew + alphanumeric
    .toLowerCase();
  
  // Get unique words longer than 2 chars
  const words = cleaned.split(/\s+/).filter(w => w.length > 2);
  const unique = Array.from(new Set(words));
  return unique.join(" ");
}

/**
 * Index a single lesson into chunks
 */
function lessonToChunks(lesson: LessonData) {
  const chunks: Array<{
    lessonId: number;
    moduleId: number;
    lessonTitle: string;
    sectionTitle: string | null;
    chunkType: string;
    content: string;
    keywords: string;
  }> = [];

  const base = {
    lessonId: lesson.id,
    moduleId: lesson.module,
    lessonTitle: lesson.title,
  };

  // Intro
  if (lesson.content.intro) {
    chunks.push({
      ...base,
      sectionTitle: null,
      chunkType: "intro",
      content: lesson.content.intro,
      keywords: extractKeywords(lesson.content.intro),
    });
  }

  // Sections
  for (const section of lesson.content.sections) {
    // Main text
    chunks.push({
      ...base,
      sectionTitle: section.title,
      chunkType: "section",
      content: section.text,
      keywords: extractKeywords(section.title + " " + section.text),
    });

    // Highlight
    if (section.highlight) {
      chunks.push({
        ...base,
        sectionTitle: section.title,
        chunkType: "highlight",
        content: section.highlight,
        keywords: extractKeywords(section.highlight),
      });
    }

    // Example
    if (section.example) {
      chunks.push({
        ...base,
        sectionTitle: section.title,
        chunkType: "example",
        content: section.example,
        keywords: extractKeywords(section.example),
      });
    }
  }

  // Summary
  if (lesson.content.summary) {
    chunks.push({
      ...base,
      sectionTitle: null,
      chunkType: "summary",
      content: lesson.content.summary,
      keywords: extractKeywords(lesson.content.summary),
    });
  }

  // Key Points
  for (const point of lesson.keyPoints) {
    chunks.push({
      ...base,
      sectionTitle: null,
      chunkType: "keyPoint",
      content: point,
      keywords: extractKeywords(point),
    });
  }

  // Exercises
  for (const exercise of lesson.exercises) {
    chunks.push({
      ...base,
      sectionTitle: null,
      chunkType: "exercise",
      content: exercise,
      keywords: extractKeywords(exercise),
    });
  }

  // Description
  if (lesson.description) {
    chunks.push({
      ...base,
      sectionTitle: null,
      chunkType: "description",
      content: lesson.description,
      keywords: extractKeywords(lesson.description),
    });
  }

  return chunks;
}

/**
 * Re-index all course content (clears existing and re-inserts)
 */
export async function indexAllCourseContent(lessons: LessonData[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Clear existing chunks
  await db.delete(courseContentChunks).execute();
  
  // Generate all chunks
  const allChunks: Array<{
    lessonId: number;
    moduleId: number;
    lessonTitle: string;
    sectionTitle: string | null;
    chunkType: string;
    content: string;
    keywords: string;
  }> = [];
  
  for (const lesson of lessons) {
    const chunks = lessonToChunks(lesson);
    allChunks.push(...chunks);
  }

  // Insert in batches of 50
  for (let i = 0; i < allChunks.length; i += 50) {
    const batch = allChunks.slice(i, i + 50);
    await db.insert(courseContentChunks).values(batch as any);
  }

  return { totalChunks: allChunks.length, totalLessons: lessons.length };
}

/**
 * Index a single lesson (for incremental updates)
 */
export async function indexSingleLesson(lesson: LessonData) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Remove existing chunks for this lesson
  await db.delete(courseContentChunks).where(eq(courseContentChunks.lessonId, lesson.id));
  
  // Insert new chunks
  const chunks = lessonToChunks(lesson);
  if (chunks.length > 0) {
    await db.insert(courseContentChunks).values(chunks as any);
  }

  return { chunksInserted: chunks.length };
}
