import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Clock,
    Timer,
    Globe,
    Save,
    Shield,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import api from '../utils/api';

const Settings = () => {
    const [settings, setSettings] = useState({
        office_start_time: '09:00',
        late_threshold_mins: 15,
        required_hours: 8.0,
        timezone_offset: 330
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const res = await api.get('/admin/settings');
            setSettings(res.data);
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load system configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccess('');
            setError('');
            await api.put('/admin/settings', settings);
            setSuccess('System settings updated successfully.');
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save configurations.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center">
                <Loader2 className="animate-spin text-primary-500 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Loading system configurations...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">System Configuration</h1>
                    <p className="text-slate-400">Manage office hours, late thresholds, and global policy.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
                >
                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>

            {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-500 animate-in fade-in slide-in-from-top-4">
                    <CheckCircle2 size={20} />
                    <p className="text-sm font-bold tracking-wide">{success}</p>
                </div>
            )}

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl flex items-center gap-3 text-rose-500 animate-in fade-in slide-in-from-top-4">
                    <AlertCircle size={20} />
                    <p className="text-sm font-bold tracking-wide">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Office Hours Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-primary-600/10 border border-primary-500/20 text-primary-500">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Attendance Policy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Office Start Time</label>
                            <input
                                type="time"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.office_start_time}
                                onChange={(e) => setSettings({ ...settings, office_start_time: e.target.value })}
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Standard clock-in time for all employees.</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Late Threshold (Minutes)</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                    value={settings.late_threshold_mins}
                                    onChange={(e) => setSettings({ ...settings, late_threshold_mins: parseInt(e.target.value) })}
                                />
                                <Timer className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
                            </div>
                            <p className="text-[10px] text-slate-600 mt-2">Maximum grace period before marking as "Late".</p>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Required Working Hours</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.5"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                    value={settings.required_hours}
                                    onChange={(e) => setSettings({ ...settings, required_hours: parseFloat(e.target.value) })}
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 text-xs font-bold">HOURS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System & Localization Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-500">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Localization</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Timezone Offset (Minutes)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.timezone_offset}
                                onChange={(e) => setSettings({ ...settings, timezone_offset: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Minutes from UTC. (e.g., 330 for India GMT+5:30)</p>
                        </div>

                        <div className="pt-4 border-t border-slate-800/50">
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-800/30 border border-slate-700/50">
                                <Shield className="text-slate-500" size={24} />
                                <div>
                                    <p className="text-xs font-bold text-slate-300 mb-0.5">Global Audit Policy</p>
                                    <p className="text-[10px] text-slate-500 leading-relaxed">All changes to these settings are logged for security audits. Employees will receive a notification if office timings are adjusted.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
