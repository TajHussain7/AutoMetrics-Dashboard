import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TravelDataProvider } from "@/contexts/travel-data-context";
import { AuthProvider, useAuth } from "@/contexts/auth-context";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";
import Header from "@/components/navigation/header";
import Footer from "@/components/navigation/footer";
import FeedbackPage from "@/pages/feedback";
import UploadPage from "@/pages/upload";
import Register from "@/components/auth/register";
import Login from "@/components/auth/login";
import RegistrationSuccess from "@/pages/registration-success";
import Profile from "@/pages/profile";
import { ProtectedRoute } from "@/components/auth/protected-route";

const publicRoutes = ["/login", "/register", "/registration-success"];

function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [location] = useLocation();

  const publicRoutes = ["/login", "/register", "/registration-success"];
  const isPublicRoute = publicRoutes.includes(location);

  // 👇 Add this line
  const isDashboardRoute = location === "/";

  // Hide header on public routes and dashboard
  if (isPublicRoute || isDashboardRoute) {
    return <>{children}</>;
  }

  return (
    <div>
      <Header
        title="AutoMetrics Travel Data"
        breadcrumb={
          location === "/"
            ? "Dashboard"
            : location.slice(1).charAt(0).toUpperCase() + location.slice(2)
        }
      />
      <main className="flex-1 bg-gray-50">{children}</main>
      <Footer />
    </div>
  );
}

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/register" component={Register} />
        <Route path="/login" component={Login} />
        <Route path="/registration-success" component={RegistrationSuccess} />
        <Route path="/">
          {() => (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/feedback">
          {() => (
            <ProtectedRoute>
              <FeedbackPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/profile">
          {() => (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          )}
        </Route>
        <Route path="/upload">
          {() => (
            <ProtectedRoute>
              <UploadPage />
            </ProtectedRoute>
          )}
        </Route>
        <Route>{() => <NotFound />}</Route>
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TravelDataProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </TravelDataProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
