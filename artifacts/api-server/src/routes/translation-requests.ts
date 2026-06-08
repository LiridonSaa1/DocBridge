import { Router } from "express";
import { db, translationRequestsTable, ordersTable, notificationsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { logAction } from "../services/audit";

const router = Router();

// Get all requests for logged-in customer
router.get("/translation-requests", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const requests = await db
    .select()
    .from(translationRequestsTable)
    .where(eq(translationRequestsTable.customerId, userId))
    .orderBy(desc(translationRequestsTable.createdAt));
  res.json(requests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline?.toISOString() ?? null,
  })));
});

// Get open requests (for translators to browse)
router.get("/translation-requests/open", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const requests = await db
    .select()
    .from(translationRequestsTable)
    .where(eq(translationRequestsTable.status, "open"))
    .orderBy(desc(translationRequestsTable.createdAt));
  res.json(requests.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    deadline: r.deadline?.toISOString() ?? null,
  })));
});

// Get single request
router.get("/translation-requests/:id", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [request] = await db
    .select()
    .from(translationRequestsTable)
    .where(eq(translationRequestsTable.id, parseInt(req.params.id)));
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  res.json({
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    deadline: request.deadline?.toISOString() ?? null,
  });
});

// Create new translation request
router.post("/translation-requests", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const {
    title, description, sourceLanguage, targetLanguage, serviceType,
    pageCount, wordCount, deadline, budget, notes, documentUrls,
    fullName, phone, documentType, purpose, country, city,
    deliveryMethod, deliveryStreet, deliveryPostalCode, priority,
  } = req.body;

  if (!title || !sourceLanguage || !targetLanguage || !serviceType) {
    res.status(400).json({ error: "title, sourceLanguage, targetLanguage, serviceType are required" }); return;
  }

  const [request] = await db.insert(translationRequestsTable).values({
    customerId: userId,
    fullName: fullName ?? null,
    phone: phone ?? null,
    title,
    description: description ?? null,
    documentType: documentType ?? null,
    sourceLanguage,
    targetLanguage,
    purpose: purpose ?? null,
    serviceType,
    priority: priority ?? "normal",
    country: country ?? null,
    city: city ?? null,
    deliveryMethod: deliveryMethod ?? null,
    deliveryStreet: deliveryStreet ?? null,
    deliveryPostalCode: deliveryPostalCode ?? null,
    pageCount: pageCount ?? null,
    wordCount: wordCount ?? null,
    deadline: deadline ? new Date(deadline) : null,
    budget: budget ?? null,
    notes: notes ?? null,
    documentUrls: documentUrls ?? [],
    status: "open",
  }).returning();

  await logAction("translation_request_created", { userId, entityType: "translation_request", entityId: String(request.id), req });

  res.status(201).json({
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    deadline: request.deadline?.toISOString() ?? null,
  });
});

// Update request status
router.patch("/translation-requests/:id", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { status, assignedTranslatorId, completedFileUrls } = req.body;
  const [request] = await db
    .update(translationRequestsTable)
    .set({
      ...(status !== undefined && { status }),
      ...(assignedTranslatorId !== undefined && { assignedTranslatorId }),
      ...(completedFileUrls !== undefined && { completedFileUrls }),
      updatedAt: new Date(),
    })
    .where(eq(translationRequestsTable.id, parseInt(req.params.id)))
    .returning();
  if (!request) { res.status(404).json({ error: "Request not found" }); return; }
  res.json({
    ...request,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
    deadline: request.deadline?.toISOString() ?? null,
  });
});

export default router;
