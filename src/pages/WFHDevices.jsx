import React, { useEffect, useState, useCallback } from "react";
import { 
  Laptop, CheckCircle, XCircle, Clock, Trash2, 
  RefreshCw, Search, Loader2, ShieldCheck, AlertCircle
} from "lucide-react";
import api from "../utils/api";
import { formatToIST } from "../utils/dateUtils";

export default function WFHDevices() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDevices = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get("/admin/wfh/devices");
      setDevices(res.data || []);
    } catch (err) {
      console.error("Error loading WFH devices:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const approveDevice = async (id) => {
    try {
      await api.post(`/admin/wfh/devices/${id}/approve`);
      loadDevices();
    } catch (err) {
      console.error("Failed to approve device:", err);
    }
  };

  const revokeDevice = async (id) => {
    try {
      await api.post(`/admin/wfh/devices/${id}/revoke`, {
        reason: "Revoked by Administrator"
      });
      loadDevices();
    } catch (err) {
      console.error("Failed to revoke device:", err);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const filteredDevices = devices.filter(device => 
    device.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.employee_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    device.hostname?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header sections */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Workstation Clearances</h1>
          <p className="text-slate-400 text-xs mt-1">Approve or revoke WFH hardware desktop fingerprints for employees.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search size={16} />
            </span>
            <input 
              className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-500 focus:border-indigo-500 outline-none w-56 transition-all"
              placeholder="Search employee or host..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={() => loadDevices(true)}
            className="p-2 border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Card Table Container */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-[2rem] overflow-hidden shadow-xl shadow-slate-950/20">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500 font-bold bg-slate-950/40">
                <th className="py-4 px-6">Workstation / Owner</th>
                <th className="py-4 px-6">Platform / Host</th>
                <th className="py-4 px-6">MAC Address / Device ID</th>
                <th className="py-4 px-6">Registered</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-slate-800/50 text-xs">
              {filteredDevices.map((device) => (
                <tr key={device._id} className="hover:bg-slate-950/25 transition-colors group">
                  
                  {/* Owner */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-colors rounded-xl border border-slate-700/50">
                        <Laptop size={16} />
                      </div>
                      <div>
                        <span className="font-bold text-white block">{device.employee_name}</span>
                        <span className="text-[10px] text-slate-500 block">{device.employee_email}</span>
                      </div>
                    </div>
                  </td>

                  {/* OS / Host */}
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-300 block">{device.hostname}</span>
                    <span className="text-[10px] text-slate-500 block">{device.os_info}</span>
                  </td>

                  {/* Hardware details */}
                  <td className="py-4 px-6 font-mono text-[10px] text-slate-400">
                    <span className="block">{device.mac_address || "N/A"}</span>
                    <span className="text-[9px] text-slate-600 block truncate max-w-[150px]" title={device.device_id}>
                      ID: {device.device_id}
                    </span>
                  </td>

                  {/* Registration timestamp */}
                  <td className="py-4 px-6 text-slate-400">
                    {device.registered_at ? formatToIST(device.registered_at, { dateStyle: "short", timeStyle: "short" }) : "N/A"}
                  </td>

                  {/* Status badge */}
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                      device.status === "approved" 
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                        : device.status === "pending" 
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                        : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                    }`}>
                      {device.status}
                    </span>
                  </td>

                  {/* Operations actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {device.status !== "approved" && (
                        <button 
                          onClick={() => approveDevice(device._id)}
                          className="px-3 py-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-400 font-bold transition-all text-[10px] uppercase flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                      )}
                      
                      {device.status !== "revoked" && (
                        <button 
                          onClick={() => revokeDevice(device._id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 font-bold transition-all text-[10px] uppercase flex items-center gap-1.5 active:scale-95"
                        >
                          <XCircle size={12} /> Revoke
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredDevices.length === 0 && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 bg-slate-950/10 border-t border-slate-800">
                    <AlertCircle size={36} className="mx-auto mb-3 text-slate-700" />
                    <p className="text-sm">No workstation signatures match your query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}