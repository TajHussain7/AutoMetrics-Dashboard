import { Home, Table, BarChart3, Download, User } from "lucide-react";
import { cn } from "@/lib/utils";

type ScreenType = 'dashboard' | 'data-table' | 'analytics' | 'export';

interface SidebarProps {
  activeScreen: ScreenType;
  onScreenChange: (screen: ScreenType) => void;
}

const navigation = [
  { id: 'dashboard' as const, label: 'Dashboard Overview', icon: Home },
  { id: 'data-table' as const, label: 'Data Management', icon: Table },
  { id: 'analytics' as const, label: 'Analytics Hub', icon: BarChart3 },
  { id: 'export' as const, label: 'Export Center', icon: Download },
];

export default function Sidebar({ activeScreen, onScreenChange }: SidebarProps) {
  return (
    <div className="w-64 bg-white shadow-lg border-r border-slate-200 flex flex-col">
      {/* Logo Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <BarChart3 className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">TajMetrics</h1>
            <p className="text-xs text-slate-500">Travel Data Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreen === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onScreenChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 text-left rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User Profile Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center">
            <User className="text-slate-600 text-sm" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-800">Travel Admin</p>
            <p className="text-xs text-slate-500">admin@tajmetrics.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
