"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import {
  Send,
  Loader2,
  Bug,
  Lightbulb,
  MessageCircle,
  HelpCircle,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { feedbackSchema, type FeedbackFormData } from "@shared/feedback-schema";
import { useFeedback } from "@/hooks/use-feedback";

const feedbackTypes = [
  {
    value: "Bug Report",
    label: "Bug Report",
    icon: Bug,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  {
    value: "Suggestion",
    label: "Suggestion",
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    value: "Performance",
    label: "Performance",
    icon: Zap,
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
  {
    value: "Question",
    label: "Question",
    icon: MessageCircle,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    value: "Other",
    label: "Other",
    icon: HelpCircle,
    color: "text-slate-500",
    bg: "bg-slate-50",
  },
] as const;

const ratingEmojis = ["😞", "😕", "😐", "😊", "🤩"];

interface FeedbackFormProps {
  onSuccess?: () => void;
}

const FeedbackForm = ({ onSuccess }: FeedbackFormProps) => {
  const { submitFeedback, isSubmitting } = useFeedback();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<FeedbackFormData>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      rating: 5,
    },
  });

  const watchedType = watch("type");
  const watchedRating = watch("rating");

  const onSubmit = async (data: FeedbackFormData) => {
    try {
      await submitFeedback.mutateAsync(data);
      reset();
      onSuccess?.();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-2xl mx-auto shadow-xl border-0 bg-white/80 backdrop-blur-sm rounded-2xl overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-600" />

        <CardHeader className="border-b border-slate-100 pb-6 pt-8 px-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 text-blue-600 text-xs font-semibold rounded-full border border-blue-200/50">
              <Sparkles className="h-3 w-3" />
              We Value Your Input
            </span>
          </div>
          <CardTitle className="text-3xl font-bold text-slate-900">
            Share Your Feedback
          </CardTitle>
          <CardDescription className="text-slate-600 mt-2 text-base">
            Help us improve by sharing your thoughts, suggestions, or reporting
            issues.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-6 pt-8 px-8">
            {/* Name Field */}
            <div className="space-y-2">
              <Label
                htmlFor="name"
                className="text-sm font-semibold text-slate-700"
              >
                Name <span className="text-red-400">*</span>
              </Label>
              <Input
                id="name"
                {...register("name")}
                placeholder="Your full name"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-slate-200 rounded-xl h-11 hover:border-blue-300"
              />
              {errors.name && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500"
                >
                  {errors.name.message}
                </motion.p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-semibold text-slate-700"
              >
                Email <span className="text-red-400">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="your.email@example.com"
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-slate-200 rounded-xl h-11 hover:border-blue-300"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500"
                >
                  {errors.email.message}
                </motion.p>
              )}
            </div>

            {/* Feedback Type */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-slate-700">
                Feedback Type <span className="text-red-400">*</span>
              </Label>
              <Select
                onValueChange={(value) =>
                  setValue("type", value as FeedbackFormData["type"])
                }
              >
                <SelectTrigger className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 border-slate-200 rounded-xl h-11 hover:border-blue-300">
                  <SelectValue placeholder="Select feedback type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {feedbackTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem
                        key={type.value}
                        value={type.value}
                        className="rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 ${type.bg} rounded-md flex items-center justify-center`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${type.color}`} />
                          </div>
                          {type.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {errors.type && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500"
                >
                  {errors.type.message}
                </motion.p>
              )}
            </div>

            {/* Rating */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                How satisfied are you?{" "}
                <span className="text-blue-500 font-bold">
                  ({watchedRating}/5)
                </span>
              </Label>
              <div className="flex gap-3 justify-center p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                {ratingEmojis.map((emoji, index) => (
                  <motion.button
                    key={index}
                    type="button"
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setValue("rating", index + 1)}
                    className={`text-3xl p-3 rounded-xl transition-all duration-200 ${
                      watchedRating === index + 1
                        ? "bg-gradient-to-br from-blue-500 to-purple-600 ring-2 ring-blue-400 shadow-lg scale-110"
                        : "hover:bg-white hover:shadow-md bg-white/50"
                    }`}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div className="space-y-2">
              <Label
                htmlFor="message"
                className="text-sm font-semibold text-slate-700"
              >
                Message <span className="text-red-400">*</span>
              </Label>
              <Textarea
                id="message"
                {...register("message")}
                placeholder="Tell us more about your feedback..."
                rows={5}
                className="transition-all duration-200 focus:ring-2 focus:ring-blue-500 resize-none border-slate-200 rounded-xl hover:border-blue-300"
              />
              {errors.message && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-red-500"
                >
                  {errors.message.message}
                </motion.p>
              )}
            </div>
          </CardContent>

          <CardFooter className="border-t border-slate-100 pt-6 pb-8 px-8">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 rounded-xl h-12 text-base font-semibold shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
            >
              {isSubmitting ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2"
                >
                  <Send className="h-5 w-5" />
                  Send Feedback
                </motion.div>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
};

export default function FeedbackPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <main className="flex-1 py-12 relative">
        <div className="max-w-3xl mx-auto px-4">
          <FeedbackForm />
        </div>
      </main>
    </div>
  );
}
