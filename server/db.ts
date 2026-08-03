import { desc, eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  contacts, InsertContact, InsertUser, users,
  lessonUpdates, lessonExtraSections, lessonExtraKeyPoints,
  lessonExtraExercises, researchRuns,
  articles, registrations,
  type InsertLessonUpdate,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && ENV.databaseUrl) {
    try {
      _db = drizzle(ENV.databaseUrl);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ── Contact queries ────────────────────────────────────────────────────────────

export async function createContact(data: InsertContact) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(contacts).values(data);
}

export async function getAllContacts() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.select().from(contacts).orderBy(desc(contacts.createdAt));
}

export async function updateContactStatus(id: number, status: "new" | "read" | "replied") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contacts).set({ status }).where(eq(contacts.id, id));
}

export async function deleteContact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contacts).where(eq(contacts.id, id));
}

export async function getContactStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const all = await db.select().from(contacts);
  return {
    total: all.length,
    newCount: all.filter(c => c.status === "new").length,
    readCount: all.filter(c => c.status === "read").length,
    repliedCount: all.filter(c => c.status === "replied").length,
  };
}

// ── NLP Lesson Updates (pending review) ──────────────────────────────────────

export async function getPendingUpdates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonUpdates)
    .where(eq(lessonUpdates.status, "pending"))
    .orderBy(desc(lessonUpdates.researchedAt));
}

export async function getAllUpdates(limit = 200) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonUpdates)
    .orderBy(desc(lessonUpdates.researchedAt))
    .limit(limit);
}

export async function getUpdateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(lessonUpdates).where(eq(lessonUpdates.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function insertLessonUpdates(updates: InsertLessonUpdate[]) {
  if (updates.length === 0) return;
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(lessonUpdates).values(updates);
}

export async function approveUpdate(id: number, reviewNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const update = await getUpdateById(id);
  if (!update) throw new Error("Update not found");
  await db.update(lessonUpdates)
    .set({ status: "approved", reviewedAt: new Date(), reviewNote: reviewNote ?? null, updatedAt: new Date() })
    .where(eq(lessonUpdates.id, id));
  if (update.updateType === "section" && update.title && update.body) {
    const existing = await db.select().from(lessonExtraSections)
      .where(eq(lessonExtraSections.lessonId, update.lessonId));
    const maxOrder = existing.reduce((m, r) => Math.max(m, r.sortOrder), 0);
    await db.insert(lessonExtraSections).values({
      lessonId: update.lessonId,
      title: update.title,
      body: update.body,
      highlight: update.highlight ?? null,
      source: update.source ?? null,
      sourceUrl: update.sourceUrl ?? null,
      sortOrder: maxOrder + 1,
      isVisible: true,
      approvedAt: new Date(),
    });
  } else if (update.updateType === "keyPoint" && update.title) {
    await db.insert(lessonExtraKeyPoints).values({
      lessonId: update.lessonId,
      text: update.title,
      source: update.source ?? null,
      sourceUrl: update.sourceUrl ?? null,
      isVisible: true,
      approvedAt: new Date(),
    });
  } else if (update.updateType === "exercise" && update.title) {
    await db.insert(lessonExtraExercises).values({
      lessonId: update.lessonId,
      text: update.title,
      source: update.source ?? null,
      sourceUrl: update.sourceUrl ?? null,
      isVisible: true,
      approvedAt: new Date(),
    });
  }
}

export async function rejectUpdate(id: number, reviewNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(lessonUpdates)
    .set({ status: "rejected", reviewedAt: new Date(), reviewNote: reviewNote ?? null, updatedAt: new Date() })
    .where(eq(lessonUpdates.id, id));
}

// ── Approved content (student-facing) ────────────────────────────────────────

export async function getExtraSectionsForLesson(lessonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonExtraSections)
    .where(and(eq(lessonExtraSections.lessonId, lessonId), eq(lessonExtraSections.isVisible, true)))
    .orderBy(lessonExtraSections.sortOrder);
}

export async function getExtraKeyPointsForLesson(lessonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonExtraKeyPoints)
    .where(and(eq(lessonExtraKeyPoints.lessonId, lessonId), eq(lessonExtraKeyPoints.isVisible, true)));
}

export async function getExtraExercisesForLesson(lessonId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonExtraExercises)
    .where(and(eq(lessonExtraExercises.lessonId, lessonId), eq(lessonExtraExercises.isVisible, true)));
}

export async function getLessonsWithNewContent(): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const sections = await db.select({ lessonId: lessonExtraSections.lessonId }).from(lessonExtraSections)
    .where(eq(lessonExtraSections.isVisible, true));
  const kps = await db.select({ lessonId: lessonExtraKeyPoints.lessonId }).from(lessonExtraKeyPoints)
    .where(eq(lessonExtraKeyPoints.isVisible, true));
  const exs = await db.select({ lessonId: lessonExtraExercises.lessonId }).from(lessonExtraExercises)
    .where(eq(lessonExtraExercises.isVisible, true));
  const ids = new Set([...sections, ...kps, ...exs].map(r => r.lessonId));
  return Array.from(ids);
}

// ── Research run log ──────────────────────────────────────────────────────────

export async function logResearchRun(data: {
  taskUid?: string;
  updatesSubmitted: number;
  summary?: string;
  error?: string;
  status: "success" | "partial" | "failed";
}) {
  const db = await getDb();
  if (!db) return;
  return db.insert(researchRuns).values({
    taskUid: data.taskUid ?? null,
    updatesSubmitted: data.updatesSubmitted,
    summary: data.summary ?? null,
    error: data.error ?? null,
    status: data.status,
    ranAt: new Date(),
  });
}

export async function getRecentResearchRuns(limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(researchRuns).orderBy(desc(researchRuns.ranAt)).limit(limit);
}

// ── Dashboard Statistics ──────────────────────────────────────────────────────

export async function getDashboardStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Contacts by month (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const allContacts = await db.select().from(contacts);
  const allArticles = await db.select({ id: articles.id, published: articles.published, createdAt: articles.createdAt }).from(articles);
  const allRegistrations = await db.select({ id: registrations.id, createdAt: registrations.createdAt }).from(registrations);

  // Monthly contacts (last 6 months)
  const monthlyContacts: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyContacts[key] = 0;
  }
  for (const c of allContacts) {
    const d = new Date(c.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyContacts) monthlyContacts[key]++;
  }

  // Monthly registrations (last 6 months)
  const monthlyRegistrations: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyRegistrations[key] = 0;
  }
  for (const r of allRegistrations) {
    const d = new Date(r.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyRegistrations) monthlyRegistrations[key]++;
  }

  // Contact status breakdown
  const contactStatus = {
    new: allContacts.filter(c => c.status === "new").length,
    read: allContacts.filter(c => c.status === "read").length,
    replied: allContacts.filter(c => c.status === "replied").length,
  };

  return {
    totals: {
      contacts: allContacts.length,
      articles: allArticles.length,
      publishedArticles: allArticles.filter(a => a.published).length,
      registrations: allRegistrations.length,
      newContacts: contactStatus.new,
    },
    contactStatus,
    monthlyContacts: Object.entries(monthlyContacts).map(([month, count]) => ({ month, count })),
    monthlyRegistrations: Object.entries(monthlyRegistrations).map(([month, count]) => ({ month, count })),
  };
}
