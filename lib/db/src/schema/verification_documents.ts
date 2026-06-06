import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const verificationDocumentsTable = pgTable("verification_documents", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  documentType: text("document_type").notNull(), // passport | national_id | driver_license
  frontUrl: text("front_url"),
  backUrl: text("back_url"),
  selfieUrl: text("selfie_url"),
  status: text("status").notNull().default("pending"),
  // pending | verified | rejected | flagged
  flagReason: text("flag_reason"), // duplicate_id | selfie_mismatch | edited_document
  adminNotes: text("admin_notes"),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertVerificationDocumentSchema = createInsertSchema(verificationDocumentsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertVerificationDocument = z.infer<typeof insertVerificationDocumentSchema>;
export type VerificationDocument = typeof verificationDocumentsTable.$inferSelect;
