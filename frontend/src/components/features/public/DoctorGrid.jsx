"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAvailableDoctors, getDoctorAvailableSlots } from "@/services/api";
import { Calendar, User, X, ArrowLeft } from "lucide-react";

export default function DoctorGrid() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [selectedSpecialty, setSelectedSpecialty] = useState("");
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  
  // Booking state
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedDoctorForBooking) return;
      setLoadingSlots(true);
      try {
        const data = await getDoctorAvailableSlots(selectedDoctorForBooking.id, selectedDate);
        setAvailableSlots(data.available_slots || []);
        setSelectedSlot(""); // reset selected slot when date changes
      } catch (error) {
        console.error("Failed to fetch slots:", error);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };
    
    if (showBooking) {
      fetchSlots();
    }
  }, [selectedDate, showBooking, selectedDoctorForBooking]);

  const handleBookNowClick = (doctor) => {
    setSelectedDoctorForBooking(doctor);
    setShowBooking(true);
    if (!selectedDate) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedSlot && selectedDoctorForBooking) {
      router.push(`/login?roles=patient&doctorId=${selectedDoctorForBooking.id}&date=${selectedDate}&time=${selectedSlot}`);
    }
  };

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

  // Derive unique specialties from the fetched doctors
  const specialties = [...new Set(doctors.map(d => d.specialty || "General Dentistry"))];

  // Derive doctor options based on the selected specialty
  const doctorOptions = doctors.filter(doc => {
    const docSpecialty = doc.specialty || "General Dentistry";
    if (selectedSpecialty && docSpecialty !== selectedSpecialty) return false;
    return true;
  });

  // Filter the grid display based on both filters
  const filteredDoctors = doctors.filter(doc => {
    const docSpecialty = doc.specialty || "General Dentistry";
    if (selectedSpecialty && docSpecialty !== selectedSpecialty) return false;
    if (selectedDoctorId && doc.id.toString() !== selectedDoctorId) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 mb-2">
        <div className="flex-1">
          <label htmlFor="specialty-filter" className="block text-sm font-semibold text-slate-700 mb-1">
            Filter by Specialty
          </label>
          <select
            id="specialty-filter"
            value={selectedSpecialty}
            onChange={(e) => {
              setSelectedSpecialty(e.target.value);
              setSelectedDoctorId(""); // Reset doctor selection when specialty changes
            }}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Specialties</option>
            {specialties.map((spec, idx) => (
              <option key={idx} value={spec}>
                {spec}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label htmlFor="doctor-filter" className="block text-sm font-semibold text-slate-700 mb-1">
            Filter by Doctor Name
          </label>
          <select
            id="doctor-filter"
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">All Doctors</option>
            {doctorOptions.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredDoctors.length === 0 ? (
        <div className="text-center py-10 text-slate-500 bg-white rounded-2xl border border-slate-100 shadow-sm">
          No doctors match your selected filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredDoctors.map((doctor) => (
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
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                onClick={() => handleBookNowClick(doctor)}
                className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
              >
                <Calendar className="w-4 h-4" /> Book
              </button>
            </div>
          </div>
        </div>
      ))}
        </div>
      )}

      {/* Booking Modal */}
      {showBooking && selectedDoctorForBooking && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowBooking(false);
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Book Appointment
                </h3>
                <p className="text-xs text-slate-500 mt-1">Select your preferred date and time with {selectedDoctorForBooking.name}</p>
              </div>
              <button 
                onClick={() => setShowBooking(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Date Picker */}
                <div className="w-full md:w-1/3 space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Select Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      min={new Date().toISOString().split("T")[0]}
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 text-slate-700 bg-slate-50 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* Time Slots */}
                <div className="w-full md:w-2/3 space-y-2">
                  <label className="block text-sm font-bold text-slate-700 uppercase tracking-wide">Available Slots</label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-3 text-slate-500 text-sm py-4">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" /> Fetching real-time availability...
                    </div>
                  ) : availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-2">
                      {availableSlots.map((slotObj) => {
                        const isFull = slotObj.is_full;
                        const time = slotObj.time;
                        const isSelected = selectedSlot === time;
                        return (
                        <button
                          key={time}
                          disabled={isFull}
                          title={isFull ? "Slot Already Booked" : ""}
                          onClick={() => !isFull && setSelectedSlot(time)}
                          className={`py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                            isFull 
                              ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-70"
                              : isSelected
                                ? "bg-primary text-white shadow-md shadow-primary/30 ring-2 ring-primary ring-offset-1"
                                : "bg-white text-slate-700 border border-slate-200 hover:border-primary/50 hover:bg-primary/5"
                          }`}
                        >
                          {time} 
                          {isFull && <span className="block text-[9px] uppercase tracking-wider font-bold text-red-400 mt-0.5">Booked</span>}
                        </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-center mt-2">
                      <p className="text-sm text-slate-500 font-medium">No slots available for this date.</p>
                      <p className="text-xs text-slate-400 mt-1">Please try selecting another day.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowBooking(false)}
                className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                disabled={!selectedSlot}
                onClick={handleConfirmBooking}
                className="px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-primary to-secondary rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Continue <ArrowLeft className="w-4 h-4 rotate-180" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
