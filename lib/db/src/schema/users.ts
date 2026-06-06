import { pgTable, text, timestamp, boolean, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("customer"), // customer | translator | notary | admin
  firstName: text("first_name"),
  lastName: text("last_name"),
  fullName: text("full_name"),
  phone: text("phone"),
  personalNumber: text("personal_number"),
  dateOfBirth: date("date_of_birth"),
  gender: text("gender"),
  country: text("country"),
  city: text("city"),
  address: text("address"),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  identityVerified: boolean("identity_verified").notNull().default(false),
  verificationStatus: text("verification_status").notNull().default("pending_email"),
  // pending_email | email_verified | phone_verified | identity_verified | approved | rejected | suspended
  status: text("status").notNull().default("pending"),
  // pending | active | suspended | rejected
  adminNotes: text("admin_notes"),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ createdAt: true, updatedAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
