import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import {
    Shield,
    UserPlus,
    Trash2,
    Mail,
    User,
    Lock,
    Loader2,
    Search,
    AlertCircle,
    CheckCircle2,
    X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AdminMgmt = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [actionMessage, setActionMessage] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: ''
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const response = await api.get('/admin/sub-admins');
            setAdmins(response.data);
        } catch (err) {
            console.error("Failed to fetch admins", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post('/admin/sub-admins', formData);
            setActionMessage({ type: 'success', text: 'Admin added successfully!' });
            setShowAddModal(false);
            setFormData({ full_name: '', email: '', password: '' });
            fetchAdmins();
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to add admin.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteAdmin = async (email) => {
        if (!window.confirm(`Are you sure you want to remove ${email} from the admin team?`)) return;

        try {
            await api.delete(`/admin/sub-admins/${email}`);
            setAdmins(admins.filter(a => a.email !== email));
            setActionMessage({ type: 'success', text: 'Admin removed successfully.' });
        } catch (err) {
            setActionMessage({ type: 'error', text: err.response?.data?.detail || 'Failed to remove admin.' });
        }
    };

    const filteredAdmins = admins.filter(admin =>
        admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Team Management</h1>
                    <p className="text-slate-400">Control who has access to this management portal</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3 rounded-xl font-medium transition-all shadow-lg shadow-primary-900/20 active:scale-95"
                >
                    <UserPlus size={20} />
                    Add Sub-Admin
                </button>
            </div>

            {/* Quick Stats & Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-primary-600/20 rounded-2xl flex items-center justify-center border border-primary-500/30">
                            <Shield className="text-primary-500" size={24} />
                        </div>
                        <div>
                            <p className="text-slate-400 text-sm">Total Admins</p>
                            <h3 className="text-2xl font-bold text-white">{admins.length}</h3>
                        </div>
                    </div>
                </div>

                <div className="md:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-6 rounded-3xl flex items-center">
                    <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Alert Messages */}
            <AnimatePresence>
                {actionMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`flex items-center gap-3 p-4 rounded-xl border ${actionMessage.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                            }`}
                    >
                        {actionMessage.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="flex-1 text-sm font-medium">{actionMessage.text}</span>
                        <button onClick={() => setActionMessage(null)} className="hover:opacity-70 transition-opacity">
                            <X size={18} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Admins Table-like Grid */}
            <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden">
                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center text-slate-500">
                        <Loader2 className="animate-spin mb-4" size={40} />
                        <p>Loading admin accounts...</p>
                    </div>
                ) : filteredAdmins.length === 0 ? (
                    <div className="p-20 text-center text-slate-500">
                        <Shield className="mx-auto mb-4 opacity-20" size={60} />
                        <p>No admin accounts found matching your search.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/50">
                        {filteredAdmins.map((admin) => (
                            <div key={admin.email} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${admin.role === 'owner'
                                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                                            : 'bg-primary-600/10 border-primary-500/30 text-primary-500'
                                        }`}>
                                        {admin.full_name?.charAt(0) || 'A'}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-white font-semibold">{admin.full_name}</h4>
                                            {admin.role === 'owner' && (
                                                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-black px-2 py-0.5 rounded border border-amber-500/30 uppercase tracking-tighter">Owner</span>
                                            )}
                                        </div>
                                        <p className="text-slate-500 text-sm flex items-center gap-1.5 mt-0.5">
                                            <Mail size={12} />
                                            {admin.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="text-right mr-4 hidden sm:block">
                                        <p className="text-slate-400 text-xs font-medium">Joined On</p>
                                        <p className="text-white text-sm">{new Date(admin.created_at).toLocaleDateString()}</p>
                                    </div>

                                    {/* Actions */}
                                    {admin.role !== 'owner' && (
                                        <button
                                            onClick={() => handleDeleteAdmin(admin.email)}
                                            className="p-3 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                                            title="Remove Admin Access"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal for adding sub-admin */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900 border border-slate-800 w-full max-w-md p-8 rounded-3xl shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="absolute right-6 top-6 text-slate-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-white mb-1">Add Sub-Admin</h2>
                                <p className="text-slate-400">Provide management access to another user</p>
                            </div>

                            <form onSubmit={handleAddAdmin} className="space-y-4">
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="text"
                                        placeholder="Full Name"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                        value={formData.full_name}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    />
                                </div>

                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="email"
                                        placeholder="Email Address"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>

                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input
                                        type="password"
                                        placeholder="Portal Password"
                                        required
                                        className="w-full bg-slate-950/50 border border-slate-800 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-primary-500/50 transition-all text-slate-200 placeholder:text-slate-600"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Grant Access'}
                                </button>

                                <p className="text-[10px] text-slate-500 text-center mt-2 px-6">
                                    Sub-admins cannot delete other admins or change organization settings.
                                </p>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminMgmt;
