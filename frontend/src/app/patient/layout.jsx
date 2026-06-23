import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function PatientLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["patient"]} type="patient">
      <DashboardLayout>{children}</DashboardLayout>
    </AuthGuard>
  );
}

