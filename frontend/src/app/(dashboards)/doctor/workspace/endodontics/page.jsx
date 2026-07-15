"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import EndoWorkspace from "@/components/features/doctor/workspace/specialties/EndoWorkspace";

export default function EndoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="endodontics">
      <EndoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
