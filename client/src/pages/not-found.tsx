import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveContainer } from "@/components/ui/responsive-container";
import { useLocation } from "wouter";
import { AlertCircle, Home } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        <Card className="w-full max-w-md mx-auto border-0 shadow-lg bg-white">
          <CardHeader className="text-center border-b border-slate-200">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">
              404
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6 text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Page Not Found
            </h2>
            <p className="text-slate-600 mb-6">
              The page you are looking for doesn't exist or has been moved.
            </p>
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 transition-all duration-200"
              onClick={() => setLocation("/")}
            >
              <Home className="w-4 h-4 mr-2" />
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
