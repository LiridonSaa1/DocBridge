import { Router } from "express";
import { db, adsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { CreateAdBody, UpdateAdBody } from "@workspace/api-zod";

const router = Router();

router.get("/ads", async (req, res) => {
  const ads = await db.select().from(adsTable).orderBy(asc(adsTable.order), asc(adsTable.createdAt));
  res.json(ads.map(a => ({
    ...a,
    order: a.order ?? null,
    createdAt: a.createdAt.toISOString(),
  })));
});

router.post("/ads", async (req, res) => {
  const body = CreateAdBody.parse(req.body);
  const [ad] = await db.insert(adsTable).values({
    title: body.title,
    description: body.description,
    imageUrl: body.imageUrl,
    linkUrl: body.linkUrl,
    businessType: body.businessType,
    isActive: body.isActive ?? true,
    order: body.order ?? null,
  }).returning();
  res.status(201).json({ ...ad, order: ad.order ?? null, createdAt: ad.createdAt.toISOString() });
});

router.get("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [ad] = await db.select().from(adsTable).where(eq(adsTable.id, id));
  if (!ad) { res.status(404).json({ error: "Ad not found" }); return; }
  res.json({ ...ad, order: ad.order ?? null, createdAt: ad.createdAt.toISOString() });
});

router.patch("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const body = UpdateAdBody.parse(req.body);
  const [ad] = await db.update(adsTable).set({
    ...(body.title !== undefined && { title: body.title }),
    ...(body.description !== undefined && { description: body.description }),
    ...(body.imageUrl !== undefined && { imageUrl: body.imageUrl }),
    ...(body.linkUrl !== undefined && { linkUrl: body.linkUrl }),
    ...(body.businessType !== undefined && { businessType: body.businessType }),
    ...(body.isActive !== undefined && { isActive: body.isActive }),
    ...(body.order !== undefined && { order: body.order }),
  }).where(eq(adsTable.id, id)).returning();
  if (!ad) { res.status(404).json({ error: "Ad not found" }); return; }
  res.json({ ...ad, order: ad.order ?? null, createdAt: ad.createdAt.toISOString() });
});

router.delete("/ads/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(adsTable).where(eq(adsTable.id, id));
  res.status(204).send();
});

export default router;
