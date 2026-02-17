import { useState, useEffect } from 'react';
import axios from 'axios';

const META_FIELDS = [
    { key: 'form_name', label: 'Form Name', placeholder: 'e.g. FAMB0007' },
    { key: 'checksheet_name', label: 'Checksheet Name', placeholder: 'e.g. FAMB0007_V3' },
    { key: 'version', label: 'Version', placeholder: 'e.g. 3' },
    { key: 'department', label: 'Department', placeholder: 'e.g. EDM, EDW, ASSEMBLY' },
    { key: 'model', label: 'Model', placeholder: 'e.g. K3HS, AL400G' },
    { key: 'as_group', label: 'AS Group', placeholder: 'e.g. BODY, FINAL, ASSY' },
    { key: 'title', label: 'Title (optional)', placeholder: 'Display title' },
    { key: 'header', label: 'Header (optional)', placeholder: 'Header text' },
];

const MetaEditModal = ({ isOpen, folderName, onClose, onSuccess }) => {
    const [meta, setMeta] = useState({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen && folderName) {
            setLoading(true);
            axios.get(`/api/admin/templates/${folderName}/meta`, { withCredentials: true })
                .then(res => {
                    if (res.data.success) {
                        setMeta(res.data.meta || {});
                    }
                })
                .catch(err => {
                    console.error('Load meta error:', err);
                    alert('❌ Failed to load meta.json');
                })
                .finally(() => setLoading(false));
        }
    }, [isOpen, folderName]);

    if (!isOpen) return null;

    const handleChange = (key, value) => {
        setMeta(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Remove empty string fields
            const cleanMeta = {};
            Object.entries(meta).forEach(([k, v]) => {
                if (v !== '' && v !== null && v !== undefined) {
                    cleanMeta[k] = v;
                }
            });

            const res = await axios.put(`/api/admin/templates/${folderName}/meta`, cleanMeta, {
                withCredentials: true,
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.data.success) {
                onSuccess();
            } else {
                alert('❌ Save failed: ' + (res.data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Save meta error:', err);
            alert('❌ Save failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                onClick={() => !saving && onClose()}
            ></div>

            <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-blue-600">✏️</span> Edit Meta
                    </h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Editing <code className="bg-slate-100 px-2 py-0.5 rounded font-bold text-blue-700">{folderName}</code>
                    </p>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-500">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        {META_FIELDS.map(({ key, label, placeholder }) => (
                            <div key={key} className="space-y-1">
                                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                    {label}
                                </label>
                                <input
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                                    placeholder={placeholder}
                                    value={meta[key] || ''}
                                    onChange={(e) => handleChange(key, e.target.value)}
                                    disabled={saving}
                                />
                            </div>
                        ))}

                        <div className="pt-4 flex gap-3">
                            <button
                                onClick={onClose}
                                disabled={saving}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-medium transition-colors border border-slate-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : '💾 Save'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MetaEditModal;
