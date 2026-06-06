import { pgTable, serial, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notariesTable = pgTable("notaries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name").notNull(),
  businessNumber: text("business_number").notNull(),
  officeName: text("office_name"),
  officeAddress: text("office_address"),
  licenseNumber: text("license_number"),
  taxNumber: text("tax_number"),
  municipality: text("municipality"),
  workingHours: text("working_hours"),
  city: text("city").notNull(),
  address: text("address"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  website: text("website"),
  certificationNumber: text("certification_number"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  iban: text("iban"),
  // Document storage keys (Supabase Storage paths)
  professionalLicenseUrl: text("professional_license_url"),
  govCertUrl: text("gov_cert_url"),
  identityDocFrontUrl: text("identity_doc_front_url"),
  identityDocBackUrl: text("identity_doc_back_url"),
  selfieUrl: text("selfie_url"),
  officePhotos: jsonb("office_photos").$type<string[]>().default([]),
  adminNotes: text("admin_notes"),
  status: text("status").notNull().default("pending"),
  // pending | approved | rejected | suspended | more_info_requested
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertNotarySchema = createInsertSchema(notariesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertNotary = z.infer<typeof insertNotarySchema>;
export type Notary = typeof notariesTable.$inferSelect;
