import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const translationRequestsTable = pgTable("translation_requests", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  sourceLanguage: text("source_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  serviceType: text("service_type").notNull(),
  // normal | urgent | certified | notarization | legalization
  documentUrls: jsonb("document_urls").$type<string[]>().default([]),
  pageCount: text("page_count"),
  wordCount: text("word_count"),
  deadline: timestamp("deadline"),
  assignedTranslatorId: text("assigned_translator_id"),
  status: text("status").notNull().default("open"),
  // open | assigned | in_progress | review | completed | cancelled
  budget: text("budget"),
  notes: text("notes"),
  completedFileUrls: jsonb("completed_file_urls").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTranslationRequestSchema = createInsertSchema(translationRequestsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTranslationRequest = z.infer<typeof insertTranslationRequestSchema>;
export type TranslationRequest = typeof translationRequestsTable.$inferSelect;
