import { pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const messagesTable = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  orderId: text("order_id"),
  requestId: text("request_id"),
  content: text("content").notNull(),
  attachmentUrl: text("attachment_url"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMessageSchema = createInsertSchema(messagesTable).omit({ id: true, createdAt: true });
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messagesTable.$inferSelect;
