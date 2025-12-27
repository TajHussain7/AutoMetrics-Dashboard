import { createContext, useContext, useEffect, useState } from "react";
import { authService, User } from "@/lib/auth-service";
import { useToast } from "@/hooks/use-toast";
import { debug, error as errorLogger } from "@/lib/logger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  signIn: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<AuthResponse>;
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
        // First check localStorage and sessionStorage for user data (remember me uses localStorage)
        const storedUser =
          localStorage.getItem("user") || sessionStorage.getItem("user");
        if (storedUser) {
          // Validate stored user with the server to ensure cookie/session is valid and user is up-to-date
          try {
            const { user } = await authService.getSession();
            if (user) {
              setUser(user);
              setLoading(false);
              return;
            }
            // If there's no server session, clear stored user data
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
          } catch (err) {
            debug("Stored user validation failed:", err);
            localStorage.removeItem("user");
            sessionStorage.removeItem("user");
          }
        }

        // If no stored valid user, check the server session directly
        const { user } = await authService.getSession();
        if (user) {
          // Persist to sessionStorage by default when discovered from server session
          sessionStorage.setItem("user", JSON.stringify(user));
          setUser(user);
        }
      } catch (error) {
        errorLogger("Error loading user:", error);
        // Clear any invalid session data
        sessionStorage.removeItem("user");
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Setup deactivation fetch interceptor so server-side deactivation causes UI update
    let cleanupFetch: (() => void) | undefined;
    // Dynamically import the interceptor in the browser environment
    import("@/lib/deactivation-interceptor")
      .then(({ setupDeactivationFetchInterceptor }) => {
        cleanupFetch = setupDeactivationFetchInterceptor();
      })
      .catch((err) => {
        console.warn(
          "Deactivation fetch interceptor failed to initialize:",
          err
        );
      });

    return () => {
      if (cleanupFetch) cleanupFetch();
    };
  }, []);

  const signIn = async (
    email: string,
    password: string,
    remember = false
  ): Promise<AuthResponse> => {
    try {
      const response = await authService.signIn(email, password);
      if (response.error) {
        return { user: null, error: response.error };
      }

      setUser(response.user);
      // Persist user data based on remember flag (localStorage for long lived, sessionStorage otherwise)
      if (response.user) {
        if (remember) {
          localStorage.setItem("user", JSON.stringify(response.user));
        } else {
          sessionStorage.setItem("user", JSON.stringify(response.user));
        }
      }

      toast({
        title: "Welcome back!",
        description: "You have successfully signed in.",
      });

      return response;
    } catch (error) {
      errorLogger("Error signing in:", error);
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
      errorLogger("Error signing up:", error);
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
      // Clear stored user from both storage locations
      sessionStorage.removeItem("user");
      localStorage.removeItem("user");
      setUser(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
      // Do not perform navigation here. Callers should navigate (SPA navigation) after signOut.
    } catch (error) {
      errorLogger("Error signing out:", error);
      toast({
        title: "Error signing out",
        description: "Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Listen for global "account-deactivated" events and update user status accordingly
  useEffect(() => {
    const handler = (ev: any) => {
      const data = ev?.detail || {};
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, status: "inactive" as const };
        try {
          // Persist the change to whichever storage currently used
          if (localStorage.getItem("user"))
            localStorage.setItem("user", JSON.stringify(next));
          if (sessionStorage.getItem("user"))
            sessionStorage.setItem("user", JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist user status change locally:", e);
        }
        toast({
          title: "Account deactivated",
          description:
            "Your account has been deactivated by an administrator. Some actions are disabled.",
          variant: "destructive",
        });
        return next;
      });
    };

    window.addEventListener("account-deactivated", handler as EventListener);
    return () =>
      window.removeEventListener(
        "account-deactivated",
        handler as EventListener
      );
  }, [toast]);

  // Listen for global "account-reactivated" events and update user status accordingly
  useEffect(() => {
    const handler = (ev: any) => {
      const data = ev?.detail || {};
      setUser((prev) => {
        if (!prev) return prev;
        const next = { ...prev, status: "active" as const };
        try {
          if (localStorage.getItem("user"))
            localStorage.setItem("user", JSON.stringify(next));
          if (sessionStorage.getItem("user"))
            sessionStorage.setItem("user", JSON.stringify(next));
        } catch (e) {
          console.warn("Failed to persist user status change locally:", e);
        }
        toast({
          title: "Account reactivated",
          description: "Your account access has been restored.",
        });
        return next;
      });
    };

    window.addEventListener("account-reactivated", handler as EventListener);
    return () =>
      window.removeEventListener(
        "account-reactivated",
        handler as EventListener
      );
  }, [toast]);

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
