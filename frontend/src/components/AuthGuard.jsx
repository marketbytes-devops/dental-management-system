"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, ArrowRight } from "lucide-react";
import ToothIcon from "@/components/ui/shared/ToothIcon";
import { getProfile, getPatientProfile } from "@/services/api";

// Helper to normalize roles
const normalizeRole = (role) => {
  if (!role) return "";
  const r = role.toLowerCase().trim();
  if (r === "admin") return "admin";
  if (r === "doctor") return "doctor";
  if (r === "lab tech" || r === "lab" || r === "lab technician") return "lab tech";
  if (r === "receptionist" || r === "reception") return "receptionist";
  if (r === "accountant" || r === "accountent") return "accountant";
  if (r === "patient") return "patient";
  return r;
};

// Helper to get default redirect path based on user roles
const getDefaultRedirectPath = (roles) => {
  const normalized = roles.map(normalizeRole);

  if (normalized.includes("admin")) return "/admin/dashboard";
  if (normalized.includes("doctor")) return "/doctor/dashboard";
  if (normalized.includes("lab tech")) return "/labtechnicians/dashboard";

  // prioritize accountant
  if (normalized.includes("accountant")) {
    return "/frontdesk/accountant/dashboard";
  }

  if (normalized.includes("receptionist")) {
    return "/frontdesk/receptionist/dashboard";
  }

  return "/";
};

export default function AuthGuard({ children, allowedRoles = [], type = "staff" }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const allowedRolesStr = JSON.stringify(allowedRoles);

  useEffect(() => {
    let active = true;

    const verifySession = async () => {
      const tokenKey = type === "patient" ? "patient_jwt_token" : "staff_jwt_token";
      const token = localStorage.getItem(tokenKey);

      if (!token) {
        if (active) {
          router.push(type === "patient" ? "/login?role=patient" : "/login");
        }
        return;
      }

      try {
        const profile = type === "patient"
          ? await getPatientProfile()
          : await getProfile();

        // Save/Sync fresh profile details in localStorage
        if (type === "patient") {
          localStorage.setItem("patient_token", profile.token);
          localStorage.setItem("patient_name", profile.name);
          localStorage.setItem("patient_phone", profile.phone);
          localStorage.setItem("patient_email", profile.email);
          localStorage.setItem("patient_profile_picture", profile.profile_picture || "");
        } else {
          localStorage.setItem("staff_user", JSON.stringify(profile));
        }

        const roles = type === "patient" ? ["patient"] : (profile.roles || []);
        const normalizedUserRoles = roles.map(normalizeRole);
        const allowedRolesArray = JSON.parse(allowedRolesStr);
        const normalizedAllowedRoles = allowedRolesArray.map(normalizeRole);

        // Check authorization (admin role gets full bypass access)
        const isAuthorized = normalizedUserRoles.includes("admin") || normalizedUserRoles.some(r => normalizedAllowedRoles.includes(r));

        if (active) {
          setUserRoles(roles);
          if (isAuthorized) {
            setAuthorized(true);
            setLoading(false);
          } else {
            setAuthorized(false);
            setLoading(false);
          }
        }
      } catch (err) {
        if (err.status === 401 || err.status === 403) {
          // Token expired or invalid
          localStorage.removeItem(tokenKey);
          if (type === "patient") {
            localStorage.removeItem("patient_token");
            localStorage.removeItem("patient_name");
            localStorage.removeItem("patient_phone");
            localStorage.removeItem("patient_email");
            localStorage.removeItem("patient_profile_picture");
          } else {
            localStorage.removeItem("staff_user");
          }
          if (active) {
            router.push(type === "patient" ? "/login?role=patient" : "/login");
          }
          return;
        }

        console.warn("Auth verification failed, falling back to local cache:", err);
        // Resilient fallback to cached localStorage credentials if server is down
        const cachedUserStr = localStorage.getItem(type === "patient" ? "patient_name" : "staff_user");
        if (cachedUserStr) {
          let roles = [];
          if (type === "patient") {
            roles = ["patient"];
          } else {
            try {
              const cachedUser = JSON.parse(cachedUserStr);
              roles = cachedUser.roles || [];
            } catch (e) {
              roles = [];
            }
          }

          const normalizedUserRoles = roles.map(normalizeRole);
          const allowedRolesArray = JSON.parse(allowedRolesStr);
          const normalizedAllowedRoles = allowedRolesArray.map(normalizeRole);
          const isAuthorized = normalizedUserRoles.includes("admin") || normalizedUserRoles.some(r => normalizedAllowedRoles.includes(r));

          if (active) {
            setUserRoles(roles);
            if (isAuthorized) {
              setAuthorized(true);
            } else {
              setAuthorized(false);
            }
            setLoading(false);
          }
        } else {
          if (active) {
            router.push(type === "patient" ? "/login?role=patient" : "/login");
          }
        }
      }
    };

    verifySession();

    return () => {
      active = false;
    };
  }, [router, type, allowedRolesStr]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative font-sans">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <ToothIcon className="w-12 h-12 text-primary animate-bounce" strokeWidth={2.5} />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
            <span className="text-sm font-bold text-slate-300 tracking-wider uppercase">Verifying Security Session...</span>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Protected by HIPAA Compliance Standards</p>
        </div>
      </div>
    );
  }

  if (!authorized) {
    const pageName = allowedRoles.join(" / ");
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 relative font-sans text-center">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ef444408_1px,transparent_1px),linear-gradient(to_bottom,#ef444408_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="relative z-10 max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-8 shadow-2xl backdrop-blur-md space-y-6">
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-white">Access Unauthorized</h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Your account does not have authorization to access the <strong>{pageName}</strong> module.
            </p>
          </div>
          <div className="pt-2 flex flex-col gap-2">
            <button
              onClick={() => {
                window.location.href = getDefaultRedirectPath(userRoles);
              }}
              className="w-full bg-primary hover:bg-primary/95 text-white text-xs font-bold py-3 rounded-xl transition-all shadow-md shadow-primary/10 flex items-center justify-center gap-2 cursor-pointer"
            >
              Go to Your Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("staff_jwt_token");
                localStorage.removeItem("staff_user");
                window.location.href = "/login";
              }}
              className="w-full bg-slate-700 hover:bg-slate-650 text-slate-300 text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            >
              Log in with Different Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return children;
}
