import { useState, lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import AdminLayout from "@/components/admin/layout";

// lightweight fallback used for Suspense while subpages load
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[200px]">
    <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
  </div>
);

const AdminDashboard = lazy(() => import("@/components/admin/dashboard"));
const UsersPage = lazy(() => import("@/components/admin/users"));
const AnnouncementsPage = lazy(
  () => import("@/components/admin/announcements")
);
const QueriesPage = lazy(() => import("@/components/admin/queries"));
const StoragePage = lazy(() => import("@/components/admin/storage"));
const FeedbackPage = lazy(() => import("@/components/admin/feedback"));
const ContactsPage = lazy(() => import("@/components/admin/contacts"));
const ReactivatePage = lazy(() => import("@/components/admin/reactivations"));
import { ProtectedRoute } from "@/components/auth/protected-route";

type AdminPage =
  | "dashboard"
  | "users"
  | "storage"
  | "queries"
  | "announcements"
  | "feedback"
  | "contacts"
  | "reactivations";

export default function AdminPage() {
  const [currentPage, setCurrentPage] = useState<AdminPage>("dashboard");

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <AdminDashboard />;
      case "users":
        return <UsersPage />;
      case "announcements":
        return <AnnouncementsPage />;
      case "queries":
        return <QueriesPage />;
      case "feedback":
        return <FeedbackPage />;
      case "contacts":
        return <ContactsPage />;
      case "reactivations":
        return <ReactivatePage />;

      case "storage":
        return <StoragePage />;
      default:
        return <AdminDashboard />;
    }
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page as AdminPage);
  };

  return (
    <ProtectedRoute adminOnly>
      <AdminLayout currentPage={currentPage} onNavigate={handleNavigate}>
        <Suspense fallback={<LoadingSpinner />}>{renderPage()}</Suspense>
      </AdminLayout>
    </ProtectedRoute>
  );
}
