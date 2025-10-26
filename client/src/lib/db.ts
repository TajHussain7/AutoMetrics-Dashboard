// Type definitions for our local database
export type FlightStatus = "Coming" | "Gone" | "Cancelled";

export interface TravelBooking {
  id: string;
  date: string;
  voucher: string;
  customer_name: string;
  route: string;
  pnr: string;
  flying_date: string;
  flight_status: FlightStatus;
  debit: number;
  credit: number;
  balance: number;
  customer_rate: number;
  company_rate: number;
  profit: number;
  created_at: string;
  user_id: string;
}

export const travelBookingsAPI = {
  // Create a new booking
  createBooking: async (
    booking: Omit<TravelBooking, "id" | "created_at" | "profit" | "balance">
  ) => {
    const response = await fetch("/api/travel-bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(booking),
    });

    if (!response.ok) {
      throw new Error("Failed to create booking");
    }
    return response.json();
  },

  // Get a specific booking by ID
  getBookingById: async (id: string) => {
    const response = await fetch(`/api/travel-bookings/${id}`);
    if (!response.ok) {
      throw new Error("Failed to get booking");
    }
    return response.json();
  },

  // Update a booking
  updateBooking: async (id: string, updates: Partial<TravelBooking>) => {
    const response = await fetch(`/api/travel-bookings/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update booking");
    }
    return response.json();
  },

  // Delete a booking
  deleteBooking: async (id: string) => {
    const response = await fetch(`/api/travel-bookings/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Failed to delete booking");
    }
  },

  // Get bookings by date range
  getBookingsByDateRange: async (startDate: string, endDate: string) => {
    const response = await fetch(
      `/api/travel-bookings/range?start=${startDate}&end=${endDate}`
    );
    if (!response.ok) {
      throw new Error("Failed to get bookings by date range");
    }
    return response.json();
  },

  // Get bookings by flight status
  getBookingsByStatus: async (status: FlightStatus) => {
    const response = await fetch(`/api/travel-bookings/status/${status}`);
    if (!response.ok) {
      throw new Error("Failed to get bookings by status");
    }
    return response.json();
  },

  // Search bookings
  searchBookings: async (query: string) => {
    const response = await fetch(`/api/travel-bookings/search?q=${query}`);
    if (!response.ok) {
      throw new Error("Failed to search bookings");
    }
    return response.json();
  },

  // Get booking statistics
  getBookingStats: async () => {
    const response = await fetch("/api/travel-bookings/stats");
    if (!response.ok) {
      throw new Error("Failed to get booking stats");
    }
    return response.json();
  },
};
