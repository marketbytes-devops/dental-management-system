"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/doctor/layout";

export default function DoctorWorkspaceRootPage() {
  const router = useRouter();
  const { viewingPatient } = useDoctor();

  useEffect(() => {
    if (!viewingPatient) {
      return;
    }

    const procedure = (viewingPatient.procedure || "").toLowerCase();
    
    if (procedure.includes("root canal")) {
      router.replace("/doctor/workspace/endodontics");
    } else if (procedure.includes("crown")) {
      router.replace("/doctor/workspace/prosthodontics");
    } else if (procedure.includes("extraction") || procedure.includes("surgery")) {
      router.replace("/doctor/workspace/surgery");
    } else if (procedure.includes("scaling") || procedure.includes("polishing") || procedure.includes("gum")) {
      router.replace("/doctor/workspace/periodontics");
    } else {
      router.replace("/doctor/workspace/general");
    }
  }, [viewingPatient?.token, router]);

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-12 text-center text-gray-400 font-semibold animate-pulse">
      Loading appropriate specialty workspace...
    </div>
  );
}
