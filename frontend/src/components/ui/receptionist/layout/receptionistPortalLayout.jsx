import ReceptionistSidebar from "./receptionistSidebar";
import FrontdeskNavbar from "@/components/ui/frontdesk/layout/frontdeskNavbar";

export default function ReceptionistPortalLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <ReceptionistSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FrontdeskNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
