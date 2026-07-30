import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { getFriendlyErrorMessage } from '../utils/errorMapper';
import { motion } from 'framer-motion';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const success = await login(email, password);
            if (success) {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(getFriendlyErrorMessage(err, 'Invalid admin credentials. Please try again.'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 relative overflow-hidden">
            {/* Subtle Brand Gradient Orbs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#004B87]/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#D91424]/5 blur-[120px] rounded-full pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col items-center mb-8">
                        <img src="/logday_logo.png" alt="LogDay Attendance & HRMS" className="h-14 object-contain mb-4" />
                        <h1 className="text-2xl font-bold text-slate-900">
                            Admin Portal
                        </h1>
                        <p className="text-slate-500 mt-2 text-sm">Secure Management Dashboard</p>
                    </div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm mb-6"
                        >
                            {error}
                        </motion.div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B87] transition-colors" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Admin Email"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#004B87]/50 focus:ring-2 focus:ring-[#004B87]/10 transition-all text-slate-900 placeholder:text-slate-400"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#004B87] transition-colors" size={20} />
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    placeholder="Password"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-12 pr-4 outline-none focus:border-[#004B87]/50 focus:ring-2 focus:ring-[#004B87]/10 transition-all text-slate-900 placeholder:text-slate-400"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-[#004B87] hover:bg-[#003A6B] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 group active:scale-[0.98] shadow-lg shadow-[#004B87]/20"
                        >
                            {isSubmitting ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                <>
                                    Enter Dashboard
                                    <ArrowRight className="group-hover:translate-x-1 transition-transform" size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-200 text-center">
                        <p className="text-sm text-slate-500 mb-4">
                            Only authorized LogDay administrators can access this portal.
                        </p>
                        <Link to="/register-org" className="text-[#004B87] hover:text-[#003A6B] text-sm font-medium transition-colors">
                            Need a workspace for your company? Register Organization
                        </Link>
                        <p className="text-slate-400 text-xs mt-6">Powered by LogDay</p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LoginPage;
