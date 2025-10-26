import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus, Heart, Zap, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export default function FeedbackPrompt() {
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer to pause animation when off-screen
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const element = document.getElementById("feedback-prompt");
    if (element) {
      observer.observe(element);
    }

    return () => {
      if (element) {
        observer.unobserve(element);
      }
    };
  }, []);

  const handleFeedbackClick = () => {
    // Get the base URL of your application
    const baseUrl = window.location.origin;
    window.open(`${baseUrl}/feedback`, "_blank");
  };

  return (
    <Card
      id="feedback-prompt"
      className="group hover:shadow-xl transition-all duration-500"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <CardContent className="p-8 min-h-[400px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/60 via-indigo-50/40 to-blue-100/30" />

        {/* Main Content Layout - Text Left, Animation Right */}
        <div className="flex flex-col lg:flex-row items-center justify-between h-full gap-8 mb-8">
          {/* Left Column - Text Content */}
          <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 order-2 lg:order-1">
            {/* Enhanced Typography Hierarchy with Better Styling */}
            <div className="space-y-6 max-w-md">
              {/* Main Headline - Better Structured and Styled */}
              <h3 className="text-3xl lg:text-4xl font-bold text-slate-900 leading-tight">
                <span className="block mb-4 text-slate-1000">
                  Help us improve AutoMetrics
                </span>
                <span className="flex items-center justify-center lg:justify-start gap-3 text-blue-600">
                  <span>Share your feedback!</span>
                </span>
              </h3>

              {/* Supporting Text - Better Typography and Spacing */}
              <p className="text-lg lg:text-xl text-slate-600 font-medium leading-relaxed max-w-sm">
                Your insights help us create a better experience for everyone!
              </p>
            </div>
          </div>

          {/* Right Column - Enhanced Animation */}
          <div className="flex-shrink-0 flex flex-col items-center lg:items-end order-1 lg:order-2">
            {/* Animated Feedback Bubble with Enhanced Size and Shadow */}
            <div className="relative flex-shrink-0">
              <div
                className={`relative transition-all duration-700 ${
                  isHovered ? "scale-110 rotate-2" : ""
                }`}
              >
                {/* Main Chat Bubble */}
                <div className="w-36 h-32 bg-gradient-to-b from-blue-100 via-indigo-200 to-blue-300 rounded-3xl border-4 border-blue-400 shadow-2xl relative overflow-hidden">
                  {/* Bubble Tail */}
                  <div className="absolute -bottom-3 left-10 w-6 h-6 bg-blue-300 border-b-4 border-r-4 border-blue-400 transform rotate-45" />

                  {/* Message Lines with Enhanced Animation */}
                  <div className="absolute top-8 left-5 right-5 space-y-3">
                    <div
                      className={`h-2.5 bg-blue-500 rounded-full transition-all duration-500 ${
                        isHovered ? "w-full opacity-100" : "w-4/5 opacity-80"
                      }`}
                    />
                    <div
                      className={`h-2.5 bg-blue-500 rounded-full transition-all duration-500 delay-100 ${
                        isHovered ? "w-full opacity-100" : "w-3/4 opacity-60"
                      }`}
                    />
                    <div
                      className={`h-2.5 bg-blue-500 rounded-full transition-all duration-500 delay-200 ${
                        isHovered ? "w-full opacity-100" : "w-1/2 opacity-40"
                      }`}
                    />
                  </div>

                  {/* Plus Icon that appears on hover with enhanced animation */}
                  <div
                    className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-500 ${
                      isHovered
                        ? "opacity-100 scale-100 rotate-90"
                        : "opacity-0 scale-75 rotate-0"
                    }`}
                  >
                    <Plus className="h-10 w-10 text-blue-600 font-bold drop-shadow-lg" />
                  </div>

                  {/* Enhanced Glow Effect */}
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-200/30 to-indigo-300/30 transition-all duration-500 ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </div>

                {/* Enhanced Floating Feedback Icons with Better Animation */}
                {isVisible && (
                  <>
                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-indigo-400 rounded-full animate-feedback-float shadow-lg flex items-center justify-center">
                      <MessageSquare className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-3 -left-3 w-6 h-6 bg-blue-400 rounded-full animate-feedback-float-delayed shadow-lg flex items-center justify-center">
                      <MessageSquare className="h-3 w-3 text-white" />
                    </div>
                    <div className="absolute top-1/2 -right-5 w-5 h-5 bg-indigo-300 rounded-full animate-feedback-float-reverse shadow-md flex items-center justify-center">
                      <MessageSquare className="h-2.5 w-2.5 text-white" />
                    </div>
                    <div className="absolute top-1/4 -left-4 w-4 h-4 bg-blue-300 rounded-full animate-feedback-float-slow shadow-md flex items-center justify-center">
                      <MessageSquare className="h-2 w-2 text-white" />
                    </div>
                  </>
                )}

                {/* Enhanced Bouncing Animation with Glow */}
                {isVisible && (
                  <div
                    className={`absolute inset-0 rounded-3xl bg-gradient-to-b from-blue-200/20 to-indigo-300/20 animate-feedback-bounce ${
                      isHovered ? "animate-none" : ""
                    }`}
                  />
                )}

                {/* Sparkle Effects */}
                {isVisible && (
                  <>
                    <div className="absolute top-2 right-2 w-2 h-2 bg-blue-400 rounded-full animate-ping" />
                    <div className="absolute bottom-4 left-2 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping delay-300" />
                    <div className="absolute top-1/2 right-1 w-1 h-1 bg-blue-300 rounded-full animate-ping delay-500" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Large Expanded Share Feedback Button at Bottom */}
        <div className="w-full flex justify-center">
          <Button
            onClick={handleFeedbackClick}
            className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 text-white font-bold text-lg lg:text-xl px-12 lg:px-16 py-4 lg:py-5 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:scale-105 border-0 w-full max-w-md group relative overflow-hidden"
          >
            {/* Button Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-2xl transition-all duration-500 group-hover:opacity-100 opacity-0" />

            {/* Button Content */}
            <div className="relative flex items-center justify-center gap-3">
              <MessageSquare className="h-6 w-6 lg:h-7 lg:w-7 flex-shrink-0 group-hover:animate-bounce" />
              <span>Share Feedback</span>
              <ArrowUp className="h-5 w-5 lg:h-6 lg:w-6 flex-shrink-0 group-hover:animate-bounce group-hover:-translate-y-1 transition-transform duration-300" />
            </div>
          </Button>
        </div>

        {/* Enhanced Background Decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-100/30 to-indigo-100/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-indigo-100/30 to-blue-100/20 rounded-full blur-2xl animate-pulse delay-500" />

        {/* Additional Blue Accent */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-blue-50/20 to-indigo-50/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </CardContent>
    </Card>
  );
}
