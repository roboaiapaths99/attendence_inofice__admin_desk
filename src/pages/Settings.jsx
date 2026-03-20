import React, { useState, useEffect } from 'react';
import {
    Settings as SettingsIcon,
    Clock,
    Timer,
    Globe,
    Save,
    Shield,
    MapPin,
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
            setSettings({
                ...res.data,
                primary_color: res.data.primary_color || '#6366f1'
            });
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load system configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Logo size must be less than 5MB');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        try {
            setSaving(true);
            const res = await api.post('/admin/upload-logo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setSettings({ ...settings, logo_url: res.data.logo_url });
            setSuccess('Logo uploaded successfully. Save changes to persist.');
        } catch (err) {
            console.error('Logo upload error:', err);
            setError('Failed to upload logo.');
        } finally {
            setSaving(false);
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
                        <h2 className="text-lg font-bold text-white">Desk App Policy</h2>
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
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Late Threshold (Mins)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.late_threshold_mins}
                                onChange={(e) => setSettings({ ...settings, late_threshold_mins: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Required Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.required_hours}
                                onChange={(e) => setSettings({ ...settings, required_hours: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Field Force Settings Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-500">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Field App Policy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Daily Start Time</label>
                            <input
                                type="time"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.field_office_start_time || '10:00'}
                                onChange={(e) => setSettings({ ...settings, field_office_start_time: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Late Threshold (Mins)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.field_late_threshold_mins || 30}
                                onChange={(e) => setSettings({ ...settings, field_late_threshold_mins: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Goal Working Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                value={settings.field_required_hours || 9.0}
                                onChange={(e) => setSettings({ ...settings, field_required_hours: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Visits Goal</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-200"
                                    value={settings.field_visits_goal || 10}
                                    onChange={(e) => setSettings({ ...settings, field_visits_goal: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Distance Goal (KM)</label>
                                <input
                                    type="number"
                                    step="1"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={settings.field_km_goal || 20}
                                    onChange={(e) => setSettings({ ...settings, field_km_goal: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Visit Geofence Radius (Meters)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                value={settings.field_visit_geofence || 200}
                                onChange={(e) => setSettings({ ...settings, field_visit_geofence: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Recommended: 200m for field reliability.</p>
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
                    </div>
                </div>

                {/* Office Location & Security Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500">
                            <MapPin size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Office Location & Security</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Office Geofence Center (GPS)</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 mb-1 font-bold">Latitude</p>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="e.g. 28.6139"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                        value={settings.office_lat || ''}
                                        onChange={(e) => setSettings({ ...settings, office_lat: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <p className="text-[10px] text-slate-500 mb-1 font-bold">Longitude</p>
                                    <input
                                        type="number"
                                        step="0.000001"
                                        placeholder="e.g. 77.2090"
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                        value={settings.office_long || ''}
                                        onChange={(e) => setSettings({ ...settings, office_long: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    if (navigator.geolocation) {
                                        navigator.geolocation.getCurrentPosition((pos) => {
                                            setSettings({
                                                ...settings,
                                                office_lat: pos.coords.latitude,
                                                office_long: pos.coords.longitude
                                            });
                                            setSuccess("Captured current coordinates successfully!");
                                            setTimeout(() => setSuccess(''), 3000);
                                        });
                                    }
                                }}
                                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold rounded-lg border border-slate-700 transition-colors uppercase tracking-widest"
                            >
                                Use My Current Location
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Restricted Office WiFi (SSID)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. MyOffice_WiFi"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={settings.office_wifi_ssid || ''}
                                    onChange={(e) => setSettings({ ...settings, office_wifi_ssid: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-600 mt-2">Leave blank to allow any network. Desk app will check for this SSID.</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Geofence Radius (Meters)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-white"
                                    value={settings.geofence_radius || 150}
                                    onChange={(e) => setSettings({ ...settings, geofence_radius: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800 p-8 rounded-[2rem] space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-500">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-white">Custom Branding</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Primary Ecosystem Color</label>
                            <div className="flex items-center gap-4">
                                <input
                                    type="color"
                                    className="w-16 h-16 bg-transparent border-none outline-none cursor-pointer"
                                    value={settings.primary_color || '#6366f1'}
                                    onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                                />
                                <div>
                                    <p className="text-sm text-slate-200 font-mono uppercase">{settings.primary_color || '#6366f1'}</p>
                                    <p className="text-[10px] text-slate-600 mt-1">This color will be used across Admin and Field Apps.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Organization Logo</label>
                            <label className="p-4 rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 transition-colors flex flex-col items-center justify-center cursor-pointer bg-slate-950/50 min-h-[100px] relative overflow-hidden">
                                {settings.logo_url ? (
                                    <img
                                        src={settings.logo_url}
                                        className="h-16 w-auto object-contain mb-2"
                                        alt="Org Logo"
                                    />
                                ) : (
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Click to Upload Logo</p>
                                )}
                                <p className="text-[9px] text-slate-600 mt-1">(PNG, SVG or JPG - Max 5MB)</p>
                                <input
                                    type="file"
                                    className="hidden"
                                    onChange={handleLogoUpload}
                                    accept="image/*"
                                />
                                {saving && (
                                    <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary-500" size={24} />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
