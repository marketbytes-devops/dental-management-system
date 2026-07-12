"use client";

import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Loader2, CheckCircle, XCircle, Eye } from "lucide-react";
import client from "@/services/api"; // Axios client

export default function ProceduresPage() {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [currentProc, setCurrentProc] = useState(null);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState("");
  const [specialty, setSpecialty] = useState("General Dentistry");
  const [isActive, setIsActive] = useState(true);
  const [hasSubProcedures, setHasSubProcedures] = useState(false);
  const [subProcedures, setSubProcedures] = useState([{ name: "", rate: "" }]);

  const handleAddSubProcField = () => {
    setSubProcedures(prev => [...prev, { name: "", rate: "" }]);
  };

  const handleRemoveSubProcField = (index) => {
    setSubProcedures(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubProcChange = (index, field, value) => {
    setSubProcedures(prev => prev.map((sub, i) => {
      if (i === index) {
        return { ...sub, [field]: value };
      }
      return sub;
    }));
  };

  const fetchProcedures = async () => {
    setLoading(true);
    try {
      const res = await client.get("/procedures");
      setProcedures(res.data);
    } catch (err) {
      console.error("Failed to fetch procedures", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProcedures();
  }, []);

  const openModal = (proc = null) => {
    setCurrentProc(proc);
    if (proc) {
      setName(proc.name);
      setDescription(proc.description || "");
      setRate(proc.rate.toString());
      setSpecialty(proc.specialty || "General Dentistry");
      setIsActive(proc.is_active);
      setHasSubProcedures(false);
      setSubProcedures([{ name: "", rate: "" }]);
    } else {
      setName("");
      setDescription("");
      setRate("");
      setSpecialty("General Dentistry");
      setIsActive(true);
      setHasSubProcedures(false);
      setSubProcedures([{ name: "", rate: "" }]);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsViewModalOpen(false);
    setCurrentProc(null);
  };

  const openViewModal = (proc) => {
    setCurrentProc(proc);
    setIsViewModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentProc) {
        // Edit mode (simple edit)
        const payload = {
          name,
          description,
          rate: parseFloat(rate) || 0.0,
          parent_id: currentProc.parent_id,
          is_active: isActive
        };
        await client.put(`/procedures/${currentProc.id}`, payload);
      } else {
        // Create mode
        const parentPayload = {
          name,
          description,
          rate: hasSubProcedures ? 0.0 : (parseFloat(rate) || 0.0),
          parent_id: null,
          is_active: isActive
        };
        const res = await client.post("/procedures", parentPayload);
        
        if (hasSubProcedures && res.data.id) {
          const createdParentId = res.data.id;
          const childPromises = subProcedures
            .filter(sub => sub.name.trim() !== "")
            .map(sub => {
              const childPayload = {
                name: `${name} - ${sub.name.trim()}`,
                description: `Option for ${name}`,
                rate: parseFloat(sub.rate) || 0.0,
                parent_id: createdParentId,
                is_active: true
              };
              return client.post("/procedures", childPayload);
            });
          await Promise.all(childPromises);
        }
      }
      closeModal();
      fetchProcedures();
    } catch (err) {
      console.error("Failed to save procedure", err);
      alert("Failed to save procedure");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this procedure?")) return;
    try {
      await client.delete(`/procedures/${id}`);
      fetchProcedures();
    } catch (err) {
      console.error("Failed to delete procedure", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Procedures & Rates Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Manage standard procedures and base billing rates.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" /> Add Procedure
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-10 flex justify-center text-primary">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs tracking-wider border-b border-gray-150">
              <tr>
                <th className="p-4">Procedure Name</th>
                <th className="p-4">Specialty</th>
                <th className="p-4">Description</th>
                <th className="p-4 text-right">Standard Rate (₹)</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {procedures.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 font-semibold">
                    No procedures found. Click "Add Procedure" to start.
                  </td>
                </tr>
              ) : (
                procedures.map(proc => (
                  <tr key={proc.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-bold text-gray-800">{proc.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100 animate-in fade-in duration-200">
                        {proc.specialty || "General Dentistry"}
                      </span>
                    </td>
                    <td className="p-4 text-gray-605 truncate max-w-[200px]">{proc.description}</td>
                    <td className="p-4 text-right font-bold text-primary">₹{proc.rate.toFixed(2)}</td>
                    <td className="p-4 text-center">
                      {proc.is_active ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                          <XCircle className="w-3 h-3" /> Inactive
                        </span>
                      )}
                    </td>
                    <td className="p-4 flex justify-center gap-2">
                      <button 
                        onClick={() => openViewModal(proc)}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => openModal(proc)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Procedure"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(proc.id)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Procedure"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-black text-gray-900">{currentProc ? "Edit Procedure" : "New Procedure"}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-left overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Procedure Name</label>
                <input 
                  required
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="e.g. Braces"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Description (Optional)</label>
                <textarea 
                  rows="2"
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Short description of the procedure"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Clinical Specialty</label>
                <select 
                  value={specialty} 
                  onChange={e => setSpecialty(e.target.value)} 
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-xs font-semibold text-gray-700"
                >
                  <option value="General Dentistry">General Dentistry</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Endodontics">Endodontics</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                  <option value="Periodontics">Periodontics</option>
                  <option value="Prosthodontics">Prosthodontics</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Standard Rate (₹)</label>
                <input 
                  required={!hasSubProcedures}
                  disabled={hasSubProcedures}
                  type="number" 
                  min="0"
                  step="0.01"
                  value={hasSubProcedures ? "0" : rate} 
                  onChange={e => setRate(e.target.value)} 
                  className={`w-full px-3 py-2 border rounded-xl focus:ring-2 outline-none ${
                    hasSubProcedures 
                      ? "bg-gray-100 border-gray-200 text-gray-400 focus:ring-transparent cursor-not-allowed" 
                      : "bg-gray-50 border-gray-200 focus:ring-primary/20 focus:border-primary"
                  }`}
                  placeholder={hasSubProcedures ? "N/A (Derived from options)" : "e.g. 5000"}
                />
              </div>



              {!currentProc && (
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      id="hasSubProcedures"
                      checked={hasSubProcedures}
                      onChange={e => {
                        setHasSubProcedures(e.target.checked);
                        if (e.target.checked) {
                          setRate("0");
                        }
                      }}
                      className="w-4 h-4 text-primary rounded focus:ring-primary cursor-pointer"
                    />
                    <label htmlFor="hasSubProcedures" className="text-xs font-bold text-gray-700 cursor-pointer select-none">
                      This procedure has multiple options / sub-types (e.g. Braces)
                    </label>
                  </div>

                  {hasSubProcedures && (
                    <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Sub-Procedures / Options</span>
                        <button 
                          type="button"
                          onClick={handleAddSubProcField}
                          className="text-[10px] bg-primary text-white font-bold px-2 py-1 rounded-md hover:bg-primary/95 transition-all cursor-pointer"
                        >
                          + Add Option
                        </button>
                      </div>

                      <div className="space-y-2.5 max-h-[180px] overflow-y-auto pr-1">
                        {subProcedures.map((sub, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <input 
                              required
                              type="text"
                              value={sub.name}
                              placeholder="e.g. Metal"
                              onChange={e => handleSubProcChange(index, "name", e.target.value)}
                              className="flex-1 min-w-0 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary text-gray-800"
                            />
                            <input 
                              required
                              type="number"
                              min="0"
                              step="0.01;any"
                              value={sub.rate}
                              placeholder="Price (₹)"
                              onChange={e => handleSubProcChange(index, "rate", e.target.value)}
                              className="w-24 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-primary text-gray-800"
                            />
                            {subProcedures.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => handleRemoveSubProcField(index)}
                                className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={e => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <label htmlFor="isActive" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Available in Catalog
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 shrink-0">
                <button type="button" onClick={closeModal} className="px-4 py-2 font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 shadow-sm transition-all cursor-pointer">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isViewModalOpen && currentProc && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center">
              <h2 className="text-lg font-black text-gray-900">Procedure Details</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700 cursor-pointer">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 text-left">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Procedure Name</label>
                <div className="text-sm font-bold text-gray-800">{currentProc.name}</div>
              </div>

              {currentProc.parent_id && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Parent Procedure</label>
                  <div className="text-sm font-bold text-gray-850">
                    {procedures.find(p => p.id === currentProc.parent_id)?.name || `ID: ${currentProc.parent_id}`}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Clinical Specialty</label>
                <div className="text-sm font-semibold text-gray-800">
                  {currentProc.specialty || "General Dentistry"}
                </div>
              </div>
              
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Description</label>
                <div className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-xl border border-gray-100">
                  {currentProc.description || "No description provided."}
                </div>
              </div>

              <div className="flex gap-8">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Standard Rate</label>
                  <div className="text-lg font-black text-primary">₹{currentProc.rate.toFixed(2)}</div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                  <div className="mt-1">
                    {currentProc.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">
                        <CheckCircle className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-0.5 rounded-full">
                        <XCircle className="w-3 h-3" /> Inactive
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button onClick={closeModal} className="px-6 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all cursor-pointer">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
