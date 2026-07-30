import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Home,
  Users,
  Check,
  X,
  Clock,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  LayoutDashboard,
  FileText,
  Settings,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  UserCheck,
  Building2,
  Laptop,
  Shield,
  Save,
  Eye,
  ChevronDown,
  RefreshCw,
  Wifi,
  WifiOff,
  MonitorSmartphone,
} from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

/* ───────────────────────── helpers ───────────────────────── */

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const DAYS_SHORT = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const fmtMonth = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
const fmtDate  = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

const statusColor = (s) => {
  switch (s) {
    case 'approved':  return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20';
    case 'rejected':  return 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20';
    case 'pending':   return 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20';
    default:          return 'bg-slate-50 dark:bg-slate-500/10 text-slate-650 dark:text-slate-400 border-slate-100 dark:border-slate-500/20';
  }
};

const statusIcon = (s) => {
  switch (s) {
    case 'approved':  return <CheckCircle className="w-3.5 h-3.5" />;
    case 'rejected':  return <XCircle className="w-3.5 h-3.5" />;
    case 'pending':   return <Clock className="w-3.5 h-3.5" />;
    default:          return <AlertCircle className="w-3.5 h-3.5" />;
  }
};

const avatar = (name, size = 'w-9 h-9 text-sm') => {
  const initial = (name || '?')[0].toUpperCase();
  const colors = [
    'from-indigo-500 to-purple-500',
    'from-emerald-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-rose-500 to-pink-500',
    'from-sky-500 to-cyan-500',
    'from-violet-500 to-fuchsia-500',
  ];
  const idx = (name || '').charCodeAt(0) % colors.length;
  return (
    <div className={`${size} rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center font-bold text-white shrink-0 shadow-lg`}>
      {initial}
    </div>
  );
};

/* ───────────────── Animated counter hook ────────────────── */
const useAnimatedCount = (end, duration = 700) => {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (end === 0) { setVal(0); return; }
    let start = 0;
    const step = Math.max(1, Math.ceil(end / (duration / 16)));
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [end, duration]);
  return val;
};

const AnimatedNumber = ({ value }) => {
  const n = useAnimatedCount(value);
  return <>{n}</>;
};

/* ───────────────────────── TABS ─────────────────────────── */
const TABS = [
  { id: 'dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { id: 'requests',  label: 'Requests',   icon: FileText },
  { id: 'calendar',  label: 'Calendar',   icon: Calendar },
  { id: 'policy',    label: 'WFH Policy', icon: Settings },
];

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
const WFHManagement = () => {
  const { admin } = useAuth();
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');

  /* ── shared state ── */
  const [stats, setStats] = useState({ today_wfh: 0, pending_requests: 0, approved_this_month: 0, permanent_wfh: 0 });
  const [requests, setRequests] = useState([]);
  const [todayWfh, setTodayWfh] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [policies, setPolicies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  /* ── filters ── */
  const [requestFilter, setRequestFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [calMonth, setCalMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [policySearch, setPolicySearch] = useState('');

  /* ── modals ── */
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [toast, setToast] = useState(null);

  /* ── policy save tracking ── */
  const [policyChanges, setPolicyChanges] = useState({});
  const [savingPolicy, setSavingPolicy] = useState(false);

  /* ─────────── API Calls ─────────── */

  const showToast = (text, type = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/admin/wfh/stats');
      setStats(res.data);
      if (res.data.today_wfh_list) setTodayWfh(res.data.today_wfh_list);
    } catch (err) {
      console.error('Failed to fetch WFH stats:', err);
    }
  }, []);

  const fetchRequests = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (requestFilter !== 'all') params.append('status', requestFilter);
      params.append('month', fmtMonth(new Date()));
      const res = await api.get(`/admin/wfh/requests?${params.toString()}`);
      setRequests(res.data || []);
    } catch (err) {
      console.error('Failed to fetch WFH requests:', err);
    }
  }, [requestFilter]);

  const fetchCalendar = useCallback(async () => {
    try {
      const res = await api.get(`/admin/wfh/calendar?month=${fmtMonth(calMonth)}`);
      setCalendarData(res.data || {});
    } catch (err) {
      console.error('Failed to fetch WFH calendar:', err);
    }
  }, [calMonth]);

  const fetchPolicies = useCallback(async () => {
    try {
      const res = await api.get('/admin/wfh/policies');
      setPolicies(res.data || []);
    } catch (err) {
      console.error('Failed to fetch WFH policies:', err);
    }
  }, []);

  /* initial load */
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.allSettled([fetchStats(), fetchRequests(), fetchCalendar(), fetchPolicies()]);
      setLoading(false);
    };
    load();
  }, []);

  /* refetch on filter change */
  useEffect(() => { fetchRequests(); }, [requestFilter]);
  useEffect(() => { fetchCalendar(); }, [calMonth]);

  /* ─────────── Actions ─────────── */

  const handleApprove = async (id) => {
    setActionLoading(p => ({ ...p, [id]: 'approve' }));
    try {
      await api.put(`/admin/wfh/requests/${id}/approve`);
      showToast('Request approved successfully');
      fetchRequests();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to approve', 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    const id = rejectModal;
    setActionLoading(p => ({ ...p, [id]: 'reject' }));
    try {
      await api.put(`/admin/wfh/requests/${id}/reject`, { reason: rejectReason });
      showToast('Request rejected');
      setRejectModal(null);
      setRejectReason('');
      fetchRequests();
      fetchStats();
    } catch (err) {
      showToast(err.response?.data?.detail || 'Failed to reject', 'error');
    } finally {
      setActionLoading(p => { const n = { ...p }; delete n[id]; return n; });
    }
  };

  const handlePolicyChange = (email, field, value) => {
    setPolicyChanges(prev => ({
      ...prev,
      [email]: { ...(prev[email] || {}), [field]: value },
    }));
  };

  const savePolicies = async () => {
    setSavingPolicy(true);
    try {
      const entries = Object.entries(policyChanges);
      await Promise.all(
        entries.map(([email, changes]) => {
          const emp = policies.find(p => p.email === email);
          const body = {
            wfh_type: changes.wfh_type ?? emp?.wfh_type ?? 'office',
            allowed_days_per_month: changes.allowed_days_per_month ?? emp?.allowed_days_per_month ?? 0,
          };
          return api.put(`/admin/wfh/policies/${email}`, body);
        })
      );
      showToast(`${entries.length} policy update${entries.length > 1 ? 's' : ''} saved`);
      setPolicyChanges({});
      fetchPolicies();
    } catch (err) {
      showToast('Failed to save policies', 'error');
    } finally {
      setSavingPolicy(false);
    }
  };

  /* ─────────── Filtered data ─────────── */

  const filteredRequests = requests.filter(r => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const name = (r.employee_name || r.name || '').toLowerCase();
      const email = (r.employee_email || r.email || '').toLowerCase();
      if (!name.includes(q) && !email.includes(q)) return false;
    }
    return true;
  });

  const pendingRequests = requests.filter(r => r.status === 'pending');

  const filteredPolicies = policies.filter(p => {
    if (!policySearch) return true;
    const q = policySearch.toLowerCase();
    return (p.name || '').toLowerCase().includes(q) || (p.email || '').toLowerCase().includes(q);
  });

  /* ─────────── Calendar Helpers ─────────── */
  const calYear  = calMonth.getFullYear();
  const calMon   = calMonth.getMonth();
  const firstDay = new Date(calYear, calMon, 1).getDay();
  const daysInMonth = new Date(calYear, calMon + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  const prevMonth = () => setCalMonth(new Date(calYear, calMon - 1, 1));
  const nextMonth = () => setCalMonth(new Date(calYear, calMon + 1, 1));

  const getDayEmployees = (day) => {
    if (!day) return [];
    const key = fmtDate(new Date(calYear, calMon, day));
    return calendarData[key] || [];
  };

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-slate-400 text-sm">Loading WFH Management…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12">
      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-3 rounded-xl shadow-2xl border text-sm font-medium flex items-center gap-2 animate-slide-in
          ${toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
          {toast.type === 'error' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          {toast.text}
        </div>
      )}

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">WFH Management</h1>
            <p className="text-slate-400 text-sm">Manage work-from-home requests, schedules &amp; policies</p>
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-800 mb-8 w-fit">
        {TABS.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300
                ${active
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─────────────────── DASHBOARD TAB ─────────────────── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-fade-in">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Today's WFH",      value: stats.today_wfh || 0,           icon: Laptop,     gradient: 'from-indigo-500 to-blue-600',   bg: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400', ring: 'ring-indigo-100 dark:ring-indigo-500/20' },
              { label: 'Pending Requests',  value: stats.pending_requests || 0,    icon: Clock,      gradient: 'from-amber-500 to-orange-600',  bg: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400', ring: 'ring-amber-100 dark:ring-amber-500/20'  },
              { label: 'Approved (Month)',  value: stats.approved_this_month || 0, icon: CheckCircle, gradient: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400', ring: 'ring-emerald-100 dark:ring-emerald-500/20'},
              { label: 'Permanent WFH',     value: stats.permanent_wfh || 0,       icon: Home,       gradient: 'from-purple-500 to-fuchsia-600',bg: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400', ring: 'ring-purple-100 dark:ring-purple-500/20' },
            ].map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className={`bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300 group shadow-sm dark:shadow-none`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${s.bg} ${s.ring} ring-1`}>
                      Live
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">
                    <AnimatedNumber value={s.value} />
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{s.label}</p>
                </div>
              );
            })}
          </div>

          {/* Two-column: Today's WFH + Pending Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Today's WFH Employees */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <div className="px-6 py-4 border-b border-slate-250 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MonitorSmartphone className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-slate-900 dark:text-white font-semibold">Today's WFH Employees</h3>
                </div>
                <span className="text-xs text-slate-500">{todayWfh.length} employees</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/50 max-h-[400px] overflow-y-auto">
                {todayWfh.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No employees working from home today</p>
                  </div>
                ) : (
                  todayWfh.map((emp, i) => (
                    <div key={i} className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {avatar(emp.name || emp.employee_name)}
                        <div>
                          <p className="text-sm font-medium text-slate-850 dark:text-white">{emp.name || emp.employee_name}</p>
                          <p className="text-xs text-slate-500">{emp.email || emp.employee_email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {emp.checked_in ? (
                          <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-500/20">
                            <Wifi className="w-3 h-3" /> Online
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-550 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                            <WifiOff className="w-3 h-3" /> Not checked in
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Pending Requests Quick Actions */}
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
              <div className="px-6 py-4 border-b border-slate-250 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <h3 className="text-slate-900 dark:text-white font-semibold">Pending Requests</h3>
                </div>
                <span className="text-xs text-amber-600 dark:text-amber-450 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">{pendingRequests.length} pending</span>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/50 max-h-[400px] overflow-y-auto">
                {pendingRequests.length === 0 ? (
                  <div className="py-12 text-center text-slate-500">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">All caught up! No pending requests</p>
                  </div>
                ) : (
                  pendingRequests.slice(0, 10).map((req) => (
                    <div key={req._id || req.id} className="px-6 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {avatar(req.employee_name || req.name)}
                          <div>
                            <p className="text-sm font-medium text-slate-850 dark:text-white">{req.employee_name || req.name}</p>
                            <p className="text-xs text-slate-500">
                              {req.date || req.requested_date} · {req.reason || 'No reason provided'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApprove(req._id || req.id)}
                            disabled={!!actionLoading[req._id || req.id]}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/20 transition-all disabled:opacity-50"
                            title="Approve"
                          >
                            {actionLoading[req._id || req.id] === 'approve'
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Check className="w-4 h-4" />
                            }
                          </button>
                          <button
                            onClick={() => { setRejectModal(req._id || req.id); setRejectReason(''); }}
                            disabled={!!actionLoading[req._id || req.id]}
                            className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 transition-all disabled:opacity-50"
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────── REQUESTS TAB ──────────────────── */}
      {activeTab === 'requests' && (
        <div className="space-y-6 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Status Filters */}
            <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800">
              {['all','pending','approved','rejected'].map(f => (
                <button
                  key={f}
                  onClick={() => setRequestFilter(f)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium capitalize transition-all duration-200
                    ${requestFilter === f
                      ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-500/30'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-transparent'}`}
                >
                  {f}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
          </div>

          {/* Request Cards */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-16 text-center shadow-sm dark:shadow-none">
                <FileText className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                <p className="text-slate-400">No WFH requests found</p>
                <p className="text-slate-600 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const id = req._id || req.id;
                return (
                  <div
                    key={id}
                    className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-350 dark:hover:border-slate-700 transition-all duration-200 group shadow-sm dark:shadow-none"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        {avatar(req.employee_name || req.name, 'w-11 h-11 text-base')}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-slate-900 dark:text-white font-semibold text-sm">{req.employee_name || req.name}</h4>
                            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColor(req.status)}`}>
                              {statusIcon(req.status)}
                              {req.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{req.employee_email || req.email}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs text-slate-400">
                              <Calendar className="w-3.5 h-3.5" />
                              {req.date || req.requested_date || req.start_date}
                              {req.end_date && req.end_date !== req.start_date && ` → ${req.end_date}`}
                            </span>
                            {(req.reason || req.wfh_reason) && (
                              <span className="text-xs text-slate-600 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/60 px-2 py-0.5 rounded-full">
                                {req.reason || req.wfh_reason}
                              </span>
                            )}
                          </div>
                          {req.rejection_reason && (
                            <p className="text-xs text-rose-600 dark:text-rose-400/80 mt-2 bg-rose-50 dark:bg-rose-500/5 px-3 py-1.5 rounded-lg border border-rose-100 dark:border-rose-500/10">
                              Rejected: {req.rejection_reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      {req.status === 'pending' && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApprove(id)}
                            disabled={!!actionLoading[id]}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 border border-emerald-100 dark:border-emerald-500/20 text-xs font-medium transition-all disabled:opacity-50"
                          >
                            {actionLoading[id] === 'approve'
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <Check className="w-3.5 h-3.5" />
                            }
                            Approve
                          </button>
                          <button
                            onClick={() => { setRejectModal(id); setRejectReason(''); }}
                            disabled={!!actionLoading[id]}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 border border-rose-100 dark:border-rose-500/20 text-xs font-medium transition-all disabled:opacity-50"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─────────────────── CALENDAR TAB ──────────────────── */}
      {activeTab === 'calendar' && (
        <div className="space-y-6 animate-fade-in">
          {/* Month nav */}
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:border-slate-350 dark:hover:border-slate-700 transition-all">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
              {MONTHS[calMon]} {calYear}
            </h3>
            <button onClick={nextMonth} className="p-2 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-950 dark:text-slate-400 dark:hover:text-white hover:border-slate-350 dark:hover:border-slate-700 transition-all">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            {/* Day headers */}
            <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800">
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>
            {/* Day cells */}
            <div className="grid grid-cols-7">
              {calendarCells.map((day, i) => {
                const emps = getDayEmployees(day);
                const isToday = day && fmtDate(new Date(calYear, calMon, day)) === fmtDate(new Date());
                const isSelected = day && selectedDay === day;
                return (
                  <div
                    key={i}
                    onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                    className={`min-h-[90px] p-2 border-b border-r border-slate-200 dark:border-slate-800/50 transition-all cursor-pointer
                      ${!day ? 'bg-slate-50 dark:bg-slate-950/30' : 'hover:bg-slate-100/50 dark:hover:bg-slate-800/20'}
                      ${isToday ? 'bg-indigo-50 dark:bg-indigo-500/5 border-indigo-150 dark:border-indigo-500/20' : ''}
                      ${isSelected ? 'bg-indigo-50 dark:bg-indigo-500/10 ring-1 ring-indigo-150 dark:ring-indigo-500/30' : ''}`}
                  >
                    {day && (
                      <>
                        <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full
                          ${isToday ? 'bg-indigo-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {day}
                        </span>
                        {emps.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-0.5">
                            {emps.slice(0, 3).map((emp, j) => (
                              <div
                                key={j}
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold text-white
                                  ${emp.status === 'approved' ? 'bg-emerald-500/80' : 'bg-amber-500/80'}`}
                                title={`${emp.name || emp.employee_name} (${emp.status})`}
                              >
                                {(emp.name || emp.employee_name || '?')[0].toUpperCase()}
                              </div>
                            ))}
                            {emps.length > 3 && (
                              <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[9px] font-medium text-slate-650 dark:text-slate-300">
                                +{emps.length - 3}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500/80" /> Approved</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500/80" /> Pending</span>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none animate-fade-in">
              <div className="px-6 py-4 border-b border-slate-250 dark:border-slate-800 flex items-center justify-between">
                <h4 className="text-slate-900 dark:text-white font-semibold text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  {MONTHS[calMon]} {selectedDay}, {calYear}
                </h4>
                <button onClick={() => setSelectedDay(null)} className="text-slate-500 hover:text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-800/50 max-h-[300px] overflow-y-auto">
                {getDayEmployees(selectedDay).length === 0 ? (
                  <div className="py-10 text-center text-slate-500 text-sm">No WFH employees on this day</div>
                ) : (
                  getDayEmployees(selectedDay).map((emp, i) => (
                    <div key={i} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {avatar(emp.name || emp.employee_name)}
                        <div>
                          <p className="text-sm font-medium text-slate-850 dark:text-white">{emp.name || emp.employee_name}</p>
                          <p className="text-xs text-slate-500">{emp.email || emp.employee_email}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${statusColor(emp.status)}`}>
                        {statusIcon(emp.status)}
                        {emp.status}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─────────────────── POLICY TAB ────────────────────── */}
      {activeTab === 'policy' && (
        <div className="space-y-6 animate-fade-in">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search employees…"
                value={policySearch}
                onChange={e => setPolicySearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
            </div>
            {Object.keys(policyChanges).length > 0 && (
              <button
                onClick={savePolicies}
                disabled={savingPolicy}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all disabled:opacity-50"
              >
                {savingPolicy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes ({Object.keys(policyChanges).length})
              </button>
            )}
          </div>

          {/* Policy type legend */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> Office Only
            </span>
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" /> Hybrid
            </span>
            <span className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-emerald-400" /> Permanent WFH
            </span>
          </div>

          {/* Policy Table */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm dark:shadow-none">
            {/* Header */}
            <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3.5 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-550 dark:text-slate-500 uppercase tracking-wider">
              <div className="col-span-4">Employee</div>
              <div className="col-span-4">WFH Type</div>
              <div className="col-span-2">Days / Month</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800/50 max-h-[550px] overflow-y-auto">
              {filteredPolicies.length === 0 ? (
                <div className="py-16 text-center text-slate-500">
                  <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No employees found</p>
                </div>
              ) : (
                filteredPolicies.map((emp) => {
                  const changes = policyChanges[emp.email] || {};
                  const currentType = changes.wfh_type ?? emp.wfh_type ?? 'office';
                  const currentDays = changes.allowed_days_per_month ?? emp.allowed_days_per_month ?? 0;
                  const hasChange = !!policyChanges[emp.email];

                  return (
                    <div
                      key={emp.email}
                      className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all\n                        ${hasChange ? 'bg-indigo-50 dark:bg-indigo-500/5 border-l-2 border-l-indigo-500' : ''}`}
                    >
                      {/* Employee */}
                      <div className="col-span-4 flex items-center gap-3">
                        {avatar(emp.name)}
                        <div>
                          <p className="text-sm font-medium text-slate-850 dark:text-white">{emp.name}</p>
                          <p className="text-xs text-slate-500">{emp.email}</p>
                        </div>
                      </div>

                      {/* WFH Type Toggle */}
                      <div className="col-span-4">
                        <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl w-fit border border-slate-200/50 dark:border-transparent">
                          {[
                            { value: 'office', label: 'Office', icon: Building2, color: 'text-slate-700 dark:text-slate-300' },
                            { value: 'hybrid', label: 'Hybrid', icon: RefreshCw, color: 'text-sky-400' },
                            { value: 'permanent_wfh', label: 'WFH', icon: Home, color: 'text-emerald-400' },
                          ].map(opt => {
                            const Icon = opt.icon;
                            const active = currentType === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => handlePolicyChange(emp.email, 'wfh_type', opt.value)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                                  ${active
                                    ? `bg-white dark:bg-slate-700 ${opt.color} shadow-sm`
                                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                              >
                                <Icon className="w-3.5 h-3.5" />
                                {opt.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Days per month */}
                      <div className="col-span-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={31}
                            value={currentDays}
                            onChange={e => handlePolicyChange(emp.email, 'allowed_days_per_month', parseInt(e.target.value) || 0)}
                            disabled={currentType === 'office' || currentType === 'permanent_wfh'}
                            className="w-16 px-2 py-1.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm text-center focus:outline-none focus:border-indigo-500/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                          />
                          <span className="text-xs text-slate-500">days</span>
                        </div>
                      </div>

                      {/* Change indicator */}
                      <div className="col-span-2 text-right">
                        {hasChange ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-150 dark:border-indigo-500/20">
                            <AlertCircle className="w-3 h-3" />
                            Modified
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-600">No changes</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ Rejection Reason Modal ═══════════ */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectModal(null)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="text-slate-900 dark:text-white font-semibold">Reject WFH Request</h3>
                <p className="text-slate-500 text-xs">Provide a reason for rejection</p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter rejection reason…"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm placeholder:text-slate-400 dark:placeholder:text-slate-650 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 resize-none transition-all"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setRejectModal(null)}
                className="px-4 py-2 rounded-xl text-sm text-slate-500 dark:text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || !!actionLoading[rejectModal]}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white text-sm font-medium shadow-lg shadow-rose-500/20 transition-all disabled:opacity-50"
              >
                {actionLoading[rejectModal] === 'reject'
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <XCircle className="w-4 h-4" />
                }
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inline animation styles ── */}
      <style>{`
        @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes scaleIn { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:scale(1); } }
        @keyframes slideIn { from { opacity:0; transform:translateX(20px); } to { opacity:1; transform:translateX(0); } }
        .animate-fade-in   { animation: fadeIn .35s ease-out; }
        .animate-scale-in  { animation: scaleIn .25s ease-out; }
        .animate-slide-in  { animation: slideIn .35s ease-out; }
      `}</style>
    </div>
  );
};

export default WFHManagement;
