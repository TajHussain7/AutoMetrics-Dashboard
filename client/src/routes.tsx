import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";

// Loading component for Suspense fallback
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
  </div>
);

// Lazy load route components
const Home = lazy(() => import("@/pages/home"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const FeedbackPage = lazy(() => import("@/pages/feedback"));
const UploadPage = lazy(() => import("@/pages/upload"));
const Profile = lazy(() => import("@/pages/profile"));
const History = lazy(() => import("@/pages/history"));
const Announcements = lazy(() => import("@/pages/announcements"));
const AdminPage = lazy(() => import("@/pages/admin"));
const Register = lazy(() => import("@/components/auth/register"));
const Login = lazy(() => import("@/components/auth/login"));
const RegistrationSuccess = lazy(() => import("@/pages/registration-success"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Route type definition
type Route = {
  path: string;
  Component: React.ComponentType;
};

// HOC to wrap components with Suspense
export const withSuspense = (element: React.ReactElement) => (
  <Suspense fallback={<LoadingSpinner />}>{element}</Suspense>
);

// Public routes that don't require authentication
export const publicRoutes: Route[] = [
  { path: "/", Component: Home },
  { path: "/login", Component: Login },
  { path: "/register", Component: Register },
  { path: "/registration-success", Component: RegistrationSuccess },
];

// Protected routes that require authentication
export const routes: Route[] = [
  { path: "/dashboard", Component: Dashboard },
  { path: "/feedback", Component: FeedbackPage },
  { path: "/profile", Component: Profile },
  { path: "/upload", Component: UploadPage },
  { path: "/history", Component: History },
  { path: "/announcements", Component: Announcements },
  { path: "/admin", Component: AdminPage },
  { path: "*", Component: NotFound },
];
