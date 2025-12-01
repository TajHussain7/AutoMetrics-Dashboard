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
      <div className="w-full px-6">
        <div className="max-w-[1600px] mx-auto flex h-16 items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Logo with hover animation */}
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="relative w-14 h-14 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl opacity-10"></div>
              <Activity className="w-8 h-8 text-blue-600" strokeWidth={2.5} />
            </motion.div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AutoMetrics
              </h1>
              <p className="text-sm text-slate-500">
                Intelligent Travel Data Dashboard
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleLogin}
              data-testid="button-login"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
            <Button onClick={handleRegister} data-testid="button-register">
              <UserPlus className="h-4 w-4 mr-2" />
              Register
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
