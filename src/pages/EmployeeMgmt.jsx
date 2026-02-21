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
    AlertCircle
} from 'lucide-react';
import api from '../utils/api';

const EmployeeMgmt = () => {
    const [employees, setEmployees] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState('All Teams');
    const [newEmployee, setNewEmployee] = useState({
        full_name: '',
        email: '',
        employee_id: '',
        password: '',
        designation: 'Staff',
        department: 'General'
    });

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/employees');
            setEmployees(res.data);
        } catch (err) {
            setError('Failed to fetch employee records.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (email) => {
        const newPw = prompt("Enter new temporary password:");
        if (!newPw) return;
        try {
            setLoading(true);
            await api.post(`/admin/employees/${email}/reset-password`, { password: newPw });
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
            await api.post(`/admin/employees/${email}/clear-binding`);
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
            alert(res.data.message);
            fetchEmployees();
        } catch (err) {
            alert('Import failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleManualAdd = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await api.post('/admin/employees', newEmployee);
            alert('Employee registered successfully.');
            setShowAddModal(false);
            fetchEmployees();
        } catch (err) {
            alert('Registration failed: ' + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = searchTerm === '' ||
            emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = selectedDepartment === 'All Teams' ||
            (emp.department && emp.department.toLowerCase() === selectedDepartment.toLowerCase());

        return matchesSearch && matchesDepartment;
    });

    return (
        <div className="space-y-8">
            {/* Registration Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-bold text-white mb-6">Register New Member</h2>
                        <form onSubmit={handleManualAdd} className="space-y-4">
                            <input
                                placeholder="Full Name"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                                required
                                onChange={e => setNewEmployee({ ...newEmployee, full_name: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Email Address"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                                required
                                onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    placeholder="Employee ID"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                                    required
                                    onChange={e => setNewEmployee({ ...newEmployee, employee_id: e.target.value })}
                                />
                                <input
                                    type="password"
                                    placeholder="Set Password"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none"
                                    required
                                    onChange={e => setNewEmployee({ ...newEmployee, password: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-4">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 rounded-xl border border-slate-800 text-slate-400 font-bold text-sm">Cancel</button>
                                <button type="submit" className="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm">Register</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Employee Directory</h1>
                    <p className="text-slate-400">Total registered members: <span className="text-primary-400 font-bold">{employees.length}</span></p>
                </div>
                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="excel-import"
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleImport}
                    />
                    <button
                        onClick={() => document.getElementById('excel-import').click()}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 border border-slate-700"
                    >
                        <Download size={18} className="rotate-180" />
                        Import Excel
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
                        placeholder="Search by name, email or ID..."
                        className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600 font-medium"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-800 hover:bg-slate-800 px-5 py-3 rounded-2xl text-slate-300 text-xs font-bold uppercase tracking-widest transition-all">
                        <Filter size={16} />
                        Filter
                    </button>
                    <button onClick={fetchEmployees} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-800/50 border border-slate-800 hover:bg-slate-800 px-5 py-3 rounded-2xl text-slate-300 text-xs font-bold uppercase tracking-widest transition-all">
                        Refresh
                    </button>
                </div>
            </div>

            {loading ? (
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
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-800/50">
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Member Profile</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Designation</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Account Info</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredEmployees.map((emp) => (
                                    <tr key={emp._id} className="group hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700/50 overflow-hidden group-hover:border-primary-500/30 transition-all">
                                                    {emp.profile_image ? (
                                                        <img src={`data:image/jpeg;base64,${emp.profile_image}`} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-bold text-slate-500 group-hover:text-primary-400 transition-colors">{emp.full_name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white group-hover:text-primary-400 transition-colors">{emp.full_name}</p>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                        <IdCard size={12} className="text-slate-600" />
                                                        {emp.employee_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="text-sm font-bold text-slate-300 tracking-tight">{emp.dept || emp.department}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{emp.designation}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                                    <Mail size={12} className="text-slate-600" />
                                                    {emp.email}
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-600 font-bold uppercase tracking-tighter">
                                                    Joined: {new Date(emp.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => resetPassword(emp.email)}
                                                    title="Reset Password"
                                                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-amber-400/10 transition-all border border-transparent hover:border-amber-400/20"
                                                >
                                                    <Shield size={16} />
                                                </button>
                                                <button
                                                    onClick={() => clearBinding(emp.email)}
                                                    title="Clear Hardware Binding"
                                                    className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-primary-400 hover:bg-primary-400/10 transition-all border border-transparent hover:border-primary-400/20"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-primary-500 transition-all border border-transparent hover:border-slate-700">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => deleteEmployee(emp.email)} className="p-2 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20">
                                                    <Trash2 size={16} />
                                                </button>
                                                <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-500 hover:text-white transition-all border border-transparent hover:border-slate-700">
                                                    <ExternalLink size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Status Indicator */}
                    <div className="px-8 py-4 border-t border-slate-800/50 bg-slate-900/20">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                            Live Records Terminal
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeMgmt;
