import PatientProfile from "@/components/features/receptionist/PatientProfile";

export default async function Page({ params }) {
  const { id } = await params;
  return <PatientProfile patientId={id} />;
}
