"use client";

import WorkspaceLayoutWrapper from "@/components/ui/doctor/workspace/WorkspaceLayoutWrapper";
import SurgeryWorkspace from "@/components/ui/doctor/workspace/specialties/SurgeryWorkspace";

export default function SurgeryWorkspacePage() {
  return (
    <WorkspaceLayoutWrapper specialtyId="surgery">
      <SurgeryWorkspace />
    </WorkspaceLayoutWrapper>
  );
}
