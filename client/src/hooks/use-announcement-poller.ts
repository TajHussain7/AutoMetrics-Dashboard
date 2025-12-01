import { useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseAnnouncementPollerOptions {
  pollInterval?: number; // milliseconds, default 45 seconds
  enabled?: boolean;
  onUnreadCountChange?: (count: number) => void;
}

/**
 * Lightweight polling hook for announcement unread count
 * Checks every 30-60 seconds if new announcements are available
 * Triggers toast when unread count increases
 */
export function useAnnouncementPoller({
  pollInterval = 45000, // 45 seconds
  enabled = true,
  onUnreadCountChange,
}: UseAnnouncementPollerOptions = {}) {
  const { toast } = useToast();
  const previousCountRef = useRef<number | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef(false);

  const fetchUnreadCount = useCallback(async (): Promise<number> => {
    try {
      const res = await fetch("/api/users/announcements/unread-count", {
        credentials: "include",
      });

      if (!res.ok) {
        console.error("Failed to fetch unread count:", res.status);
        return previousCountRef.current || 0;
      }

      const data = await res.json();
      const count = data.unreadCount || 0;

      // If count increased from previous, show toast and update badge
      if (
        previousCountRef.current !== null &&
        count > previousCountRef.current
      ) {
        const difference = count - previousCountRef.current;
        toast({
          title: "New Announcement",
          description:
            difference === 1
              ? "You have a new announcement"
              : `You have ${difference} new announcements`,
          variant: "default",
        });
      }

      previousCountRef.current = count;
      onUnreadCountChange?.(count);

      return count;
    } catch (err) {
      console.error("Error fetching unread count:", err);
      return previousCountRef.current || 0;
    }
  }, [toast, onUnreadCountChange]);

  // Initial fetch + periodic polling
  useEffect(() => {
    if (!enabled) return;

    // Fetch immediately on mount
    (async () => {
      await fetchUnreadCount();
    })();

    // Setup polling
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);

    pollingIntervalRef.current = setInterval(async () => {
      if (!isPollingRef.current) {
        isPollingRef.current = true;
        try {
          await fetchUnreadCount();
        } finally {
          isPollingRef.current = false;
        }
      }
    }, pollInterval);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [enabled, pollInterval, fetchUnreadCount]);

  return fetchUnreadCount;
}
