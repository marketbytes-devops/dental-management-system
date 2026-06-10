import PatientSidebar from "./patientSidebar";
import PatientNavbar from "./patientNavbar";

export default function PatientPortalLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <PatientSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PatientNavbar />
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
