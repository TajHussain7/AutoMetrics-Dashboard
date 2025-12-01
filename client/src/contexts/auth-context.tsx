import { createContext, useContext, useEffect, useState } from "react";
import { authService, User } from "@/lib/auth-service";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<AuthResponse>;
  signUp: (
    email: string,
    password: string,
    fullName: string
  ) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

interface AuthResponse {
  user: User | null;
  token?: string;
  error?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAuthenticated: false,
  isAdmin: false,
  signIn: async () => ({ user: null }),
  signUp: async () => ({ user: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First check sessionStorage for user data
        const storedUser = sessionStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          setLoading(false);
          return;
        }

        // If no stored user, check the server session
        const { user } = await authService.getSession();
        if (user) {
          sessionStorage.setItem("user", JSON.stringify(user));
          setUser(user);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        // Clear any invalid session data
        sessionStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse> => {
    try {
      const response = await authService.signIn(email, password);
      if (response.error) {
        return { user: null, error: response.error };
      }

      setUser(response.user);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return response;
    } catch (error) {
      console.error("Error signing in:", error);
      toast({
        title: "Error signing in",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
      return {
        user: null,
        error: error instanceof Error ? error.message : "Failed to sign in",
      };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string
  ): Promise<AuthResponse> => {
    try {
      const response = await authService.signUp(email, password, fullName);
      if (response.error) {
        return { user: null, error: response.error };
      }

      setUser(response.user);
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });

      return response;
    } catch (error) {
      console.error("Error signing up:", error);
      toast({
        title: "Error creating account",
        description: "Please try again with different credentials.",
        variant: "destructive",
      });
      return {
        user: null,
        error:
          error instanceof Error ? error.message : "Failed to create account",
      };
    }
  };

  const signOut = async () => {
    try {
      await authService.signOut();
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      window.location.href = "/login";
    } catch (error) {
      console.error("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
