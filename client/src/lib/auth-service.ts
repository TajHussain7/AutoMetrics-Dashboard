export interface User {
  id: string;
  email: string;
  full_name: string;
  role: "admin" | "user";
  created_at: string;
}

interface AuthResponse {
  user: User | null;
  error?: string;
}

class AuthService {
  private storageKey = "auth_user";

  async signIn(email: string, password: string): Promise<AuthResponse> {
    // In a real app, this would make an API call to your authentication server
    // For now, we'll simulate a successful login with mock data
    const mockUser: User = {
      id: "1",
      email,
      full_name: email.split("@")[0],
      role: "user",
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(mockUser));
    return { user: mockUser };
  }

  async signUp(
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> {
    // In a real app, this would make an API call to create a new user
    const mockUser: User = {
      id: Math.random().toString(36).substring(7),
      email,
      full_name: fullName,
      role: "user",
      created_at: new Date().toISOString(),
    };

    localStorage.setItem(this.storageKey, JSON.stringify(mockUser));
    return { user: mockUser };
  }

  async signOut(): Promise<void> {
    localStorage.removeItem(this.storageKey);
  }

  async getCurrentUser(): Promise<User | null> {
    const userData = localStorage.getItem(this.storageKey);
    return userData ? JSON.parse(userData) : null;
  }

  async getSession(): Promise<{ user: User | null }> {
    return { user: await this.getCurrentUser() };
  }
}

export const authService = new AuthService();
