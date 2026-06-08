import { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "./useAuth";

export interface AdminEvent {
  id: string;
  type: "pending_approval";
  entityType: "notary" | "translator";
  fullName: string;
  city?: string;
  email: string;
  createdAt: string;
}

const MAX_EVENTS = 20;

export function useAdminEvents() {
  const { role } = useAuth();
  const [events, setEvents] = useState<AdminEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (role !== "admin") return;

    const connect = () => {
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }

      const es = new EventSource("/api/admin/events");
      esRef.current = es;

      es.addEventListener("pending_approval", (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data) as AdminEvent;
          setEvents(prev => {
            const deduped = prev.filter(ev => ev.id !== data.id);
            return [data, ...deduped].slice(0, MAX_EVENTS);
          });
          setUnreadCount(c => c + 1);
        } catch {
          // ignore malformed
        }
      });

      es.onerror = () => {
        es.close();
        esRef.current = null;
        reconnectRef.current = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      esRef.current?.close();
      esRef.current = null;
    };
  }, [role]);

  const clearUnread = useCallback(() => setUnreadCount(0), []);

  return { events, unreadCount, clearUnread };
}
