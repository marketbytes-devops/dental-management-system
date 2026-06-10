import DoctorSidebar from "@/components/layout/DoctorSidebar";
import Navbar from "@/components/layout/Navbar";

export default function DoctorLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
