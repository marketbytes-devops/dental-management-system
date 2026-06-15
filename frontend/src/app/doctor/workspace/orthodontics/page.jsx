"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import OrthoWorkspace from "@/components/ui/doctor/workspace/specialties/OrthoWorkspace";

export default function OrthoWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="orthodontics">
      <OrthoWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
