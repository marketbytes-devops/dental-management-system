"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import PerioWorkspace from "@/components/ui/doctor/workspace/specialties/PerioWorkspace";

export default function PerioWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="periodontics">
      <PerioWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
