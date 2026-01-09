import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Activity } from "lucide-react";
import { motion } from "framer-motion";

export function Header() {
  const handleRegister = () => {
    window.location.href = "/register";
  };

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white shadow-sm border-b border-slate-200">
      <div
        className="w-full"
        style={{ paddingInline: "clamp(1rem, 5vw, 3rem)" }}
      >
        <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between gap-4">
          <div className="flex items-center space-x-2 md:space-x-3 min-w-0">
            {/* Logo with hover animation */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative flex items-center justify-center shrink-0"
              style={{
                width: "clamp(2.5rem, 8vw, 3.5rem)",
                height: "clamp(2.5rem, 8vw, 3.5rem)",
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-10"></div>
              <Activity
                className="text-blue-600"
                strokeWidth={2.5}
                style={{
                  width: "clamp(1.5rem, 6vw, 2rem)",
                  height: "clamp(1.5rem, 6vw, 2rem)",
                }}
              />
            </motion.div>
            <div className="min-w-0">
              <h1
                className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent truncate"
                style={{ fontSize: "clamp(1.25rem, 3vw, 1.5rem)" }}
              >
                AutoMetrics
              </h1>
              <p
                className="text-slate-500 truncate hidden sm:block"
                style={{ fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)" }}
              >
                Intelligent Travel Data Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <Button
              variant="ghost"
              onClick={handleLogin}
              data-testid="button-login"
              className="px-3 md:px-4"
            >
              <LogIn className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Login</span>
            </Button>
            <Button
              onClick={handleRegister}
              data-testid="button-register"
              className="px-3 md:px-4"
            >
              <UserPlus className="h-4 w-4 mr-0 sm:mr-2" />
              <span className="hidden sm:inline">Register</span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
