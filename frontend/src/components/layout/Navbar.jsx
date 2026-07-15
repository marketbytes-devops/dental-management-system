"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Bell, HelpCircle, Sparkles, Share2, Microscope, AlertTriangle, Calendar, CreditCard, ClipboardList, Info } from "lucide-react";
import { useDoctor } from "@/app/doctor/layout";
import { updateAuthStatus, getPatientNotifications, markPatientNotificationAsRead } from "@/services/api";

export default function Navbar() {
  const [role, setRole] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [currentStatus, setCurrentStatus] = useState("Active");
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [patientNotifications, setPatientNotifications] = useState([]);

  const fetchPatientNotifs = async () => {
    try {
      const data = await getPatientNotifications();
      setPatientNotifications(data);
    } catch (e) {
      console.warn("Failed to fetch patient notifications:", e);
    }
  };

  useEffect(() => {
    if (role === "patient") {
      fetchPatientNotifs();
      const interval = setInterval(fetchPatientNotifs, 5000);
      return () => clearInterval(interval);
    }
  }, [role]);

  const getPatientNotifLink = (type) => {
    switch (type) {
      case "appointment":
      case "reminders":
        return "/patient/appointments";
      case "consent":
        return "/patient/documents";
      case "billing":
        return "/patient/billing";
      case "treatment_plan":
        return "/patient/dashboard";
      case "lab_delivery":
        return "/patient/records";
      default:
        return "/patient/notifications";
    }
  };

  const getPatientNotifIcon = (type) => {
    switch (type) {
      case "appointment":
      case "reminders":
        return <Calendar className="w-3.5 h-3.5 text-primary" />;
      case "consent":
        return <ClipboardList className="w-3.5 h-3.5 text-success" />;
      case "billing":
        return <CreditCard className="w-3.5 h-3.5 text-danger" />;
      case "treatment_plan":
        return <Info className="w-3.5 h-3.5 text-indigo-600" />;
      case "lab_delivery":
        return <Microscope className="w-3.5 h-3.5 text-secondary" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-gray-400" />;
    }
  };

  // Safely try-catch calling useDoctor so it doesn't crash when rendered outside DoctorProvider
  let doctorContext = null;
  try {
    doctorContext = useDoctor();
  } catch (e) {
    // not in doctor context
  }

  const { notifications = [], bellAnimating, markAsRead } = doctorContext || {};

  useEffect(() => {
    if (typeof window !== "undefined") {
      const staffUser = localStorage.getItem("staff_user");
      const patientUser = localStorage.getItem("patient_user");
      const patientName = localStorage.getItem("patient_name");

      if (staffUser) {
        try {
          const parsed = JSON.parse(staffUser);
          setTimeout(() => {
            setCurrentUser(parsed);

            const roles = parsed.roles || [];
            const rawRole = roles.length > 0 ? roles[0] : (parsed.role || "");

            const normalizeRole = (r) => {
              if (!r) return "";
              const val = r.toLowerCase().trim();
              if (val === "admin") return "admin";
              if (val === "doctor") return "doctor";
              if (val === "lab tech" || val === "lab" || val === "lab technician") return "lab tech";
              if (val === "receptionist" || val === "reception") return "receptionist";
              if (val === "accountant" || val === "accountent") return "accountant";
              if (val === "patient") return "patient";
              return val;
            };

            setRole(normalizeRole(rawRole));
            setCurrentStatus(parsed.status || "Active");
          }, 0);
        } catch (e) {
          console.error("Failed to parse staff_user", e);
        }
      } else if (patientUser || patientName) {
        try {
          const name = patientName || (patientUser ? JSON.parse(patientUser).name : "Patient");
          setCurrentUser({ name });
          setRole("patient");
        } catch (e) {
          console.error("Failed to parse patient user info", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest(".status-dropdown-container")) {
        setShowStatusDropdown(false);
      }
    };
    if (showStatusDropdown) {
      window.addEventListener("click", handleOutsideClick);
    }
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [showStatusDropdown]);

  const handleStatusChange = async (newStatus) => {
    try {
      const data = await updateAuthStatus({ status: newStatus });
      setCurrentStatus(data.status);
      setShowStatusDropdown(false);

      if (currentUser) {
        const updatedUser = { ...currentUser, status: data.status };
        localStorage.setItem("staff_user", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
      }
    } catch (e) {
      console.error("Error updating status:", e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("staff_jwt_token");
    localStorage.removeItem("staff_user");
    localStorage.removeItem("patient_jwt_token");
    localStorage.removeItem("patient_user");
    localStorage.removeItem("patient_name");
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_profile_picture");
    window.location.href = "/login";
  };

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Greeting Details
  let userGreetingName = "User";
  let userSubtitle = "SmileCare Portal";

  if (currentUser?.name) {
    if (role === "doctor") {
      const doctorFirstName = currentUser.name.replace("Dr. ", "").split(" ")[0];
      userGreetingName = `Dr. ${doctorFirstName}`;
      userSubtitle = currentUser.specialties && currentUser.specialties.length > 0
        ? currentUser.specialties.join(", ")
        : "Specialist Dentist";
    } else if (role === "admin") {
      userGreetingName = "Admin";
      userSubtitle = "System Administrator";
    } else {
      userGreetingName = currentUser.name;
      userSubtitle = role.charAt(0).toUpperCase() + role.slice(1) + " Portal";
    }
  }

  const unreadNotifications = notifications ? notifications.filter(n => n.status === "unread") : [];
  const unreadCount = unreadNotifications.length;
  const bellDotColor = unreadCount > 0 ? unreadNotifications[0].dotColor : null;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      {/* Greeting */}
      <div className="flex items-center gap-6">
        <div>
          <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
            {greeting}, {userGreetingName} <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
          </p>
          <p className="text-xs text-gray-500">{userSubtitle}</p>
        </div>

        <div className="hidden md:flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-80 transition-all">
          <Search className="text-gray-400 mr-2 w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Search patients, doctors, appointments..."
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 relative">
        {/* Doctor-specific clinical notifications popover */}
        {role === "doctor" ? (
          <>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer outline-none"
            >
              <Bell className={`w-5 h-5 transition-transform ${bellAnimating ? "animate-bell-ring text-primary" : ""}`} />
              {unreadCount > 0 && (
                <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${bellDotColor === "green" ? "bg-success animate-dot-pulse-green" : "bg-danger animate-dot-pulse-red"
                  }`} />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-12 w-80 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-4 space-y-3 animate-fade-in text-left">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Clinical Notifications</span>
                  <span className="text-[9px] font-bold bg-danger/10 text-danger px-2 py-0.5 rounded">
                    {unreadCount} New
                  </span>
                </div>

                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {notifications.map(notif => {
                    const getNotifIcon = () => {
                      switch (notif.type) {
                        case "referral":
                          return <Share2 className="w-3.5 h-3.5 text-primary" />;
                        case "labs":
                          return <Microscope className="w-3.5 h-3.5 text-secondary" />;
                        case "alerts":
                          return <AlertTriangle className="w-3.5 h-3.5 text-danger" />;
                        default:
                          return <Bell className="w-3.5 h-3.5 text-gray-400" />;
                      }
                    };

                    return (
                      <Link
                        key={notif.id}
                        href={notif.link}
                        onClick={() => {
                          if (markAsRead) markAsRead(notif.id);
                          setShowNotifications(false);
                        }}
                        className={`block p-2.5 rounded-xl border border-transparent transition-all text-xs relative ${notif.status === "unread"
                            ? "bg-gray-50/80 hover:bg-gray-50 border-gray-100 font-semibold"
                            : "hover:bg-gray-50"
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <p className="font-bold text-gray-800 flex items-center gap-1.5 capitalize">
                            {getNotifIcon()}
                            {notif.type} notification
                          </p>
                          {notif.status === "unread" && (
                            <span className={`w-2 h-2 rounded-full shrink-0 ${notif.dotColor === "green" ? "bg-success animate-pulse" : "bg-danger animate-pulse"
                              }`} />
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-1 leading-normal font-normal">
                          {notif.message}
                        </p>
                        <span className="text-[9px] text-gray-400 font-semibold block mt-1">{notif.timestamp}</span>
                      </Link>
                    );
                  })}
                  {notifications.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-6 font-medium">No new notifications.</p>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100 text-center">
                  <Link
                    href="/doctor/notifications"
                    onClick={() => setShowNotifications(false)}
                    className="text-xs font-bold text-primary hover:underline block cursor-pointer"
                  >
                    View All Notifications
                  </Link>
                </div>
              </div>
            )}
          </>
        ) : role === "patient" ? (
          <Link
            href="/patient/notifications"
            className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer outline-none animate-fade-in"
            title="My Notifications"
          >
            <Bell className="w-5 h-5" />
            {patientNotifications.filter(n => !n.read).length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-danger rounded-full border border-white animate-pulse" />
            )}
          </Link>
        ) : (
          <button className="relative p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </button>
        )}

        {/* Doctor-specific availability status dropdown */}
        {role === "doctor" && (
          <div className="relative status-dropdown-container">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors text-xs font-bold text-gray-700 cursor-pointer outline-none"
            >
              <span className={`w-2.5 h-2.5 rounded-full ${currentStatus === "Active" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                  currentStatus === "On Break" ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-gray-400"
                }`} />
              {currentStatus === "Active" ? "On Duty" :
                currentStatus === "On Break" ? "On Break" : "Off Duty"}
              <span className="text-[8px] text-gray-400">▼</span>
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-150 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5 animate-fade-in">
                <button
                  onClick={() => handleStatusChange("Active")}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Check In (On Duty)
                </button>
                <button
                  onClick={() => handleStatusChange("On Break")}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-amber-50 hover:text-amber-650 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Go On Break
                </button>
                <button
                  onClick={() => handleStatusChange("Inactive")}
                  className="w-full text-left px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-55 hover:text-gray-900 rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  Check Out (Off Duty)
                </button>
              </div>
            )}
          </div>
        )}

        <button className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer outline-none"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
