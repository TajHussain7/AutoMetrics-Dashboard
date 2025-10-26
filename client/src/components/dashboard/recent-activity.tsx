import { Card, CardContent } from "@/components/ui/card";
import { useTravelData } from "@/contexts/travel-data-context";
import { Plane, MapPin, Sparkles } from "lucide-react";

export default function TravelAnimation() {
  const { travelData } = useTravelData();

  // Get unique routes for the animation
  const routes = Array.from(
    new Set(travelData.map((item) => item.route).filter(Boolean))
  );
  const hasData = travelData.length > 0;

  return (
    <Card className="hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-8 min-h-[300px] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-purple-50/50 to-indigo-50/60 animate-gradient" />

        {/* Animated Header */}
        <h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          <Sparkles className="h-6 w-6 text-blue-500 animate-sparkle" />
          Travel Routes Visualization
        </h3>

        {hasData ? (
          <div className="relative">
            {/* Animated Flight Path */}
            <div className="space-y-6 relative">
              {routes.slice(0, 3).map((route, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between relative"
                >
                  {/* Origin */}
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {route?.split("-")[0]}
                    </span>
                  </div>

                  {/* Animated Plane */}
                  <div className="absolute left-1/2 transform -translate-x-1/2">
                    <Plane
                      className={`h-5 w-5 text-blue-600 
                        animate-flyPlane${index + 1} transform rotate-90`}
                    />
                  </div>

                  {/* Destination */}
                  <div className="flex items-center gap-2 animate-fadeIn">
                    <MapPin className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-slate-700">
                      {route?.split("-").pop()}
                    </span>
                  </div>

                  {/* Animated Path Line */}
                  <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-200 to-purple-200">
                    <div
                      className={`h-full w-full bg-blue-500 animate-pathLine${
                        index + 1
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-purple-100/20 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-purple-100/20 to-blue-100/20 rounded-full blur-xl animate-pulse delay-300" />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <Plane className="h-12 w-12 text-slate-300 mb-4 animate-bounce" />
            <p className="text-slate-500 mb-2">No routes available</p>
            <p className="text-sm text-slate-400">
              Upload data to visualize travel routes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
