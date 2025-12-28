import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useAnnouncementPoller } from "@/hooks/use-announcement-poller";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { debug, error } from "@/lib/logger";

interface AnnouncementContextType {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<number>;
}

const AnnouncementContext = createContext<AnnouncementContextType | undefined>(
  undefined
);

export function AnnouncementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();
  const { toast } = useToast();
  const wsRef = useRef<WebSocket | null>(null);

  // The poller hook will call onUnreadCountChange when count changes
  const refreshUnreadCount = useAnnouncementPoller({
    pollInterval: 45000, // 45 seconds
    enabled: true,
    onUnreadCountChange: setUnreadCount,
  });

  // Open a WebSocket connection for real-time announcements and query replies
  useEffect(() => {
    if (!user) return;

    // Use a Vite-provided env var when available so deployments can configure the
    // announcements WebSocket URL. Falls back to the local dev server.
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const WS_URL = `${protocol}://${window.location.host}/ws/announcements`;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;
      ws.onopen = () => {
        debug("Connected to announcement WebSocket");
      };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (!msg || !msg.type) return;

          // Generic announcement created -> refresh counts
          if (msg.type === "ANNOUNCEMENT_CREATED") {
            // If announcement is a site-wide broadcast, show it to everyone.
            // Otherwise, only show to the intended recipients (if provided).
            const isBroadcast = Boolean(msg.data?.broadcast);
            const recipients: string[] = Array.isArray(msg.data?.recipients)
              ? msg.data.recipients.map((r: any) => String(r))
              : [];
            const uid =
              (user as any).id || (user as any)._id || (user as any).userId;

            if (!isBroadcast && recipients.length > 0) {
              if (!uid) return; // cannot determine recipient
              if (!recipients.includes(String(uid))) return; // not for this user
            }

            // For broadcasts and targeted announcements for this user, refresh
            // the unread count and show a lightweight toast.
            refreshUnreadCount();
            toast({
              title: "New announcement",
              description: msg.data?.title || "You have a new announcement",
            });
            return;
          }

          // Query reply: only notify if the reply is for the current user
          if (msg.type === "QUERY_REPLY") {
            const targetUser = msg.data?.userId;
            if (!targetUser) return;
            const uid =
              (user as any).id || (user as any)._id || (user as any).userId;
            if (String(uid) === String(targetUser)) {
              setUnreadCount((c) => c + 1);
              toast({
                title: "Reply to your support query",
                description:
                  msg.data?.reply?.slice(0, 140) ||
                  "An admin replied to your query",
              });
              // Emit an event so pages (like My Queries) can refresh the thread
              try {
                const ev = new CustomEvent("query:reply", { detail: msg.data });
                window.dispatchEvent(ev);
              } catch (e) {
                debug("Failed to emit query:reply event", e);
              }
            }
          }

          // Query deleted: notify the user and emit an event for pages to refresh
          if (msg.type === "QUERY_DELETED") {
            const targetUser = msg.data?.userId;
            if (!targetUser) return;
            const uid =
              (user as any).id || (user as any)._id || (user as any).userId;
            if (String(uid) === String(targetUser)) {
              setUnreadCount((c) => c + 1);
              toast({
                title: "Support query removed",
                description:
                  "An administrator removed one of your support queries.",
              });
              try {
                const ev = new CustomEvent("query:deleted", {
                  detail: msg.data,
                });
                window.dispatchEvent(ev);
              } catch (e) {
                debug("Failed to emit query:deleted event", e);
              }
            }
          }

          // Admin-facing events: new query or contact created
          if (msg.type === "QUERY_CREATED") {
            try {
              const ev = new CustomEvent("query:created", { detail: msg.data });
              window.dispatchEvent(ev);
              // Also show a lightweight admin toast
              if ((user as any)?.role === "admin") {
                toast({
                  title: "New support query",
                  description: msg.data?.subject || "A user submitted a query",
                });
              }
            } catch (e) {
              debug("Failed to emit query:created event", e);
            }
          }

          if (msg.type === "CONTACT_CREATED") {
            try {
              const ev = new CustomEvent("contact:created", {
                detail: msg.data,
              });
              window.dispatchEvent(ev);
              if ((user as any)?.role === "admin") {
                toast({
                  title: "New contact message",
                  description:
                    msg.data?.subject || `From ${msg.data?.email || "someone"}`,
                });
              }
            } catch (e) {
              debug("Failed to emit contact:created event", e);
            }
          }

          // New query created (admin-facing): emit event so admin pages can refresh
          if (msg.type === "QUERY_CREATED") {
            try {
              const ev = new CustomEvent("query:created", { detail: msg.data });
              window.dispatchEvent(ev);
            } catch (e) {
              debug("Failed to emit query:created event", e);
            }
          }

          // New contact message (admin-facing)
          if (msg.type === "CONTACT_CREATED") {
            try {
              const ev = new CustomEvent("contact:created", {
                detail: msg.data,
              });
              window.dispatchEvent(ev);
            } catch (e) {
              debug("Failed to emit contact:created event", e);
            }
          }

          // Account status change (e.g., admin reactivated or deactivated a user)
          if (msg.type === "ACCOUNT_STATUS_CHANGED") {
            const targetUser = msg.data?.userId;
            const status = msg.data?.status;
            if (!targetUser || !status) return;
            const uid =
              (user as any).id || (user as any)._id || (user as any).userId;
            if (String(uid) !== String(targetUser)) return;

            try {
              if (status === "active") {
                window.dispatchEvent(
                  new CustomEvent("account-reactivated", { detail: { status } })
                );
              } else if (status === "inactive") {
                window.dispatchEvent(
                  new CustomEvent("account-deactivated", { detail: { status } })
                );
              }
            } catch (e) {
              debug("Failed to emit account status event", e);
            }
          }
        } catch (err) {
          error("Failed to parse WS message:", err);
        }
      };
      ws.onclose = () => {
        debug("Announcement WebSocket closed");
      };
      ws.onerror = (err) => {
        error("Announcement WebSocket error:", err);
      };

      return () => {
        try {
          ws.close();
        } catch (e) {
          /* no-op */
        }
        wsRef.current = null;
      };
    } catch (err) {
      error("Failed to open announcement WebSocket:", err);
    }
  }, [user]);

  return (
    <AnnouncementContext.Provider
      value={{
        unreadCount,
        setUnreadCount,
        refreshUnreadCount,
      }}
    >
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  if (context === undefined) {
    throw new Error(
      "useAnnouncements must be used within an AnnouncementProvider"
    );
  }
  return context;
}
