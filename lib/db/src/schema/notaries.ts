import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const notariesTable = pgTable("notaries", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  businessName: text("business_name").notNull(),
  businessNumber: text("business_number").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  certificationNumber: text("certification_number"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertNotarySchema = createInsertSchema(notariesTable).omit({ id: true, createdAt: true });
export type InsertNotary = z.infer<typeof insertNotarySchema>;
export type Notary = typeof notariesTable.$inferSelect;
