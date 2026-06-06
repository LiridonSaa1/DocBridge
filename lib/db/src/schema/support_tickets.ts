import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const supportTicketsTable = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull().default("general"),
  // general | technical | billing | complaint | verification
  priority: text("priority").notNull().default("normal"),
  // low | normal | high | urgent
  status: text("status").notNull().default("open"),
  // open | in_progress | resolved | closed
  assignedTo: text("assigned_to"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertSupportTicketSchema = createInsertSchema(supportTicketsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type SupportTicket = typeof supportTicketsTable.$inferSelect;
