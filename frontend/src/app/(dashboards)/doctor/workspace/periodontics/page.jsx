"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import PerioWorkspace from "@/components/features/doctor/workspace/specialties/PerioWorkspace";

export default function PerioWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="periodontics">
      <PerioWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
