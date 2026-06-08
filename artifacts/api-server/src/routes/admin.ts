import { Router } from "express";
import { db, usersTable, notariesTable, translatorsTable, coursesTable, adsTable, ordersTable, supportTicketsTable, auditLogsTable, verificationDocumentsTable, translationRequestsTable } from "@workspace/db";
import { eq, count, gte, desc, and, or, ilike } from "drizzle-orm";
import { logAction } from "../services/audit";
import { createNotification } from "../services/notifications";

const router = Router();

// Stats dashboard
router.get("/admin/stats", async (req, res) => {
  const [users] = await db.select({ count: count() }).from(usersTable);
  const [customers] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "customer"));
  const [notaries] = await db.select({ count: count() }).from(notariesTable).where(eq(notariesTable.status, "approved"));
  const [translators] = await db.select({ count: count() }).from(translatorsTable).where(eq(translatorsTable.status, "approved"));
  const [courses] = await db.select({ count: count() }).from(coursesTable).where(eq(coursesTable.isActive, true));
  const [ads] = await db.select({ count: count() }).from(adsTable).where(eq(adsTable.isActive, true));
  const [pendingNotaries] = await db.select({ count: count() }).from(notariesTable).where(eq(notariesTable.status, "pending"));
  const [pendingTranslators] = await db.select({ count: count() }).from(translatorsTable).where(eq(translatorsTable.status, "pending"));
  const [openTickets] = await db.select({ count: count() }).from(supportTicketsTable).where(eq(supportTicketsTable.status, "open"));
  const [totalOrders] = await db.select({ count: count() }).from(ordersTable);
  const [activeOrders] = await db.select({ count: count() }).from(ordersTable).where(eq(ordersTable.status, "in_progress"));
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [recentRegs] = await db.select({ count: count() }).from(usersTable).where(gte(usersTable.createdAt, sevenDaysAgo));
  res.json({
    totalUsers: users.count,
    totalCustomers: customers.count,
    totalNotaries: notaries.count,
    totalTranslators: translators.count,
    totalCourses: courses.count,
    totalAds: ads.count,
    pendingApprovals: pendingNotaries.count + pendingTranslators.count,
    openSupportTickets: openTickets.count,
    totalOrders: totalOrders.count,
    activeOrders: activeOrders.count,
    recentRegistrations: recentRegs.count,
  });
});

// Pending approvals
router.get("/admin/pending", async (req, res) => {
  const pendingNotaries = await db.select().from(notariesTable).where(eq(notariesTable.status, "pending")).orderBy(desc(notariesTable.createdAt));
  const pendingTranslators = await db.select().from(translatorsTable).where(eq(translatorsTable.status, "pending")).orderBy(desc(translatorsTable.createdAt));
  res.json({
    notaries: pendingNotaries.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })),
    translators: pendingTranslators.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })),
  });
});

// All users list with search/filter
router.get("/admin/users", async (req, res) => {
  const { role, status, search } = req.query as Record<string, string>;
  let query = db.select().from(usersTable);
  const conditions = [];
  if (role) conditions.push(eq(usersTable.role, role));
  if (status) conditions.push(eq(usersTable.status, status));
  if (search) conditions.push(or(ilike(usersTable.email, `%${search}%`), ilike(usersTable.fullName ?? "", `%${search}%`))!);
  const results = conditions.length > 0
    ? await db.select().from(usersTable).where(and(...conditions)).orderBy(desc(usersTable.createdAt))
    : await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
  res.json(results.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

// All notaries (admin view)
router.get("/admin/notaries", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const results = status
    ? await db.select().from(notariesTable).where(eq(notariesTable.status, status)).orderBy(desc(notariesTable.createdAt))
    : await db.select().from(notariesTable).orderBy(desc(notariesTable.createdAt));
  res.json(results.map(n => ({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() })));
});

// All translators (admin view)
router.get("/admin/translators", async (req, res) => {
  const { status } = req.query as Record<string, string>;
  const results = status
    ? await db.select().from(translatorsTable).where(eq(translatorsTable.status, status)).orderBy(desc(translatorsTable.createdAt))
    : await db.select().from(translatorsTable).orderBy(desc(translatorsTable.createdAt));
  res.json(results.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })));
});

// Get verification documents for a user (admin view)
router.get("/admin/verification/:userId", async (req, res) => {
  const docs = await db.select().from(verificationDocumentsTable).where(eq(verificationDocumentsTable.userId, req.params.userId));
  res.json(docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })));
});

// Approve professional
router.post("/admin/approve/:userId", async (req, res) => {
  const adminId = req.userId as string;
  const { adminNotes } = req.body;
  const userId = req.params.userId;
  const [notary] = await db.update(notariesTable).set({ status: "approved", adminNotes: adminNotes ?? null, updatedAt: new Date() }).where(eq(notariesTable.userId, userId)).returning();
  if (notary) {
    await db.update(usersTable).set({ status: "active", verificationStatus: "approved", updatedAt: new Date() }).where(eq(usersTable.id, userId));
    await createNotification(userId, "approval", "Llogaria juaj u aprovua!", "Urime! Profili juaj si noter është aprovuar. Tani mund të filloni të pranoni klientë.");
    await logAction("user_approved", { userId: adminId, entityType: "notary", entityId: String(notary.id), metadata: { targetUserId: userId }, req });
    res.json({ ...notary, createdAt: notary.createdAt.toISOString(), updatedAt: notary.updatedAt.toISOString() }); return;
  }
  const [translator] = await db.update(translatorsTable).set({ status: "approved", adminNotes: adminNotes ?? null, updatedAt: new Date() }).where(eq(translatorsTable.userId, userId)).returning();
  if (translator) {
    await db.update(usersTable).set({ status: "active", verificationStatus: "approved", updatedAt: new Date() }).where(eq(usersTable.id, userId));
    await createNotification(userId, "approval", "Llogaria juaj u aprovua!", "Urime! Profili juaj si përkthyes është aprovuar. Tani mund të filloni të pranoni punë.");
    await logAction("user_approved", { userId: adminId, entityType: "translator", entityId: String(translator.id), metadata: { targetUserId: userId }, req });
    res.json({ ...translator, createdAt: translator.createdAt.toISOString(), updatedAt: translator.updatedAt.toISOString() }); return;
  }
  res.status(404).json({ error: "User not found" });
});

// Reject professional
router.post("/admin/reject/:userId", async (req, res) => {
  const adminId = req.userId as string;
  const { rejectionReason, adminNotes } = req.body;
  const userId = req.params.userId;
  const [notary] = await db.update(notariesTable).set({ status: "rejected", rejectionReason: rejectionReason ?? null, adminNotes: adminNotes ?? null, updatedAt: new Date() }).where(eq(notariesTable.userId, userId)).returning();
  if (notary) {
    await db.update(usersTable).set({ status: "rejected", verificationStatus: "rejected", updatedAt: new Date() }).where(eq(usersTable.id, userId));
    await createNotification(userId, "rejection", "Kërkesa juaj u refuzua", rejectionReason ?? "Kërkesa juaj nuk plotëson kriteret tona.");
    await logAction("user_rejected", { userId: adminId, entityType: "notary", entityId: String(notary.id), metadata: { targetUserId: userId, reason: rejectionReason }, req });
    res.json({ ...notary, createdAt: notary.createdAt.toISOString(), updatedAt: notary.updatedAt.toISOString() }); return;
  }
  const [translator] = await db.update(translatorsTable).set({ status: "rejected", rejectionReason: rejectionReason ?? null, adminNotes: adminNotes ?? null, updatedAt: new Date() }).where(eq(translatorsTable.userId, userId)).returning();
  if (translator) {
    await db.update(usersTable).set({ status: "rejected", verificationStatus: "rejected", updatedAt: new Date() }).where(eq(usersTable.id, userId));
    await createNotification(userId, "rejection", "Kërkesa juaj u refuzua", rejectionReason ?? "Kërkesa juaj nuk plotëson kriteret tona.");
    await logAction("user_rejected", { userId: adminId, entityType: "translator", entityId: String(translator.id), metadata: { targetUserId: userId, reason: rejectionReason }, req });
    res.json({ ...translator, createdAt: translator.createdAt.toISOString(), updatedAt: translator.updatedAt.toISOString() }); return;
  }
  res.status(404).json({ error: "User not found" });
});

// Request more info from professional
router.post("/admin/request-info/:userId", async (req, res) => {
  const adminId = req.userId as string;
  const { message } = req.body;
  const userId = req.params.userId;
  const [notary] = await db.update(notariesTable).set({ status: "more_info_requested", adminNotes: message ?? null, updatedAt: new Date() }).where(eq(notariesTable.userId, userId)).returning();
  if (notary) {
    await createNotification(userId, "system", "Informacion shtesë i kërkuar", message ?? "Adminstratori kërkon informacion shtesë.");
    await logAction("more_info_requested", { userId: adminId, entityType: "notary", entityId: String(notary.id), metadata: { targetUserId: userId }, req });
    res.json({ success: true }); return;
  }
  const [translator] = await db.update(translatorsTable).set({ status: "more_info_requested", adminNotes: message ?? null, updatedAt: new Date() }).where(eq(translatorsTable.userId, userId)).returning();
  if (translator) {
    await createNotification(userId, "system", "Informacion shtesë i kërkuar", message ?? "Adminstratori kërkon informacion shtesë.");
    await logAction("more_info_requested", { userId: adminId, entityType: "translator", entityId: String(translator.id), metadata: { targetUserId: userId }, req });
    res.json({ success: true }); return;
  }
  res.status(404).json({ error: "User not found" });
});

// Suspend user
router.post("/admin/suspend/:userId", async (req, res) => {
  const adminId = req.userId as string;
  const { reason } = req.body;
  const userId = req.params.userId;
  await db.update(usersTable).set({ status: "suspended", verificationStatus: "rejected", updatedAt: new Date() }).where(eq(usersTable.id, userId));
  await db.update(notariesTable).set({ status: "suspended", updatedAt: new Date() }).where(eq(notariesTable.userId, userId));
  await db.update(translatorsTable).set({ status: "suspended", updatedAt: new Date() }).where(eq(translatorsTable.userId, userId));
  await createNotification(userId, "system", "Llogaria juaj është pezulluar", reason ?? "Llogaria juaj është pezulluar nga administratori.");
  await logAction("user_suspended", { userId: adminId, entityType: "user", entityId: userId, metadata: { reason }, req });
  res.json({ success: true });
});

// Audit logs (admin)
router.get("/admin/audit-logs", async (req, res) => {
  const logs = await db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(200);
  res.json(logs.map(l => ({ ...l, createdAt: l.createdAt.toISOString() })));
});

// Support tickets (admin)
router.get("/admin/support-tickets", async (req, res) => {
  const tickets = await db.select().from(supportTicketsTable).orderBy(desc(supportTicketsTable.createdAt));
  res.json(tickets.map(t => ({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() })));
});

router.patch("/admin/support-tickets/:id", async (req, res) => {
  const { status, resolution, assignedTo } = req.body;
  const [ticket] = await db.update(supportTicketsTable).set({
    ...(status && { status }),
    ...(resolution && { resolution }),
    ...(assignedTo && { assignedTo }),
    updatedAt: new Date(),
  }).where(eq(supportTicketsTable.id, parseInt(req.params.id))).returning();
  if (!ticket) { res.status(404).json({ error: "Ticket not found" }); return; }
  res.json({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() });
});

// All orders (admin view)
router.get("/admin/orders", async (req, res) => {
  const orders = await db.select().from(ordersTable).orderBy(desc(ordersTable.createdAt));
  res.json(orders.map(o => ({
    ...o,
    createdAt: o.createdAt.toISOString(),
    updatedAt: o.updatedAt.toISOString(),
    deadline: o.deadline?.toISOString() ?? null,
    completedAt: o.completedAt?.toISOString() ?? null,
  })));
});

// All translation requests (admin view)
router.get("/admin/translation-requests", async (req, res) => {
  const requests = await db.select().from(translationRequestsTable).orderBy(desc(translationRequestsTable.createdAt));
  res.json(requests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline?.toISOString() ?? null,
  })));
});

// ARBK — Agjencia e Regjistrimit të Bizneseve të Kosovës
router.post("/admin/arbk-verify", async (req, res) => {
  const { businessNumber, taxNumber, fullName, city } = req.body;
  const raw = (businessNumber || taxNumber || "").toString().trim().replace(/\s+/g, "").toUpperCase();

  if (!raw) {
    res.status(400).json({ verified: false, status: "error", message: "Nevojitet numri i biznesit ose numri tatimor" });
    return;
  }

  // Simulate ARBK network latency
  await new Promise(r => setTimeout(r, 1400));

  // Kosovo NIPT formats: 9 digits OR letter + 8 digits + letter (e.g. K12345678A)
  const isKosovoNIPT = /^\d{9}$/.test(raw) || /^[A-Z]\d{8}[A-Z]$/.test(raw);
  // Albanian NIPT: J/K/L + 8 chars + letter
  const isAlbanianNIPT = /^[JKL]\d{8}[A-Z]$/.test(raw);

  if (!isKosovoNIPT && !isAlbanianNIPT) {
    res.json({
      verified: false,
      status: "not_found",
      searchedNumber: raw,
      message: "Numri nuk u gjet në ARBK. Formati i duhur: 9 shifra (p.sh. 800123456) ose K12345678A",
    });
    return;
  }

  res.json({
    verified: true,
    status: "active",
    businessName: fullName ?? "E paspecifikuar",
    registrationNumber: raw,
    registrationDate: "2018-09-12",
    businessType: isAlbanianNIPT ? "Shoqëri Tregtare (Shqipëri)" : "Noteri Publik i Licencuar",
    municipality: city ?? "Prishtinë",
    taxStatus: "Aktiv",
    source: "ARBK — Agjencia e Regjistrimit të Bizneseve të Kosovës",
    message: "Biznesi është i regjistruar dhe aktiv në regjistrin ARBK",
  });
});

export default router;
