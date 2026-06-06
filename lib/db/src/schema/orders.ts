import { pgTable, serial, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  requestId: text("request_id").notNull(),
  customerId: text("customer_id").notNull(),
  providerId: text("provider_id").notNull(), // translator or notary userId
  providerType: text("provider_type").notNull(), // translator | notary
  price: numeric("price", { precision: 10, scale: 2 }),
  currency: text("currency").notNull().default("ALL"),
  deadline: timestamp("deadline"),
  status: text("status").notNull().default("pending"),
  // pending | accepted | in_progress | delivered | completed | disputed | cancelled | refunded
  invoiceUrl: text("invoice_url"),
  completedFileUrls: text("completed_file_urls").array().default([]),
  customerRating: text("customer_rating"),
  customerReview: text("customer_review"),
  adminNotes: text("admin_notes"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
