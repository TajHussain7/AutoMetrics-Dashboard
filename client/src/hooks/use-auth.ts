import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuthRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for auth token in session storage
    const checkAuthToken = () => {
      const token = sessionStorage.getItem("authToken");
      if (token) {
        setLocation("/dashboard");
      }
    };

    // Add listener for storage events to handle token changes
    window.addEventListener("storage", checkAuthToken);
    checkAuthToken();

    return () => {
      window.removeEventListener("storage", checkAuthToken);
    };
  }, [setLocation]);
}

export function useRequireAuth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      const token = sessionStorage.getItem("authToken");
      if (!token) {
        setLocation("/login");
      }
    };

    // Add listener for storage events to handle token changes
    window.addEventListener("storage", checkAuth);
    checkAuth();

    return () => {
      window.removeEventListener("storage", checkAuth);
    };
  }, [setLocation]);
}
