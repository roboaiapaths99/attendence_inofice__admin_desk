import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarCheck,
    FileText,
    Settings,
    LogOut,
    Shield,
    ChevronRight,
    Navigation,
    Target,
    ClipboardCheck,
    Receipt,
    AlertTriangle,
    PlaneTakeoff,
    Network,
    ShieldX,
    Zap,
    Trophy,
    X,
    UserPlus,
    Landmark,
    UserMinus,
    Home,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Sidebar = ({ onClose }) => {
    const { logout, admin, organization } = useAuth();
    const navigate = useNavigate();

    const isOwner = admin?.role === 'owner' || admin?.role === 'superadmin' || admin?.role === 'admin';
    const allowed = admin?.allowed_features || [];

    const ALL_MENU_ITEMS = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', featureId: 'dashboard' },
        { icon: Users, label: 'Employee Mgmt', path: '/dashboard/employees', featureId: 'employees' },
        { icon: Shield, label: 'Team Management', path: '/dashboard/admins', featureId: 'sub_admins' },
        { icon: Network, label: 'Org Structure', path: '/dashboard/org', adminOnly: true },
        { icon: CalendarCheck, label: 'Attendance Logs', path: '/dashboard/logs', featureId: 'attendance' },
        { icon: Navigation, label: 'Field War Room', path: '/dashboard/war-room', featureId: 'war_room' },
        { icon: Target, label: 'Territory Manager', path: '/dashboard/territories', featureId: 'territory' },
        { icon: ClipboardCheck, label: 'Visit Approvals', path: '/dashboard/approvals', featureId: 'attendance' },
        { icon: AlertTriangle, label: 'Alerts Center', path: '/dashboard/alerts', featureId: 'dashboard' },
        { icon: ShieldX, label: 'Fraud Dashboard', path: '/dashboard/fraud', featureId: 'reports' },
        { icon: PlaneTakeoff, label: 'Leave Management', path: '/dashboard/leave', featureId: 'leaves' },
        { icon: Receipt, label: 'Expense Approvals', path: '/dashboard/expenses', featureId: 'expenses' },
        
        { type: 'separator', label: 'HR Management' },
        { icon: UserPlus, label: 'Onboarding', path: '/dashboard/onboarding', featureId: 'onboarding' },
        { icon: FileText, label: 'Doc Verification', path: '/dashboard/verify-docs', featureId: 'document_verification' },
        { icon: Landmark, label: 'Payroll', path: '/dashboard/payroll', featureId: 'payroll' },
        { icon: UserMinus, label: 'Exit Management', path: '/dashboard/exit-management', featureId: 'exit_management' },

        { type: 'separator', label: 'Remote Operations' },
        { icon: Home, label: 'WFH Requests', path: '/dashboard/wfh-management', featureId: 'wfh_management' },
        { icon: Shield, label: 'WFH Devices', path: '/dashboard/wfh-devices', featureId: 'wfh_monitoring' },
        { icon: Users, label: 'WFH Live', path: '/dashboard/wfh-live', featureId: 'wfh_monitoring' },

        { type: 'separator', label: 'System Admin' },
        { icon: Zap, label: 'Nudge Center', path: '/dashboard/nudge', featureId: 'nudge' },
        { icon: Trophy, label: 'Team Leaderboard', path: '/dashboard/leaderboard', featureId: 'leaderboard' },
        { icon: FileText, label: 'Reports', path: '/dashboard/reports', featureId: 'reports' },
        { icon: Settings, label: 'Settings', path: '/dashboard/settings', featureId: 'settings' },
    ];

    const menuItems = [];
    let currentSeparator = null;

    for (const item of ALL_MENU_ITEMS) {
        if (item.type === 'separator') {
            currentSeparator = item;
        } else {
            const isVisible = isOwner || (!item.adminOnly && allowed.includes(item.featureId));
            if (isVisible) {
                if (currentSeparator) {
                    menuItems.push(currentSeparator);
                    currentSeparator = null;
                }
                menuItems.push(item);
            }
        }
    }

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="w-72 bg-white border-r border-slate-200 h-screen flex flex-col pt-8 pb-4 relative z-50">
            {/* Brand Header with LogDay Logo */}
            <div className="px-6 mb-10 flex items-center justify-between gap-3">
                    <img 
                        src={organization?.logo_url || "/logday_logo.png"} 
                        alt={organization?.name || "LogDay Attendance & HRMS"} 
                        className="h-10 max-w-[180px] object-contain"
                        onError={(e) => {
                            if (!e.target.dataset.fallback) {
                                e.target.dataset.fallback = 'true';
                                e.target.src = "/logday_logo.png";
                            }
                        }}
                    />
                
                {onClose && (
                    <button onClick={onClose} className="md:hidden p-2 text-slate-400 hover:text-slate-900">
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {menuItems.map((item, index) => {
                    if (item.type === 'separator') {
                        return (
                            <div key={`sep-${index}`} className="pt-4 pb-2 px-4">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">
                                    {item.label}
                                </span>
                            </div>
                        );
                    }
                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            end={item.path === '/dashboard'}
                            onClick={onClose}
                            className={({ isActive }) =>
                                cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative overflow-hidden",
                                    isActive
                                        ? "bg-[#E8F0FA] text-[#004B87] border border-[#004B87]/20 font-semibold"
                                        : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 border border-transparent"
                                )
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        className={cn(
                                            "transition-transform group-hover:scale-110",
                                            isActive ? "text-[#004B87]" : ""
                                        )}
                                    />
                                    <span className="font-medium text-sm flex-1">{item.label}</span>
                                    <ChevronRight
                                        size={16}
                                        className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
                                    />

                                    {/* Active Indicator Bar */}
                                    <span
                                        aria-hidden="true"
                                        className={cn(
                                            "absolute left-0 top-1/4 bottom-1/4 w-1 bg-[#004B87] rounded-r-full transition-transform duration-300",
                                            isActive ? "scale-y-100" : "scale-y-0"
                                        )}
                                    />
                                </>
                            )}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="px-3 pt-4 border-t border-slate-200">
                <div className="bg-slate-50 rounded-2xl p-4 mb-4 border border-slate-100">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#E8F0FA] flex items-center justify-center text-xs font-bold text-[#004B87]">
                            {admin?.full_name?.charAt(0) || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-900 truncate">{admin?.full_name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{admin?.email || 'admin@logday.ai'}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all group"
                >
                    <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="font-medium text-sm">Sign Out System</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
