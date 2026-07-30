import React, { useState, useEffect } from 'react';
import {
    Users,
    UserCheck,
    UserX,
    Clock,
    TrendingUp,
    ArrowUpRight,
    ArrowDownRight,
    MoreVertical,
    Loader2,
    ShieldAlert,
    UserPlus,
    Landmark,
    UserMinus
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { formatToIST, getRelativeDateLabel } from '../utils/dateUtils';
import { RefreshCw } from 'lucide-react';

const StatCard = ({ title, value, subValue, icon: Icon, trend, type = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    };

    return (
        <div className="bg-white border border-slate-200 p-6 rounded-2xl group hover:border-slate-300 transition-all shadow-sm hover:shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl border ${colors[type]}`}>
                    <Icon size={24} />
                </div>
                <button className="text-slate-400 hover:text-slate-600">
                    <MoreVertical size={20} />
                </button>
            </div>
            <div>
                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <div className="flex items-end gap-3">
                    <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
                    <span className={`text-xs font-bold mb-1.5 flex items-center ${trend >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                    <TrendingUp size={10} />
                    {subValue}
                </p>
            </div>
        </div>
    );
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [wfhStats, setWfhStats] = useState(null);
    const [hrmsStats, setHrmsStats] = useState(null);
    const [activities, setActivities] = useState([]);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(new Date());

    const handleExportPDF = async () => {
        try {
            const res = await api.get('/admin/export-logs-pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `attendance_report_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('PDF Export failed:', err);
            alert('Failed to generate PDF report');
        }
    };

    useEffect(() => {
        const fetchDataInternal = async (isManual = false) => {
            if (isManual) setRefreshing(true);
            try {
                const [statsRes, logsRes, chartRes, wfhStatsRes, hrmsStatsRes] = await Promise.all([
                    api.get('/admin/stats'),
                    api.get('/admin/live-feed?limit=8'),
                    api.get('/admin/stats/attendance-chart'),
                    api.get('/admin/wfh/stats').catch(() => null),
                    api.get('/admin/hrms/stats').catch(() => null)
                ]);
                setStats(statsRes.data);
                setActivities(logsRes.data.logs || []);
                setChartData(chartRes.data || []);
                if (wfhStatsRes) setWfhStats(wfhStatsRes.data);
                if (hrmsStatsRes) setHrmsStats(hrmsStatsRes.data);
                setLastUpdated(new Date());
            } catch (err) {
                console.error('Error fetching dashboard data:', err);
            } finally {
                setLoading(false);
                if (isManual) setRefreshing(false);
            }
        };

        fetchDataInternal();
        const interval = setInterval(() => fetchDataInternal(false), 10000);
        return () => clearInterval(interval);
    }, []);

    const handleManualRefresh = async () => {
        setRefreshing(true);
        try {
            const [statsRes, logsRes, chartRes, wfhStatsRes, hrmsStatsRes] = await Promise.all([
                api.get('/admin/stats'),
                api.get('/admin/live-feed?limit=8'),
                api.get('/admin/stats/attendance-chart'),
                api.get('/admin/wfh/stats').catch(() => null),
                api.get('/admin/hrms/stats').catch(() => null)
            ]);
            setStats(statsRes.data);
            setActivities(logsRes.data.logs || []);
            setChartData(chartRes.data || []);
            if (wfhStatsRes) setWfhStats(wfhStatsRes.data);
            if (hrmsStatsRes) setHrmsStats(hrmsStatsRes.data);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-[#004B87]" size={48} />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">System Overview</h1>
                    <p className="text-slate-500 flex items-center gap-2">
                        Welcome back, Admin. 
                        <span className={`text-[10px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded-md transition-all duration-500 ${refreshing ? 'bg-blue-100 text-blue-600 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
                            {refreshing ? 'Syncing...' : `Last Refreshed: ${formatToIST(lastUpdated, { hour: '2-digit', minute: '2-digit' })}`}
                        </span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-full flex items-center gap-2 shadow-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-600 text-[10px] font-black tracking-widest uppercase">Live Link Active</span>
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/alerts')}
                        className="bg-rose-50 border border-rose-200 text-rose-600 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all hover:bg-rose-100 flex items-center gap-2"
                    >
                        <ShieldAlert size={18} /> View Alerts
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="bg-[#004B87] hover:bg-[#003A6B] text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all active:scale-95 shadow-md shadow-[#004B87]/10"
                    >
                        Generate Report
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Employees"
                    value={stats?.total_employees || 0}
                    subValue="Organization capacity"
                    icon={Users}
                    trend={0}
                    type="blue"
                />
                <StatCard
                    title="Clocked-In Today"
                    value={stats?.clocked_in_today || 0}
                    subValue="Active attendance"
                    icon={UserCheck}
                    trend={0}
                    type="emerald"
                />
                <StatCard
                    title="On Leave"
                    value={stats?.on_leave || 0}
                    subValue="Approved requests"
                    icon={Clock}
                    trend={0}
                    type="amber"
                />
                <StatCard
                    title="Absent Today"
                    value={stats?.absent_today || 0}
                    subValue="Unaccounted staff"
                    icon={UserX}
                    trend={0}
                    type="rose"
                />
            </div>

            {/* WFH Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="WFH Employees"
                    value={wfhStats?.wfh_employees || 0}
                    subValue="Remote capacity"
                    icon={Users}
                    trend={0}
                    type="blue"
                />
                <StatCard
                    title="WFH Live Now"
                    value={wfhStats?.active_sessions || 0}
                    subValue="Currently monitored"
                    icon={UserCheck}
                    trend={0}
                    type="emerald"
                />
                <StatCard
                    title="WFH Avg Productivity"
                    value={wfhStats?.avg_productivity ? `${wfhStats.avg_productivity}%` : "0%"}
                    subValue="Overall score today"
                    icon={TrendingUp}
                    trend={0}
                    type="amber"
                />
                <StatCard
                    title="WFH Pending Alerts"
                    value={wfhStats?.pending_alerts || 0}
                    subValue="Awaiting audit"
                    icon={ShieldAlert}
                    trend={0}
                    type="rose"
                />
            </div>

            {/* HRMS Stats Grid */}
            <div className="flex items-center gap-2 mt-2">
                <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">HR Management Overview</h2>
                <div className="flex-1 h-[1px] bg-slate-200" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div onClick={() => navigate('/dashboard/onboarding')} className="cursor-pointer">
                    <StatCard
                        title="Active Onboarding"
                        value={hrmsStats?.onboarding_active || 0}
                        subValue="New hires in pipeline"
                        icon={UserPlus}
                        trend={0}
                        type="blue"
                    />
                </div>
                <div onClick={() => navigate('/dashboard/payroll')} className="cursor-pointer">
                    <StatCard
                        title="Payroll Drafts"
                        value={hrmsStats?.payroll_pending || 0}
                        subValue="Pending monthly runs"
                        icon={Landmark}
                        trend={0}
                        type="amber"
                    />
                </div>
                <div onClick={() => navigate('/dashboard/exit-management')} className="cursor-pointer">
                    <StatCard
                        title="Active Exits"
                        value={hrmsStats?.exits_active || 0}
                        subValue="Employee separations"
                        icon={UserMinus}
                        trend={0}
                        type="rose"
                    />
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Attendance Chart */}
                <div className="lg:col-span-2 bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Attendance Analytics</h2>
                        <select className="bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-lg px-3 py-1.5 outline-none focus:border-[#004B87]">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                        </select>
                    </div>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#004B87" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#004B87" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', color: '#0f172a' }} />
                                <Area type="monotone" dataKey="count" stroke="#004B87" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Live Activity Feed */}
                <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Recent Activity</h2>
                        <button 
                            onClick={handleManualRefresh}
                            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900 transition-all active:scale-95"
                            title="Force Sync"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {activities.length > 0 ? activities.map((activity, i) => (
                            <div key={activity._id || i} className="flex items-center gap-4 group">
                                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 group-hover:bg-[#E8F0FA] group-hover:text-[#004B87] transition-colors border border-slate-200 overflow-hidden">
                                    {activity.profile_image ? (
                                        <img src={`data:image/jpeg;base64,${activity.profile_image}`} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        (activity.employee_name || activity.email).charAt(0)
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">{activity.employee_name || activity.email}</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">
                                            {activity.type === 'check-in' ? 'Clocked In' : 'Clocked Out'} • {formatToIST(activity.timestamp, { hour: '2-digit', minute: '2-digit' })}
                                            <span className="ml-1 text-[#004B87]">({getRelativeDateLabel(activity.timestamp)})</span>
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-black tracking-widest px-2 py-1 rounded-md border ${activity.type === 'check-in' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                    } shadow-sm`}>
                                    {activity.type?.replace('-', ' ').toUpperCase()}
                                </span>
                            </div>
                        )) : (
                            <p className="text-slate-500 text-sm text-center py-12">No activity recorded today.</p>
                        )}
                    </div>
                    <button
                        onClick={() => navigate('/dashboard/logs')}
                        className="w-full mt-8 py-3 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                    >
                        Full Audit Log
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
