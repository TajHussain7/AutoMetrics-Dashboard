import { ReactNode } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({
  children,
  adminOnly = false,
}: ProtectedRouteProps) {
  const { user, loading, isAdmin } = useAuth();

  if (adminOnly && !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Access Denied
          </h2>
          <p className="text-center text-gray-600">
            You need administrator privileges to access this content.
          </p>
          <div className="flex justify-center">
            <Button
              variant="default"
              onClick={() => (window.location.href = "/")}
            >
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-md">
        <Card className="p-6 space-y-6">
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Registration Required
          </h2>
          <p className="text-center text-gray-600">
            You need to register or sign in to access this content.
          </p>
          <div className="flex flex-col space-y-3">
            <Button
              variant="default"
              onClick={() => (window.location.href = "/register")}
            >
              Register Now
            </Button>
            <Button
              variant="outline"
              onClick={() => (window.location.href = "/login")}
            >
              Sign In
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
