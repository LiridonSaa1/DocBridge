import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { isAuthenticated, getCurrentUserId } from "../auth/replitAuth.js";

const router = Router();

router.get("/auth/user", isAuthenticated, async (req, res) => {
  try {
    const userId = getCurrentUserId(req);
    if (!userId) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) {
      res.json({ id: userId, role: null, needsProfile: true });
      return;
    }
    res.json({ ...user, createdAt: user.createdAt.toISOString() });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export default router;
