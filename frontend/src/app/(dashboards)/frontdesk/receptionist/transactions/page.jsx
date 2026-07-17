"use client";

import { useState, useEffect } from "react";
import { Receipt, Download, Loader2, IndianRupee, TrendingUp, Calendar as CalIcon } from "lucide-react";
import { getDailyTransactions } from "@/services/api";

export default function ReceptionistTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      const data = await getDailyTransactions();
      setTransactions(data);
    } catch (e) {
      console.error("Error loading transactions:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const totalCollected = transactions.reduce((sum, txn) => sum + txn.amount, 0);

  const handleExport = () => {
    if (transactions.length === 0) {
      alert("No transactions to export.");
      return;
    }
    
    // Simple CSV export
    const headers = ["ID", "Appointment ID", "Patient ID", "Amount", "Method", "Date", "Collected By"];
    const rows = transactions.map(t => [
      t.id, t.appointment_id, t.patient_id, t.amount, t.payment_method, new Date(t.transaction_date).toLocaleString(), t.collected_by
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `transactions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-8 space-y-8">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Financial Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <CalIcon className="w-4 h-4 text-gray-400" />
            {todayStr}
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[.98] rounded-xl transition-all shadow-sm ring-1 ring-blue-600/50"
        >
          <Download className="w-4 h-4" /> Export EOD Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 p-6 opacity-5">
            <IndianRupee className="w-20 h-20" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Revenue Today</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-4xl font-black text-gray-900 tracking-tight">₹{totalCollected.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-center relative overflow-hidden">
          <div className="absolute right-0 top-0 p-6 opacity-5">
            <TrendingUp className="w-20 h-20" />
          </div>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Transactions Count</p>
          <p className="text-4xl font-black text-gray-900 tracking-tight mt-2">{transactions.length}</p>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
            <Receipt className="w-5 h-5 text-gray-400" /> Transaction Ledger
          </h3>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-24 text-gray-400 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-3" /> Fetching ledger records...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Receipt className="w-10 h-10 mb-4 opacity-20" />
            <p className="text-sm font-semibold">No transactions recorded for this period.</p>
            <p className="text-xs text-gray-400 mt-1">Check back once patient consultations begin.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Mode</th>
                  <th className="px-6 py-4">Processed By</th>
                  <th className="px-6 py-4 text-right">Credit Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {transactions.map(txn => (
                  <tr key={txn.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-mono text-gray-500 group-hover:text-gray-900 transition-colors">#{txn.id.toString().padStart(6, '0')}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600">{new Date(txn.transaction_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                    <td className="px-6 py-4">
                      <span className={"inline-flex px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border " + (
                        txn.payment_method === 'Online' ? 'bg-blue-50 text-blue-700 border-blue-200' : 
                        txn.payment_method === 'Card' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                      )}>
                        {txn.payment_method}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-600 capitalize">{txn.collected_by.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">₹{txn.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
