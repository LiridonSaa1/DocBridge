import { Router } from "express";
import { db, notariesTable, usersTable } from "@workspace/db";
import { eq, ilike, and } from "drizzle-orm";
import { logAction } from "../services/audit";

const router = Router();

router.get("/notaries", async (req, res) => {
  const { search, city } = req.query as { search?: string; city?: string };
  const conditions: any[] = [eq(notariesTable.status, "approved")];
  if (search) conditions.push(ilike(notariesTable.fullName, `%${search}%`));
  if (city) conditions.push(ilike(notariesTable.city, `%${city}%`));
  const rows = await db.select().from(notariesTable).where(and(...conditions));
  res.json(rows.map(r => ({ ...r, createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString() })));
});

router.get("/notaries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [n] = await db.select().from(notariesTable).where(eq(notariesTable.id, id));
  if (!n) { res.status(404).json({ error: "Notary not found" }); return; }
  res.json({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() });
});

router.post("/notaries", async (req, res) => {
  const userId = req.userId as string;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const body = req.body;
  const [existing] = await db.select().from(notariesTable).where(eq(notariesTable.userId, userId));
  if (existing) { res.status(409).json({ error: "Notary profile already exists" }); return; }
  const [n] = await db.insert(notariesTable).values({
    userId,
    fullName: body.fullName,
    businessName: body.businessName || body.officeName || body.fullName,
    businessNumber: body.businessNumber || body.licenseNumber || "",
    officeName: body.officeName ?? null,
    officeAddress: body.officeAddress ?? null,
    licenseNumber: body.licenseNumber ?? null,
    taxNumber: body.taxNumber ?? null,
    municipality: body.municipality ?? null,
    workingHours: body.workingHours ?? null,
    city: body.city,
    address: body.address ?? null,
    phone: body.phone,
    email: body.email,
    website: body.website ?? null,
    certificationNumber: body.certificationNumber ?? null,
    bio: body.bio ?? null,
    avatarUrl: body.avatarUrl ?? null,
    iban: body.iban ?? null,
    professionalLicenseUrl: body.professionalLicenseUrl ?? null,
    govCertUrl: body.govCertUrl ?? null,
    identityDocFrontUrl: body.identityDocFrontUrl ?? null,
    identityDocBackUrl: body.identityDocBackUrl ?? null,
    selfieUrl: body.selfieUrl ?? null,
    officePhotos: body.officePhotos ?? [],
    status: "pending",
  }).returning();
  // Upsert user row
  await db.insert(usersTable).values({
    id: userId, email: body.email, role: "notary",
    fullName: body.fullName, phone: body.phone,
    status: "pending", verificationStatus: "pending_email",
  }).onConflictDoUpdate({ target: usersTable.id, set: { role: "notary", status: "pending" } });
  await logAction("notary_registered", { userId, entityType: "notary", entityId: String(n.id), req });
  res.status(201).json({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() });
});

router.patch("/notaries/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { fullName, businessName, city, address, phone, bio, avatarUrl, workingHours, website } = req.body;
  const [n] = await db.update(notariesTable).set({
    ...(fullName !== undefined && { fullName }),
    ...(businessName !== undefined && { businessName }),
    ...(city !== undefined && { city }),
    ...(address !== undefined && { address }),
    ...(phone !== undefined && { phone }),
    ...(bio !== undefined && { bio }),
    ...(avatarUrl !== undefined && { avatarUrl }),
    ...(workingHours !== undefined && { workingHours }),
    ...(website !== undefined && { website }),
    updatedAt: new Date(),
  }).where(eq(notariesTable.id, id)).returning();
  if (!n) { res.status(404).json({ error: "Notary not found" }); return; }
  res.json({ ...n, createdAt: n.createdAt.toISOString(), updatedAt: n.updatedAt.toISOString() });
});

export default router;
