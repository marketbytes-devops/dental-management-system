import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function ReceptionistLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["receptionist"]} type="staff">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

