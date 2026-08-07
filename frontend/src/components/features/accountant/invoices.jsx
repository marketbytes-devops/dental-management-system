"use client";

import SupplierPayablesView from "./SupplierPayablesView";

export default function AccountantInvoices() {
  const [activeAccountantTab, setActiveAccountantTab] = useState("payables");
  const [invoices, setInvoices] = useState([
    { id: "INV-051", patient: "Sneha Joseph", amount: "₹1,200", date: "2026-06-11", status: "Paid" },
    { id: "INV-052", patient: "Deepak Kurian", amount: "₹45,000", date: "2026-06-11", status: "Paid" },
    { id: "INV-053", patient: "Aby Thomas", amount: "₹15,000", date: "2026-06-10", status: "Unpaid" },
    { id: "INV-054", patient: "Meera Pillai", amount: "₹2,500", date: "2026-06-09", status: "Unpaid" },
  ]);

  const [form, setForm] = useState({
    patient: "",
    procedure: "Consultation",
    customAmount: "500",
  });

  // Accountant Lab Case Tasks State
  const [labTasks, setLabTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [finalizeFormData, setFinalizeFormData] = useState({
    vendor_invoice_number: "",
    vendor_invoice_amount: "1200",
    final_patient_bill_amount: "3500",
    notes: ""
  });

  const procedures = [
    { name: "Consultation", fee: "500" },
    { name: "Scaling & Polishing", fee: "1200" },
    { name: "Dental Filling", fee: "1500" },
    { name: "Root Canal Treatment", fee: "8000" },
    { name: "Zirconia Crown Fitting", fee: "15000" },
    { name: "Surgical Extraction", fee: "5000" },
  ];

  const fetchLabTasks = async () => {
    try {
      const data = await getAccountantPendingLabTasks();
      setLabTasks(data || []);
    } catch (err) {
      console.error("Failed to fetch accountant lab tasks:", err);
    }
  };

  useEffect(() => {
    fetchLabTasks();
  }, []);

  const handleProcedureChange = (e) => {
    const pName = e.target.value;
    const proc = procedures.find(p => p.name === pName);
    setForm(prev => ({ ...prev, procedure: pName, customAmount: proc ? proc.fee : "0" }));
  };

  const handleCreateInvoice = (e) => {
    e.preventDefault();
    if (!form.patient || !form.customAmount) {
      alert("Please fill in patient name and amount.");
      return;
    }

    const newInvoice = {
      id: `INV-${String(invoices.length + 51).padStart(3, "0")}`,
      patient: form.patient,
      amount: `₹${Number(form.customAmount).toLocaleString("en-IN")}`,
      date: new Date().toISOString().split("T")[0],
      status: "Unpaid"
    };

    setInvoices(prev => [newInvoice, ...prev]);
    setForm({ patient: "", procedure: "Consultation", customAmount: "500" });
  };

  const handleOpenFinalizeModal = (task) => {
    setSelectedTask(task);
    const orderIdStr = task.id || "001";
    setFinalizeFormData({
      vendor_invoice_number: task.vendor_invoice_number || `LAB-INV-${orderIdStr}`,
      vendor_invoice_amount: task.vendor_invoice_amount || "1200",
      final_patient_bill_amount: task.final_patient_bill_amount || task.patient_total_amount || "3500",
      notes: ""
    });
    setBillModalOpen(true);
  };

  const handleFinalizeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await finalizeAccountantLabBill(selectedTask.id, {
        vendor_invoice_number: finalizeFormData.vendor_invoice_number,
        vendor_invoice_amount: parseFloat(finalizeFormData.vendor_invoice_amount) || 0.0,
        final_patient_bill_amount: parseFloat(finalizeFormData.final_patient_bill_amount) || 0.0,
        notes: finalizeFormData.notes
      });
      alert(`Patient bill for ${selectedTask.patientName || selectedTask.patient_name} marked as Bill Ready! Receptionist informed.`);
      setBillModalOpen(false);
      fetchLabTasks();
    } catch (err) {
      console.error(err);
      alert("Failed to finalize bill.");
    }
  };

  return (
    <div className="space-y-6 pb-10 font-sans text-left">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Invoice & Financial Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage supplier payables, finalize patient bills after fitting, and disburse vendor payments.</p>
        </div>

        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
          <button
            onClick={() => setActiveAccountantTab("payables")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeAccountantTab === "payables" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Supplier Payables
          </button>
          <button
            onClick={() => setActiveAccountantTab("pending_bills")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeAccountantTab === "pending_bills" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Pending Patient Bills ({labTasks.length})
          </button>
          <button
            onClick={() => setActiveAccountantTab("invoices")}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
              activeAccountantTab === "invoices" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All Dental Invoices
          </button>
        </div>
      </div>

      {activeAccountantTab === "payables" && <SupplierPayablesView />}

      {activeAccountantTab === "pending_bills" && (
        <div className="bg-white border-2 border-indigo-100 rounded-3xl p-6 shadow-sm space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Tri-Module Financial Control
              </span>
              <h2 className="text-lg font-black text-gray-900 mt-1 flex items-center gap-2">
                <span>💳</span> Pending Dental Lab Cases for Bill Approval ({labTasks.length})
              </h2>
              <p className="text-xs font-semibold text-gray-500">
                Patient billing released after Doctor Fit Successful. Verify vendor invoice and finalize patient bill amount.
              </p>
            </div>
          </div>

        {labTasks.length === 0 ? (
          <div className="text-center py-6 text-xs font-semibold text-gray-400 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            ✓ All dental lab cases verified & patient bills marked as Bill Ready!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {labTasks.map((task) => {
              const isReady = task.accountant_bill_status === "Bill Ready";
              return (
                <div key={task.id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-gray-400">#{task.id}</span>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${isReady ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                        {task.accountant_bill_status || "Pending Review"}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs font-semibold text-gray-800">
                      <p className="text-sm font-black text-gray-900">Patient: <span className="text-primary">{task.patientName || task.patient_name}</span></p>
                      <p className="text-gray-600">Doctor: {task.dentistName || task.dentist_name}</p>
                      <p className="text-gray-600">Procedure: <span className="font-bold text-teal-700">{task.prostheticType || task.orderCategory}</span></p>
                      <p className="text-gray-600">Clinic Received: <span className="font-bold text-gray-900">{task.clinicReceivedAt ? new Date(task.clinicReceivedAt).toLocaleDateString() : "05-Aug-2026"}</span></p>
                    </div>

                    <div className="mt-3 p-2.5 bg-gray-50 rounded-xl border border-gray-150 space-y-1 text-xs">
                      <div className="flex justify-between text-rose-700">
                        <span>Supplier Cost (Clinic Pays):</span>
                        <strong className="text-rose-700 font-bold">₹{(task.supplier_cost || task.vendor_invoice_amount || 0).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="flex justify-between text-sky-700">
                        <span>Patient Charge (Patient Bills):</span>
                        <strong className="text-sky-700 font-bold">₹{(task.patient_charge || task.final_patient_bill_amount || 3500).toLocaleString("en-IN")}</strong>
                      </div>
                      <div className="flex justify-between text-emerald-800 pt-1 border-t border-gray-200 font-extrabold">
                        <span>Gross Profit:</span>
                        <span className="text-emerald-700 font-black">
                          ₹{((task.patient_charge || task.final_patient_bill_amount || 3500) - (task.supplier_cost || task.vendor_invoice_amount || 0)).toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={() => handleOpenFinalizeModal(task)}
                      className={`w-full py-2 px-3 text-xs font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 ${isReady ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                    >
                      {isReady ? <ShieldCheck className="w-4 h-4" /> : null}
                      {isReady ? "Update Finalized Bill" : "Verify Invoice & Mark Bill Ready ↗"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {activeAccountantTab === "invoices" && (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
        {/* Create Invoice Form */}
        <form onSubmit={handleCreateInvoice} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Create Dental Invoice</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
            <input
              type="text"
              placeholder="e.g. Aby Thomas"
              value={form.patient}
              onChange={(e) => setForm(prev => ({ ...prev, patient: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Treatment / Procedure</label>
            <select
              value={form.procedure}
              onChange={handleProcedureChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary bg-white"
            >
              {procedures.map(p => (
                <option key={p.name} value={p.name}>{p.name} (₹{p.fee})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Invoice Amount (₹)</label>
            <input
              type="number"
              value={form.customAmount}
              onChange={(e) => setForm(prev => ({ ...prev, customAmount: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-primary text-white font-extrabold text-sm rounded-xl hover:bg-primary/90 transition-all cursor-pointer"
          >
            Create Invoice Draft
          </button>
        </form>

        {/* Existing Invoices List */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Recent Dental Invoices</h3>

          <div className="divide-y divide-gray-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-900">{inv.patient}</p>
                  <p className="text-xs text-gray-400">{inv.id} • {inv.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900">{inv.amount}</p>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Accountant Finalize Bill Modal */}
      {billModalOpen && selectedTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 font-sans text-left">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-indigo-50/50">
              <div>
                <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest">Financial Control</span>
                <h2 className="text-lg font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                  <span>💳</span> Finalize Patient Bill for #{selectedTask.id}
                </h2>
              </div>
              <button 
                onClick={() => setBillModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-2 hover:bg-gray-100 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFinalizeSubmit} className="p-6 space-y-4">
              <div className="bg-gray-50 border border-gray-150 rounded-xl p-3.5 space-y-1 text-xs">
                <p className="font-bold text-gray-900">Patient: <span className="font-semibold text-gray-700">{selectedTask.patientName || selectedTask.patient_name}</span></p>
                <p className="font-bold text-gray-900">Doctor: <span className="font-semibold text-gray-700">{selectedTask.dentistName || selectedTask.dentist_name}</span></p>
                <p className="font-bold text-gray-900">Procedure: <span className="font-semibold text-indigo-700">{selectedTask.prostheticType || selectedTask.orderCategory}</span></p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">External Lab Invoice #</label>
                <input 
                  type="text" 
                  required
                  value={finalizeFormData.vendor_invoice_number}
                  onChange={(e) => setFinalizeFormData({ ...finalizeFormData, vendor_invoice_number: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-semibold text-gray-800"
                  placeholder="e.g. APEX-INV-9921"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">External Lab Vendor Cost (₹)</label>
                <input 
                  type="number" 
                  required
                  value={finalizeFormData.vendor_invoice_amount}
                  onChange={(e) => setFinalizeFormData({ ...finalizeFormData, vendor_invoice_amount: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-xs font-semibold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Finalized Patient Payable Bill Amount (₹)</label>
                <input 
                  type="number" 
                  required
                  value={finalizeFormData.final_patient_bill_amount}
                  onChange={(e) => setFinalizeFormData({ ...finalizeFormData, final_patient_bill_amount: e.target.value })}
                  className="w-full px-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm font-black text-emerald-800"
                />
                <p className="text-[10px] text-gray-400 mt-1">This approved amount will be displayed (read-only) to the receptionist for patient billing & communication.</p>
              </div>

              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-[11px] font-medium text-indigo-900 flex items-start gap-2">
                <span className="shrink-0 text-sm">✅</span>
                <p>Once saved, status changes to <strong>Bill Ready</strong>. The receptionist will be notified to proceed with patient contact and fitting scheduling.</p>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setBillModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 text-xs font-extrabold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-1.5"
                >
                  Mark Bill Ready ↗
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
