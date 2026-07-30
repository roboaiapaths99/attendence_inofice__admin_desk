import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, Activity, Percent, ShieldAlert, Monitor, 
  Clock, ArrowUpRight, Search, RefreshCw, Loader2, ArrowRight, Camera, Power
} from "lucide-react";
import api from "../utils/api";
import { formatToIST } from "../utils/dateUtils";

export default function WFHLive() {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const [toast, setToast] = useState(null);
  const [triggeringMap, setTriggeringMap] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedEmpForForceEnd, setSelectedEmpForForceEnd] = useState(null);
  const [forceEndReason, setForceEndReason] = useState("");
  const [endingMap, setEndingMap] = useState({});

  const handleForceEndSession = async () => {
    if (!selectedEmpForForceEnd) return;
    const email = selectedEmpForForceEnd;
    setEndingMap(prev => ({ ...prev, [email]: true }));
    setToast({ text: `Force-ending WFH session for ${email}...`, type: "info" });
    try {
      await api.post(`/admin/wfh/employee/${email}/force-end`, { reason: forceEndReason });
      setToast({ text: `WFH session force-ended successfully for ${email}.`, type: "success" });
      setShowConfirmModal(false);
      setForceEndReason("");
      setSelectedEmpForForceEnd(null);
      loadLiveData(true);
    } catch (err) {
      console.error("Failed to force end session:", err);
      setToast({ text: `Failed to end session: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setEndingMap(prev => ({ ...prev, [email]: false }));
      setTimeout(() => setToast(null), 5000);
    }
  };

  const handleTriggerScreenshot = async (email) => {
    setTriggeringMap(prev => ({ ...prev, [email]: true }));
    setToast({ text: `Dispatching live screen capture command for ${email}...`, type: "info" });
    try {
      await api.post(`/admin/wfh/employee/${email}/trigger-screenshot`);
      setToast({ text: `Live screen capture command dispatched! Workstation feed will auto-refresh soon.`, type: "success" });
      setTimeout(() => {
        loadLiveData(true);
      }, 5000);
    } catch (err) {
      console.error("Failed to trigger screenshot:", err);
      setToast({ text: `Screenshot trigger failed: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setTriggeringMap(prev => ({ ...prev, [email]: false }));
      setTimeout(() => setToast(null), 5000);
    }
  };

  const loadLiveData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [liveRes, statsRes] = await Promise.all([
        api.get("/admin/wfh/live-view"),
        api.get("/admin/wfh/stats")
      ]);
      setEmployees(liveRes.data || []);
      setStats(statsRes.data || null);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Error loading WFH Live view:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(() => {
      loadLiveData(false);
    }, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, []);

  const handleManualRefresh = () => {
    loadLiveData(true);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.employee_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-[#004B87]" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">WFH Live Command</h1>
          <p className="text-slate-500 text-xs mt-1">
            Real-time visual monitoring feed of remote workforce workstations.
            <span className="ml-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
              {refreshing ? "Refreshing..." : `Sync: ${formatToIST(lastUpdated, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search size={16} />
            </span>
            <input 
              className="bg-white border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-900 placeholder-slate-500 focus:border-[#004B87] outline-none w-56 transition-all"
              placeholder="Search active staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={handleManualRefresh}
            className="p-2 border border-slate-200 rounded-xl bg-white hover:bg-white text-slate-500 hover:text-slate-900 transition-all"
            title="Force refresh metrics"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-[#004B87]/10 border border-[#004B87]/20 text-[#0062B1] rounded-2xl">
              <Users size={20} />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Remote Workforce</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{stats?.wfh_employees || 0} Employees</h3>
        </div>

        <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
              <Activity size={20} className="animate-pulse" />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Active Sessions</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{stats?.active_sessions || 0} Live Now</h3>
        </div>

        <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-amber-500/10 border border-[#004B87]/20 text-[#0062B1] rounded-2xl">
              <Percent size={20} />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Avg Productivity</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{stats?.avg_productivity || 0}% Today</h3>
        </div>

        <div className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-3xl">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl">
              <ShieldAlert size={20} />
            </div>
          </div>
          <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Pending Alerts</p>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">{stats?.pending_alerts || 0} Triggered</h3>
        </div>
      </div>

      {/* Employees Grid Feed */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((emp) => (
          <div 
            key={emp.session_id} 
            className="bg-white backdrop-blur-md border border-slate-200 p-6 rounded-[2rem] flex flex-col justify-between group hover:border-slate-300 transition-all shadow-xl shadow-slate-950/20"
          >
            <div className="space-y-4">
              
              {/* Card Header info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xs font-black text-slate-600 border border-slate-300">
                  {emp.employee_name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{emp.employee_name}</h4>
                  <span className="text-[10px] text-slate-500 truncate block mt-0.5">{emp.employee_email}</span>
                </div>
                <button 
                  onClick={() => handleTriggerScreenshot(emp.employee_email)}
                  disabled={triggeringMap[emp.employee_email]}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-all disabled:opacity-50"
                  title="Trigger Live Workstation Screenshot"
                >
                  {triggeringMap[emp.employee_email] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Camera size={14} />
                  )}
                </button>
                <button 
                  onClick={() => {
                    setSelectedEmpForForceEnd(emp.employee_email);
                    setShowConfirmModal(true);
                  }}
                  disabled={endingMap[emp.employee_email] || emp.session_id?.startsWith("offline")}
                  className="p-2 border border-rose-950 rounded-xl hover:bg-rose-950/40 text-rose-500 hover:text-rose-400 transition-all disabled:opacity-50"
                  title={emp.session_id?.startsWith("offline") ? "No active session to end" : "Force-End Active Session"}
                >
                  {endingMap[emp.employee_email] ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Power size={14} />
                  )}
                </button>
                <button 
                  onClick={() => navigate(`/dashboard/wfh-employee/${emp.employee_email}`)}
                  className="p-2 border border-slate-200 rounded-xl hover:bg-white text-slate-500 hover:text-slate-900 transition-all"
                  title="Deep-dive timeline"
                >
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Status parameters */}
              <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Uptime</span>
                  <span className="font-bold text-slate-600 flex items-center gap-1.5">
                    <Clock size={12} className="text-[#0062B1]" />
                    {emp.check_in_time ? formatToIST(emp.check_in_time, { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[9px] uppercase tracking-wider mb-0.5">Productivity</span>
                  <span className="font-bold text-[#0062B1]">{emp.productivity_score || 0}%</span>
                </div>
              </div>

              {/* Application name badge */}
              {emp.latest_screenshot && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Active App:</span>
                    <span className="font-bold text-slate-600 truncate max-w-[160px]" title={emp.latest_screenshot.active_window}>
                      {emp.latest_screenshot.active_app}
                    </span>
                  </div>

                  {/* Screenshot thumbnail vault */}
                  <div className="relative rounded-2xl border border-slate-200 overflow-hidden group/img aspect-video bg-slate-50 flex items-center justify-center">
                    <img 
                      src={emp.latest_screenshot.image_url?.startsWith('http') ? emp.latest_screenshot.image_url : `${api.defaults.baseURL || "http://localhost:8000"}${emp.latest_screenshot.image_url}`} 
                      alt="" 
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                      onError={(e) => {
                        e.target.style.display = "none";
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                      <span className="text-[9px] text-slate-500 font-medium">Captured: {formatToIST(emp.latest_screenshot.timestamp, { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center text-slate-600">
            <Monitor size={48} className="mx-auto mb-4 text-slate-700" />
            <p className="text-sm">No remote staff active or checked-in at the moment.</p>
          </div>
        )}
      </div>
      
      {/* Force End Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white border border-slate-200 rounded-[2rem] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Force End Session</h3>
              <p className="text-slate-500 text-xs mt-1">
                Are you sure you want to remotely terminate the WFH monitoring session for <strong className="text-slate-900">{selectedEmpForForceEnd}</strong>? This will immediately log them out of monitoring.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Reason for termination</label>
              <textarea 
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-600 focus:border-rose-500 outline-none h-20 transition-all resize-none"
                placeholder="e.g. Inactivity detected, policy violation, etc."
                value={forceEndReason}
                onChange={(e) => setForceEndReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedEmpForForceEnd(null);
                  setForceEndReason("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200:bg-slate-700 text-xs font-semibold text-slate-600 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleForceEndSession}
                disabled={endingMap[selectedEmpForForceEnd]}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-slate-900 transition-all"
              >
                {endingMap[selectedEmpForForceEnd] ? "Ending..." : "Confirm & End"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl transition-all duration-300 animate-slide-in ${
          toast.type === "error" 
            ? "bg-rose-950/80 border-rose-500/30 text-rose-200 shadow-rose-950/20" 
            : toast.type === "info"
            ? "bg-indigo-950/80 border-[#004B87]/30 text-indigo-200 shadow-indigo-950/20"
            : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20"
        }`}>
          {toast.type === "error" ? (
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <span className="font-bold text-xs">!</span>
            </div>
          ) : toast.type === "info" ? (
            <div className="w-5 h-5 rounded-full bg-[#004B87]/20 flex items-center justify-center text-[#0062B1] shrink-0">
              <span className="font-bold text-xs">i</span>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="font-bold text-xs">✓</span>
            </div>
          )}
          <div className="text-xs font-bold leading-normal">{toast.text}</div>
          <button onClick={() => setToast(null)} className="text-slate-500 hover:text-slate-900 ml-2 text-xs font-semibold shrink-0">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}