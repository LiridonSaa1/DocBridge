import { Router } from "express";
import { db, usersTable, notificationsTable, auditLogsTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";
import { logAction } from "../services/audit";



const router = Router();

// Register / upsert a user record after Supabase signup
router.post("/users/register", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { email, role, firstName, lastName, fullName, phone, personalNumber, dateOfBirth, gender, country, city, address } = req.body;
  const [user] = await db.insert(usersTable).values({
    id: userId,
    email,
    role: role ?? "customer",
    firstName: firstName ?? null,
    lastName: lastName ?? null,
    fullName: fullName ?? (firstName && lastName ? `${firstName} ${lastName}` : null),
    phone: phone ?? null,
    personalNumber: personalNumber ?? null,
    dateOfBirth: dateOfBirth ?? null,
    gender: gender ?? null,
    country: country ?? null,
    city: city ?? null,
    address: address ?? null,
    status: "pending",
    verificationStatus: "pending_email",
  }).onConflictDoUpdate({
    target: usersTable.id,
    set: {
      role: role ?? "customer",
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      fullName: fullName ?? null,
      phone: phone ?? null,
      country: country ?? null,
      city: city ?? null,
      address: address ?? null,
      updatedAt: new Date(),
    },
  }).returning();
  await logAction("user_registered", { userId, entityType: "user", entityId: userId, metadata: { role }, req });
  res.status(201).json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.get("/users/me", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.get("/users/:id", async (req, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.params.id));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

router.patch("/users/:id", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId || userId !== req.params.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const {
    firstName, lastName, fullName, phone, personalNumber,
    dateOfBirth, gender, country, city, address, avatarUrl
  } = req.body;
  const [user] = await db.update(usersTable).set({
    ...(firstName !== undefined && { firstName }),
    ...(lastName !== undefined && { lastName }),
    ...(fullName !== undefined && { fullName }),
    ...(phone !== undefined && { phone }),
    ...(personalNumber !== undefined && { personalNumber }),
    ...(dateOfBirth !== undefined && { dateOfBirth }),
    ...(gender !== undefined && { gender }),
    ...(country !== undefined && { country }),
    ...(city !== undefined && { city }),
    ...(address !== undefined && { address }),
    ...(avatarUrl !== undefined && { avatarUrl }),
    updatedAt: new Date(),
  }).where(eq(usersTable.id, req.params.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAction("user_profile_updated", { userId, entityType: "user", entityId: req.params.id, req });
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// Mark email as verified (called after Supabase email verification)
router.post("/users/:id/verify-email", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId || userId !== req.params.id) { res.status(403).json({ error: "Forbidden" }); return; }
  const [user] = await db.update(usersTable).set({
    emailVerified: true,
    verificationStatus: "email_verified",
    updatedAt: new Date(),
  }).where(eq(usersTable.id, req.params.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  await logAction("email_verified", { userId, entityType: "user", entityId: req.params.id, req });
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

// Get user notifications
router.get("/users/:id/notifications", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, req.params.id))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
  res.json(notifications.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })));
});

// Mark notification as read
router.patch("/users/:id/notifications/:notifId/read", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(
      eq(notificationsTable.id, parseInt(req.params.notifId)),
      eq(notificationsTable.userId, req.params.id)
    ));
  res.json({ success: true });
});

// Get audit logs for user (admin only or self)
router.get("/users/:id/audit-logs", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const logs = await db
    .select()
    .from(auditLogsTable)
    .where(eq(auditLogsTable.userId, req.params.id))
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(100);
  res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

export default router;
