import { Router } from "express";
import { db, notariesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { CreateNotaryBody, UpdateNotaryBody } from "@workspace/api-zod";

const router = Router();

router.get("/notaries", async (req, res) => {
  const { search, city } = req.query as { search?: string; city?: string };
  const conditions = [eq(notariesTable.status, "approved")];
  if (search) conditions.push(ilike(notariesTable.fullName, `%${search}%`));
  if (city) conditions.push(ilike(notariesTable.city, `%${city}%`));
  const rows = await db.select().from(notariesTable).where(and(...conditions));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString() })));
});

router.post("/notaries", async (req, res) => {
  const body = CreateNotaryBody.parse(req.body);
  const userId = req.headers["x-user-id"] as string || "anonymous";
  const [n] = await db.insert(notariesTable).values({
    userId,
    fullName: body.fullName,
    businessName: body.businessName,
    businessNumber: body.businessNumber,
    city: body.city,
    address: body.address ?? null,
    phone: body.phone,
    email: body.email,
    certificationNumber: body.certificationNumber ?? null,
    bio: body.bio ?? null,
    avatarUrl: body.avatarUrl ?? null,
    status: "pending",
  }).returning();
  res.status(201).json({ ...n, createdAt: n.createdAt.toISOString() });
});

router.get("/notaries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [n] = await db.select().from(notariesTable).where(eq(notariesTable.id, id));
  if (!n) { res.status(404).json({ error: "Notary not found" }); return; }
  res.json({ ...n, createdAt: n.createdAt.toISOString() });
});

router.patch("/notaries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateNotaryBody.parse(req.body);
  const [n] = await db.update(notariesTable).set({
    ...(body.fullName !== undefined && { fullName: body.fullName }),
    ...(body.businessName !== undefined && { businessName: body.businessName }),
    ...(body.city !== undefined && { city: body.city }),
    ...(body.address !== undefined && { address: body.address }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.bio !== undefined && { bio: body.bio }),
    ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
  }).where(eq(notariesTable.id, id)).returning();
  if (!n) { res.status(404).json({ error: "Notary not found" }); return; }
  res.json({ ...n, createdAt: n.createdAt.toISOString() });
});

export default router;
