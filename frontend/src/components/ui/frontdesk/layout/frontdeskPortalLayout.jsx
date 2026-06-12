import FrontdeskSidebar from "./frontdeskSidebar";
import FrontdeskNavbar from "./frontdeskNavbar";

export default function FrontdeskPortalLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <FrontdeskSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <FrontdeskNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
