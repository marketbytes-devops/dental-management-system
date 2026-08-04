"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ReceptionistRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/frontdesk/receptionist/dashboard");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <p className="text-gray-500 mt-4 font-semibold text-sm">Loading Receptionist Dashboard...</p>
    </div>
  );
}
