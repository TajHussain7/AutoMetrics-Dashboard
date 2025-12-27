"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { AxiosError } from "axios";
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
import { Eye, EyeOff, UserPlus, User, Mail, Lock } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { debug, error as errorLogger } from "@/lib/logger";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

export default function RegisterScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  // Verification state
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string | null>(
    null
  );
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) {
          clearInterval(t);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.email || !formData.password || !formData.fullName) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }

    try {
      const response = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (response?.user) {
        toast({
          title: "Registration successful",
          description: "A verification code has been sent to your email.",
        });
        // Start verification flow
        setVerificationPending(true);
        setVerificationEmail(formData.email);

        // Start verification flow
        // (Do not reveal OTP on client or in logs in any environment.)
      } else {
        debug("Registration response:", response);
        throw new Error(response?.error || "Failed to create account");
      }
    } catch (error) {
      errorLogger("Registration error details:", error);

      let errorMessage = "Failed to create account";

      if (error instanceof AxiosError) {
        errorMessage = error.response?.data?.message || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setError(errorMessage);
      toast({
        title: "Registration failed",
        description: errorMessage,
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
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl" />

      <ResponsiveContainer width="100%">
        <div className="w-full max-w-md mx-auto relative">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

            <CardHeader className="space-y-1 text-center border-b border-slate-100 pb-6 pt-8">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/25">
                <UserPlus className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold text-slate-900">
                Create an Account
              </CardTitle>
              <CardDescription className="text-slate-600">
                Enter your details below to create your account
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 px-8">
              {error && (
                <Alert variant="destructive" className="mb-4 rounded-xl">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <form onSubmit={handleSubmit} className="space-y-5">
                {!verificationPending ? (
                  <>
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Full Name
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                          <User className="w-4 h-4 text-slate-500" />
                        </div>
                        <Input
                          id="fullName"
                          placeholder="Your full name"
                          required
                          value={formData.fullName}
                          onChange={handleInputChange}
                          className="pl-14 h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                    </div>

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
                      <Label
                        htmlFor="password"
                        className="text-sm font-semibold text-slate-700"
                      >
                        Password
                      </Label>
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

                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-white rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                          <span>Creating Account...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <UserPlus className="h-5 w-5" />
                          <span>Create Account</span>
                        </div>
                      )}
                    </Button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                      An OTP has been sent to{" "}
                      <strong>{verificationEmail}</strong>. Enter it below to
                      verify your email.
                    </p>
                    <div className="flex gap-2">
                      <Input
                        id="otp"
                        placeholder="6-digit code"
                        required
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="h-12 rounded-xl border-slate-200 hover:border-blue-400 focus:border-blue-500 transition-all duration-200"
                      />
                      <Button
                        onClick={async () => {
                          setIsVerifying(true);
                          try {
                            if (!verificationEmail)
                              throw new Error("No email to verify");
                            const resp = await (
                              await import("@/lib/auth-service")
                            ).authService.verifyOtp(verificationEmail, otp);
                            if (resp.user) {
                              toast({
                                title: "Email verified",
                                description:
                                  "Your email has been verified and you are now signed in.",
                              });
                              window.location.href = "/dashboard";
                            } else {
                              throw new Error(
                                resp.error || "Verification failed"
                              );
                            }
                          } catch (err: any) {
                            toast({
                              title: "Verification failed",
                              description: err?.message || "Invalid code",
                              variant: "destructive",
                            });
                          } finally {
                            setIsVerifying(false);
                          }
                        }}
                        className="h-12"
                        disabled={isVerifying}
                      >
                        {isVerifying ? "Verifying..." : "Verify"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-500">Didn't get it?</p>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          if (!verificationEmail) return;
                          setIsResending(true);
                          try {
                            const resp = await (
                              await import("@/lib/auth-service")
                            ).authService.resendOtp(verificationEmail);
                            if (resp.error) throw new Error(resp.error);
                            toast({
                              title: "OTP sent",
                              description: "Check your email.",
                            });
                            setResendCooldown(60);
                          } catch (err: any) {
                            toast({
                              title: "Resend failed",
                              description:
                                err?.message || "Please try again later.",
                              variant: "destructive",
                            });
                          } finally {
                            setIsResending(false);
                          }
                        }}
                        disabled={isResending || resendCooldown > 0}
                      >
                        {isResending
                          ? "Sending..."
                          : resendCooldown > 0
                          ? `Resend (${resendCooldown}s)`
                          : "Resend"}
                      </Button>
                    </div>
                  </div>
                )}
              </form>
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 text-center border-t border-slate-100 pt-6 pb-8 px-8">
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  Sign in
                </a>
              </p>
            </CardFooter>
          </Card>
        </div>
      </ResponsiveContainer>
    </div>
  );
}
