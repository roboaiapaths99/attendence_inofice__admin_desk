import React, { useState, useEffect } from 'react';
import {
    User,
    UserPlus,
    Calendar,
    Briefcase,
    CheckSquare,
    Square,
    Loader2,
    Plus,
    X,
    FileText,
    Check,
    AlertCircle,
    UserCheck,
    Clock,
    Clipboard,
    Bookmark,
    Trash2,
    TrendingUp
} from 'lucide-react';
import api from '../utils/api';

const Onboarding = () => {
    const [onboardings, setOnboardings] = useState([]);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_progress: 0, completed: 0, overdue: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedOnb, setSelectedOnb] = useState(null);
    const [detailTab, setDetailTab] = useState('tasks'); // 'tasks' or 'documents'
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Create new onboarding form state
    const [newOnb, setNewOnb] = useState({
        employee_email: '',
        employee_name: '',
        department: '',
        designation: '',
        start_date: new Date().toISOString().split('T')[0],
        expected_completion_date: '', // optional
        assigned_to: '',
        buddy: '',
        notes: ''
    });
    
    // Custom task form state
    const [showAddTask, setShowAddTask] = useState(false);
    const [customTask, setCustomTask] = useState({
        title: '',
        category: 'HR', // HR, IT, Team, Compliance
        due_date: new Date().toISOString().split('T')[0]
    });

    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchOnboardings();
        fetchStats();
    }, []);

    useEffect(() => {
        if (selectedId) {
            fetchSingleOnboarding(selectedId);
        } else {
            setSelectedOnb(null);
        }
    }, [selectedId]);

    const fetchOnboardings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/onboarding');
            setOnboardings(res.data);
            if (res.data.length > 0 && !selectedId) {
                setSelectedId(res.data[0]._id);
            }
        } catch (err) {
            console.error('Error fetching onboardings:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/admin/onboarding/stats');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching onboarding stats:', err);
        }
    };

    const fetchSingleOnboarding = async (id) => {
        try {
            const res = await api.get(`/admin/onboarding/${id}`);
            setSelectedOnb(res.data);
        } catch (err) {
            console.error('Error fetching single onboarding:', err);
        }
    };

    const handleCreateOnboarding = async (e) => {
        e.preventDefault();
        try {
            setActionLoading(true);
            const res = await api.post('/admin/onboarding', newOnb);
            alert('Onboarding pipeline initialized successfully.');
            setShowCreateModal(false);
            setNewOnb({
                employee_email: '',
                employee_name: '',
                department: '',
                designation: '',
                start_date: new Date().toISOString().split('T')[0],
                expected_completion_date: '',
                assigned_to: '',
                buddy: '',
                notes: ''
            });
            fetchOnboardings();
            fetchStats();
            setSelectedId(res.data._id);
        } catch (err) {
            alert('Failed to create onboarding: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleTask = async (taskId, currentStatus) => {
        if (!selectedOnb) return;
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            const res = await api.put(`/admin/onboarding/${selectedOnb._id}/tasks/${taskId}`, { status: newStatus });
            setSelectedOnb(res.data);
            // Update in lists
            setOnboardings(prev => prev.map(o => o._id === res.data._id ? res.data : o));
        } catch (err) {
            alert('Failed to update task status');
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!selectedOnb || !customTask.title.trim()) return;
        try {
            const res = await api.post(`/admin/onboarding/${selectedOnb._id}/tasks`, {
                task_id: '',
                title: customTask.title,
                category: customTask.category,
                due_date: customTask.due_date,
                status: 'pending'
            });
            setSelectedOnb(res.data);
            setOnboardings(prev => prev.map(o => o._id === res.data._id ? res.data : o));
            setCustomTask({ title: '', category: 'HR', due_date: new Date().toISOString().split('T')[0] });
            setShowAddTask(false);
        } catch (err) {
            alert('Failed to add custom task');
        }
    };

    const handleVerifyDocument = async (docType, isVerified) => {
        if (!selectedOnb) return;
        try {
            const res = await api.post(`/admin/onboarding/${selectedOnb._id}/documents`, {
                type: docType,
                verified: isVerified
            });
            setSelectedOnb(res.data);
            setOnboardings(prev => prev.map(o => o._id === res.data._id ? res.data : o));
        } catch (err) {
            alert('Failed to verify document');
        }
    };

    const handleCompleteOnboarding = async () => {
        if (!selectedOnb) return;
        if (!window.confirm(`Mark ${selectedOnb.employee_name}'s onboarding as COMPLETED? This will automatically register/activate their employee user profile in the system.`)) return;
        try {
            setActionLoading(true);
            const res = await api.post(`/admin/onboarding/${selectedOnb._id}/complete`);
            alert(res.data.message || 'Onboarding completed successfully.');
            fetchOnboardings();
            fetchStats();
            if (selectedId) {
                fetchSingleOnboarding(selectedId);
            }
        } catch (err) {
            alert('Failed to complete onboarding: ' + (err.response?.data?.detail || err.message));
        } finally {
            setActionLoading(false);
        }
    };

    const getStatusStyles = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
            case 'cancelled': return 'bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20';
            case 'in_progress': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
            default: return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
        }
    };

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Onboarding Pipelines</h1>
                    <p className="text-slate-500 dark:text-slate-400">Track and manage onboarding procedures, document submissions, and check-in clearances.</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-primary-600 hover:bg-primary-500 text-slate-900 dark:text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                >
                    <Plus size={18} /> Initiate Onboarding
                </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: 'Total Pipelines', value: stats.total, color: 'text-blue-500', bg: 'bg-blue-500/5 border-blue-500/10' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-500', bg: 'bg-amber-500/5 border-amber-500/10' },
                    { label: 'In Progress', value: stats.in_progress, color: 'text-indigo-500', bg: 'bg-indigo-500/5 border-indigo-500/10' },
                    { label: 'Completed', value: stats.completed, color: 'text-emerald-500', bg: 'bg-emerald-500/5 border-emerald-500/10' },
                    { label: 'Overdue Pipelines', value: stats.overdue, color: 'text-rose-500', bg: 'bg-rose-500/5 border-rose-500/10 animate-pulse' }
                ].map((s, idx) => (
                    <div key={idx} className={`border p-5 rounded-2xl ${s.bg}`}>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block mb-1">{s.label}</span>
                        <span className={`text-2xl font-bold ${s.color}`}>{s.value}</span>
                    </div>
                ))}
            </div>

            {/* Split layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Onboarding List */}
                <div className="lg:col-span-1 space-y-4">
                    {loading ? (
                        <div className="py-20 flex justify-center">
                            <Loader2 className="animate-spin text-primary-500" size={32} />
                        </div>
                    ) : onboardings.length > 0 ? (
                        onboardings.map((onb) => (
                            <div
                                key={onb._id}
                                onClick={() => setSelectedId(onb._id)}
                                className={`border p-5 rounded-[2rem] transition-all cursor-pointer group bg-white dark:bg-white dark:bg-slate-900/40 backdrop-blur-md ${
                                    selectedId === onb._id ? 'border-primary-500 ring-1 ring-primary-500/20' : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:border-slate-700'
                                }`}
                            >
                                <div className="flex justify-between items-start gap-2 mb-3">
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white group-hover:text-primary-400 transition-colors text-base truncate leading-tight max-w-[180px]">{onb.employee_name}</h3>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-1">{onb.employee_email}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${getStatusStyles(onb.status)}`}>
                                        {onb.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-950/30 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800/30">
                                    <span className="flex items-center gap-1 font-semibold text-slate-600 dark:text-slate-300">
                                        <Briefcase size={12} className="text-slate-500 dark:text-slate-400" /> {onb.department}
                                    </span>
                                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        Start: {onb.start_date}
                                    </span>
                                </div>
                                {/* Progress track */}
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px]">
                                        <span className="text-slate-500 dark:text-slate-400 font-bold">Progress</span>
                                        <span className="text-primary-400 font-black">{onb.progress}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary-500 transition-all duration-500"
                                            style={{ width: `${onb.progress}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] py-16 text-center bg-white dark:bg-slate-900/10">
                            <Clipboard className="mx-auto text-slate-700 mb-3" size={40} />
                            <p className="text-slate-500 dark:text-slate-400 text-sm">No onboarding processes logged.</p>
                        </div>
                    )}
                </div>

                {/* Detail view */}
                <div className="lg:col-span-2">
                    {selectedOnb ? (
                        <div className="bg-white dark:bg-white dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 space-y-6">
                            {/* Detail header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-200 dark:border-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-none mb-2">{selectedOnb.employee_name}</h2>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                                        <Briefcase size={14} className="text-slate-500 dark:text-slate-400" /> {selectedOnb.designation} • {selectedOnb.department}
                                    </p>
                                </div>
                                {selectedOnb.status !== 'completed' && (
                                    <button
                                        onClick={handleCompleteOnboarding}
                                        disabled={actionLoading}
                                        className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-900 dark:text-white font-bold text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all shadow-lg shadow-emerald-950/30 flex items-center gap-2"
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" size={14} /> : <UserCheck size={16} />}
                                        Complete Onboarding
                                    </button>
                                )}
                            </div>

                            {/* Info card */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-950/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-200 dark:border-slate-800/50">
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Start Date</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-slate-500 dark:text-slate-400" /> {selectedOnb.start_date}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Expected Completion</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <Calendar size={14} className="text-slate-500 dark:text-slate-400" /> {selectedOnb.expected_completion_date || 'Not Set'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Assigned HR Buddy</span>
                                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                                        <User size={14} className="text-slate-500 dark:text-slate-400" /> {selectedOnb.buddy || 'Not Assigned'}
                                    </p>
                                </div>
                            </div>

                            {/* Tab selector */}
                            <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2">
                                <button
                                    onClick={() => setDetailTab('tasks')}
                                    className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                        detailTab === 'tasks' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    Onboarding Tasks ({selectedOnb.tasks?.length || 0})
                                </button>
                                <button
                                    onClick={() => setDetailTab('documents')}
                                    className={`pb-2 text-xs font-black uppercase tracking-widest border-b-2 transition-all ${
                                        detailTab === 'documents' ? 'border-primary-500 text-primary-500' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300'
                                    }`}
                                >
                                    Verification Documents ({selectedOnb.documents_required?.length || 0})
                                </button>
                            </div>

                            {/* Tab content */}
                            {detailTab === 'tasks' && (
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tasks List</h3>
                                        {selectedOnb.status !== 'completed' && (
                                            <button
                                                onClick={() => setShowAddTask(!showAddTask)}
                                                className="text-xs font-bold text-primary-500 hover:text-primary-400 flex items-center gap-1"
                                            >
                                                <Plus size={14} /> Add Custom Task
                                            </button>
                                        )}
                                    </div>

                                    {showAddTask && (
                                        <form onSubmit={handleAddTask} className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in slide-in-from-top-4 duration-200">
                                            <div className="space-y-1.5">
                                                <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Task Title</label>
                                                <input
                                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                                    required
                                                    placeholder="e.g. Sign NDA document"
                                                    value={customTask.title}
                                                    onChange={e => setCustomTask({ ...customTask, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Category</label>
                                                    <select
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                                        value={customTask.category}
                                                        onChange={e => setCustomTask({ ...customTask, category: e.target.value })}
                                                    >
                                                        {['HR', 'IT', 'Team', 'Compliance'].map(cat => (
                                                            <option key={cat} value={cat}>{cat}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">Due Date</label>
                                                    <input
                                                        type="date"
                                                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white"
                                                        value={customTask.due_date}
                                                        onChange={e => setCustomTask({ ...customTask, due_date: e.target.value })}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-3 pt-2">
                                                <button type="button" onClick={() => setShowAddTask(false)} className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400">Cancel</button>
                                                <button type="submit" className="px-4 py-2 bg-primary-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white">Save Task</button>
                                            </div>
                                        </form>
                                    )}

                                    <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
                                        {selectedOnb.tasks && selectedOnb.tasks.length > 0 ? (
                                            selectedOnb.tasks.map((task) => {
                                                const isCompleted = task.status === 'completed';
                                                return (
                                                    <div
                                                        key={task.task_id}
                                                        onClick={() => selectedOnb.status !== 'completed' && handleToggleTask(task.task_id, task.status)}
                                                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                                            isCompleted
                                                                ? 'bg-white dark:bg-slate-900/20 border-slate-850/50 opacity-60'
                                                                : 'bg-slate-50 dark:bg-slate-950 border-slate-850 hover:border-slate-200 dark:border-slate-800 cursor-pointer'
                                                        }`}
                                                    >
                                                        <div className={`transition-colors ${isCompleted ? 'text-primary-500' : 'text-slate-600'}`}>
                                                            {isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className={`text-xs font-bold truncate ${isCompleted ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
                                                                {task.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded">
                                                                    {task.category}
                                                                </span>
                                                                {task.due_date && (
                                                                    <span className="text-[9px] text-slate-600 font-medium">Due: {task.due_date}</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <p className="text-slate-500 dark:text-slate-400 text-xs py-8 text-center uppercase tracking-widest font-black">No tasks created</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {detailTab === 'documents' && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Required Documents</h3>
                                    <div className="space-y-3">
                                        {selectedOnb.documents_required?.map((docType) => {
                                            const submitted = selectedOnb.documents_submitted?.find(d => d.type === docType);
                                            const isVerified = submitted?.verified;
                                            const baseURL = api.defaults.baseURL || 'https://logday-api.duckdns.org';
                                            return (
                                                <div key={docType} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 border border-slate-850 rounded-xl">
                                                    <div>
                                                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">{docType.replace('_', ' ')}</p>
                                                        <p className="text-[9px] text-slate-500 dark:text-slate-400 mt-1">
                                                            {submitted 
                                                                ? `${isVerified ? 'Verified' : 'Submitted (Awaiting Audit)'} on ${submitted.submitted_at?.split('T')[0]}`
                                                                : 'Awaiting submission & audit'}
                                                        </p>
                                                        {submitted?.verification_message && (
                                                            <p className="text-[9px] text-primary-400 mt-1 font-semibold italic">
                                                                {submitted.verification_message}
                                                            </p>
                                                        )}
                                                        {submitted?.file_url && (
                                                            <a 
                                                                href={`${baseURL}${submitted.file_url}`}
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                                className="text-[10px] text-primary-500 hover:text-primary-400 hover:underline mt-2 inline-block font-bold"
                                                            >
                                                                View Uploaded Document
                                                            </a>
                                                        )}
                                                    </div>
                                                    {selectedOnb.status !== 'completed' ? (
                                                        <button
                                                            onClick={() => handleVerifyDocument(docType, !isVerified)}
                                                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${
                                                                isVerified
                                                                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white'
                                                            }`}
                                                        >
                                                            {isVerified ? 'Verified' : 'Verify'}
                                                        </button>
                                                    ) : (
                                                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                                            isVerified ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                        }`}>
                                                            {isVerified ? 'Submitted & Verified' : 'Missing'}
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Notes */}
                            {selectedOnb.notes && (
                                <div className="space-y-1.5 border-t border-slate-200 dark:border-slate-200 dark:border-slate-800/50 pt-4">
                                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">HR Checklist & Notes</span>
                                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-500 dark:text-slate-400 italic">
                                        "{selectedOnb.notes}"
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center p-12 text-center bg-white dark:bg-slate-900/10 text-slate-600">
                            <div>
                                <Clipboard className="mx-auto mb-4 opacity-15" size={48} />
                                <p className="text-sm font-medium">Select an employee from the pipeline to view tasks checklist.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Initiate Onboarding Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Initiate Joining Process</h2>
                            <button onClick={() => setShowCreateModal(false)} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:text-white">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateOnboarding} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">New Hire Name</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        placeholder="John Doe"
                                        value={newOnb.employee_name}
                                        onChange={e => setNewOnb({ ...newOnb, employee_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Personal Email</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        placeholder="john@company.com"
                                        value={newOnb.employee_email}
                                        onChange={e => setNewOnb({ ...newOnb, employee_email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Department</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        placeholder="Engineering"
                                        value={newOnb.department}
                                        onChange={e => setNewOnb({ ...newOnb, department: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Designation</label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        placeholder="Software Engineer"
                                        value={newOnb.designation}
                                        onChange={e => setNewOnb({ ...newOnb, designation: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Joining Date</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        value={newOnb.start_date}
                                        onChange={e => setNewOnb({ ...newOnb, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Expected Completion</label>
                                    <input
                                        type="date"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        value={newOnb.expected_completion_date}
                                        onChange={e => setNewOnb({ ...newOnb, expected_completion_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">HR Representative</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        required
                                        placeholder="hr@company.com"
                                        value={newOnb.assigned_to}
                                        onChange={e => setNewOnb({ ...newOnb, assigned_to: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Buddy/Mentor (Optional)</label>
                                    <input
                                        type="email"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white"
                                        placeholder="buddy@company.com"
                                        value={newOnb.buddy}
                                        onChange={e => setNewOnb({ ...newOnb, buddy: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">Internal Notes</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900 dark:text-white h-20 resize-none"
                                    placeholder="Add any specific instructions or profile notes..."
                                    value={newOnb.notes}
                                    onChange={e => setNewOnb({ ...newOnb, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold text-sm">Cancel</button>
                                <button type="submit" disabled={actionLoading} className="flex-1 py-3 rounded-xl bg-primary-600 text-slate-900 dark:text-white font-bold text-sm flex items-center justify-center gap-2">
                                    {actionLoading && <Loader2 className="animate-spin" size={16} />}
                                    Start Process
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Onboarding;
