import { Router } from "express";
import { db, messagesTable } from "@workspace/db";
import { eq, or, and, desc } from "drizzle-orm";

const router = Router();

// Get conversation between two users
router.get("/messages/:partnerId", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(
      or(
        and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, req.params.partnerId)),
        and(eq(messagesTable.senderId, req.params.partnerId), eq(messagesTable.receiverId, userId))
      )
    )
    .orderBy(desc(messagesTable.createdAt))
    .limit(100);
  res.json(messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

// Send a message
router.post("/messages", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { receiverId, content, orderId, requestId, attachmentUrl } = req.body;
  if (!receiverId || !content) { res.status(400).json({ error: "receiverId and content required" }); return; }
  const [message] = await db.insert(messagesTable).values({
    senderId: userId,
    receiverId,
    content,
    orderId: orderId ?? null,
    requestId: requestId ?? null,
    attachmentUrl: attachmentUrl ?? null,
  }).returning();
  res.status(201).json({ ...message, createdAt: message.createdAt.toISOString() });
});

// Get all conversations (unique partners) for the current user
router.get("/messages", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const messages = await db
    .select()
    .from(messagesTable)
    .where(or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)))
    .orderBy(desc(messagesTable.createdAt));
  res.json(messages.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

export default router;
