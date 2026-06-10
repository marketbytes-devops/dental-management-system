import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 flex flex-col items-center gap-6 w-full max-w-sm">

        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900">SmileCare</h1>
          <p className="text-sm text-gray-500 mt-1">Dental Management System</p>
        </div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/admin/dashboard"
            className="bg-primary text-white text-center rounded-xl px-6 py-3 text-sm font-medium hover:bg-primary/90 shadow-sm shadow-primary/30 transition-colors"
          >
            Enter as Admin
          </Link>
          <Link
            href="/doctor/dashboard"
            className="bg-white text-gray-700 text-center rounded-xl px-6 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Enter as Doctor
          </Link>
          <Link
            href="/lab/dashboard"
            className="bg-white text-gray-700 text-center rounded-xl px-6 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Enter as Lab Technician
          </Link>
          <Link
            href="/patient/dashboard"
            className="bg-white text-gray-700 text-center rounded-xl px-6 py-3 text-sm font-medium border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            Enter as Patient
          </Link>
        </div>

      </div>
    </div>
  );
}