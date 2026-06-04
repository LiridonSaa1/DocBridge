import { Router } from "express";
import { db, coursesTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { CreateCourseBody } from "@workspace/api-zod";

const router = Router();

router.get("/courses", async (req, res) => {
  const { search, category } = req.query as { search?: string; category?: string };
  const conditions = [eq(coursesTable.isActive, true)];
  if (search) conditions.push(ilike(coursesTable.title, `%${search}%`));
  if (category) conditions.push(eq(coursesTable.category, category));
  const rows = await db.select().from(coursesTable).where(and(...conditions));
  res.json(rows.map(r => ({ ...r, price: parseFloat(r.price), createdAt: r.createdAt.toISOString() })));
});

router.post("/courses", async (req, res) => {
  const body = CreateCourseBody.parse(req.body);
  const [c] = await db.insert(coursesTable).values({
    title: body.title,
    description: body.description,
    provider: body.provider,
    city: body.city,
    price: String(body.price),
    duration: body.duration,
    category: body.category,
    imageUrl: body.imageUrl ?? null,
    contactPhone: body.contactPhone ?? null,
    contactEmail: body.contactEmail ?? null,
    isActive: true,
  }).returning();
  res.status(201).json({ ...c, price: parseFloat(c.price), createdAt: c.createdAt.toISOString() });
});

router.get("/courses/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [c] = await db.select().from(coursesTable).where(eq(coursesTable.id, id));
  if (!c) { res.status(404).json({ error: "Course not found" }); return; }
  res.json({ ...c, price: parseFloat(c.price), createdAt: c.createdAt.toISOString() });
});

export default router;
