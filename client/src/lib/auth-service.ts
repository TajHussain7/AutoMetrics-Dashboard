import axios from "axios";
import { debug, error as errorLogger } from "@/lib/logger";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  status?: "active" | "inactive";
  created_at: string;
}

interface AuthResponse {
  user: User | null;
  token?: string;
  error?: string;
}

class AuthService {
  private getBaseUrl() {
    const apiBase = import.meta.env.VITE_API_URL ?? "";
    return apiBase ? `${apiBase}/api/auth` : "/api/auth";
  }

  private axiosInstance = axios.create({
    withCredentials: true,
    get baseURL() {
      const apiBase = import.meta.env.VITE_API_URL ?? "";
      return apiBase ? `${apiBase}/api/auth` : "/api/auth";
    },
  });

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      debug("Auth service: Attempting login for:", email);
      const response = await this.axiosInstance.post("/login", {
        email,
        password,
      });
      debug("Auth service: Login response:", response.data);
      return response.data;
    } catch (error: any) {
      // Log minimal info; avoid printing full error objects in production
      errorLogger("Auth service: Login error:", {
        status: error.response?.status,
        message: error.message,
      });
      return {
        user: null,
        error:
          error.response?.data?.message || error.message || "Failed to sign in",
      };
    }
  }

  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> {
    try {
      debug("Attempting to register user:", { email, fullName });

      const response = await this.axiosInstance.post("/register", {
        email,
        password,
        fullName,
      });

      debug("Registration response:", response.data);

      return response.data;
    } catch (error: any) {
      // Only log minimal info
      errorLogger("Registration error:", {
        status: error.response?.status,
        message: error.message,
      });

      return {
        user: null,
        error:
          error.response?.data?.message ||
          error.message ||
          "Failed to create account",
      };
    }
  }

  async signOut(): Promise<void> {
    await this.axiosInstance.post("/logout");
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await this.axiosInstance.get("/me");
      return response.data.user;
    } catch {
      return null;
    }
  }

  async getSession(): Promise<{ user: User | null }> {
    const user = await this.getCurrentUser();
    return { user };
  }
}

export const authService = new AuthService();
