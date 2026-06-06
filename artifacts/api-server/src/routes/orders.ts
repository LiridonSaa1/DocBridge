import { Router } from "express";
import { db, ordersTable, notificationsTable } from "@workspace/db";
import { eq, or, desc } from "drizzle-orm";
import { logAction } from "../services/audit";
import { createNotification } from "../services/notifications";

const router = Router();

// Get orders for current user (as customer or provider)
router.get("/orders", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const orders = await db
    .select()
    .from(ordersTable)
    .where(or(eq(ordersTable.customerId, userId), eq(ordersTable.providerId, userId)))
    .orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    deadline: o.deadline?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
  })));
});

// Get single order
router.get("/orders/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [order] = await db.select().from(ordersTable).where(eq(ordersTable.id, parseInt(req.params.id)));
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    deadline: order.deadline?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
  });
});

// Create order (from a translation request, accepted by provider)
router.post("/orders", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { requestId, customerId, price, currency, deadline, providerType } = req.body;
  if (!requestId || !customerId) { res.status(400).json({ error: "requestId and customerId are required" }); return; }
  const [order] = await db.insert(ordersTable).values({
    requestId,
    customerId,
    providerId: userId,
    providerType: providerType ?? "translator",
    price: price ?? null,
    currency: currency ?? "ALL",
    deadline: deadline ? new Date(deadline) : null,
    status: "pending",
  }).returning();
  await createNotification(customerId, "order_update", "Ofertë e re", "Keni marrë një ofertë të re për kërkesën tuaj.");
  await logAction("order_created", { userId, entityType: "order", entityId: String(order.id), req });
  res.status(201).json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    deadline: order.deadline?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
  });
});

// Update order status
router.patch("/orders/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { status, completedFileUrls, customerRating, customerReview, invoiceUrl } = req.body;
  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updateData.status = status;
  if (completedFileUrls !== undefined) updateData.completedFileUrls = completedFileUrls;
  if (customerRating !== undefined) updateData.customerRating = customerRating;
  if (customerReview !== undefined) updateData.customerReview = customerReview;
  if (invoiceUrl !== undefined) updateData.invoiceUrl = invoiceUrl;
  if (status === "completed") updateData.completedAt = new Date();
  const [order] = await db.update(ordersTable).set(updateData as any).where(eq(ordersTable.id, parseInt(req.params.id))).returning();
  if (!order) { res.status(404).json({ error: "Order not found" }); return; }
  await logAction("order_updated", { userId, entityType: "order", entityId: req.params.id, metadata: { status }, req });
  res.json({
    ...order,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    deadline: order.deadline?.toISOString() ?? null,
    completedAt: order.completedAt?.toISOString() ?? null,
  });
});

export default router;
