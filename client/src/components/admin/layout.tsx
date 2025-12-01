import {
  Users,
  HardDrive,
  MessageSquare,
  Megaphone,
  Star,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

interface AdminLayoutProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  children: React.ReactNode;
}

export default function AdminLayout({
  currentPage,
  onNavigate,
  children,
}: AdminLayoutProps) {
  const { signOut } = useAuth();
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Users", icon: Users },
    { id: "storage", label: "Storage", icon: HardDrive },
    { id: "queries", label: "Queries & Support", icon: MessageSquare },
    { id: "announcements", label: "Announcements", icon: Megaphone },
    { id: "reviews", label: "Reviews", icon: Star },
  ];

  const handleLogout = () => {
    signOut();
    setLocation("/login");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your platform</p>
        </div>

        <nav className="p-4 flex-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-700 hover:text-white rounded-lg"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-100">{children}</main>
    </div>
  );
}
