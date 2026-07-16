"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDoctor } from "@/app/(dashboards)/doctor/layout";

const SPECIALTY_PROCEDURES = {
  general: ["general dentistry", "consultation", "routine check-up", "follow-up check-up", "teeth cleaning", "scaling & polishing", "dental filling", "composite filling", "amalgam filling", "scaling and polishing", "teeth cleaning / polishing", "fluoride treatment", "sealants (pit and fissure)", "teeth whitening", "night guard / occlusal splint"],
  endodontics: ["endodontics", "root canal", "rct", "pulpotomy", "apicoectomy", "root canal treatment (rct)", "root canal treatment (rct) - single sitting", "root canal treatment (rct) - multiple sitting", "root canal retreatment"],
  orthodontics: ["orthodontics", "orthodontic", "braces", "braces - metal", "braces - self-ligating", "braces - ceramic", "clear aligners", "palatal expander (rme)", "space maintainer", "habit-breaking appliance", "retainer-only treatment", "retainer fitting", "orthodontic consultation"],
  periodontics: ["periodontics", "deep cleaning", "gum surgery", "scaling and root planing", "periodontal maintenance"],
  surgery: ["oral surgery", "surgery", "simple extraction", "surgical extraction (impacted tooth, wisdom tooth)", "orthognathic surgery", "tooth extraction", "wisdom tooth removal", "dental implant surgery", "biopsy"],
  prosthodontics: ["prosthodontics", "crown – single tooth", "bridge (multi-tooth)", "complete denture (full set)", "partial denture (removable)", "implant-supported crown/bridge", "veneers", "crown fitting", "bridge installation", "denture adjustment"]
};

export default function DoctorWorkspaceRootPage() {
  const router = useRouter();
  const { viewingPatient, activePatientToken, setViewingPatientToken, patients = {} } = useDoctor();

  useEffect(() => {
    if (!viewingPatient) {
      if (activePatientToken) {
        const pt = patients[activePatientToken];
        const proc = (pt?.procedure || "").toLowerCase();
        let targetSpecialty = "general";
        for (const [specId, procs] of Object.entries(SPECIALTY_PROCEDURES)) {
          if (procs.some(val => proc.includes(val) || val.includes(proc))) {
            targetSpecialty = specId;
            break;
          }
        }
        router.replace(`/doctor/workspace/${targetSpecialty}?patientToken=${activePatientToken}`);
      } else {
        // Redirect to general workspace to show the selector if no patient is in chair
        router.replace("/doctor/workspace/general");
      }
      return;
    }

    const procedure = (viewingPatient.procedure || "").toLowerCase();
    let targetSpecialty = "general";
    for (const [specId, procs] of Object.entries(SPECIALTY_PROCEDURES)) {
      if (procs.some(val => procedure.includes(val) || val.includes(procedure))) {
        targetSpecialty = specId;
        break;
      }
    }
    router.replace(`/doctor/workspace/${targetSpecialty}?patientToken=${viewingPatient.token}`);
  }, [viewingPatient?.token, activePatientToken, router, setViewingPatientToken, patients]);

  return (
    <div className="bg-white border border-gray-150 rounded-2xl shadow-sm p-12 text-center text-gray-400 font-semibold animate-pulse">
      Loading appropriate specialty workspace...
    </div>
  );
}
