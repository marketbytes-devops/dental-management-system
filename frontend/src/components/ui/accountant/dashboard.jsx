"use client";

import { useState } from "react";
import { Coins, TrendingUp, AlertCircle, Shield } from "lucide-react";

export default function AccountantDashboard() {
  const [payments, setPayments] = useState([
    { id: "TXN-801", name: "Sneha Joseph", amount: "₹1,200", mode: "UPI", date: "Today, 11:45 AM", status: "Success" },
    { id: "TXN-802", name: "Deepak Kurian", amount: "₹45,000", mode: "Net Banking", date: "Today, 10:15 AM", status: "Success" },
    { id: "TXN-803", name: "Maria George", amount: "₹500", mode: "Cash", date: "Yesterday, 04:30 PM", status: "Success" },
  ]);

  const [dues, setDues] = useState([
    { name: "Aby Thomas", pending: "₹15,000", dueSince: "2026-06-01" },
    { name: "Meera Pillai", pending: "₹2,500", dueSince: "2026-06-05" },
  ]);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Accountant Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Review ledger transactions, manage invoice flows, and monitor patient outstanding balances.</p>
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Today's Collections</p>
            <h3 className="text-2xl font-black text-gray-800">₹46,700</h3>
            <p className="text-xs text-success font-semibold mt-1">↑ 14% vs last Thursday</p>
          </div>
          <span className="bg-success/10 p-3 rounded-xl text-success flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Monthly Billings</p>
            <h3 className="text-2xl font-black text-gray-800">₹4,82,000</h3>
            <p className="text-xs text-primary font-semibold mt-1">Target: ₹5,00,000</p>
          </div>
          <span className="bg-primary/10 p-3 rounded-xl text-primary flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Outstanding Dues</p>
            <h3 className="text-2xl font-black text-gray-800">₹17,500</h3>
            <p className="text-xs text-danger font-semibold mt-1">2 critical accounts</p>
          </div>
          <span className="bg-danger/10 p-3 rounded-xl text-danger flex items-center justify-center shrink-0">
            <AlertCircle className="w-6 h-6" />
          </span>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-150 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Pending Claims</p>
            <h3 className="text-2xl font-black text-gray-800">8 Claims</h3>
            <p className="text-xs text-warning font-semibold mt-1">Est. value: ₹1,20,050</p>
          </div>
          <span className="bg-warning/10 p-3 rounded-xl text-warning flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6" />
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Ledger Transactions (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-base font-extrabold text-gray-900 mb-4">Recent Transactions Log</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    <th className="py-3 px-2">Transaction ID</th>
                    <th className="py-3 px-2">Patient</th>
                    <th className="py-3 px-2">Method</th>
                    <th className="py-3 px-2">Billing Time</th>
                    <th className="py-3 px-2 text-right">Receipt Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map(p => (
                    <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{p.id}</td>
                      <td className="py-3.5 px-2 font-semibold text-gray-900">{p.name}</td>
                      <td className="py-3.5 px-2 text-xs text-gray-500 font-medium">{p.mode}</td>
                      <td className="py-3.5 px-2 text-gray-450 text-xs">{p.date}</td>
                      <td className="py-3.5 px-2 text-right font-black text-success">{p.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Outstanding Balances (4 cols) */}
        <div className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">Aged Receivable list</h3>
            <p className="text-xs text-gray-400 mt-0.5">Patients with pending clinic payments</p>
          </div>

          <div className="space-y-3">
            {dues.map((d, idx) => (
              <div key={idx} className="p-3 border border-danger/10 bg-danger/5 rounded-xl hover:bg-danger/10 transition-colors flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-800">{d.name}</h4>
                  <p className="text-[10px] text-gray-400 mt-0.5">Unpaid since: {d.dueSince}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-danger">{d.pending}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <button
              onClick={() => alert("Payment reminder reminders dispatched to all outstanding dues accounts.")}
              className="w-full py-2 bg-danger hover:bg-danger/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Dispatch Dunning Reminders
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
