import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AccountantLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["accountant"]} type="staff">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

