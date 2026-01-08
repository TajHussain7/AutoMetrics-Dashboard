import axios from "axios";

// Create an axios instance with credentials enabled for admin API calls
const getBaseURL = () => {
  const apiBase = import.meta.env.VITE_API_URL ?? "";
  return apiBase ? `${apiBase}/api/admin` : "/api/admin";
};

export const adminApiClient = axios.create({
  get baseURL() {
    return getBaseURL();
  },
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default adminApiClient;
