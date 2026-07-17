"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { getAvailableDoctors, getDoctorAvailableSlots } from "@/services/api";
import { Calendar, User, ArrowLeft, Award, BookOpen, Clock, X } from "lucide-react";
import Link from "next/link";
import PublicFooter from "@/components/layout/PublicFooter";

export default function DoctorProfile({ params }) {
  const router = useRouter();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Booking state
  const [showBooking, setShowBooking] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const unwrappedParams = use(params);
  const id = unwrappedParams.id;

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const data = await getAvailableDoctors();
        const found = data.find((d) => d.id.toString() === id);
        setDoctor(found);
      } catch (error) {
        console.error("Failed to fetch doctor:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctor();
  }, [id]);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate) return;
      setLoadingSlots(true);
      try {
        const data = await getDoctorAvailableSlots(id, selectedDate);
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
  }, [selectedDate, showBooking, id]);

  const handleBookNowClick = () => {
    setShowBooking(true);
    // Default to today if not set
    if (!selectedDate) {
      setSelectedDate(new Date().toISOString().split("T")[0]);
    }
  };

  const handleConfirmBooking = () => {
    if (selectedDate && selectedSlot) {
      router.push(`/login?roles=patient&doctorId=${id}&date=${selectedDate}&time=${selectedSlot}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-700">Doctor not found</h2>
        <button onClick={() => router.push("/")} className="text-primary hover:underline">
          Return to Home
        </button>
      </div>
    );
  }

  // Placeholder static data for description since it might not be in the backend yet
  const qualifications = doctor.specialty || "BDS, MDS (Orthodontics)";
  const description = `Dr. ${doctor.name} is a highly skilled professional in the field of ${doctor.dept || "General Dentistry"}. With a compassionate approach to patient care, they ensure that every visit is comfortable and pain-free. They specialize in modern dental procedures and prioritize patient education.`;
  const experience = "10+ years of clinical experience specializing in advanced dental procedures.";
  const achievements = [
    "Awarded Best Dentist in the Region (2023)",
    "Published over 15 research papers in international journals",
    "Fellow of the International Congress of Oral Implantologists"
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-100 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-600">Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="bg-primary text-white text-xs font-semibold px-4.5 py-2 rounded-xl shadow-md hover:bg-primary/95 transition-all"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow py-12 px-6">
        <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-100">
          <div className="flex flex-col md:flex-row">
            
            {/* Left Column: Image and Qualifications */}
            <div className="md:w-1/3 bg-slate-50 p-8 flex flex-col items-center border-r border-slate-100">
              <div className="w-48 h-48 bg-white rounded-full border-4 border-white shadow-lg flex items-center justify-center overflow-hidden mb-6 relative group">
                {/* Image Placeholder */}
                {doctor.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`http://localhost:8000${doctor.profile_picture}`}
                    alt={doctor.name}
                    className="w-full h-full object-cover object-[center_80%] group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <User className="w-24 h-24 text-slate-300 group-hover:scale-110 transition-transform duration-500" />
                )}
              </div>
              <h1 className="text-2xl font-black text-slate-900 text-center mb-2">{doctor.name}</h1>
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold tracking-wide mb-6">
                {doctor.dept || doctor.operatory || "General Dentistry"}
              </div>

              <div className="w-full space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-3">
                  <div className="bg-blue-50 p-2 rounded-xl text-blue-600 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Qualifications</h4>
                    <p className="text-sm font-semibold text-slate-800">{qualifications}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Description, Experience, Achievements */}
            <div className="md:w-2/3 p-8 md:p-12 flex flex-col">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 mb-2">Professional Profile</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-primary to-secondary rounded-full"></div>
                </div>
                <button
                  onClick={handleBookNowClick}
                  className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-3 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all hover:-translate-y-1"
                >
                  <Calendar className="w-5 h-5" /> Book Appointment
                </button>
              </div>

              <div className="space-y-8 flex-grow">
                {/* About */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" /> About
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {description}
                  </p>
                </section>

                {/* Experience */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" /> Experience
                  </h3>
                  <p className="text-slate-600 leading-relaxed">
                    {experience}
                  </p>
                </section>

                {/* Achievements */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Award className="w-5 h-5 text-indigo-500" /> Key Achievements
                  </h3>
                  <ul className="space-y-3">
                    {achievements.map((ach, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
                        <span className="text-slate-600">{ach}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Mobile Book Button */}
              <div className="mt-10 md:hidden">
                <button
                  onClick={handleBookNowClick}
                  className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white font-bold px-6 py-4 rounded-2xl shadow-lg shadow-primary/25 hover:shadow-primary/45 transition-all"
                >
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" /> Book Appointment
                </h3>
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      <PublicFooter />

      {/* Booking Modal */}
      {showBooking && (
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
                <p className="text-xs text-slate-500 mt-1">Select your preferred date and time with {doctor.name}</p>
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
