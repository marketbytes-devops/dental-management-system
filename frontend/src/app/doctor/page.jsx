"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DoctorRootPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/doctor/dashboard");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[50vh] text-xs text-gray-400 font-semibold">
      Redirecting to workdesk...
    </div>
  );
}
