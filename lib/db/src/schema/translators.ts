import { pgTable, serial, text, timestamp, numeric, jsonb } from "drizzle-orm/pg-core";
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
  yearsExperience: text("years_experience"),
  education: text("education"),
  pricePerPage: numeric("price_per_page", { precision: 10, scale: 2 }),
  pricePerWord: numeric("price_per_word", { precision: 10, scale: 4 }),
  averageDeliveryTime: text("average_delivery_time"),
  availability: text("availability"), // full_time | part_time | weekends
  iban: text("iban"),
  taxNumber: text("tax_number"),
  portfolioUrl: text("portfolio_url"),
  diplomaInfo: text("diploma_info"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  // Document storage keys (Supabase Storage paths)
  diplomaUrl: text("diploma_url"),
  certificationUrl: text("certification_url"),
  licenseUrl: text("license_url"),
  cvUrl: text("cv_url"),
  identityDocFrontUrl: text("identity_doc_front_url"),
  identityDocBackUrl: text("identity_doc_back_url"),
  selfieUrl: text("selfie_url"),
  certificates: jsonb("certificates").$type<string[]>().default([]),
  adminNotes: text("admin_notes"),
  status: text("status").notNull().default("pending"),
  // pending | approved | rejected | suspended | more_info_requested
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTranslatorSchema = createInsertSchema(translatorsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTranslator = z.infer<typeof insertTranslatorSchema>;
export type Translator = typeof translatorsTable.$inferSelect;
