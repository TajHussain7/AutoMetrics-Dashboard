import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { TravelData, UploadResponse } from "@shared/schema";
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
  addTravelDataItem: (item: TravelData) => void;
}

const TravelDataContext = createContext<TravelDataContextType | undefined>(
  undefined
);

export function TravelDataProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => {
      // Initialize from localStorage if available
      return localStorage.getItem("currentSessionId");
    }
  );
  const [travelData, setTravelData] = useState<TravelData[]>([]);
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist sessionId to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("currentSessionId", currentSessionId);
    } else {
      localStorage.removeItem("currentSessionId");
    }
  }, [currentSessionId]);

  // Load initial data if we have a sessionId
  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const loadData = async () => {
      if (!currentSessionId || travelData.length > 0) return;

      setIsLoading(true);
      try {
        // Implement pagination with a reasonable page size
        const page = 1;
        const pageSize = 50;
        const response = await fetch(
          `/api/travel-data/${currentSessionId}?page=${page}&pageSize=${pageSize}`,
          {
            signal: abortController.signal,
          }
        );

        if (!mounted) return;

        if (!response.ok) {
          throw new Error("Failed to fetch travel data");
        }

        const { data, total } = await response.json();

        if (!mounted) return;

        // Normalize server items to ensure `id` exists (map `_id` -> `id`)
        const normalized = Array.isArray(data)
          ? data.map((it: any) => ({ ...(it || {}), id: it.id ?? it._id }))
          : [];

        setTravelData(normalized);
      } catch (err) {
        if (!mounted) return;
        // Don't set error state if it was just an abort
        if (err instanceof Error && err.name !== "AbortError") {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [currentSessionId, travelData.length]);

  const updateTravelDataItem = useCallback(
    (id: string, updates: Partial<TravelData>) => {
      // NOTE: This function intentionally only updates local state.
      // API requests should be performed by mutation hooks (useUpdateTravelData)
      // to avoid duplicate network calls. The hooks will call server APIs
      // and then invoke this function to reflect changes locally.
      try {
        setTravelData((prev) =>
          prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Update failed");
      }
    },
    []
  );

  const removeTravelDataItem = useCallback((id: string) => {
    // Only update local state. Server-side delete should be handled
    // by useDeleteTravelData mutation which calls the API.
    try {
      setTravelData((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }, []);

  const addTravelDataItem = useCallback((item: TravelData) => {
    // Only update local state. Server-side creation should be handled by
    // useCreateTravelData mutation which will call the API and then update
    // the cache/state via queryClient or by invoking this helper.
    try {
      setTravelData((prev) => [item, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Add failed");
    }
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
        addTravelDataItem,
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
