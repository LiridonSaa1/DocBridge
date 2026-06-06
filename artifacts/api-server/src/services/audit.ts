/**
 * Audit Log Service
 * Tracks all important actions for security and compliance.
 */

import { db, auditLogsTable } from "@workspace/db";
import type { Request } from "express";

export async function logAction(
  action: string,
  options: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
    req?: Request;
  } = {}
) {
  try {
    await db.insert(auditLogsTable).values({
      action,
      userId: options.userId,
      entityType: options.entityType,
      entityId: options.entityId,
      metadata: options.metadata ?? {},
      ipAddress: options.req
        ? (options.req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
          options.req.socket.remoteAddress
        : undefined,
      userAgent: options.req?.headers["user-agent"],
    });
  } catch {
    // Audit log failure should never crash the app
  }
}
