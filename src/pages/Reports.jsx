import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import client from '../utils/api';
import EmployeeReportModal from '../components/EmployeeReportModal';
import {
    Search, ChevronRight, Activity, Download, CheckCircle,
    Users, TrendingUp, BarChart3, PieChart, FileText,
    XCircle, Clock, DollarSign
} from 'lucide-react';

const Reports = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const [attendanceData, setAttendanceData] = useState({ summary: {}, records: [] });
    const [expenseData, setExpenseData] = useState({});
    const [performanceData, setPerformanceData] = useState([]);
    const [funnelData, setFunnelData] = useState({});
    const [trendData, setTrendData] = useState([]);
    const [leaveData, setLeaveData] = useState({ distribution: [], trends: [] });
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({
        startDate: new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        employeeType: ''
    });

    // WFH reports specific states
    const [wfhReportType, setWfhReportType] = useState('productivity'); // productivity, app-usage, attendance, screenshots
    const [wfhData, setWfhData] = useState([]);
    const [selectedWfhEmployee, setSelectedWfhEmployee] = useState('');

    // Employee search states
    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    const fetchAttendanceReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (filters.employeeType) params.append('employee_type', filters.employeeType);
            const res = await client.get(`/admin/reports/attendance?${params}`);
            setAttendanceData(res.data);
        } catch (err) {
            console.error('Failed to fetch attendance report:', err);
        }
        setLoading(false);
    };

    const fetchExpenseReport = async () => {
        setLoading(true);
        try {
            const res = await client.get('/admin/reports/expenses');
            setExpenseData(res.data);
        } catch (err) {
            console.error('Failed to fetch expense report:', err);
        }
        setLoading(false);
    };

    const fetchPerformanceReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            const res = await client.get(`/admin/reports/agent-performance?${params}`);
            setPerformanceData(res.data);
        } catch (err) {
            console.error('Performance fetch failed', err);
        }
        setLoading(false);
    };

    const fetchFunnelReport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            const res = await client.get(`/admin/reports/conversion-funnel?${params}`);
            setFunnelData(res.data);
        } catch (err) {
            console.error('Funnel fetch failed', err);
        }
    };

    const fetchTrendReport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            const res = await client.get(`/admin/reports/visit-frequency?${params}`);
            setTrendData(res.data.daily_trends || []);
        } catch (err) {
            console.error('Trend fetch failed', err);
        }
    };

    const fetchLeaveReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            const res = await client.get(`/admin/reports/leaves?${params}`);
            setLeaveData(res.data);
        } catch (err) {
            console.error('Failed to fetch leave report:', err);
        }
        setLoading(false);
    };

    const fetchWfhReport = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.startDate) params.append('start_date', filters.startDate);
            if (filters.endDate) params.append('end_date', filters.endDate);
            if (selectedWfhEmployee) params.append('employee_email', selectedWfhEmployee);
            
            const res = await client.get(`/admin/wfh/reports/${wfhReportType}?${params}`);
            setWfhData(res.data || []);
        } catch (err) {
            console.error(`Failed to fetch WFH ${wfhReportType} report:`, err);
            setWfhData([]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (activeTab === 'attendance') fetchAttendanceReport();
        else if (activeTab === 'expenses') fetchExpenseReport();
        else if (activeTab === 'leaves') fetchLeaveReport();
        else if (activeTab === 'wfh') fetchWfhReport();
        else if (activeTab === 'analytics') {
            fetchPerformanceReport();
            fetchFunnelReport();
            fetchTrendReport();
        }
    }, [activeTab, wfhReportType]);

    useEffect(() => {
        const loadEmployees = async () => {
            try {
                const res = await client.get('/admin/employees');
                setEmployees(res.data);
            } catch (err) {
                console.error('Failed to load employees for reports', err);
            }
        };
        loadEmployees();
    }, []);

    const filteredEmployees = employees.filter(emp =>
        emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10); // Show top 10 results for performance

    const exportCSV = () => {
        if (!attendanceData.records?.length) return;
        const headers = ['Name', 'Email', 'Type', 'Action', 'Timestamp', 'Method'];
        const rows = attendanceData.records.map(r => [
            r.full_name, r.email, r.employee_type, r.type,
            new Date(r.timestamp).toLocaleString(), r.check_in_method || 'N/A'
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance_report_${filters.startDate}_${filters.endDate}.csv`;
        a.click();
    };

    const exportWfhCSV = () => {
        const params = new URLSearchParams();
        if (filters.startDate) params.append('start_date', filters.startDate);
        if (filters.endDate) params.append('end_date', filters.endDate);
        if (selectedWfhEmployee) params.append('employee_email', selectedWfhEmployee);
        params.append('format', 'csv');
        
        const downloadUrl = `${client.defaults.baseURL}/admin/wfh/reports/${wfhReportType}?${params}`;
        window.open(downloadUrl, '_blank');
    };

    const StatCard = ({ icon: Icon, label, value, color, sub }) => (
        <div className="bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:border-slate-300 dark:border-slate-700 transition-all">
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                    <Icon size={20} />
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">{label}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
        </div>
    );

    const ChartContainer = ({ title, children, icon: Icon }) => (
        <div className="bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400">
                    <Icon size={18} />
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>
            </div>
            <div className="h-[300px] w-full">
                {children}
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports & Analytics</h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Enterprise intelligence dashboard</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => {
                        if (activeTab === 'analytics') {
                            fetchPerformanceReport(); fetchFunnelReport(); fetchTrendReport();
                        } else if (activeTab === 'attendance') {
                            fetchAttendanceReport();
                        } else if (activeTab === 'leaves') {
                            fetchLeaveReport();
                        } else if (activeTab === 'wfh') {
                            fetchWfhReport();
                        }
                    }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-slate-300 dark:border-slate-700 font-medium">
                        <Activity size={16} /> Refresh
                    </button>
                    <button onClick={activeTab === 'wfh' ? exportWfhCSV : exportCSV} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 text-emerald-400 rounded-xl hover:bg-emerald-600/30 transition-all border border-emerald-500/20 font-medium">
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="flex gap-2 bg-white dark:bg-white dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800 w-fit">
                {['analytics', 'attendance', 'leaves', 'expenses', 'wfh', 'individual'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${activeTab === tab
                            ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                            }`}
                    >
                        {tab === 'individual' ? 'Individual Report' : tab === 'wfh' ? 'WFH Report' : tab}
                    </button>
                ))}
            </div>

            <div className="flex gap-4 items-end bg-white dark:bg-slate-900/30 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="flex-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-medium">Start Date</label>
                    <input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-primary-500 outline-none" />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-medium">End Date</label>
                    <input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-primary-500 outline-none" />
                </div>
                {activeTab === 'attendance' && (
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-medium">Employee Type</label>
                        <select value={filters.employeeType} onChange={e => setFilters({ ...filters, employeeType: e.target.value })}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-primary-500 outline-none">
                            <option value="">All Types</option>
                            <option value="desk">Desk</option>
                            <option value="field">Field</option>
                        </select>
                    </div>
                )}
                {activeTab === 'wfh' && (
                    <div className="flex-1">
                        <label className="text-xs text-slate-500 dark:text-slate-400 mb-1 block font-medium">Employee Email</label>
                        <select value={selectedWfhEmployee} onChange={e => setSelectedWfhEmployee(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-sm px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 focus:border-primary-500 outline-none">
                            <option value="">All WFH Employees</option>
                            {employees.filter(emp => emp.employee_type === 'wfh').map(emp => (
                                <option key={emp._id} value={emp.email}>{emp.full_name} ({emp.email})</option>
                            ))}
                        </select>
                    </div>
                )}
                <button onClick={() => {
                    if (activeTab === 'attendance') fetchAttendanceReport();
                    else if (activeTab === 'leaves') fetchLeaveReport();
                    else if (activeTab === 'wfh') fetchWfhReport();
                    else fetchPerformanceReport();
                }} className="px-5 py-2 bg-primary-600 text-slate-900 dark:text-white rounded-lg hover:bg-primary-500 transition-all text-sm font-medium font-outfit">
                    Apply Filter
                </button>
            </div>

            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={CheckCircle} label="Total Visits" value={funnelData.visits || 0} color="bg-blue-500/20 text-blue-400" />
                        <StatCard icon={Users} label="Leads Captured" value={funnelData.leads || 0} color="bg-emerald-500/20 text-emerald-400" />
                        <StatCard icon={TrendingUp} label="Orders Won" value={funnelData.orders || 0} color="bg-amber-500/20 text-amber-400" />
                        <StatCard icon={TrendingUp} label="Conversion Rate" value={`${funnelData.conversion_rate || 0}%`} color="bg-purple-500/20 text-purple-400" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartContainer title="Agent Productivity (Visits vs KM)" icon={BarChart3}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                    <XAxis dataKey="full_name" stroke="#64748b" fontSize={12} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="total_visits" name="Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="total_km" name="Distance (KM)" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="Visit Frequency Trends" icon={Activity}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={trendData}>
                                    <defs>
                                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickFormatter={(str) => str.split('-').slice(1).join('/')} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="visits" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVisits)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="Conversion Funnel" icon={PieChart}>
                            <div className="flex h-full items-center justify-center">
                                <div className="space-y-4 w-full max-w-sm">
                                    {[
                                        { label: 'Total Visits', value: funnelData.visits, color: 'bg-blue-500', percent: 100 },
                                        { label: 'Leads Captured', value: funnelData.leads, color: 'bg-emerald-500', percent: funnelData.visits ? (funnelData.leads / funnelData.visits * 100) : 0 },
                                        { label: 'Orders Captured', value: funnelData.orders, color: 'bg-amber-500', percent: funnelData.leads ? (funnelData.orders / funnelData.leads * 100) : 0 }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                                                <span className="text-slate-900 dark:text-white font-medium">{item.value}</span>
                                            </div>
                                            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div className={`${item.color} h-full transition-all duration-1000`} style={{ width: `${item.percent}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ChartContainer>

                        <ChartContainer title="Outcome Distribution" icon={Users}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={[
                                            { name: 'Leads', value: funnelData.leads || 0 },
                                            { name: 'Orders', value: funnelData.orders || 0 },
                                            { name: 'Plain Visits', value: Math.max(0, (funnelData.visits || 0) - (funnelData.leads || 0) - (funnelData.orders || 0)) }
                                        ]}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                    >
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f59e0b" />
                                        <Cell fill="#3b82f6" />
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                    <Legend />
                                </RePieChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            )}

            {activeTab === 'attendance' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={FileText} label="Total Records" value={attendanceData.summary?.total_records || 0} color="bg-blue-500/20 text-blue-400" />
                        <StatCard icon={CheckCircle} label="Check-Ins" value={attendanceData.summary?.check_ins || 0} color="bg-emerald-500/20 text-emerald-400" />
                        <StatCard icon={XCircle} label="Check-Outs" value={attendanceData.summary?.check_outs || 0} color="bg-orange-500/20 text-orange-400" />
                        <StatCard icon={Users} label="Unique Employees" value={attendanceData.summary?.unique_employees || 0} color="bg-purple-500/20 text-purple-400" />
                    </div>

                    <div className="bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-800">
                                        <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">Employee</th>
                                        <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">Type</th>
                                        <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">Action</th>
                                        <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">Timestamp</th>
                                        <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium">Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">Loading...</td></tr>
                                    ) : attendanceData.records?.length === 0 ? (
                                        <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">No records found for selected filters</td></tr>
                                    ) : (
                                        attendanceData.records?.slice(0, 50).map((log, i) => (
                                            <tr key={i} className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/30 transition-colors">
                                                <td className="p-4 text-slate-900 dark:text-white font-medium">{log.full_name}</td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${log.employee_type === 'field' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                                        {log.employee_type || 'desk'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded-lg text-xs font-medium ${log.type === 'check-in' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                        {log.type}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-slate-600 dark:text-slate-300">{new Date(log.timestamp).toLocaleString()}</td>
                                                <td className="p-4 text-slate-500 dark:text-slate-400">{log.check_in_method || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'leaves' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={FileText} label="Total Requests" value={leaveData.total_requests || 0} color="bg-blue-500/20 text-blue-400" />
                        <StatCard icon={CheckCircle} label="Approved" value={leaveData.approved || 0} color="bg-emerald-500/20 text-emerald-400" />
                        <StatCard icon={Clock} label="Pending" value={leaveData.pending || 0} color="bg-amber-500/20 text-amber-400" />
                        <StatCard icon={XCircle} label="Rejected" value={leaveData.rejected || 0} color="bg-rose-500/20 text-rose-400" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <ChartContainer title="Leave Type Distribution" icon={PieChart}>
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={leaveData.distribution}
                                        cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                                    >
                                        {leaveData.distribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                    <Legend />
                                </RePieChart>
                            </ResponsiveContainer>
                        </ChartContainer>

                        <ChartContainer title="Leave Request Trends" icon={TrendingUp}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={leaveData.trends}>
                                    <defs>
                                        <linearGradient id="colorLeaves" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                                    <YAxis stroke="#64748b" fontSize={12} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }} />
                                    <Area type="monotone" dataKey="count" stroke="#10b981" fillOpacity={1} fill="url(#colorLeaves)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </div>
                </div>
            )}

            {activeTab === 'expenses' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard icon={DollarSign} label="Total Claims" value={expenseData.total_claims || 0} color="bg-blue-500/20 text-blue-400" sub={`₹${(expenseData.total_amount || 0).toLocaleString()}`} />
                        <StatCard icon={CheckCircle} label="Approved" value={expenseData.by_status?.approved || 0} color="bg-emerald-500/20 text-emerald-400" sub={`₹${(expenseData.approved_amount || 0).toLocaleString()}`} />
                        <StatCard icon={Clock} label="Pending" value={expenseData.by_status?.pending || 0} color="bg-amber-500/20 text-amber-400" sub={`₹${(expenseData.pending_amount || 0).toLocaleString()}`} />
                        <StatCard icon={XCircle} label="Rejected" value={expenseData.by_status?.rejected || 0} color="bg-rose-500/20 text-rose-400" sub={`₹${(expenseData.rejected_amount || 0).toLocaleString()}`} />
                    </div>
                    <div className="bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                        <TrendingUp size={48} className="mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed expense analytics coming soon</p>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Visit logs and expense trends are being integrated for deep insights.</p>
                    </div>
                </div>
            )}
            {activeTab === 'wfh' && (
                <div className="space-y-6">
                    {/* WFH Subtab selectors */}
                    <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                        {[
                            { id: 'productivity', label: 'Productivity Report' },
                            { id: 'app-usage', label: 'App Usage Analytics' },
                            { id: 'attendance', label: 'Attendance Summary' },
                            { id: 'screenshots', label: 'Screenshot Audit Log' }
                        ].map(sub => (
                            <button
                                key={sub.id}
                                onClick={() => setWfhReportType(sub.id)}
                                className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide uppercase transition-all ${wfhReportType === sub.id
                                    ? 'bg-primary-500 text-slate-900 dark:text-white shadow-lg shadow-primary-500/20'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white bg-white dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                                }`}
                            >
                                {sub.label}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                {wfhReportType === 'productivity' && (
                                    <>
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Date</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Employee</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Check-in</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Check-out</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Active Time</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Score (Client)</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Score (Verified)</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Face Checks</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">Loading...</td></tr>
                                            ) : wfhData.length === 0 ? (
                                                <tr><td colSpan={8} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">No productivity records found for selected filters</td></tr>
                                            ) : (
                                                wfhData.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/20 transition-all">
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium font-outfit">{row.date}</td>
                                                        <td className="p-4">
                                                            <p className="text-slate-900 dark:text-white font-medium font-outfit">{row.employee_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.employee_email}</p>
                                                        </td>
                                                        <td className="p-4 text-slate-500 dark:text-slate-400 font-outfit">{row.check_in_time ? new Date(row.check_in_time).toLocaleTimeString() : '—'}</td>
                                                        <td className="p-4 text-slate-500 dark:text-slate-400 font-outfit">{row.check_out_time ? new Date(row.check_out_time).toLocaleTimeString() : '—'}</td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-outfit">{row.duration_hours} hrs</td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-outfit ${
                                                                row.productivity_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                row.productivity_score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            }`}>
                                                                {row.productivity_score}%
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-outfit ${
                                                                row.verified_productivity_score >= 70 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                row.verified_productivity_score >= 50 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                                'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                            }`}>
                                                                {row.verified_productivity_score}%
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-outfit">
                                                            {row.face_check_passed} / {row.face_check_count}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                )}

                                {wfhReportType === 'app-usage' && (
                                    <>
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Employee</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Application</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Classification</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Total Usage</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">Loading...</td></tr>
                                            ) : wfhData.length === 0 ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">No app usage logs found for selected filters</td></tr>
                                            ) : (
                                                wfhData.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/20 transition-all">
                                                        <td className="p-4">
                                                            <p className="text-slate-900 dark:text-white font-medium font-outfit">{row.employee_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.employee_email}</p>
                                                        </td>
                                                        <td className="p-4 text-slate-900 dark:text-white font-semibold font-outfit">{row.app_name}</td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-1 rounded-lg text-xs font-semibold font-outfit ${
                                                                row.category?.toLowerCase() === 'productive' ? 'bg-emerald-500/20 text-emerald-400' :
                                                                row.category?.toLowerCase() === 'neutral' ? 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400' :
                                                                'bg-rose-500/20 text-rose-400'
                                                            }`}>
                                                                {row.category}
                                                            </span>
                                                        </td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-bold font-outfit">{row.total_minutes} mins</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                )}

                                {wfhReportType === 'attendance' && (
                                    <>
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Employee</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Total WFH Sessions</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Cumulative Hours</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Average Productivity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">Loading...</td></tr>
                                            ) : wfhData.length === 0 ? (
                                                <tr><td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">No attendance summaries found for selected filters</td></tr>
                                            ) : (
                                                wfhData.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/20 transition-all">
                                                        <td className="p-4">
                                                            <p className="text-slate-900 dark:text-white font-medium font-outfit">{row.employee_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.employee_email}</p>
                                                        </td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-medium font-outfit">{row.total_sessions} sessions</td>
                                                        <td className="p-4 text-slate-600 dark:text-slate-300 font-bold font-outfit">{row.total_duration_hours} hrs</td>
                                                        <td className="p-4 font-outfit">
                                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold font-outfit ${
                                                                row.average_productivity_score >= 70 ? 'bg-emerald-500/10 text-emerald-400' :
                                                                row.average_productivity_score >= 50 ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-rose-500/10 text-rose-400'
                                                            }`}>
                                                                {row.average_productivity_score}%
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                )}

                                {wfhReportType === 'screenshots' && (
                                    <>
                                        <thead>
                                            <tr className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/30">
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Timestamp</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Employee</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Active Application</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Active Window</th>
                                                <th className="text-left p-4 text-slate-500 dark:text-slate-400 font-medium font-outfit">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">Loading...</td></tr>
                                            ) : wfhData.length === 0 ? (
                                                <tr><td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400 font-outfit">No screenshots log found for selected filters</td></tr>
                                            ) : (
                                                wfhData.map((row, i) => (
                                                    <tr key={i} className="border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50 hover:bg-slate-100 dark:bg-slate-800/20 transition-all">
                                                        <td className="p-4 text-slate-500 dark:text-slate-400 font-outfit">{new Date(row.timestamp).toLocaleString()}</td>
                                                        <td className="p-4">
                                                            <p className="text-slate-900 dark:text-white font-medium font-outfit">{row.employee_name}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{row.employee_email}</p>
                                                        </td>
                                                        <td className="p-4 text-slate-900 dark:text-white font-semibold font-outfit">{row.active_app}</td>
                                                        <td className="p-4 text-slate-500 dark:text-slate-400 font-outfit truncate max-w-[200px]" title={row.active_window}>{row.active_window}</td>
                                                        <td className="p-4 font-outfit">
                                                            {row.flagged ? (
                                                                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-xs font-bold" title={row.flag_reason}>
                                                                    ⚠️ Flagged
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-xs font-bold">
                                                                    ✓ Normal
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </>
                                )}
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'individual' && (
                <div className="space-y-6 max-w-2xl mx-auto py-10">
                    <div className="text-center space-y-2 mb-8">
                        <div className="w-16 h-16 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-400 mx-auto">
                            <Users size={32} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Find Employee Report</h2>
                        <p className="text-slate-500 dark:text-slate-400">Search by name or email to view detailed monthly activity</p>
                    </div>

                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 dark:text-slate-400 group-focus-within:text-primary-400 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            placeholder="Type employee name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-2xl py-4 pl-12 pr-4 text-slate-900 dark:text-white focus:border-primary-500 outline-none transition-all shadow-xl group-hover:border-slate-600"
                        />
                    </div>

                    <div className="space-y-2 mt-4">
                        {searchQuery && filteredEmployees.length > 0 ? (
                            filteredEmployees.map((emp) => (
                                <button
                                    key={emp._id}
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setIsReportModalOpen(true);
                                    }}
                                    className="w-full flex items-center justify-between p-4 bg-white dark:bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:bg-slate-800/50 hover:border-slate-300 dark:border-slate-700 transition-all group"
                                >
                                    <div className="flex items-center gap-4 text-left">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 font-bold">
                                            {emp.full_name?.[0]}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-400 transition-colors">{emp.full_name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{emp.email}</p>
                                        </div>
                                    </div>
                                    <ChevronRight size={20} className="text-slate-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                                </button>
                            ))
                        ) : searchQuery ? (
                            <div className="text-center py-10 bg-white dark:bg-slate-900/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-slate-500 dark:text-slate-400">No employees found matching "{searchQuery}"</p>
                            </div>
                        ) : null}
                    </div>

                    {!searchQuery && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-12 opacity-50">
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Tip</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Works for both Field and Desk staff automatically.</p>
                            </div>
                            <div className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900/20">
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-2">Real-time</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Data reflects instant check-ins and check-outs.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <EmployeeReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                employee={selectedEmployee}
            />
        </div>
    );
};

export default Reports;
