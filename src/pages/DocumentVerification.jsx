import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    ShieldCheck,
    ScanText,
    Upload,
    FileCheck,
    FileX2,
    FileText,
    Search,
    Loader2,
    X,
    Check,
    ChevronDown,
    ChevronRight,
    Eye,
    AlertCircle,
    Clock,
    User,
    CreditCard,
    Fingerprint,
    Car,
    Vote,
    Plane,
    GraduationCap,
    BookOpen,
    Award,
    Landmark,
    Receipt,
    Briefcase,
    ScrollText,
    Mail,
    Camera,
    File,
    Shield,
    XCircle,
    CheckCircle,
    Filter,
    RefreshCw,
    ExternalLink,
    Calendar,
    Hash,
    BadgeCheck,
    ImageIcon,
    ZoomIn
} from 'lucide-react';
import api from '../utils/api';
import { useTheme } from '../context/ThemeContext';

// ─── Document type icon mapping ────────────────────────────────────────────────
const DOC_TYPE_META = {
    aadhaar:              { icon: Fingerprint, label: 'Aadhaar Card', color: 'text-orange-400' },
    pan:                  { icon: CreditCard,  label: 'PAN Card', color: 'text-sky-400' },
    driving_license:      { icon: Car,         label: 'Driving License', color: 'text-emerald-400' },
    voter_id:             { icon: Vote,        label: 'Voter ID', color: 'text-violet-400' },
    passport:             { icon: Plane,       label: 'Passport', color: 'text-rose-400' },
    class_10_marksheet:   { icon: BookOpen,    label: 'Class 10 Marksheet', color: 'text-amber-400' },
    class_12_marksheet:   { icon: BookOpen,    label: 'Class 12 Marksheet', color: 'text-amber-400' },
    degree_certificate:   { icon: GraduationCap, label: 'Degree Certificate', color: 'text-indigo-400' },
    bank_passbook:        { icon: Landmark,    label: 'Bank Passbook', color: 'text-teal-400' },
    salary_slip:          { icon: Receipt,     label: 'Salary Slip', color: 'text-green-400' },
    experience_letter:    { icon: Briefcase,   label: 'Experience Letter', color: 'text-cyan-400' },
    relieving_letter:     { icon: ScrollText,  label: 'Relieving Letter', color: 'text-blue-400' },
    offer_letter:         { icon: Mail,        label: 'Offer Letter', color: 'text-purple-400' },
    photo:                { icon: Camera,      label: 'Photograph', color: 'text-pink-400' },
    other:                { icon: File,        label: 'Other Document', color: 'text-slate-400' },
};

const getDocMeta = (type) => DOC_TYPE_META[type] || DOC_TYPE_META.other;

// ─── Verification source badges ────────────────────────────────────────────────
const SOURCE_BADGES = {
    digilocker: {
        label: 'DigiLocker Verified',
        icon: Shield,
        classes: 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/30 shadow-sm dark:shadow-none',
        dot: 'bg-emerald-400',
    },
    ocr: {
        label: 'OCR Extracted',
        icon: ScanText,
        classes: 'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/30 shadow-sm dark:shadow-none',
        dot: 'bg-amber-400',
    },
    manual: {
        label: 'Manual Upload',
        icon: Upload,
        classes: 'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/30 shadow-sm dark:shadow-none',
        dot: 'bg-blue-400',
    },
};

const getSourceBadge = (source) => SOURCE_BADGES[source] || SOURCE_BADGES.manual;

// ─── Status badges ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
    verified:  'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/25',
    pending:   'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/25',
    rejected:  'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/25',
    review:    'bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/25',
};

const STATUS_ICONS = {
    verified:  CheckCircle,
    pending:   Clock,
    rejected:  XCircle,
    review:    Eye,
};

// ─── Filter tabs config ────────────────────────────────────────────────────────
const FILTER_TABS = [
    { key: 'all',        label: 'All',               icon: FileText },
    { key: 'pending',    label: 'Pending Review',    icon: Clock },
    { key: 'digilocker', label: 'DigiLocker',        icon: Shield },
    { key: 'ocr',        label: 'OCR Extracted',     icon: ScanText },
    { key: 'manual',     label: 'Manual',            icon: Upload },
    { key: 'rejected',   label: 'Rejected',          icon: FileX2 },
];

// ─── Stat Card Component ───────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, borderColor, shadowColor, loading }) => {
    const { isDarkMode } = useTheme();
    return (
        <div className={`relative group bg-white dark:bg-slate-900/50 border ${isDarkMode ? borderColor : 'border-slate-200'} rounded-2xl p-5 shadow-sm dark:shadow-none transition-all duration-300 hover:scale-[1.02] hover:${shadowColor} overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
            <div className="flex items-center justify-between relative">
                <div>
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
                    {loading ? (
                        <div className="h-8 w-16 bg-slate-800 rounded-lg animate-pulse" />
                    ) : (
                        <p className="text-3xl font-black text-white tracking-tight">{value}</p>
                    )}
                </div>
                <div className={`p-3 ${color} rounded-2xl`}>
                    <Icon size={22} className="text-current" />
                </div>
            </div>
        </div>
    );
};

// ─── Source Badge Component ────────────────────────────────────────────────────
const SourceBadge = ({ source, compact = false }) => {
    const badge = getSourceBadge(source);
    const Icon = badge.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wide ${badge.classes}`}>
            <Icon size={compact ? 11 : 13} />
            {!compact && badge.label}
        </span>
    );
};

// ─── Status Badge Component ────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const normalized = status?.toLowerCase() || 'pending';
    const style = STATUS_STYLES[normalized] || STATUS_STYLES.pending;
    const Icon = STATUS_ICONS[normalized] || Clock;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-wide capitalize ${style}`}>
            <Icon size={12} />
            {normalized}
        </span>
    );
};

// ─── Empty State Component ─────────────────────────────────────────────────────
const EmptyState = ({ title, description, icon: Icon = FileText }) => (
    <div className="flex flex-col items-center justify-center py-20 px-6">
        <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl scale-150" />
            <div className="relative p-6 bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800/50">
                <Icon size={48} className="text-slate-600" />
            </div>
        </div>
        <h3 className="text-lg font-bold text-slate-400 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 text-center max-w-md">{description}</p>
    </div>
);

// ─── OCR Data Field ────────────────────────────────────────────────────────────
const OCRField = ({ label, value, icon: Icon }) => (
    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700/50">
        <div className="flex items-center gap-2 mb-1">
            {Icon && <Icon size={12} className="text-amber-600 dark:text-amber-400/70" />}
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-450 uppercase tracking-widest">{label}</span>
        </div>
        <p className="text-sm font-semibold text-slate-850 dark:text-white truncate">{value || '—'}</p>
    </div>
);

// ─── Rejection Modal Component ─────────────────────────────────────────────────
const RejectionModal = ({ isOpen, onClose, onSubmit, loading }) => {
    const [reason, setReason] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('');

    const presets = [
        'Document is blurry or unreadable',
        'Information does not match employee records',
        'Document appears tampered or forged',
        'Wrong document type uploaded',
        'Document has expired',
        'Missing pages or incomplete document',
    ];

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg 
                shadow-2xl shadow-slate-200/50 dark:shadow-black/50 animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-rose-500/15 rounded-xl border border-rose-500/25">
                            <FileX2 size={20} className="text-rose-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Reject Document</h3>
                            <p className="text-xs text-slate-500">Provide a reason for rejection</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-colors">
                        <X size={18} className="text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 block">
                            Quick Reasons
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {presets.map((preset) => (
                                <button
                                    key={preset}
                                    onClick={() => { setSelectedPreset(preset); setReason(preset); }}
                                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-200
                                        ${selectedPreset === preset 
                                            ? 'bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30' 
                                            : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-450 border-slate-200 dark:border-slate-700/50 hover:border-slate-350 dark:hover:border-slate-600'}`}
                                >
                                    {preset}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 block">
                            Detailed Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setSelectedPreset(''); }}
                            placeholder="Enter detailed rejection reason..."
                            rows={3}
                            className="w-full bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white
                                placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500/50
                                transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-800/50">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:text-slate-900 dark:text-slate-450 dark:hover:text-white 
                            bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/50 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onSubmit(reason)}
                        disabled={!reason.trim() || loading}
                        className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-rose-600 to-rose-500 
                            rounded-xl shadow-lg shadow-rose-500/20 dark:shadow-rose-900/30 hover:shadow-rose-500/30 dark:hover:shadow-rose-900/50 transition-all
                            disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                        Reject Document
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Image Preview Modal ───────────────────────────────────────────────────────
const ImagePreviewModal = ({ url, onClose }) => {
    if (!url) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <div className="relative max-w-4xl max-h-[85vh]">
                <button onClick={onClose}
                    className="absolute -top-3 -right-3 p-2 bg-slate-800 border border-slate-700 rounded-xl 
                        hover:bg-slate-700 transition-colors z-10 shadow-xl">
                    <X size={18} className="text-white" />
                </button>
                <img src={url} alt="Document preview" 
                    className="max-w-full max-h-[85vh] object-contain rounded-2xl border border-slate-700/50 shadow-2xl" />
            </div>
        </div>
    );
};

// ─── Document Detail Card ──────────────────────────────────────────────────────
const DocumentCard = ({ doc, onVerify, onReject, actionLoading }) => {
    const meta = getDocMeta(doc.document_type);
    const DocIcon = meta.icon;
    const isOCR = doc.verification_source === 'ocr';
    const isPending = doc.status === 'pending' || doc.status === 'review';
    const [previewUrl, setPreviewUrl] = useState(null);

    return (
        <>
            <div className={`bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/60 rounded-2xl overflow-hidden
                transition-all duration-300 hover:border-slate-350 dark:hover:border-slate-700/60 group shadow-sm dark:shadow-none
                ${isPending ? 'ring-1 ring-amber-500/10' : ''}`}>
                
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800/40">
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl ${meta.color}`}>
                            <DocIcon size={18} />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">{meta.label}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                                {doc.file_name || doc.document_type}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <SourceBadge source={doc.verification_source} />
                        <StatusBadge status={doc.status} />
                    </div>
                </div>

                {/* OCR Side-by-Side View */}
                {isOCR && doc.ocr_data ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800/40">
                        {/* Document Image */}
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ImageIcon size={13} className="text-slate-500" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                    Original Document
                                </span>
                            </div>
                            {doc.file_url ? (
                                <div className="relative group/img cursor-pointer" onClick={() => setPreviewUrl(doc.file_url)}>
                                    <img src={doc.file_url} alt={meta.label}
                                        className="w-full h-48 object-cover rounded-xl border border-slate-700/50 
                                            transition-all duration-300 group-hover/img:brightness-75" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 
                                        group-hover/img:opacity-100 transition-opacity">
                                        <div className="p-2.5 bg-black/60 rounded-xl backdrop-blur-sm">
                                            <ZoomIn size={20} className="text-white" />
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full h-48 bg-slate-105 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/30 
                                    flex items-center justify-center">
                                    <FileText size={32} className="text-slate-700" />
                                </div>
                            )}
                        </div>

                        {/* OCR Extracted Data */}
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <ScanText size={13} className="text-amber-400/70" />
                                <span className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest">
                                    OCR Extracted Data
                                </span>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {doc.ocr_data.name && (
                                    <OCRField label="Full Name" value={doc.ocr_data.name} icon={User} />
                                )}
                                {doc.ocr_data.date_of_birth && (
                                    <OCRField label="Date of Birth" value={doc.ocr_data.date_of_birth} icon={Calendar} />
                                )}
                                {doc.ocr_data.document_number && (
                                    <OCRField label="Document Number" value={doc.ocr_data.document_number} icon={Hash} />
                                )}
                                {doc.ocr_data.father_name && (
                                    <OCRField label="Father's Name" value={doc.ocr_data.father_name} icon={User} />
                                )}
                                {doc.ocr_data.address && (
                                    <OCRField label="Address" value={doc.ocr_data.address} icon={FileText} />
                                )}
                                {doc.ocr_data.gender && (
                                    <OCRField label="Gender" value={doc.ocr_data.gender} icon={User} />
                                )}
                                {/* Render any additional OCR fields dynamically */}
                                {Object.entries(doc.ocr_data)
                                    .filter(([k]) => !['name', 'date_of_birth', 'document_number', 'father_name', 'address', 'gender'].includes(k))
                                    .map(([key, val]) => (
                                        <OCRField key={key} label={key.replace(/_/g, ' ')} value={String(val)} />
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Standard doc info row */
                    <div className="px-5 py-4 flex items-center gap-6 flex-wrap">
                        {doc.file_url && (
                            <button onClick={() => setPreviewUrl(doc.file_url)}
                                className="flex items-center gap-2 text-xs text-primary-400 hover:text-primary-300 
                                    font-semibold transition-colors">
                                <Eye size={14} /> View Document
                            </button>
                        )}
                        {doc.uploaded_at && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Calendar size={12} />
                                {new Date(doc.uploaded_at).toLocaleDateString('en-IN', {
                                    day: '2-digit', month: 'short', year: 'numeric'
                                })}
                            </span>
                        )}
                        {doc.document_number && (
                            <span className="flex items-center gap-1.5 text-xs text-slate-500">
                                <Hash size={12} />
                                {doc.document_number}
                            </span>
                        )}
                        {doc.rejection_reason && (
                            <span className="flex items-center gap-1.5 text-xs text-rose-400/80">
                                <AlertCircle size={12} />
                                {doc.rejection_reason}
                            </span>
                        )}
                    </div>
                )}

                {/* Action Buttons for pending docs */}
                {isPending && (
                    <div className="flex items-center gap-3 px-5 py-4 border-t border-slate-200 dark:border-slate-800/40 bg-slate-50 dark:bg-slate-950/30">
                        <button
                            onClick={() => onVerify(doc)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-white 
                                bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-xl shadow-md shadow-emerald-600/10 dark:shadow-emerald-900/25 
                                hover:shadow-emerald-900/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            {actionLoading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                            Approve
                        </button>
                        <button
                            onClick={() => onReject(doc)}
                            disabled={actionLoading}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold 
                                text-rose-400 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl 
                                hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                            <XCircle size={16} />
                            Reject
                        </button>
                    </div>
                )}
            </div>

            <ImagePreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />
        </>
    );
};

// ─── Employee Row Component ────────────────────────────────────────────────────
const EmployeeRow = ({ employee, isExpanded, onToggle, onVerifyDoc, onRejectDoc, actionLoading }) => {
    const docs = employee.documents || [];
    const pendingCount = docs.filter(d => d.status === 'pending' || d.status === 'review').length;
    const verifiedCount = docs.filter(d => d.status === 'verified').length;
    const rejectedCount = docs.filter(d => d.status === 'rejected').length;
    const digilockerCount = docs.filter(d => d.verification_source === 'digilocker').length;

    return (
        <div className={`border rounded-2xl transition-all duration-300 overflow-hidden
            ${isExpanded 
                ? 'border-primary-500/30 bg-indigo-50/20 dark:bg-slate-900/70 shadow-md dark:shadow-lg dark:shadow-primary-500/5' 
                : 'border-slate-200 dark:border-slate-800/50 bg-white dark:bg-slate-900/30 hover:border-slate-350 dark:hover:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-900/50 shadow-sm dark:shadow-none'}`}>
            
            {/* Employee Header */}
            <button onClick={onToggle}
                className="w-full flex items-center justify-between px-5 py-4 text-left group">
                <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary-600 to-primary-500 
                            flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-primary-900/20">
                            {(employee.employee_name || employee.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        {pendingCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full text-[10px] 
                                font-bold text-white flex items-center justify-center shadow-lg shadow-amber-900/30 
                                animate-pulse">
                                {pendingCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-850 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-300 transition-colors">
                            {employee.employee_name || employee.name || 'Unknown Employee'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {employee.employee_email || employee.email || '—'}
                            {employee.department && <span className="ml-2 text-slate-600">• {employee.department}</span>}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Doc count pills */}
                    <div className="hidden sm:flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/40">
                            {docs.length} docs
                        </span>
                        {verifiedCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
                                {verifiedCount} ✓
                            </span>
                        )}
                        {digilockerCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-1">
                                <Shield size={10} /> {digilockerCount}
                            </span>
                        )}
                        {rejectedCount > 0 && (
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                                {rejectedCount} ✗
                            </span>
                        )}
                    </div>

                    <div className={`p-1.5 rounded-lg transition-all duration-300 
                        ${isExpanded ? 'bg-primary-500/15 text-primary-400 rotate-180' : 'text-slate-600'}`}>
                        <ChevronDown size={18} />
                    </div>
                </div>
            </button>

            {/* Expanded Document List */}
            {isExpanded && (
                <div className="px-5 pb-5 space-y-3 animate-in slide-in-from-top-2 fade-in duration-300">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700/50 to-transparent" />
                    {docs.length > 0 ? (
                        docs.map((doc) => (
                            <DocumentCard
                                key={doc._id || doc.id || `${doc.document_type}-${doc.uploaded_at}`}
                                doc={doc}
                                onVerify={onVerifyDoc}
                                onReject={onRejectDoc}
                                actionLoading={actionLoading}
                            />
                        ))
                    ) : (
                        <div className="text-center py-8">
                            <FileText size={28} className="text-slate-700 mx-auto mb-2" />
                            <p className="text-sm text-slate-600">No documents uploaded yet</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════════
// ─── Main DocumentVerification Component ───────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

const DocumentVerification = () => {
    const { isDarkMode } = useTheme();
    // ─── State ─────────────────────────────────────────────────────────────
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEmployee, setExpandedEmployee] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // Modal states
    const [rejectModal, setRejectModal] = useState({ open: false, doc: null, employeeId: null });
    
    // Stats
    const [stats, setStats] = useState({
        total: 0,
        digilocker: 0,
        ocr_pending: 0,
        manual_pending: 0,
        verified: 0,
        rejected: 0,
    });

    // ─── Data Fetching ─────────────────────────────────────────────────────
    const fetchDocuments = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            else setRefreshing(true);

            const statusParam = activeFilter === 'all' ? '' : 
                                activeFilter === 'pending' ? '?status=pending' :
                                activeFilter === 'digilocker' ? '?source=digilocker' :
                                activeFilter === 'ocr' ? '?source=ocr' :
                                activeFilter === 'manual' ? '?source=manual' :
                                activeFilter === 'rejected' ? '?status=rejected' : '';

            const res = await api.get(`/hrms/onboarding/documents/all${statusParam}`);
            const data = Array.isArray(res.data) ? res.data : res.data?.documents || [];
            setDocuments(data);
        } catch (err) {
            console.error('Error fetching documents:', err);
            // Set empty on error so UI doesn't break
            setDocuments([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [activeFilter]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/hrms/onboarding/documents/all?summary=true');
            const data = res.data;
            if (data?.stats) {
                setStats(data.stats);
            } else if (data) {
                // Compute stats from all docs if API doesn't return summary
                const allDocs = Array.isArray(data) ? data : data?.documents || [];
                const flatDocs = allDocs.flatMap(emp => emp.documents || [emp]);
                setStats({
                    total: flatDocs.length,
                    digilocker: flatDocs.filter(d => d.verification_source === 'digilocker').length,
                    ocr_pending: flatDocs.filter(d => d.verification_source === 'ocr' && (d.status === 'pending' || d.status === 'review')).length,
                    manual_pending: flatDocs.filter(d => d.verification_source === 'manual' && (d.status === 'pending' || d.status === 'review')).length,
                    verified: flatDocs.filter(d => d.status === 'verified').length,
                    rejected: flatDocs.filter(d => d.status === 'rejected').length,
                });
            }
        } catch (err) {
            console.error('Error fetching stats:', err);
        }
    }, []);

    useEffect(() => {
        fetchDocuments();
        fetchStats();
    }, [fetchDocuments, fetchStats]);

    // ─── Actions ───────────────────────────────────────────────────────────
    const handleVerify = async (doc) => {
        const employeeId = doc.employee_id || doc.employeeId;
        const docId = doc._id || doc.id;
        if (!employeeId || !docId) return;

        setActionLoading(true);
        try {
            await api.put(`/hrms/onboarding/${employeeId}/documents/${docId}/verify`, {
                action: 'verify'
            });
            // Refresh data
            await Promise.all([fetchDocuments(true), fetchStats()]);
        } catch (err) {
            console.error('Error verifying document:', err);
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = (doc) => {
        setRejectModal({
            open: true,
            doc,
            employeeId: doc.employee_id || doc.employeeId,
        });
    };

    const submitRejection = async (reason) => {
        const { doc, employeeId } = rejectModal;
        const docId = doc?._id || doc?.id;
        if (!employeeId || !docId) return;

        setActionLoading(true);
        try {
            await api.put(`/hrms/onboarding/${employeeId}/documents/${docId}/verify`, {
                action: 'reject',
                rejection_reason: reason,
            });
            setRejectModal({ open: false, doc: null, employeeId: null });
            await Promise.all([fetchDocuments(true), fetchStats()]);
        } catch (err) {
            console.error('Error rejecting document:', err);
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Process documents into employee groups ────────────────────────────
    const employeeGroups = useMemo(() => {
        const groups = {};
        const docs = Array.isArray(documents) ? documents : [];

        docs.forEach((item) => {
            // API might return flat docs or grouped by employee
            if (item.documents && (item.employee_id || item.employeeId || item._id)) {
                // Already grouped by employee
                const empId = item.employee_id || item.employeeId || item._id;
                groups[empId] = {
                    employee_id: empId,
                    employee_name: item.employee_name || item.name || 'Unknown',
                    employee_email: item.employee_email || item.email || '',
                    department: item.department || '',
                    documents: item.documents.map(d => ({ ...d, employee_id: empId })),
                };
            } else {
                // Flat document list - group by employee_id
                const empId = item.employee_id || item.employeeId || 'unknown';
                if (!groups[empId]) {
                    groups[empId] = {
                        employee_id: empId,
                        employee_name: item.employee_name || item.name || 'Unknown',
                        employee_email: item.employee_email || item.email || '',
                        department: item.department || '',
                        documents: [],
                    };
                }
                groups[empId].documents.push({ ...item, employee_id: empId });
            }
        });

        return Object.values(groups);
    }, [documents]);

    // ─── Filtered & searched employees ─────────────────────────────────────
    const filteredEmployees = useMemo(() => {
        let filtered = employeeGroups;

        // Search filter
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(emp =>
                (emp.employee_name || '').toLowerCase().includes(q) ||
                (emp.employee_email || '').toLowerCase().includes(q)
            );
        }

        return filtered;
    }, [employeeGroups, searchQuery]);

    // ─── Skeleton Loader ───────────────────────────────────────────────────
    const SkeletonRow = () => (
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-5 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-slate-800" />
                <div className="flex-1">
                    <div className="h-4 w-40 bg-slate-800 rounded-lg mb-2" />
                    <div className="h-3 w-56 bg-slate-800/60 rounded-lg" />
                </div>
                <div className="flex gap-2">
                    <div className="h-6 w-16 bg-slate-800 rounded-lg" />
                    <div className="h-6 w-16 bg-slate-800 rounded-lg" />
                </div>
            </div>
        </div>
    );

    // ─── Render ────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6 max-w-[1600px] mx-auto">
            {/* ─── Page Header ────────────────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-white flex items-center gap-4 tracking-tight">
                        <div className="p-3 bg-primary-500/20 rounded-2xl border border-primary-500/30 shadow-lg shadow-primary-500/10">
                            <ShieldCheck className="text-primary-400" size={28} />
                        </div>
                        Document Verification
                    </h1>
                    <p className="text-slate-400 text-sm mt-2 font-medium">
                        Verify employee identity documents across DigiLocker, OCR, and manual uploads
                    </p>
                </div>
                <button
                    onClick={() => fetchDocuments(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-primary-400 
                        bg-primary-500/10 border border-primary-500/20 rounded-xl hover:bg-primary-500/20 
                        transition-all disabled:opacity-40"
                >
                    <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                    {refreshing ? 'Refreshing...' : 'Refresh'}
                </button>
            </div>

            {/* ─── Stats Dashboard ────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={FileText}
                    label="Total Documents"
                    value={stats.total}
                    color="bg-primary-500/15 text-primary-400"
                    borderColor="border-slate-800/60"
                    shadowColor="shadow-lg shadow-primary-500/5"
                    loading={loading}
                />
                <StatCard
                    icon={Shield}
                    label="DigiLocker Verified"
                    value={stats.digilocker}
                    color="bg-emerald-500/15 text-emerald-400"
                    borderColor="border-emerald-500/15"
                    shadowColor="shadow-lg shadow-emerald-500/5"
                    loading={loading}
                />
                <StatCard
                    icon={ScanText}
                    label="OCR Pending Review"
                    value={stats.ocr_pending}
                    color="bg-amber-500/15 text-amber-400"
                    borderColor="border-amber-500/15"
                    shadowColor="shadow-lg shadow-amber-500/5"
                    loading={loading}
                />
                <StatCard
                    icon={Upload}
                    label="Manual Pending"
                    value={stats.manual_pending}
                    color="bg-blue-500/15 text-blue-400"
                    borderColor="border-blue-500/15"
                    shadowColor="shadow-lg shadow-blue-500/5"
                    loading={loading}
                />
            </div>

            {/* ─── Verification Tier Legend ────────────────────────────────── */}
            <div className="bg-slate-900/30 border border-slate-800/40 rounded-2xl p-4">
                <div className="flex flex-wrap items-center gap-6">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        Verification Tiers
                    </span>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/30" />
                        <span className="text-xs text-slate-400">
                            <span className="font-bold text-emerald-400">DigiLocker</span> — Government verified, highest trust
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
                        <span className="text-xs text-slate-400">
                            <span className="font-bold text-amber-400">OCR Extracted</span> — Auto-extracted, needs admin review
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/30" />
                        <span className="text-xs text-slate-400">
                            <span className="font-bold text-blue-400">Manual Upload</span> — Employee uploaded, admin verified
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Filter Tabs + Search ───────────────────────────────────── */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-900/40 p-1.5 rounded-2xl border border-slate-800/50 
                    backdrop-blur-md overflow-x-auto max-w-full scrollbar-hide">
                    {FILTER_TABS.map(({ key, label, icon: TabIcon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveFilter(key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold 
                                transition-all duration-200 whitespace-nowrap
                                ${activeFilter === key
                                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/40'
                                    : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/40'}`}
                        >
                            <TabIcon size={14} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* Search Bar */}
                <div className="relative flex-1 min-w-[280px]">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by employee name or email..."
                        className="w-full bg-slate-900/40 border border-slate-800/50 rounded-xl pl-11 pr-4 py-2.5 
                            text-sm text-white placeholder-slate-600 focus:outline-none focus:ring-2 
                            focus:ring-primary-500/30 focus:border-primary-500/40 transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-800 rounded-lg transition-colors">
                            <X size={14} className="text-slate-500" />
                        </button>
                    )}
                </div>
            </div>

            {/* ─── Employee Document List ──────────────────────────────────── */}
            <div className="space-y-3">
                {loading ? (
                    // Skeleton loading
                    <>
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                        <SkeletonRow />
                    </>
                ) : filteredEmployees.length === 0 ? (
                    <EmptyState
                        title={searchQuery ? 'No matching employees' : 'No documents found'}
                        description={
                            searchQuery
                                ? `No employees match "${searchQuery}". Try adjusting your search or filters.`
                                : 'There are no documents matching the current filter. Documents will appear here as employees upload them.'
                        }
                        icon={searchQuery ? Search : FileText}
                    />
                ) : (
                    filteredEmployees.map((employee) => (
                        <EmployeeRow
                            key={employee.employee_id}
                            employee={employee}
                            isExpanded={expandedEmployee === employee.employee_id}
                            onToggle={() => setExpandedEmployee(
                                expandedEmployee === employee.employee_id ? null : employee.employee_id
                            )}
                            onVerifyDoc={handleVerify}
                            onRejectDoc={handleReject}
                            actionLoading={actionLoading}
                        />
                    ))
                )}
            </div>

            {/* ─── Results Summary ────────────────────────────────────────── */}
            {!loading && filteredEmployees.length > 0 && (
                <div className="flex items-center justify-between py-3 px-1">
                    <p className="text-xs text-slate-600">
                        Showing <span className="font-bold text-slate-400">{filteredEmployees.length}</span> employee{filteredEmployees.length !== 1 ? 's' : ''} 
                        {' '}with <span className="font-bold text-slate-400">
                            {filteredEmployees.reduce((sum, emp) => sum + (emp.documents?.length || 0), 0)}
                        </span> document{filteredEmployees.reduce((sum, emp) => sum + (emp.documents?.length || 0), 0) !== 1 ? 's' : ''}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <BadgeCheck size={14} className="text-emerald-500/50" />
                        Verification powered by DigiLocker & Secure Automated OCR
                    </div>
                </div>
            )}

            {/* ─── Rejection Modal ────────────────────────────────────────── */}
            <RejectionModal
                isOpen={rejectModal.open}
                onClose={() => setRejectModal({ open: false, doc: null, employeeId: null })}
                onSubmit={submitRejection}
                loading={actionLoading}
            />
        </div>
    );
};

export default DocumentVerification;
