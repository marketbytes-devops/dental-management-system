"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import GeneralWorkspace from "@/components/ui/doctor/workspace/specialties/GeneralWorkspace";

export default function GeneralWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="general">
      <GeneralWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
