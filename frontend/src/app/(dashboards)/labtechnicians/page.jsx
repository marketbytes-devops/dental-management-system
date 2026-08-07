"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LabTechniciansIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/labtechnicians/dashboard");
  }, [router]);

  return null;
}
