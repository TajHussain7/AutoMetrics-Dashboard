"use client";

import React, { useState, useEffect } from "react";
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
import { Mail, Lock } from "lucide-react";
import { ResponsiveContainer } from "@/components/ui/responsive-container";

export default function ForgotPasswordScreen() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"request" | "reset">("request");
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [sentFlag, setSentFlag] = useState(false);

  // Reset sent flag when the email changes so UI stays consistent
  useEffect(() => {
    setSentFlag(false);
  }, [email]);

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

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const sendOtp = async () => {
    if (!validateEmail(email)) {
      return toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
    }

    setIsLoading(true);
    try {
      const resp = await (
        await import("@/lib/auth-service")
      ).authService.requestPasswordReset(email);

      // Always present a friendly, non-technical message to the user
      toast({
        title: "If an account exists",
        description:
          "If an account exists for this email, an OTP was sent. Check your inbox or spam.",
      });

      // Do not auto-advance. Let the user click "I have a code" to proceed to reset.
      setSentFlag(true);
      setResendCooldown(60);
    } catch (err: any) {
      // For errors (network, provider issues), still show a friendly message
      toast({
        title: "If an account exists",
        description:
          "If an account exists for this email, an OTP was sent. If you don't receive it, try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    try {
      await (
        await import("@/lib/auth-service")
      ).authService.requestPasswordReset(email);

      toast({
        title: "OTP resent",
        description: "If your account exists, a code was sent to your email.",
      });
      setResendCooldown(60);
    } catch (err: any) {
      // Show a friendly, non-technical message on failure
      toast({
        title: "Resend",
        description:
          "If your account exists for this email, an OTP was sent. If you don't receive it, try again later.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const submitReset = async () => {
    if (!otp || !newPassword || !confirmPassword)
      return toast({
        title: "Missing fields",
        description: "Please fill all fields",
        variant: "destructive",
      });
    if (newPassword.length < 6)
      return toast({
        title: "Weak password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
    if (newPassword !== confirmPassword)
      return toast({
        title: "Password mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
    setIsLoading(true);
    try {
      const resp = await (
        await import("@/lib/auth-service")
      ).authService.resetPassword(email, otp, newPassword);
      if (resp.error) throw new Error(resp.error);
      toast({
        title: "Password reset",
        description: "Your password has been updated and you are signed in.",
      });
      window.location.href = "/dashboard";
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err?.message || "Invalid code or expired",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 via-blue-50/30 to-slate-200 p-4 py-12 relative overflow-hidden">
      <ResponsiveContainer width="100%">
        <div className="w-full max-w-md mx-auto relative">
          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

            <CardHeader className="space-y-1 text-center border-b border-slate-100 pb-6 pt-8">
              <CardTitle className="text-3xl font-bold text-slate-900">
                Forgot Password
              </CardTitle>
              <CardDescription className="text-slate-600">
                Reset your password by verifying your email first
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-6 px-8">
              {step === "request" ? (
                <div className="space-y-4">
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
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-14 h-12 rounded-xl"
                    />
                  </div>

                  <Button
                    className="w-full h-12"
                    onClick={sendOtp}
                    disabled={isLoading || !email}
                  >
                    {isLoading ? "Sending..." : "Send verification code"}
                  </Button>

                  {sentFlag && (
                    <div className="mt-2 text-sm text-slate-600 space-y-2">
                      <p>
                        We've attempted to send a code to{" "}
                        <strong>{email}</strong>. If an account exists you will
                        receive it shortly.
                      </p>

                      <div className="flex gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => setStep("reset")}
                        >
                          I have a code
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={resend}
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
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-slate-600">
                    A code was sent to <strong>{email}</strong>. Enter it below
                    along with a new password.
                  </p>

                  <Label
                    htmlFor="otp"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Code
                  </Label>
                  <Input
                    id="otp"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="h-12 rounded-xl"
                  />

                  <Label
                    htmlFor="newPassword"
                    className="text-sm font-semibold text-slate-700"
                  >
                    New password
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-xl"
                  />

                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-slate-700"
                  >
                    Confirm password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-xl"
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={submitReset}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? "Resetting..." : "Reset password"}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={resend}
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-2 text-center border-t border-slate-100 pt-6 pb-8 px-8">
              <p className="text-sm text-slate-600">
                Remembered your password?{" "}
                <a
                  href="/login"
                  className="text-blue-600 hover:text-blue-700 font-semibold"
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
