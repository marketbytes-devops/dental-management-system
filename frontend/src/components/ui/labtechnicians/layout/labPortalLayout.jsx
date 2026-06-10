import LabSidebar from "./labSidebar";
import LabNavbar from "./labNavbar";

export default function LabPortalLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <LabSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <LabNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
