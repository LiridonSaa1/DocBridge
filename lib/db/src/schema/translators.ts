import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const translatorsTable = pgTable("translators", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name"),
  languages: text("languages").array().notNull().default([]),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  diplomaInfo: text("diploma_info"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTranslatorSchema = createInsertSchema(translatorsTable).omit({ id: true, createdAt: true });
export type InsertTranslator = z.infer<typeof insertTranslatorSchema>;
export type Translator = typeof translatorsTable.$inferSelect;
