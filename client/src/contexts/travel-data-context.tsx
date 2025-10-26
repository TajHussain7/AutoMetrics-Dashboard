import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { TravelData, UploadResponse } from "@shared/schema";
import {
  saveToStorage,
  loadFromStorage,
  clearStorage,
} from "../lib/local-storage";

interface TravelDataContextType {
  currentSessionId: string | null;
  travelData: TravelData[];
  uploadResponse: UploadResponse | null;
  isLoading: boolean;
  error: string | null;
  setCurrentSessionId: (sessionId: string | null) => void;
  setTravelData: (data: TravelData[]) => void;
  setUploadResponse: (response: UploadResponse | null) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateTravelDataItem: (id: string, updates: Partial<TravelData>) => void;
  removeTravelDataItem: (id: string) => void;
}

const TravelDataContext = createContext<TravelDataContextType | undefined>(
  undefined
);

export function TravelDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize state from localStorage or defaults
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => {
      const stored = loadFromStorage();
      return stored?.uploadSession?.id || null;
    }
  );

  const [travelData, setTravelData] = useState<TravelData[]>(() => {
    const stored = loadFromStorage();
    return stored?.travelData || [];
  });

  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load stored data on mount
  useEffect(() => {
    const stored = loadFromStorage();
    if (stored) {
      setCurrentSessionId(stored.uploadSession?.id || null);
      setTravelData(stored.travelData);
    }
  }, []);

  // Save data whenever it changes
  const saveData = useCallback(() => {
    if (travelData.length > 0 && currentSessionId && uploadResponse) {
      console.log("Saving updated data to storage", {
        dataLength: travelData.length,
        sessionId: currentSessionId,
      });

      saveToStorage({
        travelData,
        uploadSession: {
          id: currentSessionId,
          filename: "uploaded-file",
          processedAt: new Date(),
          totalRecords: travelData.length.toString(),
          opening_balance: uploadResponse.openingBalance || undefined,
        },
      });
    }
  }, [travelData, currentSessionId, uploadResponse]);

  // Save data after any state changes
  useEffect(() => {
    saveData();
  }, [travelData, currentSessionId, uploadResponse, saveData]);

  // Also save when the window is about to unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveData();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveData]);

  const updateTravelDataItem = useCallback(
    (id: string, updates: Partial<TravelData>) => {
      setTravelData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const removeTravelDataItem = useCallback((id: string) => {
    setTravelData((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <TravelDataContext.Provider
      value={{
        currentSessionId,
        travelData,
        uploadResponse,
        isLoading,
        error,
        setCurrentSessionId,
        setTravelData,
        setUploadResponse,
        setIsLoading,
        setError,
        updateTravelDataItem,
        removeTravelDataItem,
      }}
    >
      {children}
    </TravelDataContext.Provider>
  );
}

export function useTravelData() {
  const context = useContext(TravelDataContext);
  if (context === undefined) {
    throw new Error("useTravelData must be used within a TravelDataProvider");
  }
  return context;
}
