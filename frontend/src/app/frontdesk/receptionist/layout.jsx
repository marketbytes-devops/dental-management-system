import AuthGuard from "@/components/AuthGuard";
import ReceptionistPortalLayout from "@/components/ui/receptionist/layout/receptionistPortalLayout";

export default function ReceptionistLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["receptionist"]} type="staff">
      <ReceptionistPortalLayout>{children}</ReceptionistPortalLayout>
    </AuthGuard>
  );
}

