from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, JSON, Text
from sqlalchemy.sql import func
from database import Base


class PatientModel(Base):
    __tablename__ = "patients"

    # Core
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)

    name = Column(String, index=True, nullable=False)
    gender = Column(String, nullable=False)
    phone = Column(String, nullable=False)

    # Authentication
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)

    # Personal details
    date_of_birth = Column(Date, nullable=True)
    blood_group = Column(String, nullable=True)

    # Address
    address_line1 = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)

    # Emergency contact
    emergency_contact_name = Column(String, nullable=True)
    emergency_contact_phone = Column(String, nullable=True)

    # Medical
    known_allergies = Column(String, nullable=True)

    # Status / system fields
    is_active = Column(Boolean, default=True)
    profile_picture = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientConsent(Base):
    __tablename__ = "patient_consents"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, index=True, nullable=True)
    patient_token = Column(String, index=True, nullable=True)
    doctor_id = Column(Integer, nullable=True)
    treatment_plan_id = Column(Integer, nullable=True)
    step_id = Column(Integer, nullable=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=True)
    status = Column(String, default="PENDING")       # PENDING, SIGNED, REJECTED
    signing_method = Column(String, nullable=True)   # PORTAL, IN_PERSON
    signature_data = Column(String, nullable=True)   # Base64 signature image or typed name
    pdf_file_path = Column(String, nullable=True)    # PDF path
    signed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientPrescription(Base):
    __tablename__ = "patient_prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    doctor_name = Column(String, nullable=False)
    medications = Column(JSON, nullable=False)  # list of medications
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class PatientNotificationModel(Base):
    __tablename__ = "patient_notifications"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    sender_role = Column(String, nullable=False)  # doctor, receptionist, lab tech, accountant
    type = Column(String, nullable=False)  # consent, treatment_plan, appointment, lab_delivery, billing, feedback
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class DoctorFeedbackModel(Base):
    __tablename__ = "doctor_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    doctor_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)  # 1 to 5
    feedback_text = Column(String, nullable=True)
    escalated = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# Alias for backward compatibility with treatment plan module
PatientConsentModel = PatientConsent
PatientPrescriptionModel = PatientPrescription


class ClinicalNoteModel(Base):
    __tablename__ = "patient_clinical_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    doctor_name = Column(String, nullable=False)
    date = Column(String, nullable=False)  # Store YYYY-MM-DD
    note = Column(Text, nullable=False)    # Store formatted note text
    medications = Column(JSON, nullable=True)  # Store list of prescribed medications
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class MedicineDispenseModel(Base):
    __tablename__ = "medicine_dispenses"

    id = Column(Integer, primary_key=True, index=True)
    patient_token = Column(String, index=True, nullable=False)
    patient_name = Column(String, nullable=False)
    doctor_name = Column(String, nullable=False)
    medications = Column(JSON, nullable=False)  # list of medication objects
    status = Column(String, default="Pending")   # Pending, Dispensed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    dispensed_at = Column(DateTime(timezone=True), nullable=True)



