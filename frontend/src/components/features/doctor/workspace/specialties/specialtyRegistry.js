import GeneralWorkspace from "./GeneralWorkspace";
import EndoWorkspace from "./EndoWorkspace";
import OrthoWorkspace from "./OrthoWorkspace";
import PerioWorkspace from "./PerioWorkspace";
import SurgeryWorkspace from "./SurgeryWorkspace";
import ProsthoWorkspace from "./ProsthoWorkspace";
import { Stethoscope, Pill, Sparkles, Scissors, ShieldAlert, Award } from "lucide-react";

export const SPECIALTY_REGISTRY = {
  general: {
    id: "general",
    label: "General Dentistry",
    icon: Stethoscope,
    component: GeneralWorkspace
  },
  endodontics: {
    id: "endodontics",
    label: "Endodontics",
    icon: Pill,
    component: EndoWorkspace
  },
  orthodontics: {
    id: "orthodontics",
    label: "Orthodontics",
    icon: Award,
    component: OrthoWorkspace
  },
  periodontics: {
    id: "periodontics",
    label: "Periodontics",
    icon: ShieldAlert,
    component: PerioWorkspace
  },
  surgery: {
    id: "surgery",
    label: "Oral Surgery",
    icon: Scissors,
    component: SurgeryWorkspace
  },
  prosthodontics: {
    id: "prosthodontics",
    label: "Prosthodontics",
    icon: Sparkles,
    component: ProsthoWorkspace
  }
};
