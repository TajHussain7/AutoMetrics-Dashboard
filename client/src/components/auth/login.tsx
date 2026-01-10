"use client";

import type React from "react";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, LogIn, Mail, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/auth-context";
import { debug, error as errorLogger } from "@/lib/logger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

export default function LoginScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { signIn } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  // Remember me state (persist to localStorage when true)
  const [remember, setRemember] = useState<boolean>(
    () => !!localStorage.getItem("user")
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      debug("Attempting login with:", { email: formData.email });
      const response = await signIn(
        formData.email,
        formData.password,
        remember
      );
      debug("Login response:", response);

      if (response.user) {
        toast({
          title: "Login successful",
          description: "Welcome back!",
        });
        // Persistence handled by AuthContext (localStorage if remembered, sessionStorage otherwise)
        if (response.user.role === "admin") {
          window.location.href = "/admin";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        const errorMessage = response.error || "Login failed";
        errorLogger("Login failed with error:", errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      errorLogger("Login error:", err);
      setError(
        err instanceof Error ? err.message : "Invalid email or password"
      );
      toast({
        title: "Login failed",
        description:
          err instanceof Error
            ? err.message
            : "Please check your credentials and try again",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-200 p-4 py-12 relative overflow-hidden">
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />

      <ResponsiveContainer width="100%">
        <div className="w-full max-w-md mx-auto relative">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

            <CardHeader className="space-y-1 text-center border-b border-slate-100 pb-6 pt-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <LogIn className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                Welcome Back
              </CardTitle>
              <CardDescription className="text-slate-600">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 px-8">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Email
                  </Label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Mail className="w-4 h-4 text-slate-500" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="password"
                      className="text-sm font-semibold text-slate-700"
                    >
                      Password
                    </Label>
                  </div>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Lock className="w-4 h-4 text-slate-500" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="pl-14 pr-12 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-all"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-3 rounded-xl bg-slate-50/50 border border-slate-100">
                  <Checkbox
                    id="remember"
                    className="rounded"
                    checked={remember}
                    onCheckedChange={(val) => setRemember(Boolean(val))}
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-slate-600"
                  >
                    Remember me
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>Signing in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      <span>Sign In</span>
                    </div>
                  )}
                </Button>
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 text-center border-t border-slate-100 pt-6 pb-8 px-8">
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <a
                  href="/register"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Create account
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
