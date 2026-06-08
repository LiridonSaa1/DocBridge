import { Router } from "express";
import { db, translatorsTable, usersTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { logAction } from "../services/audit";
import { broadcastAdminEvent } from "../services/adminEvents";

const router = Router();

router.get("/translators", async (req, res) => {
  const { search, language } = req.query as { search?: string; language?: string };
  const conditions: any[] = [eq(translatorsTable.status, "approved")];
  if (search) conditions.push(ilike(translatorsTable.fullName, `%${search}%`));
  const rows = await db.select().from(translatorsTable).where(and(...conditions));
  const filtered = language ? rows.filter(r => r.languages.includes(language)) : rows;
  res.json(filtered.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
});

router.get("/translators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [t] = await db.select().from(translatorsTable).where(eq(translatorsTable.id, id));
  if (!t) { res.status(404).json({ error: "Translator not found" }); return; }
  res.json({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

router.post("/translators", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const body = req.body;
  const [existing] = await db.select().from(translatorsTable).where(eq(translatorsTable.userId, userId));
  if (existing) { res.status(409).json({ error: "Translator profile already exists" }); return; }
  const [t] = await db.insert(translatorsTable).values({
    userId,
    fullName: body.fullName,
    businessName: body.businessName ?? null,
    languages: body.languages ?? [],
    city: body.city,
    phone: body.phone,
    email: body.email,
    yearsExperience: body.yearsExperience ?? null,
    education: body.education ?? null,
    pricePerPage: body.pricePerPage ?? null,
    pricePerWord: body.pricePerWord ?? null,
    averageDeliveryTime: body.averageDeliveryTime ?? null,
    availability: body.availability ?? null,
    iban: body.iban ?? null,
    taxNumber: body.taxNumber ?? null,
    portfolioUrl: body.portfolioUrl ?? null,
    diplomaInfo: body.diplomaInfo ?? null,
    bio: body.bio ?? null,
    avatarUrl: body.avatarUrl ?? null,
    diplomaUrl: body.diplomaUrl ?? null,
    certificationUrl: body.certificationUrl ?? null,
    licenseUrl: body.licenseUrl ?? null,
    cvUrl: body.cvUrl ?? null,
    identityDocFrontUrl: body.identityDocFrontUrl ?? null,
    identityDocBackUrl: body.identityDocBackUrl ?? null,
    selfieUrl: body.selfieUrl ?? null,
    certificates: body.certificates ?? [],
    status: "pending",
  }).returning();
  // Upsert user row
  await db.insert(usersTable).values({
    id: userId, email: body.email, role: "translator",
    fullName: body.fullName, phone: body.phone,
    status: "pending", verificationStatus: "pending_email",
  }).onConflictDoUpdate({ target: usersTable.id, set: { role: "translator", status: "pending" } });
  await logAction("translator_registered", { userId, entityType: "translator", entityId: String(t.id), req });
  broadcastAdminEvent({
    id: `translator-${t.id}-${Date.now()}`,
    type: "pending_approval",
    entityType: "translator",
    fullName: t.fullName,
    city: t.city,
    email: t.email,
    createdAt: t.createdAt.toISOString(),
  });
  res.status(201).json({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

router.patch("/translators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullName, businessName, languages, city, phone, bio, avatarUrl, pricePerPage, pricePerWord, availability } = req.body;
  const [t] = await db.update(translatorsTable).set({
    ...(fullName !== undefined && { fullName }),
    ...(businessName !== undefined && { businessName }),
    ...(languages !== undefined && { languages }),
    ...(city !== undefined && { city }),
    ...(phone !== undefined && { phone }),
    ...(bio !== undefined && { bio }),
    ...(avatarUrl !== undefined && { avatarUrl }),
    ...(pricePerPage !== undefined && { pricePerPage }),
    ...(pricePerWord !== undefined && { pricePerWord }),
    ...(availability !== undefined && { availability }),
    updatedAt: new Date(),
  }).where(eq(translatorsTable.id, id)).returning();
  if (!t) { res.status(404).json({ error: "Translator not found" }); return; }
  res.json({ ...t, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() });
});

export default router;
