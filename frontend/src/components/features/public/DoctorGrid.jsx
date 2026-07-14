"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAvailableDoctors } from "@/services/api";
import { Calendar, User } from "lucide-react";

export default function DoctorGrid() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const data = await getAvailableDoctors();
        setDoctors(data);
      } catch (error) {
        console.error("Failed to fetch doctors:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (doctors.length === 0) {
    return (
      <div className="text-center py-20 text-slate-500">
        No doctors available at the moment.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {doctors.map((doctor) => (
        <div
          key={doctor.id}
          className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1 flex flex-col"
        >
          {/* Image Placeholder */}
          <div className="h-64 bg-slate-100 relative flex items-center justify-center overflow-hidden group">
            {doctor.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`http://localhost:8000${doctor.profile_picture}`}
                alt={doctor.name}
                className="w-full h-full object-cover object-[center_80%] group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <User className="w-24 h-24 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent"></div>
          </div>

          <div className="p-6 flex flex-col flex-grow">
            <h3 className="text-xl font-bold text-slate-900 mb-1">
              {doctor.name}
            </h3>
            <p className="text-primary font-semibold text-sm mb-3">
              {doctor.specialty || "BDS, MDS"}
            </p>
            <p className="text-slate-500 text-sm mb-6 flex-grow">
              Department: {doctor.dept || doctor.operatory || "General Dentistry"}
            </p>

            <div className="grid grid-cols-2 gap-3 mt-auto">
              <button
                onClick={() => router.push(`/doctor-profile/${doctor.id}`)}
                className="flex items-center justify-center py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                View Profile
              </button>
              <button
                onClick={() => router.push(`/login?roles=patient`)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                <Calendar className="w-4 h-4" /> Book
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
