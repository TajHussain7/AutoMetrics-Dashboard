import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function BlurOverlay() {
  const [, navigate] = useLocation();

  return (
    <div className="absolute inset-0 backdrop-blur-sm bg-white/30 z-50 flex items-center justify-center">
      <Card className="w-full max-w-md p-6 shadow-lg">
        <h3 className="text-xl font-semibold text-center mb-4">
          Registration Required
        </h3>
        <p className="text-center text-gray-600 mb-6">
          To view complete information and access all features, please register
          for free.
        </p>
        <div className="flex flex-col gap-3">
          <Button className="w-full" onClick={() => navigate("/register")}>
            Register Now
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/login")}
          >
            Sign In
          </Button>
        </div>
      </Card>
    </div>
  );
}
