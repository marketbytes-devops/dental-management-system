"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import GeneralWorkspace from "@/components/features/doctor/workspace/specialties/GeneralWorkspace";

export default function GeneralWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="general">
      <GeneralWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
