import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";

const router = Router();

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
  const body = UpdateUserBody.parse(req.body);
  const [user] = await db.update(usersTable).set({
    ...(body.fullName !== undefined && { fullName: body.fullName }),
    ...(body.phone !== undefined && { phone: body.phone }),
    ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
  }).where(eq(usersTable.id, req.params.id)).returning();
  if (!user) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ...user, createdAt: user.createdAt.toISOString() });
});

export default router;
