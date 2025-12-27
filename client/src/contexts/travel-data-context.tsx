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
  // Refetch current session travel data from the server
  refetch: () => Promise<void>;
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
  // Shared fetch implementation so it can be invoked by both the
  // initialization effect and callers via `refetch()`.
  const fetchData = useCallback(
    async (opts?: { signal?: AbortSignal }) => {
      if (!currentSessionId) return;

      setIsLoading(true);
      try {
        const page = 1;
        const pageSize = 50;
        const response = await fetch(
          `/api/travel-data/${currentSessionId}?page=${page}&pageSize=${pageSize}`,
          {
            signal: opts?.signal,
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch travel data");
        }

        const { data } = await response.json();

        const normalized = Array.isArray(data)
          ? data.map((it: any) => ({ ...(it || {}), id: it.id ?? it._id }))
          : [];

        setTravelData(normalized);
        setError(null);
      } catch (err) {
        // Abort should be silent
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Fetch failed");
        // Re-throw so callers (e.g., UI refresh buttons) can handle failures
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentSessionId]
  );

  useEffect(() => {
    let mounted = true;
    const abortController = new AbortController();

    const loadData = async () => {
      if (!currentSessionId || travelData.length > 0) return;

      try {
        await fetchData({ signal: abortController.signal });
      } catch (err) {
        if (!mounted) return;
        // fetchData already sets error state; nothing else needed here
      }
    };

    loadData();

    return () => {
      mounted = false;
      abortController.abort();
    };
  }, [currentSessionId, travelData.length, fetchData]);

  // Expose `refetch` so callers can refresh the current session data on demand
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

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
        refetch,
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
