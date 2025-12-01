import { useEffect } from "react";
import { useLocation } from "wouter";

export function useAuthRedirect() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for auth token in cookies
    const checkAuthToken = () => {
      // Check if there's an authentication cookie
      const isAuthenticated = document.cookie.includes("authToken=");
      if (isAuthenticated) {
        setLocation("/dashboard");
      }
    };

    // Check auth initially
    checkAuthToken();

    // Set up interval to check periodically
    const interval = setInterval(checkAuthToken, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [setLocation]);
}

export function useRequireAuth() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const checkAuth = () => {
      // Check if there's any authentication cookie
      const isAuthenticated = document.cookie.includes("authToken=");
      if (!isAuthenticated) {
        setLocation("/login");
      }
    };

    // Check auth initially and set up interval to check periodically
    checkAuth();
    const interval = setInterval(checkAuth, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval);
    };
  }, [setLocation]);
}
