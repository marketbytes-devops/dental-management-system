"use client";

import { useState, useEffect } from "react";
import { getExpenses, createExpense, getStaffList, getAllAppointments, getLabOrders } from "@/services/api";

export default function AccountantExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [staff, setStaff] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [labOrders, setLabOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState("operational"); // "operational" | "payroll"

  // Form State
  const [form, setForm] = useState({
    desc: "",
    cat: "Utilities",
    amt: ""
  });
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("All");

  // Load dashboard data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [expensesData, staffData, apptsData, labData] = await Promise.all([
        getExpenses(),
        getStaffList(),
        getAllAppointments(),
        getLabOrders()
      ]);
      setExpenses(expensesData || []);
      setStaff(staffData || []);
      setAppointments(apptsData || []);
      setLabOrders(labData || []);
      setError("");
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("Failed to fetch ledger or payroll information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Post Expense Handlers
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!form.desc.trim() || !form.amt || Number(form.amt) <= 0) {
      alert("Please enter a valid description and positive amount.");
      return;
    }

    try {
      setFormSubmitting(true);
      const payload = {
        category: form.cat,
        amount: parseFloat(form.amt),
        description: form.desc.trim(),
        receipt_url: ""
      };
      
      const newExp = await createExpense(payload);
      setExpenses(prev => [newExp, ...prev]);
      setForm({ desc: "", cat: "Utilities", amt: "" });
      alert("Expense voucher saved successfully.");
      
      // Refresh to update summary totals
      loadDashboardData();
    } catch (err) {
      console.error("Failed to post expense:", err);
      alert(err.message || "Failed to post expense. Please try again.");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Base Salaries config map
  const roleBaseSalaries = {
    doctor: 120000,
    admin: 50000,
    accountant: 40000,
    labtech: 35000,
    receptionist: 25000
  };

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

  const getPrimaryRole = (roles = []) => {
    if (!roles || roles.length === 0) return "staff";
    const normalized = roles.map(r => r.toLowerCase());
    if (normalized.includes("doctor")) return "doctor";
    if (normalized.includes("admin")) return "admin";
    if (normalized.includes("accountant")) return "accountant";
    if (normalized.includes("lab tech") || normalized.includes("labtech") || normalized.includes("technician")) return "labtech";
    if (normalized.includes("receptionist") || normalized.includes("reception")) return "receptionist";
    return normalized[0];
  };

  const getRoleDisplayName = (roleKey) => {
    switch (roleKey) {
      case "doctor": return "Dentist";
      case "admin": return "Administrator";
      case "accountant": return "Accountant";
      case "labtech": return "Lab Technician";
      case "receptionist": return "Receptionist";
      default: return "Clinic Staff";
    }
  };

  // Calculate incentive split
  const calculateIncentive = (staffMember) => {
    const role = getPrimaryRole(staffMember.roles);
    if (role === "doctor") {
      const docNameLower = (staffMember.name || "").toLowerCase().replace(/^dr\.\s+/i, '').trim();
      const completedAppts = appointments.filter(appt => {
        if (appt.status !== "Completed") return false;
        const apptDocName = (appt.doctor_name || "").toLowerCase().replace(/^dr\.\s+/i, '').trim();
        return apptDocName.includes(docNameLower) || docNameLower.includes(apptDocName);
      });
      return completedAppts.reduce((sum, appt) => sum + Math.round(getGrossCost(appt.treatment_type) * 0.1), 0);
    } else if (role === "labtech") {
      const techUsername = (staffMember.username || "").toLowerCase();
      const completedLabs = labOrders.filter(order => {
        const statusLower = (order.status || "").toLowerCase();
        const isCompleted = ["completed", "delivered", "ready for pickup", "ready / shipped"].includes(statusLower);
        if (!isCompleted) return false;
        if (order.claimed_by) {
          return order.claimed_by.toLowerCase() === techUsername;
        } else {
          // Fallback round-robin allocation for demo cases
          const numericId = parseInt(order.id.replace(/\D/g, '')) || 0;
          const assignedTech = numericId % 2 === 0 ? "ajay" : "james";
          return assignedTech === techUsername;
        }
      });
      return completedLabs.length * 1000;
    }
    return 0;
  };

  // Payroll resets monthly on the 4th of each month.
  // payrollPeriodStart = 4th of current month if today >= 4, else 4th of last month.
  const _today = new Date();
  const payrollPeriodStart = (() => {
    const d = new Date(_today);
    if (d.getDate() >= 4) {
      d.setDate(4);
    } else {
      d.setMonth(d.getMonth() - 1);
      d.setDate(4);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  })();

  // Label for current payroll cycle: "Aug 4 – Sep 3, 2026" style
  const _periodEnd = new Date(payrollPeriodStart);
  _periodEnd.setMonth(_periodEnd.getMonth() + 1);
  _periodEnd.setDate(3);
  const currentMonthYear = `${payrollPeriodStart.toLocaleString("en-US", { month: "short", day: "numeric" })} – ${_periodEnd.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

  // Staff is "Paid" only if a Salary voucher for them was created on/after payrollPeriodStart
  const checkIsPaid = (staffName) => {
    return expenses.some(exp => {
      if (exp.category !== "Salaries") return false;
      if (!exp.description || !exp.description.includes(staffName)) return false;
      const expDate = exp.date ? new Date(exp.date) : null;
      return expDate && expDate >= payrollPeriodStart;
    });
  };

  // Release Pay Action
  const handleReleasePay = async (staffMember, totalPay) => {
    const confirmRelease = confirm(`Are you sure you want to release payroll of ₹${totalPay.toLocaleString("en-IN")} to ${staffMember.name} for ${currentMonthYear}?`);
    if (!confirmRelease) return;

    try {
      const payload = {
        category: "Salaries",
        amount: parseFloat(totalPay),
        description: `Salary Release - ${staffMember.name} (${currentMonthYear})`,
        receipt_url: ""
      };

      const newExpense = await createExpense(payload);
      setExpenses(prev => [newExpense, ...prev]);
      alert(`Success! Payroll has been released. Voucher generated successfully.`);
      loadDashboardData();
    } catch (err) {
      console.error("Failed to release payroll:", err);
      alert(err.message || "Failed to release payroll. Please try again.");
    }
  };

  // Financial summary metrics
  const totalMonthlyExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const operationalOverheads = expenses
    .filter(exp => ["Utilities", "Supplies", "Lab Fees", "Marketing", "Other"].includes(exp.category))
    .reduce((sum, exp) => sum + exp.amount, 0);
  const disbursedPayroll = expenses
    .filter(exp => exp.category === "Salaries")
    .reduce((sum, exp) => sum + exp.amount, 0);
  
  // Pending Salaries count
  const pendingSalariesCount = staff.filter(s => !checkIsPaid(s.name)).length;

  // Filtered Expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesSearch = 
      (exp.description || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.id || "").toString().includes(searchTerm);
    const matchesCategory = filterCategory === "All" || exp.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Expenses & Staff Payroll</h1>
          <p className="text-sm text-gray-500 mt-1">Manage operational overhead ledger bills and calculate staff splits and dynamic payouts.</p>
        </div>
        
        {/* Visual Tabbed Control */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50 shadow-inner w-fit">
          <button
            onClick={() => setActiveTab("operational")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "operational"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Operational Ledger
          </button>
          <button
            onClick={() => setActiveTab("payroll")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${
              activeTab === "payroll"
                ? "bg-white text-indigo-600 shadow-sm border border-gray-100"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Payroll & Incentives
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-2xl text-sm flex items-center space-x-2">
          <svg className="w-5 h-5 text-rose-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Monthly Expenses */}
        <div className="bg-gradient-to-br from-indigo-50/70 to-purple-50/40 border border-indigo-100/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Total Expenses</span>
            <div className="p-2.5 bg-indigo-100/60 rounded-2xl text-indigo-600 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-indigo-950">₹{totalMonthlyExpenses.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-indigo-400 mt-1 font-semibold">{expenses.length} active ledger vouchers</p>
          </div>
        </div>

        {/* Operational Overheads */}
        <div className="bg-gradient-to-br from-teal-50/70 to-emerald-50/40 border border-teal-100/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Operational Overheads</span>
            <div className="p-2.5 bg-teal-100/60 rounded-2xl text-teal-600 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-teal-950">₹{operationalOverheads.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-teal-500 mt-1 font-semibold">Rent, utilities & clinic supplies</p>
          </div>
        </div>

        {/* Disbursed Payroll */}
        <div className="bg-gradient-to-br from-amber-50/70 to-orange-50/40 border border-amber-100/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Disbursed Payroll</span>
            <div className="p-2.5 bg-amber-100/60 rounded-2xl text-amber-600 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-amber-950">₹{disbursedPayroll.toLocaleString("en-IN")}</h3>
            <p className="text-xs text-amber-500 mt-1 font-semibold">Released Salaries this month</p>
          </div>
        </div>

        {/* Pending Salaries */}
        <div className="bg-gradient-to-br from-rose-50/70 to-pink-50/40 border border-rose-100/40 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">Pending Salaries</span>
            <div className="p-2.5 bg-rose-100/60 rounded-2xl text-rose-600 group-hover:scale-110 transition-transform duration-300">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-black text-rose-950">{pendingSalariesCount} Staff</h3>
            <p className="text-xs text-rose-500 mt-1 font-semibold">Awaiting payment release</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-44 bg-gray-100 animate-pulse rounded-3xl"></div>
          <div className="h-64 bg-gray-100 animate-pulse rounded-3xl"></div>
        </div>
      ) : (
        <>
          {activeTab === "operational" ? (
            /* ====================================================
               OPERATIONAL EXPENSES VIEW
               ==================================================== */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Form Card */}
              <div className="lg:col-span-4 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Post Expense Voucher</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Record immediate overhead bills and vendor invoices.</p>
                </div>

                <form onSubmit={handleAddExpense} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <select
                      value={form.cat}
                      onChange={(e) => setForm(prev => ({ ...prev, cat: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
                    >
                      <option value="Rent">Clinic Rent</option>
                      <option value="Utilities">Utility Bills</option>
                      <option value="Supplies">Dental Consumables</option>
                      <option value="Lab Fees">External Dental Lab Vendor Invoices</option>
                      <option value="Marketing">Marketing & Promotion</option>
                      <option value="Other">Other Miscellaneous</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Amount (₹)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={form.amt}
                        onChange={(e) => setForm(prev => ({ ...prev, amt: e.target.value }))}
                        className="w-full pl-8 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Expense Description</label>
                    <textarea
                      rows={3}
                      placeholder="e.g. Electricity bill for July 2026, or Apex Lab Invoice #1029"
                      value={form.desc}
                      onChange={(e) => setForm(prev => ({ ...prev, desc: e.target.value }))}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={formSubmitting}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-xs transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
                  >
                    {formSubmitting ? (
                      <span>Saving Voucher...</span>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                        </svg>
                        <span>Post Expense</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Ledger Card */}
              <div className="lg:col-span-8 bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Expense Ledger Book</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Historical log of all clinical overhead entries and payroll releases.</p>
                  </div>
                  
                  {/* Filters */}
                  <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                      <input
                        type="text"
                        placeholder="Search ledger..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full md:w-48 pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-800"
                      />
                      <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>

                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-gray-700"
                    >
                      <option value="All">All Categories</option>
                      <option value="Rent">Clinic Rent</option>
                      <option value="Utilities">Utilities</option>
                      <option value="Supplies">Clinical Supplies</option>
                      <option value="Lab Fees">Lab Fees</option>
                      <option value="Salaries">Salaries</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-4">Voucher ID</th>
                        <th className="py-4 px-4">Description</th>
                        <th className="py-4 px-4">Category</th>
                        <th className="py-4 px-4">Voucher Date</th>
                        <th className="py-4 px-4 text-right">Debit Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {filteredExpenses.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-400">
                            No ledger entries found matching filters.
                          </td>
                        </tr>
                      ) : (
                        filteredExpenses.map((exp) => (
                          <tr key={exp.id} className="text-sm text-gray-700 hover:bg-gray-50/30 transition-colors">
                            <td className="py-4 px-4 font-mono text-xs text-gray-400 font-bold">VOU-{String(exp.id).padStart(4, "0")}</td>
                            <td className="py-4 px-4 font-semibold text-gray-900">{exp.description}</td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                exp.category === "Salaries" ? "bg-amber-50 text-amber-700 border border-amber-100" :
                                exp.category === "Utilities" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" :
                                exp.category === "Supplies" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" :
                                exp.category === "Lab Fees" ? "bg-purple-50 text-purple-700 border border-purple-100" :
                                "bg-gray-50 text-gray-600 border border-gray-200/50"
                              }`}>
                                {exp.category}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-xs text-gray-500">
                              {exp.date ? new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                            </td>
                            <td className="py-4 px-4 text-right font-black text-rose-600">₹{exp.amount.toLocaleString("en-IN")}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* ====================================================
               STAFF PAYROLL VIEW
               ==================================================== */
            <div className="space-y-8">
              {/* Base Salary Reference Cards */}
              <div className="bg-gradient-to-r from-slate-50 to-indigo-50/30 border border-indigo-100/30 rounded-3xl p-6 shadow-sm">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h4 className="text-sm font-bold text-indigo-950">Baseline Base Salary Tiers Reference</h4>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
                  {Object.entries(roleBaseSalaries).map(([role, salary]) => (
                    <div key={role} className="bg-white border border-gray-150 p-4 rounded-2xl shadow-sm text-center">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">{getRoleDisplayName(role)}</span>
                      <span className="text-base font-black text-gray-900 block mt-1">₹{salary.toLocaleString("en-IN")}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payroll Calculator Ledger */}
              <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Staff Payroll & Incentive Calculator</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Live salary splits based on clinician completed appointments (10% split) and lab tech deliveries (₹1,000 bonus).</p>
                </div>

                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50/70 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        <th className="py-4 px-4">Staff Member</th>
                        <th className="py-4 px-4">Clinic Role</th>
                        <th className="py-4 px-4">Base Salary</th>
                        <th className="py-4 px-4">Dynamic Incentives</th>
                        <th className="py-4 px-4">Calculated Net Pay</th>
                        <th className="py-4 px-4">Status ({currentMonthYear})</th>
                        <th className="py-4 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {staff.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-sm text-gray-400">
                            No staff accounts found.
                          </td>
                        </tr>
                      ) : (
                        staff.map((staffMember) => {
                          const roleKey = getPrimaryRole(staffMember.roles);
                          const base = roleBaseSalaries[roleKey] || 30000;
                          const incentive = calculateIncentive(staffMember);
                          const total = base + incentive;
                          const isPaid = checkIsPaid(staffMember.name);
                          
                          return (
                            <tr key={staffMember.id} className="text-sm text-gray-700 hover:bg-gray-50/30 transition-colors">
                              <td className="py-4 px-4">
                                <div className="font-semibold text-gray-900">{staffMember.name}</div>
                                <div className="text-[10px] text-gray-400 font-mono">@{staffMember.username}</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="text-xs text-gray-600 font-medium bg-gray-100/70 px-2.5 py-1 rounded-xl">
                                  {getRoleDisplayName(roleKey)}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono text-xs text-gray-800">
                                ₹{base.toLocaleString("en-IN")}
                              </td>
                              <td className="py-4 px-4">
                                {incentive > 0 ? (
                                  <span className="font-mono text-xs text-emerald-600 font-bold">
                                    +₹{incentive.toLocaleString("en-IN")}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                              <td className="py-4 px-4 font-mono text-sm font-black text-indigo-950">
                                ₹{total.toLocaleString("en-IN")}
                              </td>
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 w-fit ${
                                  isPaid 
                                    ? "bg-emerald-50 text-emerald-700 border border-emerald-100/70"
                                    : "bg-amber-50 text-amber-700 border border-amber-100/70"
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${isPaid ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                  <span>{isPaid ? "Paid" : "Pending"}</span>
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right">
                                {isPaid ? (
                                  <span className="text-xs font-bold text-gray-400 bg-gray-50 border border-gray-200/50 px-3 py-1.5 rounded-xl">Disbursed</span>
                                ) : (
                                  <button
                                    onClick={() => handleReleasePay(staffMember, total)}
                                    className="px-3.5 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all duration-300 font-bold cursor-pointer shadow-sm"
                                  >
                                    Release Pay
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
