import { useState, lazy, Suspense } from "react";
import TopNav from "@/components/navigation/top-nav";
import Footer from "@/components/navigation/footer";
import FileUpload from "@/components/dashboard/file-upload";
import SummaryCards from "@/components/dashboard/summary-cards";
import FeedbackPrompt from "@/components/dashboard/feedback";
import EnhancedDataTable from "@/components/data-table/enhanced-data-table";
const ChartsGrid = lazy(() => import("@/components/analytics/charts-grid"));
import ExportOptions from "@/components/export/export-options";
import History from "@/pages/history";
import { useTravelData } from "@/contexts/travel-data-context";
import { useTravelDataBySession } from "@/hooks/use-travel-data";
import { getFlightStatus } from "@/lib/utils";

type ScreenType =
  | "dashboard"
  | "data-table"
  | "analytics"
  | "export"
  | "history";

const SCREEN_TITLES: Record<ScreenType, string> = {
  dashboard: "Dashboard Overview",
  "data-table": "Data Management",
  analytics: "Analytics Hub",
  export: "Export Center",
  history: "Upload History",
};

const SCREEN_BREADCRUMBS: Record<ScreenType, string> = {
  dashboard: "Home / Dashboard",
  "data-table": "Home / Data Management",
  analytics: "Home / Analytics",
  export: "Home / Export",
  history: "Home / History",
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

            <div className="grid grid-cols-1 gap-4 items-start">
              <div
                className="bg-white rounded-lg shadow-md border-0"
                style={{ padding: "clamp(1rem, 3vw, 1.5rem)" }}
              >
                <h3
                  className="font-bold text-slate-800 mb-4 md:mb-6 flex items-center flex-wrap"
                  style={{ fontSize: "clamp(1rem, 2vw, 1.125rem)" }}
                >
                  <div className="w-2 h-6 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full mr-3 shrink-0"></div>
                  Flight Status Overview
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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

            {/* Feedback moved below as a full-width layer to avoid layout disturbance */}
            <div className="mt-4">
              <div className="bg-white rounded-lg shadow-sm border-0 p-4">
                <FeedbackPrompt />
              </div>
            </div>
          </div>
        );
      case "data-table":
        return <EnhancedDataTable />;
      case "analytics":
        return (
          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[200px]">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              </div>
            }
          >
            <ChartsGrid />
          </Suspense>
        );
      case "export":
        return <ExportOptions />;
      case "history":
        return <History />;
      default:
        return <div>Screen not found</div>;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
      <TopNav activeScreen={activeScreen} onScreenChange={setActiveScreen} />

      <main
        className="flex-1 w-full"
        style={{ padding: "clamp(1rem, 3vw, 1.5rem) clamp(0.5rem, 2vw, 1rem)" }}
        id="main-content"
      >
        <div className="w-full max-w-screen-2xl mx-auto">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {SCREEN_TITLES[activeScreen]}
            </h1>
            <p className="text-sm text-slate-600">
              {SCREEN_BREADCRUMBS[activeScreen]}
            </p>
          </div>
          {renderScreen()}
        </div>
      </main>

      <Footer />
    </div>
  );
}
