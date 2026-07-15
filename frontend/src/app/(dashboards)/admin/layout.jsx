import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AdminLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["admin"]} type="staff">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

