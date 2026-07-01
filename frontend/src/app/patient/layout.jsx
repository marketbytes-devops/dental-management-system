"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { getPatientNotifications } from "@/services/api";

export default function PatientLayout({ children }) {
  const [activeToast, setActiveToast] = useState(null);
  const [toastAnimation, setToastAnimation] = useState("");
  const router = useRouter();

  useEffect(() => {
    async function checkNotifications() {
      // Only show once per login session
      if (sessionStorage.getItem("patient_toast_reminded")) {
        return;
      }
      
      try {
        const notifs = await getPatientNotifications();
        const unread = notifs.filter(n => !n.read);
        if (unread.length > 0) {
          setActiveToast({
            title: "Unread Notifications",
            message: `You have ${unread.length} unread updates. Click here to check your treatment and care instructions.`,
            type: "general",
            timestamp: "Just now"
          });
          setToastAnimation("slide-in");
          sessionStorage.setItem("patient_toast_reminded", "true");
          
          // Auto dismiss after 8 seconds
          setTimeout(() => {
            setToastAnimation("slide-out");
            setTimeout(() => {
              setActiveToast(null);
            }, 450);
          }, 8000);
        }
      } catch (err) {
        console.warn("Failed to check notifications for layout popup:", err);
      }
    }
    
    // Delay slightly for smooth page loading
    const timer = setTimeout(checkNotifications, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthGuard allowedRoles={["patient"]} type="patient">
      <DashboardLayout>
        {children}
        
        {/* Patient Reminder Toast Popup */}
        {activeToast && (
          <NotificationToast
            toast={activeToast}
            animation={toastAnimation}
            onDismiss={() => {
              setToastAnimation("slide-out");
              setTimeout(() => {
                setActiveToast(null);
              }, 450);
            }}
            onClick={() => {
              setActiveToast(null);
              router.push("/patient/notifications");
            }}
          />
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}

function NotificationToast({ toast, animation, onDismiss, onClick }) {
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);

  const handleStart = (clientX) => {
    setIsDragging(true);
    startX.current = clientX;
  };

  const handleMove = (clientX) => {
    if (!isDragging) return;
    const offset = clientX - startX.current;
    if (offset > 0) {
      setDragOffset(offset);
    }
  };

  const handleEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (dragOffset > 120) {
      onDismiss();
    } else {
      setDragOffset(0);
    }
  };

  return (
    <div
      onMouseDown={(e) => handleStart(e.clientX)}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={(e) => handleStart(e.touches[0].clientX)}
      onTouchMove={(e) => handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      onClick={onClick}
      style={{
        transform: isDragging ? `translateX(${dragOffset}px)` : undefined,
        transition: isDragging ? "none" : "transform 0.2s ease-out",
        cursor: isDragging ? "grabbing" : "pointer",
      }}
      className={`fixed top-20 right-5 max-w-sm w-96 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-xl p-4 flex gap-3 z-50 select-none ${
        animation === "slide-in" ? "animate-slide-in" : "animate-slide-out"
      }`}
    >
      <div className="flex flex-col items-center gap-1">
        <div className="p-2 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>
        <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
      </div>

      <div className="flex-1 min-w-0 pr-4 text-left">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
            Patient Portal Notice
          </span>
          <span className="text-[9px] text-gray-400 font-semibold">{toast.timestamp}</span>
        </div>
        <p className="text-xs font-semibold text-gray-800 mt-1 leading-normal line-clamp-2">
          {toast.message}
        </p>
        <span className="text-[9px] font-semibold text-primary mt-2 block hover:underline">
          Click to open Hub →
        </span>
      </div>
    </div>
  );
}
