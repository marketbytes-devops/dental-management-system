import axios from "axios";

// ==========================================
// 1. Axios Client Configuration & Interceptors
// ==========================================

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Dynamic request interceptor to automatically attach authorization tokens
client.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      let token = null;
      const isPatientRequest = config.url && config.url.startsWith("/patient");
      if (isPatientRequest) {
        token = localStorage.getItem("patient_jwt_token") || localStorage.getItem("staff_jwt_token");
      } else {
        token = localStorage.getItem("staff_jwt_token") || localStorage.getItem("patient_jwt_token");
      }

      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common error patterns
client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.detail || error.message || "An error occurred";
    const errObj = new Error(message);
    errObj.status = error.response?.status;
    errObj.response = error.response;
    return Promise.reject(errObj);
  }
);

export default client;

// ==========================================
// 2. Auth & Admin API Endpoints
// ==========================================

export const login = async (credentials) => {
  const response = await client.post("/auth/login", credentials);
  return response.data;
};

export const getProfile = async () => {
  const response = await client.get("/auth/profile");
  return response.data;
};

export const updateProfile = async (profileData) => {
  const response = await client.put("/auth/profile", profileData);
  return response.data;
};

export const uploadProfilePicture = async (formData) => {
  const response = await client.post("/auth/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const getAuthStatus = async () => {
  const response = await client.get("/auth/status");
  return response.data;
};

export const getStaffList = async () => {
  const response = await client.get("/auth/staff");
  return response.data;
};

export const updateAuthStatus = async (statusData) => {
  const response = await client.put("/auth/status", statusData);
  return response.data;
};

export const getDoctors = async (date) => {
  const url = date ? `/auth/doctors?date=${encodeURIComponent(date)}` : "/auth/doctors";
  const response = await client.get(url);
  return response.data;
};

export const updateDoctorStatus = async (id, headers) => {
  const response = await client.put(`/auth/doctors/${id}/status`, {}, { headers });
  return response.data;
};

export const adminGetUsers = async () => {
  const response = await client.get("/admin/users");
  return response.data;
};

export const adminCreateUser = async (userData) => {
  const response = await client.post("/admin/users", userData);
  return response.data;
};

export const adminUpdateUser = async (id, userData) => {
  const response = await client.put(`/admin/users/${id}`, userData);
  return response.data;
};

export const adminDeleteUser = async (id) => {
  const response = await client.delete(`/admin/users/${id}`);
  return response.data;
};

export const adminToggleUserStatus = async (id) => {
  const response = await client.put(`/admin/users/${id}/status`);
  return response.data;
};

// ==========================================
// 3. Patient API Endpoints
// ==========================================

export const getAllPatients = async () => {
  const response = await client.get("/patient/all");
  return response.data;
};

export const registerPatient = async (patientData) => {
  const response = await client.post("/patient/register", patientData);
  return response.data;
};

export const getPatientProfile = async () => {
  const response = await client.get("/patient/profile");
  return response.data;
};

export const updatePatientProfile = async (profileData) => {
  const response = await client.put("/patient/profile", profileData);
  return response.data;
};

export const uploadPatientProfilePicture = async (formData) => {
  const response = await client.post("/patient/profile/picture", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const changePatientPassword = async (passwordData) => {
  const response = await client.post("/patient/change-password", passwordData);
  return response.data;
};

export const getPendingConsents = async () => {
  const response = await client.get("/patient/consents/pending");
  return response.data;
};

export const getSignedConsents = async () => {
  const response = await client.get("/patient/consents/documents");
  return response.data;
};

export const signConsentDocument = async (id, signatureData) => {
  const response = await client.post(`/patient/consents/${id}/sign`, signatureData);
  return response.data;
};

export const getPatientByToken = async (token) => {
  const response = await client.get(`/patient/token/${encodeURIComponent(token)}`);
  return response.data;
};

export const getConsentPdfUrl = (id) => {
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  return `${baseURL}/patient/consents/${id}/pdf`;
};

export const downloadConsentPdf = async (id) => {
  const response = await client.get(`/patient/consents/${id}/pdf`, {
    responseType: "blob"
  });
  return response.data;
};

export const getOralHealthDetails = async () => {
  const response = await client.get("/patient/oral-health-details");
  return response.data;
};

export const getAvailableDoctors = async () => {
  const response = await client.get("/patient/doctors-list");
  return response.data;
};

export const getDoctorAvailableSlots = async (doctorId, date) => {
  const response = await client.get(`/patient/doctors/${doctorId}/available-slots?date=${encodeURIComponent(date)}`);
  return response.data;
};

// ==========================================
// 4. Appointments & Queue API Endpoints
// ==========================================

export const getFrontdeskDoctors = async (date) => {
  const url = date ? `/frontdesk/doctors?date=${encodeURIComponent(date)}` : "/frontdesk/doctors";
  const response = await client.get(url);
  return response.data;
};

export const createAppointment = async (appointmentData) => {
  const response = await client.post("/frontdesk/appointments", appointmentData);
  return response.data;
};

export const directCheckin = async (id, priority, doctorName) => {
  let url = `/frontdesk/appointments/${id}/direct-checkin`;
  const params = [];
  if (priority) params.push(`priority=${encodeURIComponent(priority)}`);
  if (doctorName) params.push(`doctor_name=${encodeURIComponent(doctorName)}`);
  if (params.length > 0) {
    url += `?${params.join("&")}`;
  }
  const response = await client.post(url);
  return response.data;
};

export const payConsultation = async (id, paymentData) => {
  const response = await client.post(`/frontdesk/appointments/${id}/pay-consultation`, paymentData);
  return response.data;
};

export const getTodayAppointments = async () => {
  const response = await client.get("/frontdesk/appointments/today");
  return response.data;
};

export const getTomorrowAppointments = async () => {
  const response = await client.get("/frontdesk/appointments/tomorrow");
  return response.data;
};

export const getQueue = async () => {
  const response = await client.get("/frontdesk/queue");
  return response.data;
};

export const updateAppointmentStatus = async (id, statusData) => {
  const response = await client.put(`/frontdesk/appointments/${id}/status`, statusData);
  return response.data;
};

export const getCommunications = async () => {
  const response = await client.get("/frontdesk/communications");
  return response.data;
};

export const sendCommunication = async (commData) => {
  const response = await client.post("/frontdesk/communications", commData);
  return response.data;
};

export const sendAppointmentOtp = async (id) => {
  const response = await client.post(`/frontdesk/appointments/${id}/send-otp`);
  return response.data;
};

export const getPatientAppointments = async (patientId) => {
  const response = await client.get(`/frontdesk/appointments/patient/${patientId}`);
  return response.data;
};

export const getAllAppointments = async () => {
  const response = await client.get("/frontdesk/appointments");
  return response.data;
};

export const callPatient = async (id, statusStr) => {
  const response = await client.post(`/frontdesk/appointments/${id}/call?status_str=${encodeURIComponent(statusStr)}`);
  return response.data;
};

// ==========================================
// 5. Leave & Roster API Endpoints
// ==========================================

export const getDoctorLeaves = async (doctorName) => {
  const response = await client.get(`/leave/doctor/leaves?doctor_name=${encodeURIComponent(doctorName)}`);
  return response.data;
};

export const getMyLeaveRequests = async () => {
  const response = await client.get("/leave/my");
  return response.data;
};

export const getMyLeaveBalances = async () => {
  const response = await client.get("/leave/balances");
  return response.data;
};

export const getAllLeaveRequests = async () => {
  const response = await client.get("/leave/requests");
  return response.data;
};

export const getAllLeaveBalances = async () => {
  const response = await client.get("/leave/balances/all");
  return response.data;
};

export const applyLeave = async (leaveData) => {
  const response = await client.post("/leave/apply", leaveData);
  return response.data;
};

export const updateLeaveStatus = async (id, statusData) => {
  const response = await client.put(`/leave/requests/${id}/status`, statusData);
  return response.data;
};

export const deleteLeaveRequest = async (id) => {
  const response = await client.delete(`/leave/requests/${id}`);
  return response.data;
};

export const resetLeaves = async () => {
  const response = await client.delete("/leave/reset");
  return response.data;
};

// ==========================================
// 6. Lab & Case Tracking API Endpoints
// ==========================================

export const getLabOrders = async () => {
  const response = await client.get("/lab/orders");
  return response.data;
};

export const createLabOrder = async (orderData) => {
  const response = await client.post("/lab/orders", orderData);
  return response.data;
};

export const updateLabOrder = async (id, orderData) => {
  const response = await client.put(`/lab/orders/${id}`, orderData);
  return response.data;
};

export const updateLabOrderStatus = async (id, statusData) => {
  const response = await client.put(`/lab/orders/${id}/status`, statusData);
  return response.data;
};

export const getLabNotifications = async (recipientRole) => {
  const url = recipientRole ? `/lab/notifications?recipient_role=${encodeURIComponent(recipientRole)}` : "/lab/notifications";
  const response = await client.get(url);
  return response.data;
};

export const markNotificationAsRead = async (id) => {
  const response = await client.put(`/lab/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await client.put("/lab/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (id) => {
  const response = await client.delete(`/lab/notifications/${id}`);
  return response.data;
};

export const createLabRework = async (id, statusData) => {
  const response = await client.post(`/lab/orders/${id}/rework`, statusData);
  return response.data;
};

export const getLabComments = async (id) => {
  const response = await client.get(`/lab/orders/${id}/comments`);
  return response.data;
};

export const createLabComment = async (id, commentData) => {
  const response = await client.post(`/lab/orders/${id}/comments`, commentData);
  return response.data;
};

export const getLabAuditTrail = async (id) => {
  const response = await client.get(`/lab/orders/${id}/audit`);
  return response.data;
};

export const getLabVendors = async () => {
  const response = await client.get("/lab/vendors");
  return response.data;
};

export const createLabVendor = async (vendorData) => {
  const response = await client.post("/lab/vendors", vendorData);
  return response.data;
};

export const updateLabVendor = async (id, vendorData) => {
  const response = await client.put(`/lab/vendors/${id}`, vendorData);
  return response.data;
};

export const deleteLabVendor = async (id) => {
  const response = await client.delete(`/lab/vendors/${id}`);
  return response.data;
};

export const uploadLabFile = async (formData) => {
  const response = await client.post("/lab/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return response.data;
};

export const getLabInventory = async () => {
  const response = await client.get("/lab/inventory");
  return response.data;
};

export const createInventoryItem = async (itemData) => {
  const response = await client.post("/lab/inventory", itemData);
  return response.data;
};

export const updateInventoryItem = async (id, itemData) => {
  const response = await client.put(`/lab/inventory/${id}`, itemData);
  return response.data;
};

export const getRestockRequests = async () => {
  const response = await client.get("/lab/restock-requests");
  return response.data;
};

export const createRestockRequest = async (requestData) => {
  const response = await client.post("/lab/restock-requests", requestData);
  return response.data;
};

export const updateRestockRequestStatus = async (id, statusData) => {
  const response = await client.put(`/lab/restock-requests/${id}/status`, statusData);
  return response.data;
};

// ==========================================
// 7. Doctor & Treatment Plan API Endpoints
// ==========================================

export const getPatientTreatmentPlan = async (patientToken) => {
  const response = await client.get(`/treatment-plan/patient/${encodeURIComponent(patientToken)}`);
  return response.data;
};

export const updateTreatmentPlan = async (id, planData) => {
  const response = await client.put(`/treatment-plan/${id}`, planData);
  return response.data;
};

export const createTreatmentPlan = async (planData) => {
  const response = await client.post("/treatment-plan", planData);
  return response.data;
};

export const createTreatmentPlanStep = async (planId, stepData) => {
  const response = await client.post(`/treatment-plan/${planId}/step`, stepData);
  return response.data;
};

export const updateTreatmentPlanStep = async (stepId, stepData) => {
  const response = await client.put(`/treatment-plan/step/${stepId}`, stepData);
  return response.data;
};

export const deleteTreatmentPlanStep = async (stepId) => {
  const response = await client.delete(`/treatment-plan/step/${stepId}`);
  return response.data;
};

// ==========================================
// 8. Prescriptions & Referrals API Endpoints
// ==========================================

export const createPrescription = async (prescriptionData) => {
  const response = await client.post("/patient/prescriptions", prescriptionData);
  return response.data;
};

export const getPatientPrescriptions = async () => {
  const response = await client.get("/patient/prescriptions");
  return response.data;
};

export const createReferral = async (referralData) => {
  const response = await client.post("/patient/referrals", referralData);
  return response.data;
};

export const getPatientReferrals = async () => {
  const response = await client.get("/patient/referrals");
  return response.data;
};

export const getAllReferrals = async () => {
  const response = await client.get("/patient/referrals/all");
  return response.data;
};

export const updateReferral = async (refId, referralData) => {
  const response = await client.put(`/patient/referrals/${refId}`, referralData);
  return response.data;
};

// ==========================================
// 9. Patient Notifications & Doctor Feedback (New)
// ==========================================

export const getPatientNotifications = async () => {
  const response = await client.get("/patient/notifications");
  return response.data;
};

export const markPatientNotificationAsRead = async (id) => {
  const response = await client.put(`/patient/notifications/${id}/read`);
  return response.data;
};

export const markAllPatientNotificationsAsRead = async () => {
  const response = await client.put("/patient/notifications/read-all");
  return response.data;
};

export const deletePatientNotification = async (id) => {
  const response = await client.delete(`/patient/notifications/${id}`);
  return response.data;
};

export const submitDoctorFeedback = async (feedbackData) => {
  const response = await client.post("/patient/feedback", feedbackData);
  return response.data;
};

export const getDoctorFeedbacks = async () => {
  const response = await client.get("/patient/feedback");
  return response.data;
};

export const getDoctorFeedbackStats = async (doctorName) => {
  const response = await client.get(`/patient/feedback/doctor/${encodeURIComponent(doctorName)}`);
  return response.data;
};

export const saveClinicalNote = async (noteData) => {
  const response = await client.post("/patient/clinical-notes", noteData);
  return response.data;
};

export const getPatientClinicalNotes = async (patientToken) => {
  const response = await client.get(`/patient/clinical-notes/${patientToken}`);
  return response.data;
};

// --- Doctor Performance APIs ---
export const getDoctorPerformance = async (doctorName, period = "all") => {
  const response = await client.get(`/doctor/performance/${encodeURIComponent(doctorName)}?period=${encodeURIComponent(period)}`);
  return response.data;
};

export const getDoctorDashboardAppointments = async (doctorName, filter = "today") => {
  const response = await client.get(`/doctor/appointments/${encodeURIComponent(doctorName)}?filter=${encodeURIComponent(filter)}`);
  return response.data;
};

export const getMyClinicalNotes = async () => {
  const response = await client.get("/patient/clinical-notes");
  return response.data;
};

// ==========================================
// 10. SmileCare Charting API Endpoints
// ==========================================

export const getPatientChart = async (patientToken) => {
  const response = await client.get(`/charts/${encodeURIComponent(patientToken)}`);
  return response.data;
};

export const addToothFinding = async (patientToken, toothNumber, findingData) => {
  const response = await client.post(`/charts/${encodeURIComponent(patientToken)}/teeth/${toothNumber}/findings`, findingData);
  return response.data;
};

export const getToothFindingsHistory = async (patientToken, toothNumber) => {
  const response = await client.get(`/charts/${encodeURIComponent(patientToken)}/teeth/${toothNumber}/history`);
  return response.data;
};

// ==========================================
// 11. Procedures & Billing API Endpoints
// ==========================================

export const getProcedures = async () => {
  const response = await client.get("/procedures");
  return response.data;
};

export const createBillingRequest = async (billingData) => {
  const response = await client.post("/billing/request", billingData);
  return response.data;
};


export const getDailyTransactions = async () => {
  const response = await client.get("/frontdesk/transactions/today");
  return response.data;
};


// ==========================================
// 12. Payment (Razorpay) API Endpoints
// ==========================================

/**
 * Creates a Razorpay order for the ₹100 consultation booking fee.
 * @param {number} appointmentId - The newly-created appointment ID
 * @returns {{ razorpay_order_id, amount, currency, key_id, appointment_id }}
 */
export const createPaymentOrder = async (appointmentId) => {
  const response = await client.post("/payment/create-order", {
    appointment_id: appointmentId,
    amount: 100.0,
  });
  return response.data;
};

/**
 * Verifies the Razorpay payment signature on the backend.
 * @param {{ appointment_id, razorpay_order_id, razorpay_payment_id, razorpay_signature }} payload
 */
export const verifyPayment = async (payload) => {
  const response = await client.post("/payment/verify", payload);
  return response.data;
};

