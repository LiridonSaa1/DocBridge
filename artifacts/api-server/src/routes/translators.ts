import { Router } from "express";
import { db, translatorsTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { CreateTranslatorBody, UpdateTranslatorBody } from "@workspace/api-zod";

const router = Router();

router.get("/translators", async (req, res) => {
  const { search, language } = req.query as { search?: string; language?: string };
  const conditions = [eq(translatorsTable.status, "approved")];
  if (search) conditions.push(ilike(translatorsTable.fullName, `%${search}%`));
  const rows = await db.select().from(translatorsTable).where(and(...conditions));
  const filtered = language
    ? rows.filter(r => r.languages.includes(language))
    : rows;
  res.json(filtered.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/translators", async (req, res) => {
  const body = CreateTranslatorBody.parse(req.body);
  const userId = req.headers["x-user-id"] as string || "anonymous";
  const [t] = await db.insert(translatorsTable).values({
    userId,
    fullName: body.fullName,
    businessName: body.businessName ?? null,
    languages: body.languages,
    city: body.city,
    phone: body.phone,
    email: body.email,
    diplomaInfo: body.diplomaInfo ?? null,
    bio: body.bio ?? null,
    avatarUrl: body.avatarUrl ?? null,
    status: "pending",
  }).returning();
  res.status(201).json({ ...t, createdAt: t.createdAt.toISOString() });
});

router.get("/translators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [t] = await db.select().from(translatorsTable).where(eq(translatorsTable.id, id));
  if (!t) { res.status(404).json({ error: "Translator not found" }); return; }
  res.json({ ...t, createdAt: t.createdAt.toISOString() });
});

router.patch("/translators/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateTranslatorBody.parse(req.body);
  const [t] = await db.update(translatorsTable).set({
    ...(body.fullName !== undefined && { fullName: body.fullName }),
    ...(body.businessName !== undefined && { businessName: body.businessName }),
    ...(body.languages !== undefined && { languages: body.languages }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.bio !== undefined && { bio: body.bio }),
    ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
  }).where(eq(translatorsTable.id, id)).returning();
  if (!t) { res.status(404).json({ error: "Translator not found" }); return; }
  res.json({ ...t, createdAt: t.createdAt.toISOString() });
});

export default router;
