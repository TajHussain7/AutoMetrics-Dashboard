import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { TravelData, UploadResponse, UploadSession } from "@shared/schema";
import { FlightStatus, PaymentStatus, TravelDataBase } from "@shared/types";
import type { MongoTravelData } from "@shared/mongodb-types";
import { useTravelData as useTravelDataContext } from "@/contexts/travel-data-context";
import { error } from "@/lib/logger";

function getApiUrl(path: string): string {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return apiBase ? `${apiBase}${path}` : path;
}

export function useUploadFile() {
  const queryClient = useQueryClient();
  const {
    setUploadResponse,
    setCurrentSessionId,
    setTravelData,
    setIsLoading,
    setError,
  } = useTravelDataContext();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append("file", file);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      try {
        const response = await fetch(getApiUrl("/api/upload"), {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Upload failed");
        }

        return response.json();
      } finally {
        clearTimeout(timeoutId);
      }
    },
    onMutate: () => {
      setIsLoading(true);
      setError(null);
    },
    onSuccess: (data) => {
      // Convert entries to TravelData format
      const travelData: TravelData[] = data.entries.map((entry: any) => ({
        _id: entry._id, // ✅ Preserve MongoDB _id
        id: entry._id, // Generate unique ID for each entry
        session_id: data.sessionId,
        created_at: new Date().toISOString(),
        date: entry.date,
        voucher: entry.voucher,
        reference: entry.reference,
        narration: entry.narration,
        debit: entry.debit ?? 0,
        credit: entry.credit ?? 0,
        balance: entry.balance ?? 0,
        customer_name: entry.customer_name ?? "",
        route: entry.route ?? "",
        pnr: entry.pnr ?? "",
        flying_date: entry.flying_date ?? "",
        flight_status:
          (entry.flying_status as FlightStatus) ?? FlightStatus.Coming,
        flying_status:
          (entry.flying_status as FlightStatus) ?? FlightStatus.Coming,
        customer_rate: entry.customer_rate ?? 0,
        company_rate: entry.company_rate ?? 0,
        profit: entry.profit ?? 0,
        payment_status:
          (entry.payment_status as PaymentStatus) ?? PaymentStatus.Pending,
        updated_at: new Date().toISOString(),
      }));

      // Update state directly since we're using MongoDB now
      setTravelData(travelData); // Add this line
      setUploadResponse(data);
      setCurrentSessionId(data.sessionId);
      queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
      setIsLoading(false);
    },
    onError: (error) => {
      setError(error.message);
      setIsLoading(false);
    },
  });
}

interface PaginatedResponse {
  data: TravelData[];
  total: number;
  totalPages: number;
}

export function useTravelDataBySession(
  sessionId: string | null,
  page = 1,
  pageSize = 50
) {
  const { setTravelData } = useTravelDataContext();

  return useQuery<PaginatedResponse, Error>({
    queryKey: ["/api/travel-data", sessionId, page, pageSize],
    queryFn: async () => {
      if (!sessionId) return { data: [], total: 0, totalPages: 0 };

      const response = await fetch(
        getApiUrl(
          `/api/travel-data/${sessionId}?page=${page}&pageSize=${pageSize}`
        )
      );
      if (!response.ok) {
        throw new Error("Failed to fetch travel data");
      }
      const result = await response.json();
      return result;
    },
    enabled: !!sessionId,
    select: (result) => {
      // Normalize server items, preserve both id and _id
      const normalized = result.data.map((item: any) => ({
        ...item,
        _id: item._id, // ✅ Preserve MongoDB _id
        id: item.id ?? item._id, // ✅ Use _id as id if id doesn't exist
      }));

      setTravelData(normalized);
      return {
        ...result,
        data: normalized,
      };
    },
  });
}

export function useUpdateTravelData() {
  const queryClient = useQueryClient();
  const { updateTravelDataItem } = useTravelDataContext();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<TravelData>;
    }) => {
      // Use MongoDB _id if available, fallback to id
      const mongoId = (data as any)._id || id; // Cast to any to access potential _id

      const response = await apiRequest(
        "PATCH",
        `/api/travel-data/${mongoId}`,
        data
      );

      if (!response.ok) {
        throw new Error("Failed to update travel data");
      }

      const updatedData = await response.json();

      // Ensure both id and _id are present in the response
      return {
        ...updatedData,
        id: updatedData._id || updatedData.id,
        _id: updatedData._id || updatedData.id,
      };
    },
    onSuccess: (updatedItem, { id }) => {
      // Update with the consistent ID
      const updatedId = updatedItem._id || id;
      updateTravelDataItem(updatedId, updatedItem);
      queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
    },
  });
}

export function useDeleteTravelData() {
  const queryClient = useQueryClient();
  const { removeTravelDataItem } = useTravelDataContext();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!id) {
        throw new Error("Invalid id for delete");
      }
      // ensure id is a string
      const idStr = String(id);
      return apiRequest("DELETE", `/api/travel-data/${idStr}`);
    },
    onSuccess: (_, id) => {
      try {
        removeTravelDataItem(String(id));
      } catch (e) {
        console.warn("Failed to remove local item after delete", e);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
    },
  });
}

export function useCreateTravelData() {
  const queryClient = useQueryClient();
  const { setTravelData } = useTravelDataContext();

  return useMutation({
    mutationFn: async (
      data: Omit<TravelDataBase, "id">
    ): Promise<TravelDataBase> => {
      const response = await apiRequest("POST", "/api/travel-data", data);
      const mongoResponse = await response.json();

      if (!response.ok) {
        error("Server error response:", mongoResponse);
        throw new Error(
          mongoResponse.message || "Failed to create travel data"
        );
      }

      // Convert MongoDB response to TravelDataBase format
      // Convert MongoDB response to TravelDataBase format
      return {
        ...mongoResponse,
        _id: mongoResponse._id, // ✅ Preserve _id
        id: mongoResponse._id, // ✅ Use _id as id
      };
    },
    onSuccess: (createdItem: TravelDataBase) => {
      queryClient.invalidateQueries({ queryKey: ["/api/travel-data"] });
      // Update the query cache
      queryClient.setQueryData<TravelDataBase[]>(["/api/travel-data"], (old) =>
        old ? [createdItem, ...old] : [createdItem]
      );
      // Direct state update
      setTravelData([createdItem]);
    },
  });
}

export function useUploadSessions() {
  return useQuery<UploadSession[]>({
    queryKey: ["/api/upload-sessions"],
    queryFn: async () => {
      const response = await fetch(getApiUrl("/api/upload-sessions"));
      if (!response.ok) {
        throw new Error("Failed to fetch upload sessions");
      }
      const data: any[] = await response.json();
      // Map database fields to UploadSession interface
      return data.map((session) => ({
        id: session.id,
        filename: session.filename || "Uploaded File",
        opening_balance: session.opening_balance,
        total_records: session.total_records,
        created_at: new Date(session.created_at).toISOString(),
        updated_at: new Date(
          session.updated_at || session.created_at
        ).toISOString(),
      }));
    },
  });
}
