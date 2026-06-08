import type { Response } from "express";

const clients = new Set<Response>();

export interface AdminEventPayload {
  id: string;
  type: "pending_approval";
  entityType: "notary" | "translator";
  fullName: string;
  city?: string;
  email: string;
  createdAt: string;
}

export function registerAdminClient(res: Response): void {
  clients.add(res);
}

export function removeAdminClient(res: Response): void {
  clients.delete(res);
}

export function broadcastAdminEvent(payload: AdminEventPayload): void {
  const frame = `event: ${payload.type}\ndata: ${JSON.stringify(payload)}\n\n`;
  const dead: Response[] = [];
  for (const client of clients) {
    try {
      client.write(frame);
    } catch {
      dead.push(client);
    }
  }
  dead.forEach(c => clients.delete(c));
}
