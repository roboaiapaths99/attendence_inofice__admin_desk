import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Calendar, Clock, Percent, ShieldAlert, Monitor, 
  Terminal, ShieldCheck, Video, Eye, RefreshCw, Loader2, Play, Square, ExternalLink, Camera, Power
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from "recharts";
import api from "../utils/api";
import { formatToIST } from "../utils/dateUtils";

export default function WFHEmployeeDetail() {
  const { email } = useParams();
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [timeline, setTimeline] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [activity, setActivity] = useState([]);
  const [apps, setApps] = useState([]);
  const [productivity, setProductivity] = useState([]);
  const [tasks, setTasks] = useState([]);
  
  // Assign task state
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("medium");
  const [assigningTask, setAssigningTask] = useState(false);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const [toast, setToast] = useState(null);
  const [triggeringScreenshot, setTriggeringScreenshot] = useState(false);

  const handleTriggerScreenshot = async () => {
    setTriggeringScreenshot(true);
    setToast({ text: `Dispatching live screen capture command for ${email}...`, type: "info" });
    try {
      await api.post(`/admin/wfh/employee/${email}/trigger-screenshot`);
      setToast({ text: `Live screen capture command dispatched! Vault will auto-refresh.`, type: "success" });
      setTimeout(() => {
        fetchDetailData(true);
      }, 5000);
    } catch (err) {
      console.error("Failed to trigger screenshot:", err);
      setToast({ text: `Screenshot trigger failed: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setTriggeringScreenshot(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const [showForceEndModal, setShowForceEndModal] = useState(false);
  const [forceEndReason, setForceEndReason] = useState("");
  const [endingSession, setEndingSession] = useState(false);

  const handleForceEndSession = async () => {
    setEndingSession(true);
    setToast({ text: `Force-ending WFH session for ${email}...`, type: "info" });
    try {
      await api.post(`/admin/wfh/employee/${email}/force-end`, { reason: forceEndReason });
      setToast({ text: `WFH session force-ended successfully.`, type: "success" });
      setShowForceEndModal(false);
      setForceEndReason("");
      fetchDetailData(true);
    } catch (err) {
      console.error("Failed to force end session:", err);
      setToast({ text: `Failed to end session: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setEndingSession(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const [showForceLogoutModal, setShowForceLogoutModal] = useState(false);
  const [loggingOutEmployee, setLoggingOutEmployee] = useState(false);

  const handleForceLogoutEmployee = async () => {
    setLoggingOutEmployee(true);
    setToast({ text: `Force-logging out employee ${email}...`, type: "info" });
    try {
      await api.post(`/admin/wfh/employee/${email}/force-logout`);
      setToast({ text: `Force-logout command dispatched successfully!`, type: "success" });
      setShowForceLogoutModal(false);
      fetchDetailData(true);
    } catch (err) {
      console.error("Failed to force logout employee:", err);
      setToast({ text: `Failed to force logout: ${err.response?.data?.detail || err.message}`, type: "error" });
    } finally {
      setLoggingOutEmployee(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  const fetchDetailData = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [timelineRes, shotRes, actRes, appRes, prodRes, taskRes] = await Promise.all([
        api.get(`/admin/wfh/employee/${email}/timeline?date=${selectedDate}`),
        api.get(`/admin/wfh/employee/${email}/screenshots?date=${selectedDate}`),
        api.get(`/admin/wfh/employee/${email}/activity?date=${selectedDate}`),
        api.get(`/admin/wfh/employee/${email}/apps?date=${selectedDate}`),
        api.get(`/admin/wfh/employee/${email}/productivity?date=${selectedDate}`),
        api.get(`/admin/wfh/employee/${email}/tasks`)
      ]);

      setTimeline(timelineRes.data || []);
      setScreenshots(shotRes.data || []);
      setActivity(actRes.data || []);
      setTasks(taskRes.data || []);
      
      // Parse app lists
      const parsedApps = [];
      if (appRes.data && appRes.data.length > 0) {
        // Aggregate app data
        appRes.data.forEach(batch => {
          if (batch.apps) {
            batch.apps.forEach(app => {
              const existing = parsedApps.find(a => a.name === app.name);
              if (existing) {
                existing.value += Math.round(app.duration_seconds / 60);
              } else {
                parsedApps.push({
                  name: app.name,
                  value: Math.round(app.duration_seconds / 60),
                  category: (app.category || app.status || "neutral").toLowerCase()
                });
              }
            });
          }
        });
      }
      setApps(parsedApps.sort((a, b) => b.value - a.value).slice(0, 5));

      // Parse productivity score timeline
      const parsedProd = (prodRes.data || []).map(item => ({
        time: formatToIST(item.timestamp, { hour: "2-digit", minute: "2-digit" }),
        score: item.score
      }));
      setProductivity(parsedProd);

    } catch (err) {
      console.error("Error loading WFH Employee Detail details:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, selectedDate]);

  useEffect(() => {
    fetchDetailData();
  }, [fetchDetailData]);

  const handleAssignTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setAssigningTask(true);
    try {
      await api.post(`/admin/wfh/employee/${email}/tasks`, {
        title: newTaskTitle.trim(),
        description: newTaskDesc.trim(),
        priority: newTaskPriority
      });
      setNewTaskTitle("");
      setNewTaskDesc("");
      setNewTaskPriority("medium");
      
      // Reload tasks
      const taskRes = await api.get(`/admin/wfh/employee/${email}/tasks`);
      setTasks(taskRes.data || []);
    } catch (err) {
      console.error("Failed to assign task:", err);
    } finally {
      setAssigningTask(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  // Define colors for App classification category
  const getCategoryColor = (category) => {
    if (category === "productive") return "#10b981"; // Emerald
    if (category === "unproductive") return "#ef4444"; // Rose
    return "#64748b"; // Neutral slate
  };

  return (
    <div className="space-y-8">
      
      {/* Header section with Date Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/dashboard/wfh-live")}
            className="p-2 border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-all active:scale-95"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Timeline Auditor</h1>
            <p className="text-slate-400 text-xs mt-1">Deep-dive productivity tracking and screen vault audit for {email}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Calendar size={16} />
            </span>
            <input 
              type="date"
              className="bg-slate-900 border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-white focus:border-indigo-500 outline-none w-44 transition-all"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          <button 
            onClick={handleTriggerScreenshot}
            disabled={triggeringScreenshot}
            className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-500/10 flex items-center gap-2"
            title="Trigger Live Workstation Screenshot"
          >
            {triggeringScreenshot ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Camera size={14} />
            )}
            {triggeringScreenshot ? "Capturing..." : "Trigger Live Screenshot"}
          </button>
          <button 
            onClick={() => setShowForceEndModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-500/10 flex items-center gap-2"
            title="Force-End Active WFH Session"
          >
            <Power size={14} />
            Force End Session
          </button>
          <button 
            onClick={() => setShowForceLogoutModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-amber-500/10 flex items-center gap-2"
            title="Force-Logout Employee Workspace"
          >
            <Power size={14} />
            Force Logout Employee
          </button>
          <button 
            onClick={() => fetchDetailData(true)}
            className="p-2 border border-slate-800 rounded-xl bg-slate-900/40 hover:bg-slate-900 text-slate-400 hover:text-white transition-all"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Grid containing Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Productivity Score Trend Area Chart */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-bold text-white tracking-tight mb-6">Productivity Performance Loop</h2>
          <div className="h-[250px] w-full">
            {productivity.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productivity}>
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                  <Area type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                No productivity metrics recorded on this day.
              </div>
            )}
          </div>
        </div>

        {/* Top Productive Apps Bar Chart */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20">
          <h2 className="text-xl font-bold text-white tracking-tight mb-6">Top Applications</h2>
          <div className="h-[250px] w-full">
            {apps.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={apps} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#f8fafc', fontSize: 10 }} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', color: '#f8fafc' }} />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={15}>
                    {apps.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getCategoryColor(entry.category)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                No active processes logged on this day.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Task Auditor & Assigner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Tasks List */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Assigned Tasks & Time Tracking</h2>
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
              {tasks.length} Active Tasks
            </span>
          </div>
          
          <div className="space-y-4 max-h-[350px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
            {tasks.map((task) => (
              <div key={task._id} className="bg-slate-950/40 border border-slate-900/80 p-4.5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:border-slate-800">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[8px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                      task.priority === "high" ? "bg-rose-500/10 text-rose-400 border-rose-500/25" :
                      task.priority === "medium" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/25" :
                      "bg-slate-800 text-slate-400 border-slate-700/60"
                    }`}>
                      {task.priority} Priority
                    </span>
                    <span className={`text-[8px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      task.status === "completed" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                      task.status === "in_progress" ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse" :
                      "bg-slate-900 border-slate-800 text-slate-400"
                    }`}>
                      {task.status?.replace("_", " ")}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                  {task.description && (
                    <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">{task.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-4 shrink-0 text-right">
                  <div>
                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Time Spent</span>
                    <span className="text-xs font-mono font-extrabold text-indigo-400 block mt-0.5">
                      {task.worked_minutes || 0} minutes
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {tasks.length === 0 && (
              <div className="text-center py-12 text-slate-600 text-xs">
                No tasks assigned to this employee.
              </div>
            )}
          </div>
        </div>

        {/* Task Assigner Form */}
        <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-6">Assign New Task</h2>
            <form onSubmit={handleAssignTask} className="space-y-4 text-xs font-semibold text-slate-400">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Task Title</label>
                <input 
                  type="text"
                  required
                  placeholder="E.g. Code auth route tests"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Priority Weight</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none cursor-pointer"
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value)}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase tracking-wider">Description (Optional)</label>
                <textarea 
                  rows={2}
                  placeholder="Task specifications..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white focus:border-indigo-500 outline-none resize-none"
                  value={newTaskDesc}
                  onChange={(e) => setNewTaskDesc(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={assigningTask || !newTaskTitle.trim()}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-2xl font-bold uppercase tracking-wider transition-all active:scale-[0.97]"
              >
                {assigningTask ? "Assigning Task..." : "Assign Task Card"}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Screen vault gallery */}
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20">
        <h2 className="text-xl font-bold text-white tracking-tight mb-6">Screen Vault (Screenshots)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {screenshots.map((shot) => (
            <div 
              key={shot._id} 
              className="relative group rounded-2xl border border-slate-800 overflow-hidden bg-slate-950 cursor-zoom-in aspect-video shadow-md hover:border-slate-600 transition-all"
              onClick={() => setLightboxImage(shot.image_url?.startsWith('http') ? shot.image_url : `${api.defaults.baseURL || "http://localhost:8000"}${shot.image_url}`)}
            >
              <img src={shot.image_url?.startsWith('http') ? shot.image_url : `${api.defaults.baseURL || "http://localhost:8000"}${shot.image_url}`} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="text-[10px] text-white font-bold tracking-widest uppercase bg-slate-950/90 px-3 py-1 rounded-full border border-slate-700">Audit</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 p-2 flex justify-between items-center gap-1">
                <span className="text-[9px] text-slate-300 font-bold truncate max-w-[60%]">{shot.active_app || "Unknown app"}</span>
                <span className="text-[9px] text-indigo-400 font-mono font-bold shrink-0">{formatToIST(shot.timestamp, { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}

          {screenshots.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-600 text-xs">
              No desktop screenshot captures recorded on this day.
            </div>
          )}
        </div>
      </div>

      {/* Interactive Activity timeline */}
      <div className="bg-slate-900/40 border border-slate-800 p-8 rounded-[2rem] shadow-xl shadow-slate-950/20">
        <h2 className="text-xl font-bold text-white tracking-tight mb-6">Workday Activity Feed</h2>
        <div className="space-y-6 max-h-[400px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-800">
          {timeline.map((event, i) => (
            <div key={event.data._id || i} className="flex gap-4 items-start group">
              <div className="text-xs text-slate-500 font-bold w-24 shrink-0 pt-0.5 font-mono">
                {event.timestamp ? formatToIST(event.timestamp, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "N/A"}
              </div>
              
              <div className="flex-1 space-y-1">
                {event.type === "screenshot" && (
                  <p className="text-xs font-bold text-slate-200">
                    Screenshot trigger: <span className="text-indigo-400">{event.data.active_app}</span> - {event.data.active_window}
                  </p>
                )}
                {event.type === "activity" && (
                  <p className="text-xs font-bold text-slate-300">
                    Hardware Activity Check: <span className="text-emerald-400">{event.data.keystrokes} keystrokes</span> • {event.data.mouse_clicks} clicks
                  </p>
                )}
                {event.type === "alert" && (
                  <div className="bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl max-w-fit">
                    <span className="text-[10px] font-bold text-rose-400 block uppercase tracking-wider mb-0.5">Critical: {event.data.alert_type}</span>
                    <p className="text-xs font-bold text-slate-300">{event.data.details}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {timeline.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-xs">
              No workflow activity records matching this date.
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Lightbox Modal */}
      {lightboxImage && (() => {
        const activeShot = screenshots.find(s => {
          const shotUrl = s.image_url?.startsWith('http') ? s.image_url : `${api.defaults.baseURL || "http://localhost:8000"}${s.image_url}`;
          return shotUrl === lightboxImage;
        });
        return (
          <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
            onClick={() => setLightboxImage(null)}
          >
            {activeShot && (
              <div className="bg-slate-900/90 border border-slate-800 px-5 py-2.5 rounded-full text-xs font-bold text-slate-200 mb-3 flex items-center gap-3 backdrop-blur-md shadow-lg">
                <span className="text-indigo-400">{activeShot.active_app || "Unknown App"}</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 truncate max-w-xs">{activeShot.active_window || "Active window"}</span>
                <span className="text-slate-600">•</span>
                <span className="text-indigo-400 font-mono">{formatToIST(activeShot.timestamp, { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
              </div>
            )}
            <img src={lightboxImage} alt="" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl border border-slate-850" />
          </div>
        );
      })()}
      {/* Force End Confirmation Modal */}
      {showForceEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Force End Session</h3>
              <p className="text-slate-400 text-xs mt-1">
                Are you sure you want to remotely terminate the WFH monitoring session for <strong className="text-white">{email}</strong>? This will immediately log them out of monitoring.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">Reason for termination</label>
              <textarea 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-600 focus:border-rose-500 outline-none h-20 transition-all resize-none"
                placeholder="e.g. Inactivity detected, policy violation, etc."
                value={forceEndReason}
                onChange={(e) => setForceEndReason(e.target.value)}
              />
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setShowForceEndModal(false);
                  setForceEndReason("");
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleForceEndSession}
                disabled={endingSession}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-semibold text-white transition-all"
              >
                {endingSession ? "Ending..." : "Confirm & End"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Force Logout Confirmation Modal */}
      {showForceLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-[2rem] max-w-md w-full p-6 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-lg font-bold text-white">Force Logout Employee</h3>
              <p className="text-slate-400 text-xs mt-1">
                Are you sure you want to force-logout <strong className="text-white">{email}</strong>? 
                This will immediately log them out of the desktop tracking app and end their monitoring session.
              </p>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setShowForceLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleForceLogoutEmployee}
                disabled={loggingOutEmployee}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-semibold text-white transition-all"
              >
                {loggingOutEmployee ? "Logging out..." : "Confirm & Logout"}
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
            ? "bg-indigo-950/80 border-indigo-500/30 text-indigo-200 shadow-indigo-950/20"
            : "bg-emerald-950/80 border-emerald-500/30 text-emerald-200 shadow-emerald-950/20"
        }`}>
          {toast.type === "error" ? (
            <div className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
              <span className="font-bold text-xs">!</span>
            </div>
          ) : toast.type === "info" ? (
            <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <span className="font-bold text-xs">i</span>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <span className="font-bold text-xs">✓</span>
            </div>
          )}
          <div className="text-xs font-bold leading-normal">{toast.text}</div>
          <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white ml-2 text-xs font-semibold shrink-0">
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
