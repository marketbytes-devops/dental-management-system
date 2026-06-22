import AuthGuard from "@/components/AuthGuard";
import AccountantPortalLayout from "@/components/ui/accountant/layout/accountantPortalLayout";

export default function AccountantLayout({ children }) {
  return (
    <AuthGuard allowedRoles={["accountant"]} type="staff">
      <AccountantPortalLayout>{children}</AccountantPortalLayout>
    </AuthGuard>
  );
}

