import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function LabLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["lab tech"]} type="staff">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

