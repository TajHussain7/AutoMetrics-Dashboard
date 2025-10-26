// Constants for localStorage keys
const STORAGE_KEYS = {
  TRAVEL_DATA: "taj-metrics-travel-data",
  UPLOAD_SESSION: "taj-metrics-upload-session",
  LAST_MODIFIED: "taj-metrics-last-modified",
} as const;

// Types
import type { TravelData, UploadSession } from "@shared/schema";

export interface StoredData {
  travelData: TravelData[];
  uploadSession: UploadSession | null;
  lastModified: string;
}

// Utility functions
export const saveToStorage = (data: Partial<StoredData>) => {
  try {
    console.log("Saving data to localStorage:", data);
    if (!data.travelData?.length) {
      console.warn("No travel data to save");
      return;
    }

    // Save travel data
    if (data.travelData) {
      const serialized = JSON.stringify(data.travelData);
      localStorage.setItem(STORAGE_KEYS.TRAVEL_DATA, serialized);
      console.log("Saved travel data:", data.travelData.length, "items");
    }

    // Save upload session
    if (data.uploadSession) {
      const serialized = JSON.stringify(data.uploadSession);
      localStorage.setItem(STORAGE_KEYS.UPLOAD_SESSION, serialized);
      console.log("Saved upload session:", data.uploadSession.id);
    }

    // Save timestamp
    const timestamp = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.LAST_MODIFIED, timestamp);
    console.log("Storage updated at:", timestamp);

    // Verify data was saved
    const savedTravelData = localStorage.getItem(STORAGE_KEYS.TRAVEL_DATA);
    const savedSession = localStorage.getItem(STORAGE_KEYS.UPLOAD_SESSION);
    console.log("Verification - Data in storage:", {
      hasTravelData: !!savedTravelData,
      hasSession: !!savedSession,
    });
  } catch (error) {
    console.error("Error saving to localStorage:", error);
  }
};

export const loadFromStorage = (): StoredData | null => {
  try {
    const travelDataStr = localStorage.getItem(STORAGE_KEYS.TRAVEL_DATA);
    const uploadSessionStr = localStorage.getItem(STORAGE_KEYS.UPLOAD_SESSION);
    const lastModified = localStorage.getItem(STORAGE_KEYS.LAST_MODIFIED);

    if (!travelDataStr || !uploadSessionStr) return null;

    return {
      travelData: JSON.parse(travelDataStr),
      uploadSession: JSON.parse(uploadSessionStr),
      lastModified: lastModified || new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error loading from localStorage:", error);
    return null;
  }
};

export const clearStorage = () => {
  try {
    Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
  } catch (error) {
    console.error("Error clearing localStorage:", error);
  }
};
