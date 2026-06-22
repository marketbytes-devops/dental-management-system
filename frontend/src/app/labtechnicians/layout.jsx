import AuthGuard from "@/components/AuthGuard";
import LabPortalLayout from "@/components/ui/labtechnicians/layout/labPortalLayout";

export default function LabLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["lab tech"]} type="staff">
      <LabPortalLayout>{children}</LabPortalLayout>
    </AuthGuard>
  );
}

