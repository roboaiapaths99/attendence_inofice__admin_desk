import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu } from 'lucide-react';

const Layout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex min-h-screen bg-[#F8FAFC] text-slate-900">
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 z-40 md:hidden"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <Sidebar onClose={() => setIsMobileMenuOpen(false)} />
            </div>

            <main className="flex-1 min-w-0 overflow-hidden relative flex flex-col h-screen bg-[#F8FAFC]">
                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 bg-white z-30">
                    <div className="flex items-center gap-2">
                        <img src="/logday_logo.png" alt="LogDay" className="h-8 object-contain" />
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-500 hover:text-slate-900">
                        <Menu size={24} />
                    </button>
                </div>

                <div className="p-4 md:p-8 flex-1 relative z-10 overflow-y-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {children}
                    </motion.div>
                </div>
            </main>
        </div>
    );
};

export default Layout;
