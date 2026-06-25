export const currentPatient = {
  id: "PT-10042",
  name: "Rahul Kumar",
  avatar: "R",
  dob: "1990-04-15",
  phone: "+91 98765 43210",
  email: "rahul@example.com",
  memberSince: "2022-08-10",
  oralHealthScore: 78,
  registeredVia: "Walk-in",
  address: "Flat 402, Signature Residency, Sector 56, Gurgaon, HR - 122011",
  insurance: { provider: "Star Health & Allied Insurance", policyId: "SH-2024-991", coverage: 70 },
  emergencyContact: { name: "Priya Kumar", relation: "Spouse", phone: "+91 91234 56789" },
};

export const myAppointments = [
  { id: "APT-201", date: "2026-06-15", time: "10:30 AM", doctor: "Dr. Anoop Nair", treatment: "Root Canal", status: "Confirmed", notes: "Bring previous X-ray report" },
  { id: "APT-207", date: "2026-07-03", time: "2:00 PM", doctor: "Dr. Priya Sharma", treatment: "Orthodontic Consultation", status: "Pending", notes: "" },
  { id: "APT-198", date: "2026-05-12", time: "11:00 AM", doctor: "Dr. Anoop Nair", treatment: "Scaling & Polishing", status: "Completed", notes: "" },
  { id: "APT-185", date: "2026-03-20", time: "9:30 AM", doctor: "Dr. Rajan Mehta", treatment: "Dental Filling", status: "Completed", notes: "Lower left molar filled" },
  { id: "APT-172", date: "2026-01-08", time: "4:00 PM", doctor: "Dr. Sunita Pillai", treatment: "Tooth Extraction", status: "Cancelled", notes: "Cancelled due to scheduling conflict" },
];

export const myPrescriptions = [
  { id: "RX-501", date: "2026-05-12", drug: "Amoxicillin 500mg", dosage: "1 cap × 3 times/day for 5 days", doctor: "Dr. Anoop Nair", active: true },
  { id: "RX-482", date: "2026-03-20", drug: "Paracetamol 650mg", dosage: "1 tab as needed for pain, max 3/day", doctor: "Dr. Rajan Mehta", active: false },
  { id: "RX-410", date: "2025-11-15", drug: "Ibuprofen 400mg", dosage: "1 tab × 2 times/day after meals for 3 days", doctor: "Dr. Anoop Nair", active: false },
];

export const myInvoices = [
  { id: "INV-089", date: "2026-05-12", treatment: "Scaling & Polishing", gross: 1500, insurancePaid: 1050, patientDue: 450, status: "Paid" },
  { id: "INV-094", date: "2026-06-15", treatment: "Root Canal Treatment", gross: 8000, insurancePaid: 5600, patientDue: 2400, status: "Pending" },
  { id: "INV-072", date: "2026-03-20", treatment: "Dental Filling & X-Ray", gross: 2500, insurancePaid: 1750, patientDue: 750, status: "Paid" },
];

export const myDocuments = [
  { id: "DOC-001", name: "Dental X-Ray (Full Mouth)", type: "X-Ray", date: "2026-05-12", url: "#", size: "2.4 MB" },
  { id: "DOC-002", name: "Blood Report (Pre-surgery)", type: "Lab Report", date: "2026-05-10", url: "#", size: "1.1 MB" },
  // Consent forms are now fetched dynamically from the backend
];

export const myNotifications = [
  { id: "NOT-001", title: "Upcoming Appointment", message: "Reminder: You have a Root Canal appointment with Dr. Anoop Nair on Monday, 15-Jun-2026 at 10:30 AM.", type: "appointment", date: "2026-06-11", read: false },
  { id: "NOT-002", title: "Pending Bill Payment", message: "Your invoice INV-094 for Root Canal Treatment has an outstanding amount of ₹2,400.", type: "billing", date: "2026-06-10", read: false },
  { id: "NOT-003", title: "Post-Care Instructions", message: "Avoid hot foods and drink plenty of fluids for 24 hours after scaling.", type: "post-care", date: "2026-05-12", read: true },
  { id: "NOT-004", title: "Feedback Requested", message: "How was your recent scaling and polishing session with Dr. Anoop Nair? Please rate us.", type: "feedback", date: "2026-05-13", read: true },
];

export const postCareInstructions = [
  {
    id: "PC-01",
    treatment: "Root Canal Treatment",
    date: "2026-06-15",
    doctor: "Dr. Anoop Nair",
    guidelines: [
      "Avoid eating or chewing until the numbness wears off completely.",
      "Do not chew or bite on the treated tooth until it is fully restored with a crown.",
      "Take prescribed antibiotics and pain relievers exactly as directed.",
      "Call the clinic immediately if you experience severe swelling or pain after 48 hours."
    ]
  },
  {
    id: "PC-02",
    treatment: "Scaling & Polishing",
    date: "2026-05-12",
    doctor: "Dr. Anoop Nair",
    guidelines: [
      "Avoid highly colored foods or beverages (coffee, tea, red wine, turmeric) for 48 hours to prevent staining.",
      "Expect slight tooth sensitivity to hot and cold for a few days.",
      "Continue regular brushing and flossing, but be gentle around the gums for the first 24 hours."
    ]
  }
];
