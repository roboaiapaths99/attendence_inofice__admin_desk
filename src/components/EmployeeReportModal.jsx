import React, { useState, useEffect } from 'react';
import {
    X, Calendar, Clock, MapPin, CheckCircle2,
    AlertCircle, Coffee, Download,
    ChevronRight, User, Fingerprint, Wifi
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatToIST } from '../utils/dateUtils';

const EmployeeReportModal = ({ isOpen, onClose, employee }) => {
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [selectedDay, setSelectedDay] = useState(null);

    useEffect(() => {
        if (isOpen && employee?.email) {
            fetchReport();
        }
    }, [isOpen, employee, month]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/admin/reports/employee-monthly-summary`, {
                params: { email: employee.email, month }
            });
            setData(res.data);
        } catch (err) {
            console.error("Failed to fetch report", err);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white dark:bg-slate-900 w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                            <User size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{data?.full_name || employee?.full_name}</h2>
                            <p className="text-sm text-slate-500">{employee?.email} • {employee?.employee_type || 'Staff'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="month"
                                value={month}
                                onChange={(e) => setMonth(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <X size={24} className="text-slate-400" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {loading ? (
                        <div className="h-64 flex items-center justify-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    ) : data ? (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <SummaryCard
                                    label="Working Days"
                                    value={data.summary.present_days}
                                    icon={<CheckCircle2 className="text-green-500" />}
                                    color="green"
                                />
                                <SummaryCard
                                    label="Total Hours"
                                    value={`${data.summary.total_working_hours}h`}
                                    icon={<Clock className="text-blue-500" />}
                                    color="blue"
                                />
                                <SummaryCard
                                    label="Leaves Taken"
                                    value={data.summary.leaves_taken}
                                    icon={<Coffee className="text-orange-500" />}
                                    color="orange"
                                />
                                <SummaryCard
                                    label="Avg Daily Hours"
                                    value={`${data.summary.average_daily_hours}h`}
                                    icon={<AlertCircle className="text-purple-500" />}
                                    color="purple"
                                />
                            </div>

                            {/* Daily Table */}
                            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-800">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">First IN</th>
                                            <th className="px-6 py-4">Last OUT</th>
                                            <th className="px-6 py-4">Duration</th>
                                            <th className="px-6 py-4 text-center">Status</th>
                                            <th className="px-6 py-4 text-right">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {(data.daily_breakdown || []).map((day) => (
                                            <tr
                                                key={day.date}
                                                className={`hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group cursor-pointer ${selectedDay?.date === day.date ? 'bg-blue-50/50' : ''}`}
                                                onClick={() => setSelectedDay(day)}
                                            >
                                                <td className="px-6 py-4 text-sm font-medium">{day.date}</td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {day.first_in ? formatToIST(day.first_in, { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                                                    {day.last_out ? formatToIST(day.last_out, { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-blue-600">
                                                    {day.duration_hours > 0 ? `${day.duration_hours}h` : '-'}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <StatusBadge status={day.status} />
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <ChevronRight size={18} className="inline text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-20 text-slate-500">No data available for this period.</div>
                    )}
                </div>
            </motion.div>

            {/* Daily Drill-down Sidebar */}
            <AnimatePresence>
                {selectedDay && (
                    <motion.div
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-100 dark:border-slate-800 z-[60] flex flex-col"
                    >
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800">
                            <div>
                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Day Details</h3>
                                <p className="text-sm text-slate-500">{selectedDay.date}</p>
                            </div>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors font-bold">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {selectedDay.logs.length > 0 ? selectedDay.logs.map((log, idx) => (
                                <div key={idx} className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-4 shadow-sm">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2.5 rounded-xl ${log.type === 'check-in' ? 'bg-green-100 text-green-600 dark:bg-green-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                                {log.type === 'check-in' ? <Fingerprint size={18} /> : <X size={18} />}
                                            </div>
                                            <div>
                                                <p className="font-bold capitalize text-slate-900 dark:text-white">{log.type.replace('-', ' ')}</p>
                                                <p className="text-xs text-slate-500">{formatToIST(log.time)}</p>
                                            </div>
                                        </div>
                                        <StatusBadge status={log.status} />
                                    </div>

                                    {log.location && (
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-between group">
                                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
                                                <LocationDisplay lat={log.location.lat} lon={log.location.long} />
                                            </div>
                                            <a
                                                href={`https://www.google.com/maps?q=${log.location.lat},${log.location.long}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider shrink-0 ml-2"
                                            >
                                                Open Map
                                            </a>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-6 pt-2 border-t border-slate-50 dark:border-slate-700/50">
                                        {log.wifi_confidence > 0 && (
                                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                <Wifi size={14} className="text-slate-400" />
                                                <span className="font-medium text-slate-700 dark:text-slate-300">{log.wifi_confidence}% WiFi</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                            <Clock size={14} className="text-slate-400" />
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{log.check_in_method || 'Manual'}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <AlertCircle className="text-slate-300" size={32} />
                                    </div>
                                    <p className="text-slate-500 font-medium">No activity logs for this day.</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const SummaryCard = ({ label, value, icon, color }) => {
    const colorMap = {
        green: "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400",
        blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        orange: "bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400",
        purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
    };

    return (
        <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 shadow-sm flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[color]}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs text-slate-500 font-medium">{label}</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const styles = {
        Present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        Late: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
        "Early Leave": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
        Leave: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
        Weekend: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        Absent: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    };
    return (
        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${styles[status] || styles.Absent}`}>
            {status}
        </span>
    );
};

export default EmployeeReportModal;

// Utility hook to reverse-geocode lat/long
const LocationDisplay = ({ lat, lon }) => {
    const [address, setAddress] = useState(`${lat.toFixed(4)}, ${lon.toFixed(4)}`);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchAddress = async () => {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
                const data = await res.json();
                if (isMounted && data.display_name) {
                    // Extract a simplified address, like suburb + city
                    const parts = [];
                    if (data.address.suburb || data.address.neighbourhood) parts.push(data.address.suburb || data.address.neighbourhood);
                    if (data.address.city || data.address.town) parts.push(data.address.city || data.address.town);
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

    if (loading) return <span className="animate-pulse bg-slate-200 dark:bg-slate-700 h-4 w-32 rounded"></span>;
    return <span className="truncate">{address}</span>;
};
