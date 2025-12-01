import axios from "axios";

// Create an axios instance with credentials enabled for admin API calls
export const adminApiClient = axios.create({
  baseURL: "/api/admin",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default adminApiClient;
