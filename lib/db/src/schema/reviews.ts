import { pgTable, serial, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull(),
  providerId: text("provider_id").notNull(),
  providerType: text("provider_type").notNull(), // translator | notary
  orderId: text("order_id").notNull(),
  rating: integer("rating").notNull(), // 1-5
  comment: text("comment"),
  adminApproved: text("admin_approved").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReviewSchema = createInsertSchema(reviewsTable).omit({ id: true, createdAt: true });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
