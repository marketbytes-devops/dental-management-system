"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import ProsthoWorkspace from "@/components/ui/doctor/workspace/specialties/ProsthoWorkspace";

export default function ProsthoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="prosthodontics">
      <ProsthoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
