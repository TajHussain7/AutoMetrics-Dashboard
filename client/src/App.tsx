import { Suspense } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TravelDataProvider } from "@/contexts/travel-data-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import { AnnouncementProvider } from "@/contexts/announcement-context";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { routes, withSuspense, publicRoutes } from "./routes";

// Route components will be loaded on demand

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  const isPublicRoute = publicRoutes.some((route) => route.path === location);
  const isDashboardRoute = location === "/dashboard";

  // Hide header on public routes and dashboard
  if (isPublicRoute || isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="AutoMetrics"
        breadcrumb={
          isDashboardRoute
            ? "Dashboard"
            : location.slice(1).charAt(0).toUpperCase() + location.slice(2)
        }
      />
      <main className="flex-1 bg-gray-20">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        {publicRoutes.map(({ path, Component }) => (
          <Route key={path} path={path}>
            {() => withSuspense(<Component />)}
          </Route>
        ))}
        {routes.map(({ path, Component }) => (
          <Route key={path} path={path}>
            {() => (
              <ProtectedRoute>{withSuspense(<Component />)}</ProtectedRoute>
            )}
          </Route>
        ))}
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TravelDataProvider>
          <AnnouncementProvider>
            <TooltipProvider>
              <Router />
              <Toaster />
            </TooltipProvider>
          </AnnouncementProvider>
        </TravelDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
