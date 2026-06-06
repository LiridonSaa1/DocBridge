import { Router } from "express";
import { db, verificationDocumentsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logAction } from "../services/audit";

const router = Router();

// Submit identity verification documents
router.post("/verification/documents", async (req, res) => {
  const userId = req.headers["x-user-id"] as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { documentType, frontUrl, backUrl, selfieUrl } = req.body;
  if (!documentType || !frontUrl || !selfieUrl) {
    res.status(400).json({ error: "documentType, frontUrl, selfieUrl are required" }); return;
  }
  const [doc] = await db.insert(verificationDocumentsTable).values({
    userId,
    documentType,
    frontUrl,
    backUrl: backUrl ?? null,
    selfieUrl,
    status: "pending",
  }).returning();
  await logAction("verification_docs_submitted", { userId, entityType: "verification_document", entityId: String(doc.id), req });
  res.status(201).json({ ...doc, createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() });
});

// Get verification documents for a user
router.get("/verification/documents/:userId", async (req, res) => {
  const requesterId = req.headers["x-user-id"] as string;
  if (!requesterId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const docs = await db
    .select()
    .from(verificationDocumentsTable)
    .where(eq(verificationDocumentsTable.userId, req.params.userId));
  res.json(docs.map(d => ({ ...d, createdAt: d.createdAt.toISOString(), updatedAt: d.updatedAt.toISOString() })));
});

// Admin: update document status
router.patch("/verification/documents/:id/status", async (req, res) => {
  const requesterId = req.headers["x-user-id"] as string;
  if (!requesterId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const { status, flagReason, adminNotes } = req.body;
  const [doc] = await db.update(verificationDocumentsTable).set({
    status,
    flagReason: flagReason ?? null,
    adminNotes: adminNotes ?? null,
    verifiedAt: status === "verified" ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(verificationDocumentsTable.id, parseInt(req.params.id))).returning();
  if (!doc) { res.status(404).json({ error: "Document not found" }); return; }
  if (status === "verified") {
    await db.update(usersTable).set({
      identityVerified: true,
      verificationStatus: "identity_verified",
      updatedAt: new Date(),
    }).where(eq(usersTable.id, doc.userId));
  }
  await logAction("document_status_updated", { userId: requesterId, entityType: "verification_document", entityId: req.params.id, metadata: { status }, req });
  res.json({ ...doc, createdAt: doc.createdAt.toISOString(), updatedAt: doc.updatedAt.toISOString() });
});

export default router;
