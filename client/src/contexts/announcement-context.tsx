import React, { createContext, useContext, useState, useCallback } from "react";
import { useAnnouncementPoller } from "@/hooks/use-announcement-poller";

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

  // The poller hook will call onUnreadCountChange when count changes
  const refreshUnreadCount = useAnnouncementPoller({
    pollInterval: 45000, // 45 seconds
    enabled: true,
    onUnreadCountChange: setUnreadCount,
  });

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
