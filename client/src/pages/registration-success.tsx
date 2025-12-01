import { useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function RegistrationSuccess() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated) {
      setLocation("/login");
    }
  }, [isAuthenticated, setLocation]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="max-w-md mx-auto border-0 shadow-lg bg-white">
          <CardHeader className="text-center border-b border-slate-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-slate-900">
              Registration Successful!
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            <p className="text-slate-600 text-center mb-8">
              Your account has been created successfully. You now have full
              access to all features.
            </p>

            <div className="space-y-3">
              <Button
                className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
                onClick={() => setLocation("/dashboard")}
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() => setLocation("/upload")}
              >
                Upload Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
