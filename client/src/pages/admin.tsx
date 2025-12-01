import { useState } from "react";
import AdminLayout from "@/components/admin/layout";
import AdminDashboard from "@/components/admin/dashboard";
import UsersPage from "@/components/admin/users";
import AnnouncementsPage from "@/components/admin/announcements";
import QueriesPage from "@/components/admin/queries";
import ReviewsPage from "@/components/admin/reviews";
import StoragePage from "@/components/admin/storage";
import { ProtectedRoute } from "@/components/auth/protected-route";

type AdminPage =
  | "dashboard"
  | "users"
  | "storage"
  | "queries"
  | "announcements"
  | "reviews";

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
      case "reviews":
        return <ReviewsPage />;
      case "storage":
        return <StoragePage />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <ProtectedRoute adminOnly>
      <AdminLayout currentPage={currentPage} onNavigate={setCurrentPage}>
        {renderPage()}
      </AdminLayout>
    </ProtectedRoute>
  );
}
