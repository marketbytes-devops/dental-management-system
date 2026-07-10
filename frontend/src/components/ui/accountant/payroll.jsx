"use client";

import { useState, useEffect } from "react";
import { getStaffList, getAllAppointments, getLabOrders } from "@/services/api";

export default function AccountantPayroll() {
  const [payroll, setPayroll] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayrollData = async () => {
    try {
      const [staffData, apptsData, labData] = await Promise.all([
        getStaffList(),
        getAllAppointments(),
        getLabOrders()
      ]);

      const treatmentCosts = {
        "checkup": 500,
        "cleaning": 1000,
        "root canal": 5000,
        "crown": 8000,
        "extraction": 1500,
        "filling": 1200,
        "consultation": 1500
      };

      const getGrossCost = (treatmentType) => {
        const treatment = (treatmentType || "Consultation").toLowerCase();
        for (const [key, cost] of Object.entries(treatmentCosts)) {
          if (treatment.includes(key)) {
            return cost;
          }
        }
        return 1500;
      };

      const roleBaseSalaries = {
        doctor: 120000,
        labtech: 35000,
        receptionist: 25000,
        accountant: 40000,
        admin: 50000
      };

      const mappedPayroll = (staffData || []).map((staff) => {
        const primaryRole = (staff.roles && staff.roles[0] || "staff").toLowerCase();
        const base = roleBaseSalaries[primaryRole] || 30000;

        let incentive = 0;
        if (primaryRole === "doctor") {
          const completedAppts = (apptsData || []).filter(
            (appt) =>
              (appt.doctor_name || "").toLowerCase().includes(staff.name.toLowerCase()) &&
              appt.status === "Completed"
          );
          incentive = completedAppts.reduce((sum, appt) => sum + Math.round(getGrossCost(appt.treatment_type) * 0.1), 0);
        } else if (primaryRole === "labtech") {
          const completedLabs = (labData || []).filter(
            (o) => o.status === "Completed" || o.status === "Delivered"
          );
          incentive = completedLabs.length * 1000;
        } else {
          incentive = 0;
        }

        let displayRole = "Clinic Staff";
        if (primaryRole === "doctor") displayRole = "Dentist";
        else if (primaryRole === "labtech") displayRole = "Lab Technician";
        else if (primaryRole === "receptionist") displayRole = "Receptionist";
        else if (primaryRole === "accountant") displayRole = "Accountant";
        else if (primaryRole === "admin") displayRole = "Administrator";

        return {
          id: staff.id,
          name: staff.name,
          role: displayRole,
          base,
          incentive,
          status: "Pending"
        };
      });

      setPayroll(mappedPayroll);
    } catch (err) {
      console.error("Failed to load payroll data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchPayrollData();
    }, 0);
  }, []);

  const fallbackPayroll = [
    { id: 1, name: "Dr. Anoop Nair", role: "Sr. Dentist", base: 120000, incentive: 35000, status: "Paid" },
    { id: 2, name: "Dr. Priya Varma", role: "Orthodontist", base: 110000, incentive: 45000, status: "Pending" },
    { id: 3, name: "Sneha Thomas", role: "Receptionist", base: 25000, incentive: 2000, status: "Paid" },
    { id: 4, name: "Alen Joseph", role: "Lab Tech", base: 35000, incentive: 5000, status: "Pending" },
  ];

  const displayPayroll = payroll.length > 0 ? payroll : fallbackPayroll;

  const handlePay = (id) => {
    setPayroll(prev => {
      if (prev.length === 0) {
        // If displaying fallback payroll, we need to populate state with it first before toggling
        const initialized = fallbackPayroll.map(p => p.id === id ? { ...p, status: "Paid" } : p);
        return initialized;
      }
      return prev.map(p => p.id === id ? { ...p, status: "Paid" } : p);
    });
    alert("Payroll payout processed successfully.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Staff Payroll Center</h1>
        <p className="text-sm text-gray-500 mt-1">Review basic salary brackets, dental splits/incentives, and release payments.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-gray-900">Payroll Ledger Sheet</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Staff Member</th>
                <th className="py-3 px-2">Clinic Role</th>
                <th className="py-3 px-2">Base Salary</th>
                <th className="py-3 px-2">Incentive Splits</th>
                <th className="py-3 px-2 font-black">Total Net Pay</th>
                <th className="py-3 px-2">Status</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {displayPayroll.map(p => {
                const total = p.base + p.incentive;
                return (
                  <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3.5 px-2 text-xs text-gray-500 font-medium">{p.role}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-700">₹{p.base.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2 font-mono text-xs text-success font-medium">+₹{p.incentive.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2 font-mono text-xs font-black text-gray-900">₹{total.toLocaleString("en-IN")}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${p.status === "Paid" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                        }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right">
                      {p.status === "Pending" && (
                        <button
                          onClick={() => handlePay(p.id)}
                          className="px-2.5 py-1 text-xs bg-primary hover:bg-primary/95 text-white rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Release Pay
                        </button>
                      )}
                      {p.status === "Paid" && (
                        <span className="text-xs text-gray-450 font-semibold">Disbursed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
