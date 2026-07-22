# SmileCare — Full Feature List

> **Stack:** Next.js 16 (App Router) · FastAPI (Python) · SQLite/PostgreSQL · Tailwind CSS  
> **Roles covered:** Admin · Receptionist · Doctor · Lab Technician · Accountant · Patient (Self-Service Portal)

---

## 🌐 Public Website

| Feature | Details |
|---|---|
| Landing Page | Hero, services overview, testimonials, stats |
| Doctor Directory | Browse all active doctors with specialty filter |
| Doctor Profile Pages | Individual profile with bio, specialty, availability |
| About Page | Clinic stats (patients, doctors, staff) pulled live from DB |

---

## 🔐 Authentication

| Feature | Details |
|---|---|
| Staff Login | Username + password, JWT issued on success |
| Patient Login | Separate login flow with patient-scoped JWT |
| Patient Self-Registration | New patients can register from the portal |
| Role-Based Access Control | Admin, Doctor, Receptionist, Lab Technician, Accountant, Patient |
| Auth Guard | Every dashboard route protected; token validated per request |
| Auto Token Attachment | Axios interceptor auto-attaches Bearer token on every API call |

---

## 🛡️ Admin Dashboard

| Feature | Details |
|---|---|
| Dashboard Overview | KPI cards: total patients, doctors, staff, appointments |
| User Management | Create, view, update, deactivate staff accounts |
| Role Management | Assign and change roles per user |
| Doctor Management | Create doctor profiles, assign specialties |
| Patient Overview | View all patients, status, registration date |
| Procedure Management | Add/edit/delete billable dental procedures with codes |
| Lab Module Admin | Oversee all lab orders across all technicians |
| Leave Management | Review and approve/reject staff leave requests |
| Complaint Management | View all staff complaints, update statuses, add notes |
| Inventory Overview | Admin-level inventory visibility |

---

## 🧑‍💼 Receptionist Dashboard

| Feature | Details |
|---|---|
| **Dashboard** | Live queue count, today's appointments, KPI summary cards |
| **Appointments** | Schedule, view, edit, cancel appointments; filter by date/status/doctor |
| **Patient Check-In** | Check-in patients against appointment list; update arrival status |
| **Patient Queue** | Live queue board with position tracking |
| **Patient Management** | Register new patients, search, view full profiles |
| **Patient Records** | View and manage patient visit history |
| **Treatment Records** | View treatment history per patient |
| **Doctor Directory** | View active doctors and their schedules |
| **Communication** | Send messages/notifications to patients (SMS/email integration via Twilio) |
| **Reminders** | Schedule and view appointment reminders |
| **Alerts** | System and operational alerts |
| **Leave Requests** | Submit personal leave requests |
| **Complaint Box** | Submit bug reports / issues to developers with status tracking |
| **Profile** | View and edit own profile |
| **Appearance Settings** | Theme, font size, compact mode |
| **Developer Support Portal** | Categorized bug reports (UI, Data, Performance, Feature Request), audit trail, reopen workflow |

---

## 🩺 Doctor Dashboard

| Feature | Details |
|---|---|
| **Dashboard** | Today's patient list, appointment stats, queue summary |
| **Clinical Workspace** | Full per-patient encounter environment |
| ↳ Patient Summary Banner | Demographics, last visit, alerts at a glance |
| ↳ SmileCare Tooth Chart | Interactive 32-tooth charting with per-tooth findings history |
| ↳ Clinical Notes | Rich SOAP-style notes with save/view history |
| ↳ Treatment Plan Manager | Create multi-step treatment plans with status per step |
| ↳ Lab Order Form | Submit prosthetic/pathology lab orders with full spec fields |
| ↳ Prescription Form | Issue and save patient prescriptions |
| ↳ Referral Form | Refer patients to other doctors/specialists |
| ↳ Emergency Popup | Trigger emergency escalation from workspace |
| ↳ Timeline History | Chronological patient visit & event timeline |
| **Lab Orders** | View all lab orders submitted by the doctor |
| **Patient Queue** | Live queue for the doctor's room |
| **Referrals** | Manage outbound and inbound referrals |
| **Treatment Plans** | View all open treatment plans |
| **Performance Analytics** | Personal KPIs: patients seen, avg time, rating trends |
| **Reports** | Download/view personal performance reports |
| **Notifications** | System and patient-triggered notifications |
| **Alerts** | Clinical alerts per doctor |
| **Leave Requests** | Submit and track own leave applications |
| **Complaint Box** | Submit issues to admin/developers |
| **Profile** | Edit personal profile and specialty |

---

## 🧪 Lab Technician Dashboard

| Feature | Details |
|---|---|
| **Dashboard** | Open orders, due today, completed, KPI cards with charts |
| **Orders Management** | Full CRUD on lab orders; filter by stage, category, priority |
| ↳ Prosthetic Orders | Margin design, impression type, tooth/quadrant spec |
| ↳ Pathology Orders | Pathology case detail form |
| ↳ Order Status Pipeline | New Cases → In Progress → Quality Control → Dispatch |
| ↳ Rework Orders | Flag and track rework cases |
| ↳ Comments/Notes | Per-order comment thread |
| ↳ Audit Trail | Full status-change history per order |
| **Case Tracking** | Kanban/list view of all cases by pipeline stage |
| **Quality Control** | QC checklist per completed order before dispatch |
| **CAD/Design** | CAD design task tracking per order |
| **Dispatch** | Dispatch management with courier, tracking number, dates |
| **Invoices** | Lab-side invoice management |
| **Inventory** | Lab consumables inventory with restock requests |
| **Reports** | Lab output reports by period/doctor/type |
| **Warranty** | Warranty tracking per completed prosthetic |
| **Vendor Management** | Manage lab external vendor list |
| **Notifications** | Lab-specific order notifications |
| **Leave Requests** | Submit/view own leave |
| **Complaint Box** | Report issues to admin |
| **Settings** | Lab technician preferences |
| **Profile** | Edit own profile |

---

## 💰 Accountant Dashboard

| Feature | Details |
|---|---|
| **Dashboard** | Revenue summary, pending payments, KPI cards |
| **Invoices** | View/manage all patient invoices |
| **Payments** | Record and track incoming payments |
| **Dues** | Outstanding dues management |
| **Refunds** | Refund processing and tracking |
| **Expenses** | Clinic expense tracking |
| **Payroll** | Staff payroll management |
| **Revenue Reports** | Revenue analytics by period, doctor, service |
| **Claims** | Insurance claim management |
| **Claim Verification** | Verify insurance claims before processing |
| **Audit Logs** | Financial audit trail |
| **Reports** | Exportable financial reports |
| **Leave Requests** | Submit own leave requests |
| **Complaint Box** | Submit issues to admin/developers |
| **Profile** | Edit own profile |
| **Settings** | Accountant preferences |

---

## 🧑‍🤝‍🧑 Patient Self-Service Portal

| Feature | Details |
|---|---|
| **Dashboard** | Upcoming appointments, notifications, quick actions |
| **Appointments** | View scheduled appointments, upcoming/past |
| **Self Check-In** | Online check-in for scheduled appointments |
| **Medical Records** | View personal dental records and visit history |
| **Prescriptions** | View issued prescriptions |
| **Billing** | View invoices and payment history |
| **Documents** | Access shared consent forms and documents |
| **Care Tips** | Personalized dental care tips |
| **Notifications** | Appointment reminders, status updates |
| **Profile** | Update personal details |
| **Settings** | Portal preferences |

---

## 🔔 Cross-Role Features

| Feature | Details |
|---|---|
| **Leave Management** | Any staff role can submit; Admin approves/rejects |
| **Complaint Box** | Available to all staff roles → routed to Admin |
| **Developer Support Portal** | Receptionist can report bugs by category with audit trail |
| **System Notifications** | Real-time in-app notifications across all dashboards |
| **Profile Management** | Every role can edit their profile and upload a picture |
| **Auth-Aware Navigation** | Navbar/sidebar adapts per role automatically |

---

## 🏗️ Technical / Platform Features

| Feature | Details |
|---|---|
| REST API | FastAPI with 12 backend modules and 100+ endpoints |
| Database | SQLAlchemy ORM, supports SQLite (dev) and PostgreSQL (prod) |
| Schema Migrations | Runtime ALTER TABLE migrations for backward compatibility |
| File Storage | Static file serving for profile pictures and documents |
| SMS/Notifications | Twilio integration for patient SMS reminders |
| JWT Auth | Dual token system (staff token + patient token) |
| CORS | Configured for all origins (dev); lockable for prod |
| Seed Data | Auto-seeds admin user on first boot |
| Specialty Modules | General Dentistry, Oral Surgery, Prosthodontics seeding scripts |

---

## 📊 Module Count Summary

| Module | Pages / Screens |
|---|---|
| Admin | 10 |
| Receptionist | 17 |
| Doctor | 15 + full clinical workspace |
| Lab Technician | 16 |
| Accountant | 16 |
| Patient Portal | 10 |
| Public Website | 4 |
| Auth | 2 |
| **Total** | **~90+ screens** |
