import React, { useState, useEffect } from 'react';
import {
    Landmark,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    Eye,
    CheckCircle,
    Lock,
    DollarSign,
    TrendingUp,
    FileText,
    Plus,
    X,
    Filter,
    Edit2,
    CheckSquare,
    Square,
    Printer,
    Download
} from 'lucide-react';
import api from '../utils/api';

const Payroll = () => {
    // Current payroll month state: Default to previous month or current month
    const getCurrentMonthStr = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    };

    const [payrollMonth, setPayrollMonth] = useState(getCurrentMonthStr());
    const [payrolls, setPayrolls] = useState([]);
    const [stats, setStats] = useState({ total_gross: 0, total_net: 0, total_pf: 0, total_tds: 0, count: 0 });
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [deptFilter, setDeptFilter] = useState('');
    
    // Selection state for bulk approvals
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Modals state
    const [selectedPayroll, setSelectedPayroll] = useState(null); // view payslip modal
    const [editingPayroll, setEditingPayroll] = useState(null); // edit adjustments modal
    const [showRunModal, setShowRunModal] = useState(false); // run monthly payroll modal
    const [showPayModal, setShowPayModal] = useState(null); // mark paid modal (stores payroll object)
    
    // Run monthly payroll form state
    const [runForm, setRunForm] = useState({
        payroll_month: getCurrentMonthStr(),
        department: '',
        auto_approve: false
    });
    
    // Mark paid form state
    const [paymentRef, setPaymentRef] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Days Off modal state
    const [showDaysOffModal, setShowDaysOffModal] = useState(false);
    const [daysOff, setDaysOff] = useState([]);
    const [daysOffMonth, setDaysOffMonth] = useState(getCurrentMonthStr());
    const [daysOffLoading, setDaysOffLoading] = useState(false);

    useEffect(() => {
        fetchPayrolls();
        fetchStats();
    }, [payrollMonth, statusFilter, deptFilter]);

    const fetchPayrolls = async () => {
        try {
            setLoading(true);
            let url = `/admin/payroll?payroll_month=${payrollMonth}`;
            if (statusFilter) url += `&status=${statusFilter}`;
            if (deptFilter) url += `&department=${deptFilter}`;
            
            const res = await api.get(url);
            setPayrolls(res.data);
            setSelectedIds([]);
        } catch (err) {
            console.error('Error fetching payrolls:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get(`/admin/payroll/stats?payroll_month=${payrollMonth}`);
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching payroll stats:', err);
        }
    };

    const shiftMonth = (dir) => {
        const [year, month] = payrollMonth.split('-').map(Number);
        let newYear = year;
        let newMonth = month + dir;
        if (newMonth > 12) {
            newYear += 1;
            newMonth = 1;
        } else if (newMonth < 1) {
            newYear -= 1;
            newMonth = 12;
        }
        setPayrollMonth(`${newYear}-${String(newMonth).padStart(2, '0')}`);
    };

    const handleRunPayroll = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const res = await api.post('/admin/payroll/run-monthly', runForm);
            alert(res.data.message || 'Payroll run processed successfully.');
            setShowRunModal(false);
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Failed to process payroll: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    // Days Off handlers
    const fetchDaysOff = async (month) => {
        try {
            setDaysOffLoading(true);
            const res = await api.get(`/admin/payroll/days-off?payroll_month=${month}`);
            setDaysOff(res.data.days_off || []);
        } catch (err) {
            console.error('Error fetching days off:', err);
            setDaysOff([]);
        } finally {
            setDaysOffLoading(false);
        }
    };

    const handleOpenDaysOff = () => {
        setDaysOffMonth(payrollMonth);
        setShowDaysOffModal(true);
        fetchDaysOff(payrollMonth);
    };

    const toggleDayOff = (day) => {
        setDaysOff(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b));
    };

    const handleSaveDaysOff = async () => {
        try {
            setDaysOffLoading(true);
            await api.post('/admin/payroll/days-off', { payroll_month: daysOffMonth, days_off: daysOff });
            alert('Days off saved successfully.');
            setShowDaysOffModal(false);
        } catch (err) {
            alert('Failed to save days off: ' + (err.response?.data?.detail || err.message));
        } finally {
            setDaysOffLoading(false);
        }
    };

    const getDaysInMonth = (monthStr) => {
        const [y, m] = monthStr.split('-').map(Number);
        return new Date(y, m, 0).getDate();
    };

    const getDayOfWeek = (monthStr, day) => {
        const [y, m] = monthStr.split('-').map(Number);
        return new Date(y, m - 1, day).getDay(); // 0=Sun
    };

    const getDayName = (dow) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dow];

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/payroll/${id}/approve`);
            alert('Payroll approved.');
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Failed to approve');
        }
    };

    const handleBulkApprove = async () => {
        if (selectedIds.length === 0) return;
        try {
            setActionLoading(true);
            await api.post('/admin/payroll/bulk-approve', { ids: selectedIds });
            alert(`Approved ${selectedIds.length} payroll records.`);
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Bulk approval failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleLock = async (id) => {
        try {
            await api.post(`/admin/payroll/${id}/lock`);
            alert('Payroll locked.');
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Failed to lock payroll');
        }
    };

    const handleMarkPaid = async (e) => {
        e.preventDefault();
        if (!showPayModal || !paymentRef.trim()) return;
        try {
            setActionLoading(true);
            await api.post(`/admin/payroll/${showPayModal._id}/mark-paid`, { payment_reference: paymentRef });
            alert('Payroll marked as paid.');
            setShowPayModal(null);
            setPaymentRef('');
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Failed to process payment');
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateAdjustments = async (e) => {
        e.preventDefault();
        if (!editingPayroll) return;
        try {
            setActionLoading(true);
            const res = await api.put(`/admin/payroll/${editingPayroll._id}`, {
                bonus: parseFloat(editingPayroll.bonus) || 0,
                other_earnings: parseFloat(editingPayroll.other_earnings) || 0,
                overtime_hours: parseFloat(editingPayroll.overtime_hours) || 0,
                loan_deductions: parseFloat(editingPayroll.loan_deductions) || 0,
                advance_deductions: parseFloat(editingPayroll.advance_deductions) || 0,
                other_deductions: parseFloat(editingPayroll.other_deductions) || 0
            });
            alert('Adjustments saved successfully.');
            setEditingPayroll(null);
            fetchPayrolls();
            fetchStats();
        } catch (err) {
            alert('Failed to save adjustments');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleSelectAll = () => {
        const drafts = payrolls.filter(p => p.status === 'draft');
        if (selectedIds.length === drafts.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(drafts.map(p => p._id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'locked': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
            case 'approved': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            case 'cancelled': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Payroll Processing</h1>
                    <p className="text-slate-500">Calculate employee salaries, configure deductions, and manage monthly statutory payroll compliance.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleOpenDaysOff}
                        className="border border-slate-300 hover:border-slate-600 text-slate-600 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95"
                    >
                        <Calendar size={16} /> Configure Days Off
                    </button>
                    <button
                        onClick={() => setShowRunModal(true)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                    >
                        <Plus size={18} /> Run Monthly Payroll
                    </button>
                </div>
            </div>

            {/* Controls Bar */}
            <div className="bg-white backdrop-blur-md border border-slate-200 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-200">
                    <button onClick={() => shiftMonth(-1)} className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-black text-slate-800 tracking-widest uppercase flex items-center gap-2 select-none">
                        <Calendar size={16} className="text-primary-500" />
                        {new Date(payrollMonth + "-02").toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </span>
                    <button onClick={() => shiftMonth(1)} className="text-slate-500 hover:text-slate-900 transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-500 text-xs font-bold rounded-xl px-4 py-3 outline-none focus:border-primary-500"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="approved">Approved</option>
                        <option value="locked">Locked</option>
                        <option value="paid">Paid</option>
                    </select>

                    <input
                        type="text"
                        placeholder="Filter department..."
                        className="bg-slate-50 border border-slate-200 text-slate-500 text-xs rounded-xl px-4 py-3 outline-none focus:border-primary-500 placeholder:text-slate-700 font-medium"
                        value={deptFilter}
                        onChange={(e) => setDeptFilter(e.target.value)}
                    />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Gross Salary', value: stats.total_gross, color: 'text-[#004B87]', bg: 'bg-[#004B87]/5 border-[#004B87]/10' },
                    { label: 'Net Take-Home', value: stats.total_net, color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'Statutory PF (Org)', value: stats.total_pf, color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/10' },
                    { label: 'Tax Deducted (TDS)', value: stats.total_tds, color: 'text-rose-500', bg: 'bg-rose-500/5 border-rose-500/10' }
                ].map((s, idx) => (
                    <div key={idx} className={`border p-6 rounded-3xl bg-white backdrop-blur-md border-slate-200`}>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">{s.label}</span>
                        <span className={`text-3xl font-black ${s.color}`}>{formatCurrency(s.value)}</span>
                    </div>
                ))}
            </div>

            {/* List Table */}
            {loading ? (
                <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[2rem] border border-slate-200">
                    <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                    <p className="text-slate-500 text-sm font-medium">Computing payroll details...</p>
                </div>
            ) : (
                <div className="bg-white backdrop-blur-md border border-slate-200 rounded-[2rem] overflow-hidden shadow-2xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200">
                                    <th className="px-6 py-5 w-10">
                                        <button onClick={toggleSelectAll} className="text-slate-500 hover:text-primary-500 transition-colors">
                                            {selectedIds.length === payrolls.filter(p => p.status === 'draft').length && payrolls.filter(p => p.status === 'draft').length > 0 ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} />}
                                        </button>
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Employee</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Working / Present</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Gross Salary</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Deductions</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Net Payout</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {payrolls.map((p) => {
                                    const isSelected = selectedIds.includes(p._id);
                                    const isDraft = p.status === 'draft';
                                    return (
                                        <tr key={p._id} className={`group transition-colors ${isSelected ? 'bg-primary-600/5' : 'hover:bg-slate-100'}`}>
                                            <td className="px-6 py-4">
                                                {isDraft ? (
                                                    <button onClick={() => toggleSelect(p._id)} className={`${isSelected ? 'text-primary-500' : 'text-slate-700'}`}>
                                                        {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                    </button>
                                                ) : (
                                                    <div className="w-5" />
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 leading-tight">{p.employee_name}</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide mt-1">{p.department} • {p.designation}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600">{p.present_days} / {p.working_days} Days</p>
                                                    <p className="text-[9px] text-slate-500 mt-1">Absents: {p.absent_days} • Leaves: {p.leave_days}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-slate-800">{formatCurrency(p.gross_salary)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-bold text-rose-400">{formatCurrency(p.total_deductions)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-bold text-emerald-400">{formatCurrency(p.net_salary)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusColor(p.status)}`}>
                                                    {p.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => setSelectedPayroll(p)}
                                                        title="View Payslip"
                                                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    {p.status === 'draft' && (
                                                        <>
                                                            <button
                                                                onClick={() => setEditingPayroll({ ...p })}
                                                                title="Adjust Earnings/Deductions"
                                                                className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleApprove(p._id)}
                                                                title="Approve Calculations"
                                                                className="p-2 hover:bg-emerald-500/10 rounded-xl text-slate-500 hover:text-emerald-500 transition-all"
                                                            >
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}

                                                    {p.status === 'approved' && (
                                                        <button
                                                            onClick={() => handleLock(p._id)}
                                                            title="Lock & Finalize"
                                                            className="p-2 hover:bg-violet-500/10 rounded-xl text-slate-500 hover:text-violet-400 transition-all"
                                                        >
                                                            <Lock size={16} />
                                                        </button>
                                                    )}

                                                    {p.status === 'locked' && (
                                                        <button
                                                            onClick={() => setShowPayModal(p)}
                                                            className="bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border border-emerald-500/20"
                                                        >
                                                            Payout
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Floating Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-slate-300 px-6 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 z-[99]">
                    <span className="text-xs font-bold text-slate-500">Selected {selectedIds.length} draft items</span>
                    <button
                        onClick={handleBulkApprove}
                        disabled={actionLoading}
                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 font-bold text-xs uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-1"
                    >
                        {actionLoading ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />}
                        Approve Selected
                    </button>
                </div>
            )}

            {/* Run Payroll Modal */}
            {showRunModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Generate Payroll Run</h2>
                            <button onClick={() => setShowRunModal(false)} className="text-slate-500 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleRunPayroll} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Month</label>
                                <input
                                    type="month"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    required
                                    value={runForm.payroll_month}
                                    onChange={e => setRunForm({ ...runForm, payroll_month: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department Filter (Optional)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    placeholder="e.g. Engineering (Leave blank for all)"
                                    value={runForm.department}
                                    onChange={e => setRunForm({ ...runForm, department: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                <div>
                                    <p className="text-xs font-bold text-slate-900">Auto-Approve Calculations</p>
                                    <p className="text-[9px] text-slate-500">Instantly flag calculations as Approved without draft stage</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setRunForm({ ...runForm, auto_approve: !runForm.auto_approve })}
                                    className={`w-11 h-6 rounded-full transition-all duration-300 relative ${
                                        runForm.auto_approve ? 'bg-primary-600' : 'bg-slate-100'
                                    }`}
                                >
                                    <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-300 ${
                                        runForm.auto_approve ? 'left-6' : 'left-1'
                                    }`} />
                                </button>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowRunModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={actionLoading}
                                    className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                                    Run Calculation
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Adjustments (Edit) Modal */}
            {editingPayroll && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Manual Adjustments</h2>
                                <p className="text-xs text-slate-500 mt-1">Configure variable bonuses, overtime, or custom deductions for {editingPayroll.employee_name}</p>
                            </div>
                            <button onClick={() => setEditingPayroll(null)} className="text-slate-500 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateAdjustments} className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-850">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Earnings Details</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Overtime Hours</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.overtime_hours || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, overtime_hours: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Performance Bonus</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.bonus || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, bonus: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Other Earnings</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.other_earnings || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, other_earnings: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-850">
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2">Adjusted Deductions</p>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Loan Recovery</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.loan_deductions || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, loan_deductions: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Salary Advance</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.advance_deductions || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, advance_deductions: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Other Deducts</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900"
                                            value={editingPayroll.other_deductions || ''}
                                            onChange={e => setEditingPayroll({ ...editingPayroll, other_deductions: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button type="button" onClick={() => setEditingPayroll(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2">
                                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                                    Save Adjustments
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payout (Mark Paid) Modal */}
            {showPayModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Record Payout</h2>
                            <button onClick={() => setShowPayModal(null)} className="text-slate-500 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleMarkPaid} className="space-y-4">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-850 text-xs text-slate-500 space-y-2 mb-4">
                                <div className="flex justify-between">
                                    <span>Employee:</span>
                                    <span className="font-bold text-slate-800">{showPayModal.employee_name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Net Payout Amount:</span>
                                    <span className="font-bold text-emerald-400">{formatCurrency(showPayModal.net_salary)}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-850 pt-2">
                                    <span>Bank Target:</span>
                                    <span className="font-bold text-slate-800">{showPayModal.bank_name || 'N/A'} (Acc: {showPayModal.bank_account || 'N/A'})</span>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Reference ID (Bank UTR)</label>
                                <input
                                    type="text"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 font-mono uppercase"
                                    required
                                    placeholder="e.g. UTR123456789"
                                    value={paymentRef}
                                    onChange={e => setPaymentRef(e.target.value)}
                                />
                            </div>
                            
                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowPayModal(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={actionLoading || !paymentRef.trim()}
                                    className="flex-1 py-3 rounded-xl bg-emerald-600 text-slate-900 font-bold text-sm flex items-center justify-center gap-2"
                                >
                                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                                    Confirm Payment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Payslip View Modal */}
            {selectedPayroll && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-50 backdrop-blur-md overflow-y-auto">
                    <div className="bg-white border border-slate-200 w-full max-w-xl rounded-[2.5rem] p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-[#004B87] to-primary-500" />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Employee Payslip</h2>
                                <p className="text-xs text-slate-500 mt-1">Salary breakdown for the period of {selectedPayroll.payroll_month}</p>
                            </div>
                            <button onClick={() => setSelectedPayroll(null)} className="text-slate-500 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Printable Area */}
                        <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50 space-y-6">
                            {/* Company Branding */}
                            <div className="flex justify-between items-center border-b border-slate-200 pb-4">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 tracking-tight uppercase">OfficeFlow Attendance System</h3>
                                    <span className="text-[9px] text-primary-500 font-bold uppercase tracking-widest">Enterprise Payslip</span>
                                </div>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${getStatusColor(selectedPayroll.status)}`}>
                                    {selectedPayroll.status}
                                </span>
                            </div>

                            {/* Employee Metadata */}
                            <div className="grid grid-cols-2 gap-y-3 gap-x-6 text-xs border-b border-slate-200 pb-4">
                                <div className="flex justify-between"><span className="text-slate-500">Employee Name:</span><span className="text-slate-800 font-bold">{selectedPayroll.employee_name}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Employee ID:</span><span className="text-slate-800 font-bold">{selectedPayroll.employee_id}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Department:</span><span className="text-slate-800 font-bold">{selectedPayroll.department}</span></div>
                                <div className="flex justify-between"><span className="text-slate-500">Designation:</span><span className="text-slate-800 font-bold">{selectedPayroll.designation}</span></div>
                                <div className="flex justify-between border-t border-slate-850 pt-2"><span className="text-slate-500">Working Days:</span><span className="text-slate-800 font-bold">{selectedPayroll.working_days} Days</span></div>
                                <div className="flex justify-between border-t border-slate-850 pt-2"><span className="text-slate-500">Present Days:</span><span className="text-slate-800 font-bold">{selectedPayroll.present_days} Days</span></div>
                            </div>

                            {/* Earnings & Deductions Split */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                {/* Earnings */}
                                <div className="space-y-2">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-850">Earnings Breakup</h4>
                                    <div className="flex justify-between"><span>Basic Salary</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.basic_salary)}</span></div>
                                    <div className="flex justify-between"><span>HRA Allowance</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.hra)}</span></div>
                                    <div className="flex justify-between"><span>Special Allowance</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.special_allowance)}</span></div>
                                    {selectedPayroll.lop_deduction > 0 && (
                                        <div className="flex justify-between text-rose-400"><span>LOP Deduction</span><span>-{formatCurrency(selectedPayroll.lop_deduction)}</span></div>
                                    )}
                                    {selectedPayroll.overtime_amount > 0 && (
                                        <div className="flex justify-between text-[#0062B1]"><span>Overtime ({selectedPayroll.overtime_hours} hrs)</span><span>+{formatCurrency(selectedPayroll.overtime_amount)}</span></div>
                                    )}
                                    {selectedPayroll.bonus > 0 && (
                                        <div className="flex justify-between text-emerald-400"><span>Variable Bonus</span><span>+{formatCurrency(selectedPayroll.bonus)}</span></div>
                                    )}
                                    {selectedPayroll.other_earnings > 0 && (
                                        <div className="flex justify-between text-[#0062B1]"><span>Other Allowances</span><span>+{formatCurrency(selectedPayroll.other_earnings)}</span></div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-slate-800">
                                        <span>Gross Monthly Salary</span>
                                        <span>{formatCurrency(selectedPayroll.gross_salary)}</span>
                                    </div>
                                </div>

                                {/* Deductions */}
                                <div className="space-y-2 border-t md:border-t-0 md:border-l border-slate-200 md:pl-6">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-2 pb-1 border-b border-slate-850">Deductions Breakup</h4>
                                    <div className="flex justify-between"><span>Provident Fund (PF)</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.pf_employee)}</span></div>
                                    <div className="flex justify-between"><span>State ESI</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.esi_employee)}</span></div>
                                    <div className="flex justify-between"><span>Professional Tax (PT)</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.professional_tax)}</span></div>
                                    <div className="flex justify-between"><span>Income Tax (TDS)</span><span className="text-slate-800 font-semibold">{formatCurrency(selectedPayroll.income_tax_tds)}</span></div>
                                    {selectedPayroll.loan_deductions > 0 && (
                                        <div className="flex justify-between text-rose-400"><span>Loan Recovery</span><span>{formatCurrency(selectedPayroll.loan_deductions)}</span></div>
                                    )}
                                    {selectedPayroll.advance_deductions > 0 && (
                                        <div className="flex justify-between text-rose-400"><span>Salary Advance</span><span>{formatCurrency(selectedPayroll.advance_deductions)}</span></div>
                                    )}
                                    {selectedPayroll.other_deductions > 0 && (
                                        <div className="flex justify-between text-rose-400"><span>Other Deducts</span><span>{formatCurrency(selectedPayroll.other_deductions)}</span></div>
                                    )}
                                    <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-rose-400">
                                        <span>Total Deductions</span>
                                        <span>{formatCurrency(selectedPayroll.total_deductions)}</span>
                                    </div>
                                </div>
                            </div>

                            {(selectedPayroll.travel_reimbursement > 0 || selectedPayroll.expense_claims > 0) && (
                                <div className="border-t border-slate-200 pt-4 space-y-2 text-xs">
                                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 pb-1 border-b border-slate-850">Reimbursements (Non-Taxable)</h4>
                                    {selectedPayroll.travel_reimbursement > 0 && (
                                        <div className="flex justify-between"><span>KM Travel Reimbursement</span><span className="text-emerald-400 font-semibold">+{formatCurrency(selectedPayroll.travel_reimbursement)}</span></div>
                                    )}
                                    {selectedPayroll.expense_claims > 0 && (
                                        <div className="flex justify-between"><span>Approved Expense Claims</span><span className="text-emerald-400 font-semibold">+{formatCurrency(selectedPayroll.expense_claims)}</span></div>
                                    )}
                                </div>
                            )}

                            {/* Net Payout Highlight */}
                            <div className="bg-white border border-slate-200 p-4 rounded-xl flex justify-between items-center text-sm font-bold">
                                <div>
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">Net Take-Home Salary</span>
                                    <span className="text-emerald-400 text-xl font-black">{formatCurrency(selectedPayroll.net_salary)}</span>
                                </div>
                                <div className="text-right text-xs">
                                    <p className="text-slate-600 font-bold">{selectedPayroll.bank_name || 'Bank N/A'}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Acc: {selectedPayroll.bank_account || 'N/A'} • {selectedPayroll.bank_ifsc || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Payment reference if paid */}
                            {selectedPayroll.status === 'paid' && (
                                <div className="bg-emerald-500/5 border border-emerald-500/25 p-3 rounded-xl flex justify-between items-center text-[10px] text-emerald-400 font-bold">
                                    <span>UTR Reference: {selectedPayroll.payment_reference}</span>
                                    <span>Payment Date: {selectedPayroll.payment_date}</span>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex gap-4 mt-6">
                            <button
                                onClick={() => window.print()}
                                className="flex-1 py-3 border border-slate-200 rounded-xl text-slate-500 hover:text-slate-900 transition-all font-bold text-sm flex items-center justify-center gap-1.5"
                            >
                                <Printer size={16} /> Print Payslip
                            </button>
                            <button
                                onClick={() => setSelectedPayroll(null)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200:bg-slate-700 text-slate-900 rounded-xl transition-all font-bold text-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Days Off Configuration Modal */}
            {showDaysOffModal && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Configure Days Off</h2>
                                <p className="text-xs text-slate-500 mt-1">Mark non-working days (holidays, weekends) for {new Date(daysOffMonth + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}. Employees are paid for these days but absences won't be marked.</p>
                            </div>
                            <button onClick={() => setShowDaysOffModal(false)} className="text-slate-500 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>

                        {daysOffLoading ? (
                            <div className="py-12 flex justify-center">
                                <Loader2 className="animate-spin text-primary-500" size={32} />
                            </div>
                        ) : (
                            <>
                                {/* Quick select buttons */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const sundays = [];
                                            const total = getDaysInMonth(daysOffMonth);
                                            for (let d = 1; d <= total; d++) {
                                                if (getDayOfWeek(daysOffMonth, d) === 0) sundays.push(d);
                                            }
                                            setDaysOff(sundays);
                                        }}
                                        className="text-[10px] font-bold text-slate-500 border border-slate-300 px-3 py-1.5 rounded-lg hover:border-primary-500 hover:text-primary-400 transition-all"
                                    >
                                        Select Sundays Only
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const weekends = [];
                                            const total = getDaysInMonth(daysOffMonth);
                                            for (let d = 1; d <= total; d++) {
                                                const dow = getDayOfWeek(daysOffMonth, d);
                                                if (dow === 0 || dow === 6) weekends.push(d);
                                            }
                                            setDaysOff(weekends);
                                        }}
                                        className="text-[10px] font-bold text-slate-500 border border-slate-300 px-3 py-1.5 rounded-lg hover:border-primary-500 hover:text-primary-400 transition-all"
                                    >
                                        Sat + Sun
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDaysOff([])}
                                        className="text-[10px] font-bold text-slate-500 border border-slate-300 px-3 py-1.5 rounded-lg hover:border-rose-500 hover:text-rose-400 transition-all"
                                    >
                                        Clear All
                                    </button>
                                </div>

                                {/* Calendar grid header */}
                                <div className="grid grid-cols-7 gap-1 mb-1">
                                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                        <div key={d} className="text-center text-[9px] font-black text-slate-600 uppercase tracking-widest py-1">{d}</div>
                                    ))}
                                </div>

                                {/* Calendar grid */}
                                <div className="grid grid-cols-7 gap-1">
                                    {/* Empty cells for days before month start */}
                                    {Array.from({ length: getDayOfWeek(daysOffMonth, 1) }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {/* Day buttons */}
                                    {Array.from({ length: getDaysInMonth(daysOffMonth) }).map((_, i) => {
                                        const day = i + 1;
                                        const isOff = daysOff.includes(day);
                                        const dow = getDayOfWeek(daysOffMonth, day);
                                        const isSunday = dow === 0;
                                        return (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDayOff(day)}
                                                className={`aspect-square rounded-xl text-xs font-bold transition-all border ${
                                                    isOff
                                                        ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                                                        : isSunday
                                                            ? 'bg-slate-100 border-slate-300 text-slate-500'
                                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-600'
                                                }`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="mt-4 flex items-center gap-4 text-[9px] text-slate-500 font-bold">
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/30 border border-rose-500/40 inline-block" /> Day Off (Paid)</span>
                                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-200 inline-block" /> Working Day</span>
                                    <span className="ml-auto">{daysOff.length} days off selected</span>
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowDaysOffModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm">Cancel</button>
                                    <button
                                        onClick={handleSaveDaysOff}
                                        disabled={daysOffLoading}
                                        className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm flex items-center justify-center gap-2"
                                    >
                                        {daysOffLoading && <Loader2 className="animate-spin" size={16} />}
                                        Save Days Off
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Payroll;
