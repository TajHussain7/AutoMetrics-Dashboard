"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { contactSchema, type ContactFormData } from "@shared/contact-schema";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Mail,
  Send,
  User,
  MessageSquare,
  ArrowLeft,
  Building2,
  ExternalLink,
  Phone,
} from "lucide-react";
import { Header } from "@/components/header";
import { error } from "@/lib/logger";
import Footer from "@/components/navigation/footer";

export default function ContactPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
  });

  // Use an optional Vite env var to set the API base when the frontend is served separately.
  const apiBase = (import.meta as any).env?.VITE_API_URL ?? "";
  const contactUrl = apiBase
    ? `${apiBase.replace(/\/$/, "")}/api/contact`
    : "/api/contact";

  const onSubmit = async (data: ContactFormData) => {
    try {
      setIsSubmitting(true);
      await axios.post(contactUrl, data);
      toast({
        title: "Message sent",
        description: "Thank you — we will respond soon!",
      });
      reset();
    } catch (err: any) {
      error("Contact submission error:", err?.response || err);
      if (err?.response?.status === 404) {
        toast({
          title: "Service unavailable",
          description:
            "Contact service not found (404). Is the backend server running?",
        });
      } else {
        toast({
          title: "Error",
          description:
            err?.response?.data?.message || err?.message || "Failed to send",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen ">
      <Header />

      <main className="flex-1 relative bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 py-12 overflow-hidden">
        {/* Ambient background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" />
        </div>

        <div className="w-full max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Left sidebar with company info */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="rounded-2xl shadow-xl bg-white/80 backdrop-blur-sm border-0 relative h-full flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

                <div className="flex justify-center -mt-8 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-white" />
                  </div>
                </div>

                <CardHeader className="pt-0">
                  <CardTitle className="text-2xl text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Contact Support
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Business Objective */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/50 to-purple-50/50 border border-blue-100/50">
                    <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
                        <MessageSquare className="w-4 h-4 text-white" />
                      </div>
                      Business Objective
                    </h4>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Our mission is to provide fast, reliable travel data
                      extraction and analytics so teams can make informed
                      decisions quickly. We focus on accuracy, performance, and
                      privacy.
                    </p>
                  </div>

                  {/* Company Links */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-100">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-sm">
                        <ExternalLink className="w-4 h-4 text-white" />
                      </div>
                      Company Links
                    </h4>
                    <ul className="space-y-2">
                      <li>
                        <a
                          className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-2 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50/50"
                          href="/"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Website (placeholder)
                        </a>
                      </li>
                      <li>
                        <a className="text-sm text-blue-600 hover:text-blue-700 hover:underline cursor-pointer flex items-center gap-2 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                          Docs (placeholder)
                        </a>
                      </li>
                    </ul>
                  </div>

                  {/* Admin Info */}
                  <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-xl border border-blue-100/50">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-sm">
                        <User className="w-4 h-4 text-white" />
                      </div>
                      Admin
                    </h4>
                    <div className="flex items-center gap-3 mb-3">
                      <img
                        src="profile.jpg"
                        alt="Tajamal Hussain"
                        className="w-14 h-14 rounded-xl object-cover shadow-lg border-2 border-white"
                      />

                      <div>
                        <div className="font-semibold text-slate-900">
                          Tajamal Hussain
                        </div>
                        <div className="text-sm text-slate-600">
                          Support Lead
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed mb-3 italic">
                      Motive: "To help customers get the most value from
                      AutoMetrics — fast onboarding and practical answers."
                    </p>
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-white/70 border border-green-100">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-slate-600">WhatsApp:</span>
                      <a
                        className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
                        href="https://wa.me/3438002540"
                      >
                        +92 343 800 2540
                      </a>
                    </div>
                  </div>

                  {/* How to use */}
                  <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-700 mb-3">
                      How to use the system
                    </h4>
                    <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 leading-relaxed">
                      <li className="pl-1">
                        Upload your travel CSV/Excel files on the dashboard.
                      </li>
                      <li className="pl-1">
                        Review parsed data in the analytics panel and correct
                        mappings as needed.
                      </li>
                      <li className="pl-1">
                        Export cleaned data or save to your account for later
                        use.
                      </li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right side - Contact Form */}
            <div className="lg:col-span-2">
              <Card className="rounded-2xl shadow-xl bg-white/80 backdrop-blur-sm border-0 relative h-full flex flex-col">
                <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

                <div className="flex justify-center -mt-8 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center">
                    <Mail className="w-8 h-8 text-white" />
                  </div>
                </div>

                <CardContent className="p-8 pt-4 flex-1 flex flex-col">
                  <h3 className="text-2xl font-semibold mb-2 text-center bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Send us a message
                  </h3>
                  <p className="text-sm text-slate-600 text-center mb-6">
                    We'll get back to you as soon as possible
                  </p>

                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      // Ensure default is prevented in all browsers and then run RHF
                      void handleSubmit(onSubmit)(e);
                    }}
                    className="space-y-5 flex-1 flex flex-col"
                  >
                    <div>
                      <Label
                        htmlFor="name"
                        className="text-sm font-semibold text-slate-700 mb-1.5 block"
                      >
                        Name
                      </Label>
                      <Input
                        id="name"
                        {...register("name")}
                        className="mt-1 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                        placeholder="Your full name"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-500 mt-1.5">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="email"
                        className="text-sm font-semibold text-slate-700 mb-1.5 block"
                      >
                        Email
                      </Label>
                      <Input
                        id="email"
                        {...register("email")}
                        className="mt-1 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                        placeholder="your.email@example.com"
                      />
                      {errors.email && (
                        <p className="text-sm text-red-500 mt-1.5">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label
                        htmlFor="subject"
                        className="text-sm font-semibold text-slate-700 mb-1.5 block"
                      >
                        Subject{" "}
                        <span className="text-slate-400 font-normal">
                          (optional)
                        </span>
                      </Label>
                      <Input
                        id="subject"
                        {...register("subject")}
                        className="mt-1 h-11 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm"
                        placeholder="Brief description of your inquiry"
                      />
                    </div>

                    <div>
                      <Label
                        htmlFor="message"
                        className="text-sm font-semibold text-slate-700 mb-1.5 block"
                      >
                        Message
                      </Label>
                      <Textarea
                        id="message"
                        {...register("message")}
                        rows={6}
                        className="mt-1 bg-white border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 shadow-sm resize-none"
                        placeholder="Tell us how we can help you..."
                      />
                      {errors.message && (
                        <p className="text-sm text-red-500 mt-1.5">
                          {errors.message.message}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 gap-2 "
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
