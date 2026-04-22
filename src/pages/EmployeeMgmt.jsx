import React, { useState, useEffect } from 'react';
import {
    Users,
    Search,
    Filter,
    Plus,
    Download,
    MoreHorizontal,
    Mail,
    IdCard,
    MapPin,
    Edit2,
    Trash2,
    ExternalLink,
    Loader2,
    AlertCircle,
    Shield,
    MoreVertical,
    CheckSquare,
    Square,
    UserCircle2,
    Network,
    ArrowRight,
    FileText,
    UserPlus,
    X,
    Key,
    RotateCcw,
    Monitor,
    Building2
} from 'lucide-react';
import api from '../utils/api';
import { getFriendlyErrorMessage } from '../utils/errorMapper';
import { motion, AnimatePresence } from 'framer-motion';
import EmployeeReportModal from '../components/EmployeeReportModal';

const EmployeeMgmt = () => {
    const [employees, setEmployees] = useState([]);
    const [managers, setManagers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Teams');
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBulkAssigning, setIsBulkAssigning] = useState(false);
    const [selectedManager, setSelectedManager] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [selectedReportEmployee, setSelectedReportEmployee] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [showBulkAssign, setShowBulkAssign] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const [newEmployee, setNewEmployee] = useState({
        full_name: '',
        email: '',
        employee_id: '',
        password: '',
        designation: 'Staff',
        department: 'General',
        employee_type: 'desk'
    });

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [empRes, adminRes] = await Promise.all([
                api.get('/admin/employees'),
                api.get('/admin/sub-admins')
            ]);
            setEmployees(empRes.data);
            setManagers(adminRes.data.filter(a => a.role === 'manager' || a.role === 'owner'));
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Failed to fetch initial data.'));
            setTimeout(() => setError(''), 5000);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await api.get('/admin/employees');
            setEmployees(res.data);
            setSelectedIds([]);
        } catch (err) {
            console.error(err);
        }
    };

    const handleBulkAssign = async () => {
        if (!selectedManager) {
            alert("Please select a manager first.");
            return;
        }
        try {
            setIsBulkAssigning(true);
            await api.post('/admin/employees/bulk-assign-manager', {
                employee_emails: selectedIds,
                manager_email: selectedManager
            });
            alert('Employees assigned successfully.');
            setSelectedIds([]);
            setSelectedManager('');
            setShowBulkAssign(false);
            fetchEmployees();
        } catch (err) {
            alert(getFriendlyErrorMessage(err, 'Assignment failed.'));
        } finally {
            setIsBulkAssigning(false);
        }
    };

    const handleBulkTypeChange = async (type) => {
        try {
            setLoading(true);
            await api.post('/admin/employees/bulk-update-type', {
                employee_emails: selectedIds,
                employee_type: type
            });
            alert(`Updated ${selectedIds.length} employees to ${type} type.`);
            setSelectedIds([]);
            fetchEmployees();
        } catch (err) {
            alert(getFriendlyErrorMessage(err, 'Update failed.'));
        } finally {
            setLoading(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === filteredEmployees.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredEmployees.map(e => e.email));
        }
    };

    const toggleSelect = (email) => {
        setSelectedIds(prev =>
            prev.includes(email) ? prev.filter(id => id !== email) : [...prev, email]
        );
    };

    const resetPassword = async (email) => {
        const newPw = prompt("Enter new temporary password:");
        if (!newPw) return;
        try {
            setLoading(true);
            const cleanEmail = email.trim().toLowerCase();
            await api.post(`/admin/employees/${cleanEmail}/reset-password`, { password: newPw });
            alert('Password reset successful.');
        } catch (err) {
            alert('Reset failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const clearBinding = async (email) => {
        if (!window.confirm(`Clear hardware binding for ${email}? This will allow the user to log in from a new device.`)) return;
        try {
            setLoading(true);
            const cleanEmail = email.trim().toLowerCase();
            await api.post(`/admin/employees/${cleanEmail}/clear-binding`);
            alert('Device binding cleared.');
            fetchEmployees();
        } catch (err) {
            alert('Operation failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const deleteEmployee = async (email) => {
        if (!window.confirm(`Are you sure you want to delete ${email}? This will also delete all their attendance records.`)) return;

        try {
            await api.delete(`/admin/employees/${email}`);
            setEmployees(employees.filter(emp => emp.email !== email));
        } catch (err) {
            alert('Failed to delete employee.');
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const res = await api.post('/admin/import-employees', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportResult(res.data);
            fetchEmployees();
        } catch (err) {
            alert('Import failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
            e.target.value = '';
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await api.get('/admin/employees/import-template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const a = document.createElement('a');
            a.href = url;
            a.download = 'employee_import_template.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Download failed: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const normalizedData = {
                ...newEmployee,
                email: newEmployee.email.trim().toLowerCase()
            };
            await api.post('/admin/employees', normalizedData);
            alert('Employee registered successfully.');
            setShowAddModal(false);
            setNewEmployee({
                full_name: '',
                email: '',
                employee_id: '',
                password: '',
                designation: 'Staff',
                department: 'General',
                employee_type: 'desk'
            });
            fetchEmployees();
        } catch (err) {
            const errorMsg = err.response?.data?.detail;
            const detailedError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
            alert('Registration failed: ' + (detailedError || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            await api.put(`/admin/employees/${editingEmployee.email}`, editingEmployee);
            alert('Employee updated successfully.');
            setShowEditModal(false);
            setEditingEmployee(null);
            fetchEmployees();
        } catch (err) {
            const errorMsg = err.response?.data?.detail;
            const detailedError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
            alert('Update failed: ' + (detailedError || err.message));
        } finally {
            setIsUpdating(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = searchTerm === '' ||
            emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = selectedDepartment === 'All Teams' ||
            (emp.department && emp.department.toLowerCase() === selectedDepartment.toLowerCase());

        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="space-y-8 relative">
            {/* Registration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-6">Register New Member</h2>
                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <input
                                id="reg_full_name"
                                name="full_name"
                                placeholder="Full Name"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                required
                                value={newEmployee.full_name}
                                onChange={e => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                            />
                            <input
                                type="email"
                                id="reg_email"
                                name="email"
                                placeholder="Email Address"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                required
                                value={newEmployee.email}
                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    id="reg_employee_id"
                                    name="employee_id"
                                    placeholder="Employee ID"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    required
                                    value={newEmployee.employee_id}
                                    onChange={e => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                                />
                                <input
                                    type="password"
                                    id="reg_password"
                                    name="password"
                                    placeholder="Set Password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    required
                                    value={newEmployee.password || ''}
                                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    id="reg_designation"
                                    name="designation"
                                    placeholder="Designation"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={newEmployee.designation}
                                    onChange={e => setNewEmployee({ ...newEmployee, designation: e.target.value })}
                                />
                                <input
                                    id="reg_department"
                                    name="department"
                                    placeholder="Department"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={newEmployee.department}
                                    onChange={e => setNewEmployee({ ...newEmployee, department: e.target.value })}
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Work Mode / Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'desk', label: 'Desk', icon: Monitor },
                                        { id: 'field', label: 'Field', icon: MapPin },
                                        { id: 'office', label: 'Office', icon: Building2 }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setNewEmployee({ ...newEmployee, employee_type: item.id })}
                                            className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-tighter ${newEmployee.employee_type === item.id
                                                ? 'bg-primary-500/10 border-primary-500 text-primary-500'
                                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-[10px] text-slate-600">Field employees can check-in from anywhere. Desk/Office require location validation.</p>
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )
            }

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Employee Directory</h1>
                    <p className="text-slate-400">Manage organizational members and team assignments</p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="excel-import"
                        className="hidden"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleImport}
                    />
                    <button
                        onClick={downloadTemplate}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 border border-slate-700"
                    >
                        <Download size={16} /> Template
                    </button>
                    <button
                        onClick={() => document.getElementById('excel-import').click()}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 border border-slate-700"
                    >
                        <Download size={18} className="rotate-180" />
                        Import CSV/Excel
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                    >
                        <Plus size={20} />
                        Register Member
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 group w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-primary-500 transition-colors" size={20} />
                    <input
                        type="text"
                        id="employee_search"
                        name="search"
                        placeholder="Search by name, email or ID..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-slate-900/20 rounded-[2rem] border border-slate-800/50">
                        <Loader2 className="animate-spin text-primary-500 mb-4" size={40} />
                        <p className="text-slate-500 text-sm font-medium">Synchronizing employee database...</p>
                    </div>
                ) : error ? (
                    <div className="py-24 flex flex-col items-center justify-center bg-rose-500/5 rounded-[2rem] border border-rose-500/20 text-rose-400">
                        <AlertCircle size={40} className="mb-4" />
                        <p className="text-sm font-bold uppercase tracking-widest">{error}</p>
                    </div>
                ) : (
                    <>
                        {/* Bulk Actions Bar */}
                        <AnimatePresence>
                            {selectedIds.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 50 }}
                                    className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/90 backdrop-blur-2xl border border-slate-700 shadow-2xl rounded-[2.5rem] px-8 py-4 flex items-center gap-6 shadow-primary-900/20"
                                >
                                    <div className="flex items-center gap-3 pr-6 border-r border-slate-800">
                                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-primary-900/40">
                                            {selectedIds.length}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-sm leading-none">Selected</span>
                                            <span className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">Members</span>
                                        </div>
                                    </div>

                                    {!showBulkAssign ? (
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setShowBulkAssign(true)}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-200 text-sm font-bold transition-all border border-slate-700/50"
                                            >
                                                <UserPlus size={18} className="text-primary-400" /> Assign Manager
                                            </button>

                                            <div className="flex items-center gap-1.5 px-4 border-l border-slate-800">
                                                {['desk', 'field', 'office'].map(type => (
                                                    <button
                                                        key={type}
                                                        onClick={() => handleBulkTypeChange(type)}
                                                        className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-lg border border-slate-800 hover:border-primary-500/50 text-slate-400 hover:text-white transition-all bg-slate-950/50"
                                                    >
                                                        Set {type}
                                                    </button>
                                                ))}
                                            </div>

                                            <button
                                                onClick={() => {
                                                    if (window.confirm(`Delete ${selectedIds.length} employees? This cannot be undone.`)) {
                                                        alert("Bulk delete coming soon. Currently using individual revoke.");
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-5 py-2.5 hover:bg-rose-500/10 rounded-xl text-rose-400 text-sm font-bold transition-all border-l border-slate-800 ml-2"
                                            >
                                                <Trash2 size={18} /> Delete
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-4 animate-in slide-in-from-right-4 duration-300">
                                            <div className="flex items-center gap-3 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2">
                                                <Network className="text-primary-500" size={18} />
                                                <select
                                                    id="bulk_manager_select"
                                                    name="manager_email"
                                                    className="bg-transparent text-sm text-white outline-none min-w-[200px]"
                                                    value={selectedManager}
                                                    onChange={(e) => setSelectedManager(e.target.value)}
                                                >
                                                    <option value="">Select Manager...</option>
                                                    {managers.map(m => (
                                                        <option key={m.email} value={m.email}>{m.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                onClick={handleBulkAssign}
                                                disabled={isBulkAssigning || !selectedManager}
                                                className="bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-primary-900/40"
                                            >
                                                {isBulkAssigning ? <Loader2 className="animate-spin" size={18} /> : 'Confirm Assignment'}
                                            </button>
                                            <button
                                                onClick={() => setShowBulkAssign(false)}
                                                className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    )}

                                    {!showBulkAssign && (
                                        <button
                                            onClick={() => setSelectedIds([])}
                                            className="p-3 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all ml-4"
                                        >
                                            <X size={22} />
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-800/50">
                                            <th className="px-6 py-5 w-10">
                                                <button onClick={toggleSelectAll} className="text-slate-500 hover:text-primary-500 transition-colors">
                                                    {selectedIds.length === filteredEmployees.length && filteredEmployees.length > 0 ? <CheckSquare size={20} className="text-primary-500" /> : <Square size={20} />}
                                                </button>
                                            </th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member Profile</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Type</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Designation & Team</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Reporting Manager</th>
                                            <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredEmployees.map((emp) => {
                                            const isSelected = selectedIds.includes(emp.email);
                                            const reportingManager = managers.find(m => m.email === emp.manager_id);

                                            return (
                                                <tr key={emp._id} className={`group transition-colors ${isSelected ? 'bg-primary-600/5' : 'hover:bg-slate-800/30'}`}>
                                                    <td className="px-6 py-4">
                                                        <button onClick={() => toggleSelect(emp.email)} className={`${isSelected ? 'text-primary-500' : 'text-slate-700'}`}>
                                                            {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                                                        </button>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700/50 overflow-hidden group-hover:border-primary-500/30 transition-all">
                                                                {emp.profile_image ? (
                                                                    <img src={`data:image/jpeg;base64,${emp.profile_image}`} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    <span className="text-sm font-bold text-slate-500 group-hover:text-primary-400 transition-colors uppercase">{emp.full_name?.charAt(0)}</span>
                                                                )}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-all truncate">{emp.full_name}</p>
                                                                <p className="text-[10px] text-slate-500 font-medium truncate">{emp.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`text-[10px] font-black px-2 py-1 rounded border uppercase tracking-widest ${emp.employee_type === 'field' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                                                            emp.employee_type === 'office' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                                            }`}>
                                                            {emp.employee_type || 'desk'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-300 tracking-tight">{emp.department || 'General'}</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{emp.designation}</p>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {reportingManager ? (
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30">
                                                                    <UserCircle2 size={12} className="text-indigo-400" />
                                                                </div>
                                                                <span className="text-xs font-semibold text-white">{reportingManager.full_name}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded uppercase font-black tracking-widest italic">
                                                                Not Assigned
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedReportEmployee(emp);
                                                                    setIsReportModalOpen(true);
                                                                }}
                                                                title="Activity Report"
                                                            >
                                                                <FileText size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setEditingEmployee({ ...emp });
                                                                    setShowEditModal(true);
                                                                }}
                                                                title="Edit Details"
                                                                className="p-2 hover:bg-primary-400/10 rounded-xl text-slate-500 hover:text-primary-400 transition-all font-bold"
                                                            >
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => resetPassword(emp.email)}
                                                                title="Change Password"
                                                                className="p-2 hover:bg-amber-400/10 rounded-xl text-slate-500 hover:text-amber-400 transition-all"
                                                            >
                                                                <Key size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => clearBinding(emp.email)}
                                                                title="Release Device Binding"
                                                                className="p-2 hover:bg-primary-400/10 rounded-xl text-slate-500 hover:text-primary-400 transition-all"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => deleteEmployee(emp.email)}
                                                                title="Delete Employee"
                                                                className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-500 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )
            }

            {/* Import Results Modal */}
            <ImportResultModal result={importResult} onClose={() => setImportResult(null)} />

            {/* Edit Employee Modal */}
            {showEditModal && editingEmployee && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-500 via-indigo-500 to-primary-500" />

                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white">Edit Member Details</h2>
                                <p className="text-xs text-slate-500 mt-1">Update profile and custom territory settings</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                                    <input
                                        id="edit_full_name"
                                        name="full_name"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white transition-all"
                                        required
                                        value={editingEmployee.full_name}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, full_name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Employee ID</label>
                                    <input
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-500 cursor-not-allowed outline-none"
                                        disabled
                                        value={editingEmployee.employee_id}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Designation</label>
                                    <input
                                        id="edit_designation"
                                        name="designation"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                        value={editingEmployee.designation}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, designation: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Department</label>
                                    <input
                                        id="edit_department"
                                        name="department"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                        value={editingEmployee.department}
                                        onChange={e => setEditingEmployee({ ...editingEmployee, department: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800/50">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Work Settings & Mode</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { id: 'desk', label: 'Desk', icon: Monitor },
                                        { id: 'field', label: 'Field', icon: MapPin },
                                        { id: 'office', label: 'Office', icon: Building2 }
                                    ].map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setEditingEmployee({ ...editingEmployee, employee_type: item.id })}
                                            className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl text-[10px] font-bold border transition-all uppercase tracking-tighter ${editingEmployee.employee_type === item.id
                                                ? 'bg-primary-500/10 border-primary-500 text-primary-500'
                                                : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                                        >
                                            <item.icon size={16} />
                                            {item.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {editingEmployee.employee_type === 'field' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="space-y-3 p-4 bg-indigo-500/5 rounded-2xl border border-indigo-500/20"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <MapPin size={14} className="text-indigo-400" />
                                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Field Territory (GPS)</label>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Center Lat</span>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                                                value={editingEmployee.territory_center_lat || ''}
                                                onChange={e => setEditingEmployee({ ...editingEmployee, territory_center_lat: parseFloat(e.target.value) })}
                                                placeholder="0.000000"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Center Lng</span>
                                            <input
                                                type="number"
                                                step="any"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                                                value={editingEmployee.territory_center_lng || ''}
                                                onChange={e => setEditingEmployee({ ...editingEmployee, territory_center_lng: parseFloat(e.target.value) })}
                                                placeholder="0.000000"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[9px] text-slate-500 font-bold ml-1 uppercase">Radius (Meters)</span>
                                        <input
                                            type="number"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                                            value={editingEmployee.territory_radius_meters || 500}
                                            onChange={e => setEditingEmployee({ ...editingEmployee, territory_radius_meters: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <p className="text-[9px] text-indigo-400/60 font-medium leading-relaxed">Agent will trigger alerts if check-in occurs beyond this radius from the center center.</p>
                                </motion.div>
                            )}

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-all">Cancel</button>
                                <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/40 flex items-center justify-center gap-2"
                                >
                                    {isUpdating ? <Loader2 size={18} className="animate-spin" /> : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* Individual Report Modal */}
            <EmployeeReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                employee={selectedReportEmployee}
            />
        </div>
    );
}

const ImportResultModal = ({ result, onClose }) => {
    if (!result) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl p-8 shadow-2xl">
                <h2 className="text-xl font-bold text-white mb-6">Import Results</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-emerald-400">{result.created}</p>
                        <p className="text-xs text-emerald-300/70 font-bold uppercase tracking-wider mt-1">Created</p>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-blue-400">{result.updated}</p>
                        <p className="text-xs text-blue-300/70 font-bold uppercase tracking-wider mt-1">Updated</p>
                    </div>
                    <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                        <p className="text-3xl font-black text-rose-400">{result.errors?.length || 0}</p>
                        <p className="text-xs text-rose-300/70 font-bold uppercase tracking-wider mt-1">Errors</p>
                    </div>
                </div>
                {result.errors?.length > 0 && (
                    <div className="bg-slate-950 rounded-2xl p-4 mb-6 max-h-40 overflow-y-auto">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Error Details</p>
                        {result.errors.map((e, i) => (
                            <p key={i} className="text-xs text-rose-400 mb-1">Row {e.row}: {e.error}</p>
                        ))}
                    </div>
                )}
                <button onClick={onClose} className="w-full py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-500 transition-all">
                    Done
                </button>
            </div>
        </div>
    );
};

export default EmployeeMgmt;
