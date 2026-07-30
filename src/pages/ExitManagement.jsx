import React, { useState, useEffect } from 'react';
import {
    UserMinus,
    Calendar,
    Briefcase,
    CheckCircle,
    XCircle,
    Loader2,
    Plus,
    X,
    Clipboard,
    ChevronRight,
    MapPin,
    AlertCircle,
    DollarSign,
    CheckSquare,
    Square,
    ClipboardCheck,
    Lock,
    HelpCircle,
    Check
} from 'lucide-react';
import api from '../utils/api';

const ExitManagement = () => {
    const [exits, setExits] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedExit, setSelectedExit] = useState(null);
    const [detailTab, setDetailTab] = useState('clearances'); // clearances, settlement, interview
    const [showInitiateModal, setShowInitiateModal] = useState(false);
    
    // Initiate exit form state
    const [newExit, setNewExit] = useState({
        employee_email: '',
        exit_reason: 'resignation', // resignation, termination, retirement, contract_end
        resignation_date: new Date().toISOString().split('T')[0],
        last_working_day: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days notice
        notice_period_days: 30,
        assigned_to: '',
        exit_interviewer: '',
        notes: ''
    });

    const [employees, setEmployees] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);

    // Settlement form state
    const [settlementForm, setSettlementForm] = useState({
        unused_leave_days: 0,
        remaining_days_in_month: 0,
        bonus_due: 0,
        gratuity: 0,
        other_deductions: 0,
        processed: false
    });

    // Interview form state
    const [interviewForm, setInterviewForm] = useState({
        reason_for_leaving: '',
        feedback: '',
        would_rejoin: 'yes',
        improvement_suggestions: ''
    });

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchExits();
        fetchStats();
    }, []);

    useEffect(() => {
        if (showInitiateModal) {
            const loadEmployees = async () => {
                try {
                    const res = await api.get('/admin/employees');
                    setEmployees(res.data);
                } catch (err) {
                    console.error('Error fetching employees:', err);
                }
            };
            loadEmployees();
        } else {
            setSearchQuery('');
        }
    }, [showInitiateModal]);

    useEffect(() => {
        if (selectedId) {
            fetchSingleExit(selectedId);
        } else {
            setSelectedExit(null);
        }
    }, [selectedId]);

    useEffect(() => {
        if (selectedExit) {
            // Load settlement values
            const fs = selectedExit.final_settlement || {};
            setSettlementForm({
                unused_leave_days: fs.unused_leave_days || 0,
                remaining_days_in_month: fs.remaining_days_in_month || 0,
                bonus_due: fs.bonus_due || 0,
                gratuity: fs.gratuity || 0,
                other_deductions: fs.other_deductions || 0,
                processed: fs.processed || false
            });
            // Load interview values
            const ei = selectedExit.exit_interview || {};
            setInterviewForm({
                reason_for_leaving: ei.reason_for_leaving || '',
                feedback: ei.feedback || '',
                would_rejoin: ei.would_rejoin || 'yes',
                improvement_suggestions: ei.improvement_suggestions || ''
            });
        }
    }, [selectedExit]);

    const fetchExits = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/exit-management');
            setExits(res.data);
            if (res.data.length > 0 && !selectedId) {
                setSelectedId(res.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching exits:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/exit-management/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching exit stats:', err);
        }
    };

    const fetchSingleExit = async (id) => {
        try {
            const res = await api.get(`/admin/exit-management/${id}`);
            setSelectedExit(res.data);
        } catch (err) {
            console.error('Error fetching single exit details:', err);
        }
    };

    const handleInitiateExit = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const res = await api.post('/admin/exit-management', newExit);
            alert('Exit/Separation process initiated successfully.');
            setShowInitiateModal(false);
            setNewExit({
                employee_email: '',
                exit_reason: 'resignation',
                resignation_date: new Date().toISOString().split('T')[0],
                last_working_day: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                notice_period_days: 30,
                assigned_to: '',
                exit_interviewer: '',
                notes: ''
            });
            setSearchQuery('');
            fetchExits();
            fetchStats();
            setSelectedId(res.data._id);
        } catch (err) {
            const detail = err.response?.data?.detail;
            const errMsg = typeof detail === 'string'
                ? detail
                : Array.isArray(detail)
                    ? detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n')
                    : err.message;
            alert('Failed to initiate exit: ' + errMsg);
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleChecklist = async (dept, itemIdx, currentStatus) => {
        if (!selectedExit) return;
        const currentItems = [...selectedExit.clearances[dept].items];
        currentItems[itemIdx].done = !currentStatus;
        try {
            const res = await api.put(`/admin/exit-management/${selectedExit._id}/clearance-items`, {
                department: dept,
                items: currentItems
            });
            setSelectedExit(res.data);
            setExits(prev => prev.map(e => e._id === res.data._id ? res.data : e));
        } catch (err) {
            alert('Failed to update checklist item');
        }
    };

    const handleVerifyClearance = async (dept, newStatus) => {
        if (!selectedExit) return;
        try {
            const res = await api.put(`/admin/exit-management/${selectedExit._id}/clearance`, {
                department: dept,
                status: newStatus,
                notes: '',
                cleared_by: ''
            });
            setSelectedExit(res.data);
            setExits(prev => prev.map(e => e._id === res.data._id ? res.data : e));
            alert(`${dept.toUpperCase()} clearance updated.`);
        } catch (err) {
            alert('Failed to verify department clearance');
        }
    };

    const handleCalculateSettlement = async (e) => {
        e.preventDefault();
        if (!selectedExit) return;
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/exit-management/${selectedExit._id}/settlement`, settlementForm);
            setSelectedExit(res.data);
            setExits(prev => prev.map(e => e._id === res.data._id ? res.data : e));
            alert('Final settlement calculated successfully.');
        } catch (err) {
            alert('Settlement calculation failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveInterview = async (e) => {
        e.preventDefault();
        if (!selectedExit) return;
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/exit-management/${selectedExit._id}/interview`, interviewForm);
            setSelectedExit(res.data);
            setExits(prev => prev.map(e => e._id === res.data._id ? res.data : e));
            alert('Exit interview questionnaire logged.');
        } catch (err) {
            alert('Failed to save interview logs');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCompleteExit = async () => {
        if (!selectedExit) return;
        if (!window.confirm(`Are you absolutely sure you want to COMPLETE this exit process? This will officially lock settlement details and DEACTIVATE the employee account in the database (blocking future logins and check-ins).`)) return;
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/exit-management/${selectedExit._id}/complete`);
            alert(res.data.message || 'Exit completed successfully.');
            fetchExits();
            fetchStats();
            if (selectedId) {
                fetchSingleExit(selectedId);
            }
        } catch (err) {
            alert('Failed to complete separation: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    const formatCurrency = (val) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(val || 0);
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Exit Management</h1>
                    <p className="text-slate-500">Track notice periods, manage departmental clearances, and calculate final settlements for departing staff.</p>
                </div>
                <button
                    onClick={() => setShowInitiateModal(true)}
                    className="bg-rose-600 hover:bg-rose-500 text-slate-900 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-rose-950/40"
                >
                    <Plus size={18} /> Initiate Exit Process
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Separations', value: stats.total, color: 'text-[#004B87]', bg: 'bg-[#004B87]/5 border-[#004B87]/10' },
                    { label: 'Active pipelines', value: stats.in_progress, color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/10' },
                    { label: 'Clearances completed', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'Cancelled processes', value: stats.cancelled, color: 'text-slate-500', bg: 'bg-slate-500/5 border-slate-500/10' }
                ].map((s, idx) => (
                    <div key={idx} className={`border p-6 rounded-3xl bg-white backdrop-blur-md border-slate-200`}>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-2">{s.label}</span>
                        <span className={`text-3xl font-black ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Exit Pipelines List */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : exits.length > 0 ? (
                        exits.map((ex) => (
                            <div
                                key={ex._id}
                                onClick={() => setSelectedId(ex._id)}
                                className={`border p-5 rounded-[2rem] transition-all cursor-pointer group bg-white backdrop-blur-md ${
                                    selectedId === ex._id ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 group-hover:text-primary-400 transition-colors text-base truncate leading-tight max-w-[180px]">{ex.employee_name}</h3>
                                        <p className="text-[10px] text-slate-500 truncate mt-1">{ex.employee_email}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(ex.status)}`}>
                                        {ex.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                                    <span className="flex items-center gap-1 font-semibold text-slate-600">
                                        <Briefcase size={12} className="text-slate-500" /> {ex.department}
                                    </span>
                                    <span className="text-[10px] text-slate-500">
                                        LWD: {ex.last_working_day}
                                    </span>
                                </div>
                                {/* Clearance Progress bar */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500 font-bold">Clearance Progress</span>
                                        <span className="text-primary-400 font-black">{ex.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-rose-500 transition-all duration-500"
                                            style={{ width: `${ex.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="border border-dashed border-slate-200 rounded-[2rem] py-16 text-center bg-white">
                            <UserMinus className="mx-auto text-slate-700 mb-3" size={40} />
                            <p className="text-slate-500 text-sm">No exit processes active.</p>
                        </div>
                    )}
                </div>

                {/* Detail View panel */}
                <div className="lg:col-span-2">
                    {selectedExit ? (
                        <div className="bg-white backdrop-blur-md border border-slate-200 rounded-[2.5rem] p-8 space-y-6">
                            {/* Detail header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight leading-none mb-2">{selectedExit.employee_name}</h2>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-slate-500" /> {selectedExit.designation} • {selectedExit.department}
                                    </p>
                                </div>
                                {selectedExit.status === 'in_progress' && (
                                    <button
                                        onClick={handleCompleteExit}
                                        disabled={actionLoading || selectedExit.progress < 100}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/30 flex items-center gap-2"
                                        title={selectedExit.progress < 100 ? 'All 4 clearances must be completed first' : ''}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle size={16} />}
                                        Complete & Block Account
                                    </button>
                                )}
                            </div>

                            {/* Info card */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Exit Reason</span>
                                    <p className="text-slate-800 font-bold capitalize">{selectedExit.exit_reason?.replace('_', ' ')}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Resignation Date</span>
                                    <p className="text-slate-800 font-bold">{selectedExit.resignation_date}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Last Working Day</span>
                                    <p className="text-slate-800 font-bold">{selectedExit.last_working_day}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Notice Period</span>
                                    <p className="text-slate-800 font-bold">{selectedExit.notice_period_days} Days</p>
                                </div>
                            </div>

                            {/* Tab selector */}
                            <div className="flex gap-4 border-b border-slate-200 pb-2">
                                <button
                                    onClick={() => setDetailTab('clearances')}
                                    className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                        detailTab === 'clearances' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-600'
                                    }`}
                                >
                                    Department Clearances
                                </button>
                                <button
                                    onClick={() => setDetailTab('settlement')}
                                    className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                        detailTab === 'settlement' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-600'
                                    }`}
                                >
                                    Final Settlement
                                </button>
                                <button
                                    onClick={() => setDetailTab('interview')}
                                    className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                        detailTab === 'interview' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 hover:text-slate-600'
                                    }`}
                                >
                                    Exit Interview
                                </button>
                            </div>

                            {/* Tab contents */}
                            {detailTab === 'clearances' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['hr', 'it', 'finance', 'assets'].map((dept) => {
                                        const clearance = selectedExit.clearances?.[dept] || {};
                                        const isCompleted = clearance.status === 'completed';
                                        
                                        return (
                                            <div key={dept} className="bg-slate-50 border border-slate-850 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                                                <div>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h4 className="text-xs font-black text-slate-600 uppercase tracking-wider">{dept} Clearance</h4>
                                                        <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                            isCompleted ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                        }`}>
                                                            {clearance.status || 'pending'}
                                                        </span>
                                                    </div>
                                                    
                                                    {/* Checklist items */}
                                                    <div className="space-y-2 mt-2">
                                                        {clearance.items?.map((item, idx) => (
                                                            <div
                                                                key={idx}
                                                                onClick={() => selectedExit.status === 'in_progress' && handleToggleChecklist(dept, idx, item.done)}
                                                                className="flex items-center gap-2 cursor-pointer text-xs"
                                                            >
                                                                <span className={item.done ? 'text-primary-500' : 'text-slate-600'}>
                                                                    {item.done ? <CheckSquare size={16} /> : <Square size={16} />}
                                                                </span>
                                                                <span className={item.done ? 'text-slate-500 line-through' : 'text-slate-600'}>{item.item}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {selectedExit.status === 'in_progress' && !isCompleted && (
                                                    <button
                                                        onClick={() => handleVerifyClearance(dept, 'completed')}
                                                        className="w-full mt-2 py-2 rounded-xl border border-slate-200 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center justify-center gap-1"
                                                    >
                                                        <Check size={12} /> Force Clear
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {detailTab === 'settlement' && (
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Calculations Breakdown</h3>
                                    
                                    <form onSubmit={handleCalculateSettlement} className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-850">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unused Leave Days</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                                                value={settlementForm.unused_leave_days}
                                                onChange={e => setSettlementForm({ ...settlementForm, unused_leave_days: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Remaining Working Days in Month</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                                                value={settlementForm.remaining_days_in_month}
                                                onChange={e => setSettlementForm({ ...settlementForm, remaining_days_in_month: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Gratuity (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                                                value={settlementForm.gratuity}
                                                onChange={e => setSettlementForm({ ...settlementForm, gratuity: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Other Earnings/Bonus (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                                                value={settlementForm.bonus_due}
                                                onChange={e => setSettlementForm({ ...settlementForm, bonus_due: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Other Deductions (₹)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900"
                                                value={settlementForm.other_deductions}
                                                onChange={e => setSettlementForm({ ...settlementForm, other_deductions: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200 mt-5">
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Mark Processed / Paid</span>
                                            <button
                                                type="button"
                                                onClick={() => setSettlementForm({ ...settlementForm, processed: !settlementForm.processed })}
                                                className={`w-9 h-5 rounded-full transition-all duration-300 relative ${
                                                    settlementForm.processed ? 'bg-primary-600' : 'bg-slate-100'
                                                }`}
                                            >
                                                <span className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.5 transition-all duration-300 ${
                                                    settlementForm.processed ? 'left-5' : 'left-0.5'
                                                }`} />
                                            </button>
                                        </div>
                                        <div className="col-span-1 md:col-span-2 flex justify-end pt-3">
                                            <button
                                                type="submit"
                                                disabled={actionLoading || selectedExit.status === 'completed'}
                                                className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-slate-900 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                                            >
                                                Calculate Settlement
                                            </button>
                                        </div>
                                    </form>

                                    {/* Result Breakdown */}
                                    {selectedExit.final_settlement?.calculated && (
                                        <div className="bg-slate-50 border border-slate-850 p-6 rounded-2xl space-y-4 text-xs">
                                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-850 pb-2">Calculated Results</h4>
                                            <div className="grid grid-cols-2 gap-y-2">
                                                <div className="flex justify-between"><span className="text-slate-500">Notice Period Recovery:</span><span className="text-slate-800 font-bold">{formatCurrency(selectedExit.final_settlement.notice_period_recovery)}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Unused Leave Encash:</span><span className="text-emerald-400 font-bold">+{formatCurrency(selectedExit.final_settlement.leave_encashment)}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Remaining Salary Dues:</span><span className="text-emerald-400 font-bold">+{formatCurrency(selectedExit.final_settlement.salary_dues)}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Service Gratuity:</span><span className="text-emerald-400 font-bold">+{formatCurrency(selectedExit.final_settlement.gratuity)}</span></div>
                                                <div className="flex justify-between"><span className="text-slate-500">Other Deductions:</span><span className="text-rose-400 font-bold">-{formatCurrency(selectedExit.final_settlement.other_deductions)}</span></div>
                                                <div className="flex justify-between border-t border-slate-850 pt-2 font-bold text-sm col-span-2">
                                                    <span className="text-slate-900 uppercase tracking-wider">Net Settlement Payout</span>
                                                    <span className={selectedExit.final_settlement.total_payable >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                                        {formatCurrency(selectedExit.final_settlement.total_payable)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {detailTab === 'interview' && (
                                <form onSubmit={handleSaveInterview} className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Exit Interview Questionnaire</h3>
                                    
                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Reason for Leaving</span>
                                            <input
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs text-slate-900 focus:border-primary-500 outline-none"
                                                value={interviewForm.reason_for_leaving}
                                                onChange={e => setInterviewForm({ ...interviewForm, reason_for_leaving: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Interviewer Feedback / Notes</span>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:border-primary-500 outline-none h-20 resize-none"
                                                value={interviewForm.feedback}
                                                onChange={e => setInterviewForm({ ...interviewForm, feedback: e.target.value })}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Would employee rejoin?</span>
                                                <select
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900"
                                                    value={interviewForm.would_rejoin}
                                                    onChange={e => setInterviewForm({ ...interviewForm, would_rejoin: e.target.value })}
                                                >
                                                    <option value="yes">Yes</option>
                                                    <option value="no">No</option>
                                                    <option value="maybe">Maybe</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Improvement Suggestions</span>
                                            <textarea
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs text-slate-900 focus:border-primary-500 outline-none h-20 resize-none"
                                                value={interviewForm.improvement_suggestions}
                                                onChange={e => setInterviewForm({ ...interviewForm, improvement_suggestions: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end pt-3">
                                        <button
                                            type="submit"
                                            disabled={actionLoading || selectedExit.status === 'completed'}
                                            className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-slate-900 font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all"
                                        >
                                            Log Interview Logs
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    ) : (
                        <div className="h-full border border-dashed border-slate-200 rounded-[2.5rem] flex items-center justify-center p-12 text-center bg-white text-slate-600">
                            <div>
                                <UserMinus className="mx-auto mb-4 opacity-15" size={48} />
                                <p className="text-sm font-medium">Select an employee from the separation directory to view clearance checklist.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Initiate Exit Modal */}
            {showInitiateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">Initiate Employee Separation</h2>
                            <button onClick={() => setShowInitiateModal(false)} className="text-slate-500 hover:text-slate-900">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleInitiateExit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1 relative">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 placeholder:text-slate-600"
                                            required
                                            placeholder="Search name or email..."
                                            value={searchQuery}
                                            onChange={e => {
                                                setSearchQuery(e.target.value);
                                                setShowDropdown(true);
                                                if (newExit.employee_email) {
                                                    setNewExit(prev => ({ ...prev, employee_email: '' }));
                                                }
                                            }}
                                            onFocus={() => setShowDropdown(true)}
                                            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                                        />
                                        {searchQuery && (
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setNewExit(prev => ({ ...prev, employee_email: '' }));
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
                                            >
                                                <X size={16} />
                                            </button>
                                        )}
                                    </div>
                                    {showDropdown && (
                                        <div className="absolute z-50 w-full mt-1 bg-slate-50 border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-900">
                                            {employees
                                                .filter(emp => 
                                                    emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                    emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                                )
                                                .map(emp => (
                                                    <button
                                                        key={emp.email}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 hover:bg-primary-500/10 text-sm transition-all flex flex-col"
                                                        onClick={() => {
                                                            setSearchQuery(`${emp.full_name} (${emp.email})`);
                                                            setNewExit(prev => ({ ...prev, employee_email: emp.email }));
                                                            setShowDropdown(false);
                                                        }}
                                                    >
                                                        <span className="font-bold text-slate-900">{emp.full_name}</span>
                                                        <span className="text-[10px] text-slate-500">{emp.email} | {emp.department || 'General'}</span>
                                                    </button>
                                                ))
                                            }
                                            {employees.filter(emp => 
                                                emp.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                                emp.email?.toLowerCase().includes(searchQuery.toLowerCase())
                                            ).length === 0 && (
                                                <div className="px-4 py-3 text-xs text-slate-500">No employees found</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exit Reason</label>
                                    <select
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3.5 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        value={newExit.exit_reason}
                                        onChange={e => setNewExit({ ...newExit, exit_reason: e.target.value })}
                                    >
                                        <option value="resignation">Resignation</option>
                                        <option value="termination">Termination</option>
                                        <option value="retirement">Retirement</option>
                                        <option value="contract_end">Contract End</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Notice Days</label>
                                    <input
                                        type="number"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        required
                                        value={newExit.notice_period_days}
                                        onChange={e => setNewExit({ ...newExit, notice_period_days: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resign Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        required
                                        value={newExit.resignation_date}
                                        onChange={e => setNewExit({ ...newExit, resignation_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Last Day</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        required
                                        value={newExit.last_working_day}
                                        onChange={e => setNewExit({ ...newExit, last_working_day: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Assigned HR Representative</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        required
                                        placeholder="hr@company.com"
                                        value={newExit.assigned_to}
                                        onChange={e => setNewExit({ ...newExit, assigned_to: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exit Interviewer</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                        placeholder="interviewer@company.com"
                                        value={newExit.exit_interviewer}
                                        onChange={e => setNewExit({ ...newExit, exit_interviewer: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Internal Notes</label>
                                <textarea
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 h-20 resize-none"
                                    placeholder="Add any specific instructions or separation notes..."
                                    value={newExit.notes}
                                    onChange={e => setNewExit({ ...newExit, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowInitiateModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-primary-600 text-slate-900 font-bold text-sm flex items-center justify-center gap-2">
                                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                                    Initiate Process
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExitManagement;
