import { useState } from "react";
import TopNav from "@/components/navigation/top-nav";
import FileUpload from "@/components/dashboard/file-upload";
import SummaryCards from "@/components/dashboard/summary-cards";
import FeedbackPrompt from "@/components/dashboard/feedback";
import EnhancedDataTable from "@/components/data-table/enhanced-data-table";
import ChartsGrid from "@/components/analytics/charts-grid";
import ExportOptions from "@/components/export/export-options";
import { useTravelData } from "@/contexts/travel-data-context";
import { useTravelDataBySession } from "@/hooks/use-travel-data";
import { getFlightStatus } from "@/lib/utils";

type ScreenType = "dashboard" | "data-table" | "analytics" | "export";

const SCREEN_TITLES: Record<ScreenType, string> = {
  dashboard: "Dashboard Overview",
  "data-table": "Data Management",
  analytics: "Analytics Hub",
  export: "Export Center",
};

const SCREEN_BREADCRUMBS: Record<ScreenType, string> = {
  dashboard: "Home / Dashboard",
  "data-table": "Home / Data Management",
  analytics: "Home / Analytics",
  export: "Home / Export",
};

export default function Dashboard() {
  const [activeScreen, setActiveScreen] = useState<ScreenType>("dashboard");
  const { travelData, currentSessionId } = useTravelData();

  // Fetch travel data when session ID is available
  const { isLoading: isLoadingData } = useTravelDataBySession(currentSessionId);

  const renderScreen = () => {
    switch (activeScreen) {
      case "dashboard":
        return (
          <div className="space-y-4">
            <FileUpload />
            <SummaryCards />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <FeedbackPrompt />
              <div className="bg-white rounded-lg shadow-md border-0 p-4">
                <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3"></div>
                  Flight Status Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                      <span className="text-sm font-medium text-green-800">
                        Coming
                      </span>
                    </div>
                    <span className="text-sm font-bold text-green-900 bg-green-100 px-3 py-1 rounded-full">
                      {
                        travelData.filter(
                          (item) => getFlightStatus(item) === "Coming"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-amber-500 rounded-full shadow-sm"></div>
                      <span className="text-sm font-medium text-amber-800">
                        Gone
                      </span>
                    </div>
                    <span className="text-sm font-bold text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
                      {
                        travelData.filter(
                          (item) => getFlightStatus(item) === "Gone"
                        ).length
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-red-500 rounded-full shadow-sm"></div>
                      <span className="text-sm font-medium text-red-800">
                        Cancelled
                      </span>
                    </div>
                    <span className="text-sm font-bold text-red-900 bg-red-100 px-3 py-1 rounded-full">
                      {
                        travelData.filter(
                          (item) => getFlightStatus(item) === "Cancelled"
                        ).length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "data-table":
        return <EnhancedDataTable />;
      case "analytics":
        return <ChartsGrid />;
      case "export":
        return <ExportOptions />;
      default:
        return <div>Screen not found</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <TopNav activeScreen={activeScreen} onScreenChange={setActiveScreen} />

      <main className="px-2 md:px-4 py-4 max-w-none" id="main-content">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            {SCREEN_TITLES[activeScreen]}
          </h1>
          <p className="text-sm text-slate-600">
            {SCREEN_BREADCRUMBS[activeScreen]}
          </p>
        </div>
        {renderScreen()}
      </main>
    </div>
  );
}
