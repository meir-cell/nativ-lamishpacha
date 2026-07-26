import { boolean, int, mysqlEnum, mysqlTable, text, tinyint, timestamp, varchar } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// טבלת פניות מהאתר
export const contacts = mysqlTable("contacts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["new", "read", "replied"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = typeof contacts.$inferInsert;

// ─── NLP Practitioner Course Tables ───────────────────────────────────────────

/**
 * Incoming lesson content updates proposed by the AI research agent.
 */
export const lessonUpdates = mysqlTable("lesson_updates", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  updateType: mysqlEnum("updateType", ["section", "keyPoint", "exercise"]).notNull(),
  title: varchar("title", { length: 500 }),
  body: text("body"),
  highlight: varchar("highlight", { length: 500 }),
  source: text("source"),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewNote: text("reviewNote"),
  researchedAt: timestamp("researchedAt").defaultNow().notNull(),
  reviewedAt: timestamp("reviewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonUpdate = typeof lessonUpdates.$inferSelect;
export type InsertLessonUpdate = typeof lessonUpdates.$inferInsert;

/**
 * Approved extra sections displayed to students in the lesson content tab.
 */
export const lessonExtraSections = mysqlTable("lesson_extra_sections", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  body: text("body").notNull(),
  highlight: varchar("highlight", { length: 500 }),
  source: text("source"),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  sortOrder: int("sortOrder").default(0).notNull(),
  isVisible: boolean("isVisible").default(true).notNull(),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonExtraSection = typeof lessonExtraSections.$inferSelect;
export type InsertLessonExtraSection = typeof lessonExtraSections.$inferInsert;

/**
 * Approved extra key points displayed to students.
 */
export const lessonExtraKeyPoints = mysqlTable("lesson_extra_key_points", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  text: text("text").notNull(),
  source: text("source"),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  isVisible: boolean("isVisible").default(true).notNull(),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonExtraKeyPoint = typeof lessonExtraKeyPoints.$inferSelect;
export type InsertLessonExtraKeyPoint = typeof lessonExtraKeyPoints.$inferInsert;

/**
 * Approved extra exercises for lessons.
 */
export const lessonExtraExercises = mysqlTable("lesson_extra_exercises", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  text: text("text").notNull(),
  source: text("source"),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  isVisible: boolean("isVisible").default(true).notNull(),
  approvedAt: timestamp("approvedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonExtraExercise = typeof lessonExtraExercises.$inferSelect;
export type InsertLessonExtraExercise = typeof lessonExtraExercises.$inferInsert;

/**
 * Research run log — one row per AGENT cron execution.
 */
export const researchRuns = mysqlTable("research_runs", {
  id: int("id").autoincrement().primaryKey(),
  taskUid: varchar("taskUid", { length: 65 }),
  updatesSubmitted: int("updatesSubmitted").default(0).notNull(),
  summary: text("summary"),
  error: text("error"),
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success").notNull(),
  ranAt: timestamp("ranAt").defaultNow().notNull(),
});
export type ResearchRun = typeof researchRuns.$inferSelect;
export type InsertResearchRun = typeof researchRuns.$inferInsert;

/**
 * Course registrations — students who registered for the NLP course.
 */
export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  phone: varchar("phone", { length: 30 }).notNull(),
  passwordHash: varchar("passwordHash", { length: 100 }).notNull(),
  token: varchar("token", { length: 512 }).notNull().default(""),
  emailOptIn: boolean("emailOptIn").default(false).notNull(),
  unsubscribeToken: varchar("unsubscribeToken", { length: 128 }),
  firstLessonEmailSent: boolean("firstLessonEmailSent").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  passwordResetToken: varchar("passwordResetToken", { length: 128 }),
  passwordResetExpiry: timestamp("passwordResetExpiry"),
  lastActivityAt: timestamp("lastActivityAt"),
  reEngagementEmailSent: boolean("reEngagementEmailSent").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/**
 * Lesson progress — tracks which lessons each student has completed.
 */
export const lessonProgress = mysqlTable("lesson_progress", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  lessonId: int("lessonId").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type LessonProgress = typeof lessonProgress.$inferSelect;
export type InsertLessonProgress = typeof lessonProgress.$inferInsert;

/**
 * Module exam results — tracks exam scores per module per student.
 */
export const moduleExamResults = mysqlTable("module_exam_results", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  moduleId: int("moduleId").notNull(),
  score: int("score").notNull(),
  passed: boolean("passed").notNull(),
  attempt: int("attempt").default(1).notNull(),
  examVersion: varchar("examVersion", { length: 1 }).default("A").notNull(),
  completedAt: timestamp("completedAt").defaultNow().notNull(),
});
export type ModuleExamResult = typeof moduleExamResults.$inferSelect;
export type InsertModuleExamResult = typeof moduleExamResults.$inferInsert;

/**
 * Satisfaction surveys — student feedback after completing the course.
 */
export const satisfactionSurveys = mysqlTable("satisfaction_surveys", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  moduleId: int("moduleId").notNull(),
  overallRating: int("overallRating").notNull(),
  contentRating: int("contentRating").notNull(),
  uxRating: int("uxRating").notNull(),
  relevanceRating: int("relevanceRating").notNull(),
  recommendRating: int("recommendRating").notNull(),
  comment: text("comment"),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});
export type SatisfactionSurvey = typeof satisfactionSurveys.$inferSelect;
export type InsertSatisfactionSurvey = typeof satisfactionSurveys.$inferInsert;

/**
 * Lesson positions — saves where each student left off in a lesson (timestamp).
 */
export const lessonPositions = mysqlTable("lesson_positions", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull().unique(),
  lessonId: int("lessonId").notNull(),
  slideIndex: int("slideIndex").default(0).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type LessonPosition = typeof lessonPositions.$inferSelect;
export type InsertLessonPosition = typeof lessonPositions.$inferInsert;

/**
 * Certificates — issued to students who completed all modules.
 */
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registrationId").notNull(),
  fullName: varchar("fullName", { length: 200 }).notNull(),
  totalHours: int("totalHours").notNull(),
  moduleCount: int("moduleCount").notNull(),
  lessonCount: int("lessonCount").notNull(),
  certNumber: varchar("certNumber", { length: 30 }).notNull().unique(),
  pdfKey: varchar("pdfKey", { length: 500 }),
  pdfUrl: varchar("pdfUrl", { length: 1000 }),
  emailSent: boolean("emailSent").default(false).notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
});
export type Certificate = typeof certificates.$inferSelect;
export type InsertCertificate = typeof certificates.$inferInsert;

/**
 * Pronunciation overrides dictionary — manual corrections for TTS pronunciation.
 */
export const pronunciationOverrides = mysqlTable("pronunciation_overrides", {
  id: int("id").autoincrement().primaryKey(),
  originalWord: varchar("originalWord", { length: 255 }).notNull().unique(),
  replacement: varchar("replacement", { length: 255 }).notNull(),
  note: text("note"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PronunciationOverride = typeof pronunciationOverrides.$inferSelect;
export type InsertPronunciationOverride = typeof pronunciationOverrides.$inferInsert;

/**
 * Indexed course content chunks for RAG (AI chatbot).
 */
export const courseContentChunks = mysqlTable("course_content_chunks", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  moduleId: int("moduleId").notNull(),
  lessonTitle: varchar("lessonTitle", { length: 255 }).notNull(),
  sectionTitle: varchar("sectionTitle", { length: 255 }),
  chunkType: varchar("chunkType", { length: 50 }).notNull(),
  content: text("content").notNull(),
  keywords: text("keywords"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CourseContentChunk = typeof courseContentChunks.$inferSelect;
export type InsertCourseContentChunk = typeof courseContentChunks.$inferInsert;

/**
 * Global TTS settings managed by admin.
 */
export const ttsSettings = mysqlTable("tts_settings", {
  id: int("id").autoincrement().primaryKey(),
  rate: varchar("rate", { length: 10 }).default("0.88").notNull(),
  pitch: varchar("pitch", { length: 10 }).default("1.02").notNull(),
  sentencePause: int("sentencePause").default(220).notNull(),
  commaPause: int("commaPause").default(100).notNull(),
  prefixPause: int("prefixPause").default(180).notNull(),
  mergeSpacedLetters: tinyint("mergeSpacedLetters").default(1).notNull(),
  stripNikudForTts: tinyint("stripNikudForTts").default(1).notNull(),
  provider: varchar("provider", { length: 20 }).default("openai").notNull(),
  voice: varchar("voice", { length: 30 }).default("nova").notNull(),
  model: varchar("model", { length: 20 }).default("tts-1").notNull(),
  openaiSpeed: varchar("openaiSpeed", { length: 10 }).default("1.0").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type TtsSettings = typeof ttsSettings.$inferSelect;
export type InsertTtsSettings = typeof ttsSettings.$inferInsert;
