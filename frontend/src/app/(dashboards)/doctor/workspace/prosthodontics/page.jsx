"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import ProsthoWorkspace from "@/components/features/doctor/workspace/specialties/ProsthoWorkspace";

export default function ProsthoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="prosthodontics">
      <ProsthoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
