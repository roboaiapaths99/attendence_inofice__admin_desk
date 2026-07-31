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
import { useAuth } from '../context/AuthContext';

const Settings = () => {
    const { updateOrganization } = useAuth();
    const [settings, setSettings] = useState({
        office_start_time: '09:00',
        late_threshold_mins: 15,
        required_hours: 8.0,
        timezone_offset: 330,
        office_wifi_bssid: ''
    });
    const [wfhPolicy, setWfhPolicy] = useState({
        screenshot_interval_minutes: 10,
        face_check_interval_minutes: 30,
        max_idle_minutes: 20,
        productivity_threshold_percent: 60,
        working_hours_start: '09:00',
        working_hours_end: '18:00',
        screenshot_retention_days: 5,
        require_face_verification: true,
        productive_apps: '',
        unproductive_apps: ''
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
            const [settingsRes, policyRes] = await Promise.all([
                api.get('/admin/settings'),
                api.get('/admin/wfh/policy').catch(() => null)
            ]);
            
            setSettings({
                ...settingsRes.data,
                primary_color: settingsRes.data.primary_color || '#004B87'
            });
            
            if (policyRes && policyRes.data) {
                setWfhPolicy({
                    ...policyRes.data,
                    productive_apps: (policyRes.data.productive_apps || []).join('\n'),
                    unproductive_apps: (policyRes.data.unproductive_apps || []).join('\n')
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError('Failed to load system configurations.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Logo size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Url = event.target.result;
            setSettings(prev => ({ ...prev, logo_url: base64Url }));
            setSuccess('Logo selected! Click "Save Changes" at the top right to save.');
            setTimeout(() => setSuccess(''), 4000);
        };
        reader.onerror = () => {
            setError('Failed to read logo image file.');
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setSuccess('');
            setError('');
            
            const formattedPolicy = {
                ...wfhPolicy,
                productive_apps: wfhPolicy.productive_apps.split('\n').map(a => a.trim()).filter(Boolean),
                unproductive_apps: wfhPolicy.unproductive_apps.split('\n').map(a => a.trim()).filter(Boolean)
            };
            
            await Promise.all([
                api.put('/admin/settings', settings),
                api.put('/admin/wfh/policy', formattedPolicy)
            ]);

            if (updateOrganization && settings.logo_url) {
                updateOrganization({ logo_url: settings.logo_url });
            }
            
            setSuccess('System and organization settings updated successfully.');
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">System Configuration</h1>
                    <p className="text-slate-500">Manage office hours, late thresholds, and global policy.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-primary-600 hover:bg-primary-500 disabled:bg-slate-100 disabled:text-slate-600 text-white px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 active:scale-95 shadow-lg shadow-primary-900/40"
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
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-primary-600/10 border border-primary-500/20 text-primary-500">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Desk App Policy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Office Start Time</label>
                            <input
                                type="time"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.office_start_time}
                                onChange={(e) => setSettings({ ...settings, office_start_time: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Late Threshold (Mins)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.late_threshold_mins}
                                onChange={(e) => setSettings({ ...settings, late_threshold_mins: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Required Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.required_hours}
                                onChange={(e) => setSettings({ ...settings, required_hours: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>

                {/* Field Force Settings Section */}
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-500">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Field App Policy</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Daily Start Time</label>
                            <input
                                type="time"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.field_office_start_time || '10:00'}
                                onChange={(e) => setSettings({ ...settings, field_office_start_time: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Late Threshold (Mins)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.field_late_threshold_mins || 30}
                                onChange={(e) => setSettings({ ...settings, field_late_threshold_mins: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Goal Working Hours</label>
                            <input
                                type="number"
                                step="0.5"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.field_required_hours || 9.0}
                                onChange={(e) => setSettings({ ...settings, field_required_hours: parseFloat(e.target.value) })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Visits Goal</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                    value={settings.field_visits_goal || 10}
                                    onChange={(e) => setSettings({ ...settings, field_visits_goal: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Distance Goal (KM)</label>
                                <input
                                    type="number"
                                    step="1"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    value={settings.field_km_goal || 20}
                                    onChange={(e) => setSettings({ ...settings, field_km_goal: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Rate Per KM (₹)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                    value={settings.field_rate_per_km || 10.0}
                                    onChange={(e) => setSettings({ ...settings, field_rate_per_km: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Visit Geofence Radius (Meters)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    value={settings.field_visit_geofence || 200}
                                    onChange={(e) => setSettings({ ...settings, field_visit_geofence: parseInt(e.target.value) })}
                                />
                                <p className="text-[10px] text-slate-600 mt-2">Recommended: 200m for field reliability.</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* System & Localization Section */}
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-orange-600/10 border border-orange-500/20 text-orange-500">
                            <Globe size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Localization</h2>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Timezone Offset (Minutes)</label>
                            <input
                                type="number"
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 text-slate-800"
                                value={settings.timezone_offset}
                                onChange={(e) => setSettings({ ...settings, timezone_offset: parseInt(e.target.value) })}
                            />
                            <p className="text-[10px] text-slate-600 mt-2">Minutes from UTC. (e.g., 330 for India GMT+5:30)</p>
                        </div>
                    </div>
                </div>

                {/* Office Location & Security Section */}
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-500">
                            <MapPin size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Office Location & Security</h2>
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
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
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
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
                                className="w-full py-2 bg-slate-100 hover:bg-slate-200:bg-slate-700 text-slate-600 text-[10px] font-bold rounded-lg border border-slate-300 transition-colors uppercase tracking-widest"
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
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    value={settings.office_wifi_ssid || ''}
                                    onChange={(e) => setSettings({ ...settings, office_wifi_ssid: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-600 mt-2">Leave blank to allow any network. Desk app will check for this SSID.</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Restricted Office WiFi (BSSID)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. 00:11:22:33:44:55"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    value={settings.office_wifi_bssid || ''}
                                    onChange={(e) => setSettings({ ...settings, office_wifi_bssid: e.target.value })}
                                />
                                <p className="text-[10px] text-slate-600 mt-2">Optional. Specify WiFi router BSSID MAC address for higher security.</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Geofence Radius (Meters)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-primary-500 outline-none text-slate-900"
                                    value={settings.geofence_radius || 150}
                                    onChange={(e) => setSettings({ ...settings, geofence_radius: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Branding Section */}
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-rose-600/10 border border-rose-500/20 text-rose-500">
                            <Shield size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Custom Branding</h2>
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
                                    <p className="text-sm text-slate-800 font-mono uppercase">{settings.primary_color || '#6366f1'}</p>
                                    <p className="text-[10px] text-slate-600 mt-1">This color will be used across Admin and Field Apps.</p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Organization Logo</label>
                            <label className="p-4 rounded-xl border-2 border-dashed border-slate-200 hover:border-slate-300 transition-colors flex flex-col items-center justify-center cursor-pointer bg-slate-50 min-h-[100px] relative overflow-hidden">
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
                                    <div className="absolute inset-0 bg-slate-50 flex items-center justify-center">
                                        <Loader2 className="animate-spin text-primary-500" size={24} />
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>
                </div>

                {/* WFH Policy Section */}
                <div className="bg-white backdrop-blur-md border border-slate-200 p-8 rounded-[2rem] space-y-6 md:col-span-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-[#004B87]/10 border border-[#004B87]/20 text-[#004B87]">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Work From Home (WFH) Policy</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Screenshot Interval</label>
                                    <span className="text-xs font-mono font-bold text-[#0062B1]">{wfhPolicy.screenshot_interval_minutes} minutes</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="5"
                                    className="w-full h-1 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-[#004B87]"
                                    value={wfhPolicy.screenshot_interval_minutes}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, screenshot_interval_minutes: parseInt(e.target.value) })}
                                />
                                <p className="text-[9px] text-slate-600 mt-1">Select interval for desktop screenshots. Range: 5 to 60 min. Default: 10 min.</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Face Check Interval</label>
                                    <span className="text-xs font-mono font-bold text-[#0062B1]">{wfhPolicy.face_check_interval_minutes} minutes</span>
                                </div>
                                <input
                                    type="range"
                                    min="15"
                                    max="120"
                                    step="15"
                                    className="w-full h-1 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-[#004B87]"
                                    value={wfhPolicy.face_check_interval_minutes}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, face_check_interval_minutes: parseInt(e.target.value) })}
                                />
                                <p className="text-[9px] text-slate-600 mt-1">Continuous webcam biometrics verification check frequency.</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Max Idle Timeout</label>
                                    <span className="text-xs font-mono font-bold text-[#0062B1]">{wfhPolicy.max_idle_minutes} minutes</span>
                                </div>
                                <input
                                    type="range"
                                    min="5"
                                    max="60"
                                    step="5"
                                    className="w-full h-1 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-[#004B87]"
                                    value={wfhPolicy.max_idle_minutes}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, max_idle_minutes: parseInt(e.target.value) })}
                                />
                                <p className="text-[9px] text-slate-600 mt-1">Minutes of inactivity before extended idle alert and auto checkout.</p>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Productivity Threshold</label>
                                    <span className="text-xs font-mono font-bold text-[#0062B1]">{wfhPolicy.productivity_threshold_percent}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="30"
                                    max="90"
                                    step="5"
                                    className="w-full h-1 bg-slate-50 rounded-lg appearance-none cursor-pointer accent-[#004B87]"
                                    value={wfhPolicy.productivity_threshold_percent}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, productivity_threshold_percent: parseInt(e.target.value) })}
                                />
                                <p className="text-[9px] text-slate-600 mt-1">Minimum score required to maintain productive status.</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Working Hours Start</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#004B87] text-slate-800"
                                        value={wfhPolicy.working_hours_start}
                                        onChange={(e) => setWfhPolicy({ ...wfhPolicy, working_hours_start: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Working Hours End</label>
                                    <input
                                        type="time"
                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#004B87] text-slate-800"
                                        value={wfhPolicy.working_hours_end}
                                        onChange={(e) => setWfhPolicy({ ...wfhPolicy, working_hours_end: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Screenshot Retention (Days)</label>
                                <input
                                    type="number"
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#004B87] text-slate-800"
                                    value={wfhPolicy.screenshot_retention_days}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, screenshot_retention_days: parseInt(e.target.value) })}
                                />
                                <p className="text-[9px] text-slate-600 mt-2">Captured workstation frames older than this will be auto-deleted.</p>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="require_face_verification"
                                    className="w-4 h-4 rounded border-slate-200 bg-slate-50 text-[#004B87] focus:ring-[#004B87] cursor-pointer"
                                    checked={wfhPolicy.require_face_verification}
                                    onChange={(e) => setWfhPolicy({ ...wfhPolicy, require_face_verification: e.target.checked })}
                                />
                                <label htmlFor="require_face_verification" className="text-xs font-bold text-slate-600 cursor-pointer">
                                    Require Face Biometrics & Liveness
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-200">
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Productive Applications List</label>
                            <textarea
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-[#004B87] text-slate-800 font-mono text-xs resize-none"
                                placeholder="E.g. vscode, slack, teams, chrome (one per line)"
                                value={wfhPolicy.productive_apps}
                                onChange={(e) => setWfhPolicy({ ...wfhPolicy, productive_apps: e.target.value })}
                            />
                            <p className="text-[9px] text-slate-600 mt-1">Applications classified as high-priority workflow tools.</p>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Unproductive Applications List</label>
                            <textarea
                                rows={3}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-rose-500 text-slate-800 font-mono text-xs resize-none"
                                placeholder="E.g. steam, discord, netflix, pubg (one per line)"
                                value={wfhPolicy.unproductive_apps}
                                onChange={(e) => setWfhPolicy({ ...wfhPolicy, unproductive_apps: e.target.value })}
                            />
                            <p className="text-[9px] text-slate-600 mt-1">Applications classified as non-workflow/entertainment tools.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
