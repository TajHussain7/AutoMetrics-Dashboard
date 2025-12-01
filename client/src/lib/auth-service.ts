import axios from "axios";

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "member";
  created_at: string;
}

interface AuthResponse {
  user: User | null;
  token?: string;
  error?: string;
}

class AuthService {
  private baseUrl = "/api/auth";
  private axiosInstance = axios.create({
    withCredentials: true,
    baseURL: this.baseUrl,
  });

  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.debug("Auth service: Attempting login for:", email);
      const response = await this.axiosInstance.post("/login", {
        email,
        password,
      });
      console.debug("Auth service: Login response:", response.data);
      return response.data;
    } catch (error: any) {
      console.error("Auth service: Login error:", {
        status: error.response?.status,
        data: error.response?.data,
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
      console.debug("Attempting to register user:", { email, fullName });

      const response = await this.axiosInstance.post("/register", {
        email,
        password,
        fullName,
      });

      console.debug("Registration response:", response.data);

      return response.data;
    } catch (error: any) {
      console.error("Registration error:", {
        status: error.response?.status,
        data: error.response?.data,
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
