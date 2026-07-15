"use client";

import WorkspaceLayoutWrapper from "@/components/features/doctor/workspace/WorkspaceLayoutWrapper";
import SurgeryWorkspace from "@/components/features/doctor/workspace/specialties/SurgeryWorkspace";

export default function SurgeryWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="surgery">
      <SurgeryWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
