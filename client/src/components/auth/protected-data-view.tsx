import React from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ProtectedDataViewProps {
  children: React.ReactNode;
}

export function ProtectedDataView({ children }: ProtectedDataViewProps) {
  const { user } = useAuth();

  return (
    <div className="relative">
      {children}
      {!user && (
        <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-50">
          <div className="flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md mx-4 p-6">
              <h3 className="text-xl font-semibold text-center mb-4">
                Registration Required
              </h3>
              <p className="text-center text-gray-600 mb-6">
                To view complete information and access all features, please
                register for free.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => (window.location.href = "/register")}
                  className="w-full"
                >
                  Register Now
                </Button>
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/login")}
                  className="w-full"
                >
                  Sign In
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
