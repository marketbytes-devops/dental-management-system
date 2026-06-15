"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import EndoWorkspace from "@/components/ui/doctor/workspace/specialties/EndoWorkspace";

export default function EndoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="endodontics">
      <EndoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
