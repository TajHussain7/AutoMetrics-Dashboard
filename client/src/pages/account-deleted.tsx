"use client";

import { CheckCircle2, Home, Mail, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AccountDeleted() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 px-4 relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <Card className="max-w-md w-full shadow-2xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden relative z-10">
        {/* Gradient accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

        <CardHeader className="flex flex-col items-center pt-8 pb-4">
          {/* Icon badge with gradient */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl blur-xl opacity-30 animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center shadow-lg">
              <CheckCircle2
                className="w-10 h-10 text-white"
                strokeWidth={2.5}
              />
            </div>
          </div>

          {/* Heading with gradient text */}
          <h2 className="text-3xl font-bold mb-3 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
            Account Deleted
          </h2>
          <p className="text-slate-600 text-center text-base leading-relaxed max-w-sm">
            Your account has been successfully deleted. Thank you for using our
            service.
          </p>
        </CardHeader>

        <CardContent className="pb-8 px-8">
          <div className="space-y-3">
            {/* Primary action button */}
            <Button
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl gap-2"
              onClick={() => navigate("/")}
            >
              <Home className="w-5 h-5" />
              Go to Home
            </Button>

            {/* Secondary action button */}
            <Button
              variant="outline"
              className="w-full h-12 border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-slate-700 font-medium rounded-xl gap-2 shadow-sm hover:shadow transition-all duration-200 bg-transparent"
              onClick={() => navigate("/contact")}
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </Button>
          </div>

          {/* Additional info */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500 text-center leading-relaxed">
              If you deleted your account by mistake or have any questions,
              please reach out to our support team.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
