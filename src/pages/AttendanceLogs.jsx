import React, { useState, useEffect } from 'react';
import {
    Calendar,
    Search,
    Filter,
    Download,
    FileText,
    Clock,
    User,
    MapPin,
    Wifi,
    ChevronLeft,
    ChevronRight,
    ShieldCheck,
    AlertCircle,
    Loader2,
    CheckCircle2,
    Users,
    LogIn,
    LogOut
} from 'lucide-react';
import api from '../utils/api';
import { formatToIST, formatDateToIST } from '../utils/dateUtils';

const AttendanceLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filterType, setFilterType] = useState('all');

    // Selected month in YYYY-MM format (defaults to current month)
    const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

    useEffect(() => {
        fetchLogs(selectedMonth);
    }, [selectedMonth]);

    const fetchLogs = async (monthStr) => {
        try {
            setLoading(true);
            setError('');
            const res = await api.get(`/admin/logs?limit=5000&month=${monthStr}`);
            setLogs(res.data || []);
        } catch (err) {
            setError('Unable to retrieve attendance audit trail.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredLogs = logs.filter(log => {
        const matchesType = filterType === 'all' || log.type?.toLowerCase() === filterType;
        const searchStr = searchTerm.toLowerCase();
        const matchesSearch = searchTerm === '' ||
            (log.full_name && log.full_name.toLowerCase().includes(searchStr)) ||
            (log.email && log.email.toLowerCase().includes(searchStr)) ||
            (log.employee_id && log.employee_id.toLowerCase().includes(searchStr));

        return matchesType && matchesSearch;
    });

    // Summary statistics for selected month
    const totalRecords = filteredLogs.length;
    const checkInsCount = filteredLogs.filter(l => l.type === 'check-in').length;
    const checkOutsCount = filteredLogs.filter(l => l.type === 'check-out').length;
    const uniqueEmployees = new Set(filteredLogs.map(l => l.email || l.full_name || l.employee_id)).size;

    // Export PDF function (passes selectedMonth to backend, falls back to browser print PDF if endpoint unavailable)
    const handleExportPDF = async () => {
        try {
            const response = await api.get(`/admin/export-logs-pdf?month=${selectedMonth}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `LogDay_Attendance_${selectedMonth}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.warn("Backend PDF export unavailable, generating print view:", err);
            // Client-side printable PDF trigger
            window.print();
        }
    };

    // Export Excel CSV function with Month selection and Summary Totals block
    const handleExportExcel = () => {
        if (!filteredLogs || filteredLogs.length === 0) {
            alert(`No attendance records found for ${selectedMonth}.`);
            return;
        }

        // Display month label e.g., "July 2026"
        const [year, month] = selectedMonth.split('-');
        const monthDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const monthLabel = monthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

        const escapeCsv = (str) => {
            if (str === null || str === undefined) return '""';
            const stringified = String(str).replace(/"/g, '""');
            return `"${stringified}"`;
        };

        // Prepend UTF-8 BOM for Microsoft Excel auto-encoding
        let csvContent = '\uFEFF';

        // Title Block
        csvContent += `LOGDAY HRMS — ATTENDANCE AUDIT REPORT\n`;
        csvContent += `Selected Month,${escapeCsv(monthLabel)} (${selectedMonth})\n`;
        csvContent += `Generated On,${escapeCsv(new Date().toLocaleString())}\n`;
        csvContent += `\n`;

        // Monthly Summary Totals Header
        csvContent += `MONTHLY SUMMARY TOTALS\n`;
        csvContent += `Metric,Total Count\n`;
        csvContent += `Total Log Records,${totalRecords}\n`;
        csvContent += `Total Check-Ins,${checkInsCount}\n`;
        csvContent += `Total Check-Outs,${checkOutsCount}\n`;
        csvContent += `Unique Employees Active,${uniqueEmployees}\n`;
        csvContent += `\n`;

        // Data Table Column Headers
        csvContent += `S.No,Date,Time (IST),Employee Name,Email,Activity,Verification Method,Location / Address,Status\n`;

        // Rows
        filteredLogs.forEach((log, idx) => {
            const dateStr = formatDateToIST(log.timestamp);
            const timeStr = formatToIST(log.timestamp);
            const name = log.full_name || log.email || 'N/A';
            const email = log.email || 'N/A';
            const type = (log.type || 'N/A').toUpperCase();
            const method = log.check_in_method || 'Face ID Verified';
            const location = log.address || (log.location ? `${log.location.lat}, ${log.location.long}` : 'Office Zone');
            const status = (log.status || 'success').toUpperCase();

            csvContent += `${idx + 1},${escapeCsv(dateStr)},${escapeCsv(timeStr)},${escapeCsv(name)},${escapeCsv(email)},${escapeCsv(type)},${escapeCsv(method)},${escapeCsv(location)},${escapeCsv(status)}\n`;
        });

        // Summary Totals Footer Row
        csvContent += `\n`;
        csvContent += `MONTH TOTALS SUMMARY,,,,,Total Check-Ins: ${checkInsCount},Total Check-Outs: ${checkOutsCount},Total Unique Active Staff: ${uniqueEmployees},Total Entries: ${totalRecords}\n`;

        // Trigger Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `LogDay_Attendance_${monthLabel.replace(/\s+/g, '_')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Attendance Audit Logs</h1>
                    <p className="text-slate-500">Review, filter, and export monthly attendance records with summary totals.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    {/* Month Picker */}
                    <div className="bg-white border border-slate-200 rounded-2xl px-4 py-2.5 flex items-center gap-2 shadow-sm focus-within:border-[#004B87] transition-all">
                        <Calendar size={18} className="text-[#004B87]" />
                        <input
                            type="month"
                            className="bg-transparent text-xs font-bold text-slate-800 uppercase tracking-widest outline-none cursor-pointer"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>

                    {/* Export Excel Button */}
                    <button
                        onClick={handleExportExcel}
                        className="bg-[#004B87] hover:bg-[#003A6B] text-white px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-[#004B87]/20 flex items-center gap-2"
                        title="Download Monthly Attendance Excel CSV with Totals"
                    >
                        <Download size={18} />
                        Export Excel
                    </button>

                    {/* Export PDF Button */}
                    <button
                        onClick={handleExportPDF}
                        className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-6 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 shadow-sm flex items-center gap-2"
                        title="Download Monthly Attendance PDF Report"
                    >
                        <FileText size={18} />
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Monthly Summary Cards Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#004B87] flex items-center justify-center shrink-0 border border-blue-100">
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Total Month Records</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalRecords}</h3>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
                        <LogIn size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Total Check-Ins</p>
                        <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{checkInsCount}</h3>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
                        <LogOut size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Total Check-Outs</p>
                        <h3 className="text-2xl font-bold text-amber-600 mt-0.5">{checkOutsCount}</h3>
                    </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                        <Users size={22} />
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">Active Employees</p>
                        <h3 className="text-2xl font-bold text-indigo-600 mt-0.5">{uniqueEmployees}</h3>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center">
                <div className="bg-white border border-slate-200 p-1.5 rounded-2xl flex items-center gap-1 shadow-sm">
                    {['all', 'check-in', 'check-out'].map((type) => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type
                                ? 'bg-[#004B87] text-white shadow-sm'
                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                                }`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B87] transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Search activity by name or ID..."
                        className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-[#004B87] transition-all text-slate-800 placeholder:text-slate-400 font-medium shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white rounded-3xl border border-slate-200">
                    <Loader2 className="animate-spin text-[#004B87] mb-4" size={40} />
                    <p className="text-slate-500 text-sm font-medium tracking-wide">Fetching monthly attendance records...</p>
                </div>
            ) : error ? (
                <div className="py-24 flex flex-col items-center justify-center bg-rose-50 rounded-3xl border border-rose-200 text-rose-700">
                    <AlertCircle size={40} className="mb-4 text-rose-500" />
                    <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Activity</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Method/Location</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Verification</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                                    <tr key={log._id} className="group hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-slate-100 group-hover:bg-blue-50 transition-colors border border-slate-200">
                                                    <Clock size={16} className="text-slate-500 group-hover:text-[#004B87]" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 tracking-tight">{formatToIST(log.timestamp)}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{formatDateToIST(log.timestamp)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#E8F0FA] flex items-center justify-center text-xs font-bold text-[#004B87] border border-blue-100">
                                                    {(log.full_name || log.email || 'U').charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-[#004B87] transition-colors">{log.full_name || log.email}</p>
                                                    {log.employee_id && <p className="text-[10px] text-slate-400 font-medium">ID: {log.employee_id}</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${log.type === 'check-in' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                                                    <ShieldCheck size={12} className="text-[#004B87]" />
                                                    {log.check_in_method || 'Face ID Verified'}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold tracking-tight">
                                                    <MapPin size={10} className="shrink-0 text-slate-400" />
                                                    {log.location ? (
                                                        <LocationDisplay lat={log.location.lat} lon={log.location.long} />
                                                    ) : (
                                                        <span className="uppercase">{log.address || 'Office Core Zone'}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${log.status === 'success'
                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                                : 'bg-amber-50 border-amber-200 text-amber-700'
                                                }`}>
                                                <ShieldCheck size={14} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{log.status || 'success'}</span>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-12 text-center text-slate-500 text-sm">
                                            No attendance logs found for month <span className="font-bold text-slate-800">{selectedMonth}</span>.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="px-8 py-5 border-t border-slate-200 flex items-center justify-between bg-slate-50">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            Showing <span className="text-[#004B87] font-bold">{filteredLogs.length}</span> records for <span className="text-slate-800 font-bold">{selectedMonth}</span>
                        </p>
                        <div className="flex items-center gap-3">
                            <button onClick={() => fetchLogs(selectedMonth)} className="text-[10px] font-black text-[#004B87] hover:text-[#003A6B] uppercase tracking-widest transition-colors flex items-center gap-2">
                                <Loader2 size={12} className={loading ? 'animate-spin' : ''} />
                                Refresh Records
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AttendanceLogs;

// Utility component to reverse-geocode lat/long
const LocationDisplay = ({ lat, lon }) => {
    const [address, setAddress] = useState(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAddress = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://logday-api.duckdns.org'}/api/geocoding/reverse?lat=${lat}&lon=${lon}`);
                const data = await res.json();
                if (isMounted && data.display_name) {
                    const parts = [];
                    if (data.address?.suburb || data.address?.neighbourhood) 
                        parts.push(data.address.suburb || data.address.neighbourhood);
                    if (data.address?.city || data.address?.town) 
                        parts.push(data.address.city || data.address.town);
                    
                    if (parts.length === 0) setAddress(data.display_name.split(',').slice(0, 2).join(', '));
                    else setAddress(parts.join(', '));
                }
            } catch (err) {
                console.error("Geocoding failed", err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        fetchAddress();
        return () => { isMounted = false; };
    }, [lat, lon]);

    if (loading) return <span className="animate-pulse bg-slate-100 h-3 w-24 rounded"></span>;
    return <span className="truncate max-w-[150px] inline-block align-bottom">{address}</span>;
};
