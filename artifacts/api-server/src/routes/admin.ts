import { Router } from "express";
import { db, usersTable, notariesTable, translatorsTable, coursesTable, adsTable } from "@workspace/db";
import { eq, count, gte, sql } from "drizzle-orm";

const router = Router();

router.get("/admin/stats", async (req, res) => {
  const [users] = await db.select({ count: count() }).from(usersTable);
  const [notaries] = await db.select({ count: count() }).from(notariesTable).where(eq(notariesTable.status, "approved"));
  const [translators] = await db.select({ count: count() }).from(translatorsTable).where(eq(translatorsTable.status, "approved"));
  const [courses] = await db.select({ count: count() }).from(coursesTable).where(eq(coursesTable.isActive, true));
  const [ads] = await db.select({ count: count() }).from(adsTable).where(eq(adsTable.isActive, true));
  const [pendingNotaries] = await db.select({ count: count() }).from(notariesTable).where(eq(notariesTable.status, "pending"));
  const [pendingTranslators] = await db.select({ count: count() }).from(translatorsTable).where(eq(translatorsTable.status, "pending"));

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [recentRegs] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo));

  res.json({
    totalUsers: users.count,
    totalNotaries: notaries.count,
    totalTranslators: translators.count,
    totalCourses: courses.count,
    totalAds: ads.count,
    pendingApprovals: pendingNotaries.count + pendingTranslators.count,
    recentRegistrations: recentRegs.count,
  });
});

router.get("/admin/pending", async (req, res) => {
  const pendingNotaries = await db.select().from(notariesTable).where(eq(notariesTable.status, "pending"));
  const pendingTranslators = await db.select().from(translatorsTable).where(eq(translatorsTable.status, "pending"));
  res.json({
    notaries: pendingNotaries.map(n => ({ ...n, createdAt: n.createdAt.toISOString() })),
    translators: pendingTranslators.map(t => ({ ...t, createdAt: t.createdAt.toISOString() })),
  });
});

router.post("/admin/approve/:userId", async (req, res) => {
  const userId = req.params.userId;
  // Try notary first
  const [notary] = await db.update(notariesTable).set({ status: "approved" }).where(eq(notariesTable.userId, userId)).returning();
  if (notary) {
    await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, userId));
    res.json({ ...notary, createdAt: notary.createdAt.toISOString() }); return;
  }
  // Try translator
  const [translator] = await db.update(translatorsTable).set({ status: "approved" }).where(eq(translatorsTable.userId, userId)).returning();
  if (translator) {
    await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, userId));
    res.json({ ...translator, createdAt: translator.createdAt.toISOString() }); return;
  }
  res.status(404).json({ error: "User not found" });
});

router.post("/admin/reject/:userId", async (req, res) => {
  const userId = req.params.userId;
  const [notary] = await db.update(notariesTable).set({ status: "rejected" }).where(eq(notariesTable.userId, userId)).returning();
  if (notary) {
    await db.update(usersTable).set({ status: "suspended" }).where(eq(usersTable.id, userId));
    res.json({ ...notary, createdAt: notary.createdAt.toISOString() }); return;
  }
  const [translator] = await db.update(translatorsTable).set({ status: "rejected" }).where(eq(translatorsTable.userId, userId)).returning();
  if (translator) {
    await db.update(usersTable).set({ status: "suspended" }).where(eq(usersTable.id, userId));
    res.json({ ...translator, createdAt: translator.createdAt.toISOString() }); return;
  }
  res.status(404).json({ error: "User not found" });
});

export default router;
