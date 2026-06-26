"use client";

import { useState, useEffect } from "react";

export default function WaitingQueue() {
  const [activeQueue, setActiveQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("staff_jwt_token")
          : null;

      const headers = token
        ? { Authorization: `Bearer ${token}` }
        : {};

      const queueRes = await fetch(
        "http://localhost:8000/frontdesk/queue",
        { headers }
      );

      if (queueRes.ok) {
        const queueData = await queueRes.json();
        setActiveQueue(queueData);
      }
    } catch (err) {
      console.error("Error fetching queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Checkout patient
  const handleCheckout = async (id, name) => {
    try {
      const response = await fetch(`http://localhost:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Completed" })
      });
      if (response.ok) {
        alert(`Patient ${name} checked out. Billing invoice updated.`);
        fetchData();
      } else {
        const err = await response.json();
        alert(err.detail || "Checkout failed.");
      }
    } catch (err) {
      alert("Error checking out patient.");
    }
  };

  // Call patient to dental chair
  const handleCallToChair = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/frontdesk/appointments/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "In Chair" })
      });
      if (response.ok) {
        fetchData();
      }
    } catch (err) {
      alert("Error calling patient to chair.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isLoading) {
    return <div>Loading queue...</div>;
  }

  return (
    <>
      {/* Checked In Queue & Checkout Panel (12 cols) */}
      <div className="lg:col-span-12 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">
          Arrived Patients Queue
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Doctor Route</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Est. Wait</th>
                <th className="py-3 px-2">Stage</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeQueue.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-10 text-center text-xs text-gray-400 font-bold"
                  >
                    No active checked-in patients in wait room.
                  </td>
                </tr>
              ) : (
                activeQueue.map((q) => (
                  <tr
                    key={q.id}
                    className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-gray-900">
                        {q.patient_name}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {q.token} • {q.patient_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-xs text-gray-550">
                      {q.doctor_name}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${q.priority === "Emergency"
                          ? "bg-danger/10 text-danger animate-pulse border border-danger/20"
                          : q.priority === "Urgent"
                            ? "bg-warning/10 text-warning border border-warning/20"
                            : "bg-success/10 text-success border border-success/20"
                          }`}
                      >
                        {q.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-xs font-semibold text-gray-800">
                      {q.status === "In Chair"
                        ? "N/A"
                        : `${q.wait_time_estimate} mins`}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${q.status === "In Chair"
                          ? "bg-purple-55 text-purple-650 border-purple-100"
                          : "bg-gray-50 text-gray-550 border-gray-150"
                          }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right space-x-1.5">
                      {q.status === "Waiting" && (
                        <button
                          onClick={() => handleCallToChair(q.id)}
                          className="px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Call to Chair
                        </button>
                      )}
                      <button
                        onClick={() => handleCheckout(q.id, q.patient_name)}
                        className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        Checkout / Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}