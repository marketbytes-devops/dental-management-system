import AuthGuard from "@/components/AuthGuard";
import PatientPortalLayout from "@/components/ui/patients/layout/patientPortalLayout";

export default function PatientLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["patient"]} type="patient">
      <PatientPortalLayout>{children}</PatientPortalLayout>
    </AuthGuard>
  );
}

