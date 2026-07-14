"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import OrthoWorkspace from "@/components/features/doctor/workspace/specialties/OrthoWorkspace";

export default function OrthoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="orthodontics">
      <OrthoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
