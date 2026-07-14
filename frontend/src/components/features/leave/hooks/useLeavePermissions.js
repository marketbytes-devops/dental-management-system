export default function useLeavePermissions(role) {
  const isDoctor = role === "doctor";
  const isLabTech = role === "labtechnician";
  const isReceptionist = role === "receptionist";
  const isAccountant = role === "accountant";
  const isManager = role === "manager" || role === "admin";

  return {
    canApply: isDoctor || isLabTech || isReceptionist || isAccountant,
    requiresOnCall: isDoctor,
    canApprove: isManager,
    canViewAll: isManager,
    label: isDoctor ? "Doctor" : isLabTech ? "Lab Technician" : isReceptionist ? "Receptionist" : isAccountant ? "Accountant" : "Staff"
  };
}
