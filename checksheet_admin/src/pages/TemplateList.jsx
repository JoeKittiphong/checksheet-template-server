import { useState, useEffect } from 'react';
// UPDATED BY AGENT FOR JSON SUPPORT
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TemplateUploadModal from '../components/TemplateUploadModal';
import MetaEditModal from '../components/MetaEditModal';

const TemplateList = ({ onBack }) => {
    const { user } = useAuth();
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

    // Filters
    const [filterDept, setFilterDept] = useState('');
    const [filterModel, setFilterModel] = useState('');
    const [filterGroup, setFilterGroup] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Delete confirmation
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Meta edit
    const [editMetaFolder, setEditMetaFolder] = useState(null);

    const isAdmin = user && ['admin', 'manager', 'supervisor', 'engineer'].includes(user.role);

    const fetchTemplates = async () => {
        try {
            const response = await axios.get(`/api/admin/templates?t=${Date.now()}`, { withCredentials: true });
            if (response.data.success) {
                setTemplates(response.data.templates);
                setFilteredTemplates(response.data.templates);
            } else {
                setError('Failed to load templates');
            }
        } catch (err) {
            console.error(err);
            setError('Error fetching data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    // Filter Logic
    useEffect(() => {
        let result = templates;

        if (filterDept) {
            result = result.filter(t => t.meta?.department === filterDept);
        }
        if (filterModel) {
            result = result.filter(t => t.meta?.model === filterModel);
        }
        if (filterGroup) {
            result = result.filter(t => t.meta?.as_group === filterGroup);
        }
        if (searchTerm) {
            const lowSearch = searchTerm.toLowerCase();
            result = result.filter(t =>
                t.folderName.toLowerCase().includes(lowSearch) ||
                t.meta?.checksheet_name?.toLowerCase().includes(lowSearch) ||
                t.meta?.form_name?.toLowerCase().includes(lowSearch)
            );
        }

        setFilteredTemplates(result);
    }, [filterDept, filterModel, filterGroup, searchTerm, templates]);

    // Extract Unique Options
    const uniqueDepts = [...new Set(templates.map(t => t.meta?.department).filter(Boolean))];
    const uniqueModels = [...new Set(templates.map(t => t.meta?.model).filter(Boolean))];
    const uniqueGroups = [...new Set(templates.map(t => t.meta?.as_group).filter(Boolean))];

    // Delete handler
    const handleDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const response = await axios.delete(`/api/admin/delete-template/${deleteTarget}`, { withCredentials: true });
            if (response.data.success) {
                setDeleteTarget(null);
                fetchTemplates();
            } else {
                alert('❌ Delete failed: ' + (response.data.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Delete error:', err);
            alert('❌ Delete failed: ' + (err.response?.data?.error || err.message));
        } finally {
            setIsDeleting(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading templates...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                        title="Back to Dashboard"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6 text-gray-600">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <span>📋</span> Checksheet Templates
                    </h1>
                </div>

                {isAdmin && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.open('/builder/', '_blank')}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold shadow-lg shadow-green-500/30 transition-all transform active:scale-95"
                        >
                            <span className="text-xl">🛠️</span> Form Builder
                        </button>
                        <button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
                        >
                            <span className="text-xl">📤</span> Upload New Template
                        </button>
                    </div>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
                <div className="relative flex-grow max-w-md">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                        🔍
                    </span>
                    <input
                        type="text"
                        placeholder="Search by name or folder..."
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="h-6 w-px bg-gray-200 hidden md:block"></div>
                <span className="text-sm font-bold text-gray-600 uppercase">Filters:</span>

                <select
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                >
                    <option value="">All Departments</option>
                    {uniqueDepts.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                </select>

                <select
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterModel}
                    onChange={(e) => setFilterModel(e.target.value)}
                >
                    <option value="">All Models</option>
                    {uniqueModels.map(model => <option key={model} value={model}>{model}</option>)}
                </select>

                <select
                    className="border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filterGroup}
                    onChange={(e) => setFilterGroup(e.target.value)}
                >
                    <option value="">All Groups</option>
                    {uniqueGroups.map(group => <option key={group} value={group}>{group}</option>)}
                </select>

                <div className="flex-grow"></div>
                <div className="text-sm text-gray-500">
                    Found: <b>{filteredTemplates.length}</b> templates
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Form Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Title</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Department</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Model</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Group</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Version</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredTemplates.map((tpl) => (
                            <tr key={`${tpl.type}-${tpl.folderName}`} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${tpl.type === 'json' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {tpl.type === 'json' ? 'JSON' : 'HTML'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    {tpl.meta?.form_name || tpl.folderName}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {tpl.meta?.checksheet_name || <span className="text-gray-400 italic">No Title</span>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tpl.meta?.department || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tpl.meta?.model || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {tpl.meta?.as_group || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {tpl.meta?.version || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-3">
                                        <a
                                            href={tpl.type === 'json' ? `http://localhost:5173${tpl.url}` : tpl.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-indigo-600 hover:text-indigo-900 font-medium"
                                        >
                                            {tpl.type === 'json' ? 'Preview ↗' : 'Open ↗'}
                                        </a>

                                        {tpl.type === 'json' && isAdmin && (
                                            <a
                                                href={`http://localhost:5173/builder?workspace=${tpl.folderName}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-900 font-medium"
                                            >
                                                ⚙️ Edit
                                            </a>
                                        )}

                                        {isAdmin && tpl.type === 'legacy' && (
                                            <button
                                                onClick={() => setEditMetaFolder(tpl.folderName)}
                                                className="text-amber-600 hover:text-amber-800 font-medium transition-colors"
                                                title={`Edit meta for ${tpl.folderName}`}
                                            >
                                                ✏️ Edit
                                            </button>
                                        )}
                                        {isAdmin && (
                                            <button
                                                onClick={() => setDeleteTarget(tpl.folderName)}
                                                className="text-red-500 hover:text-red-700 font-medium transition-colors"
                                                title={`Delete ${tpl.folderName}`}
                                            >
                                                🗑️ Delete
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredTemplates.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                                    No templates match your filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => !isDeleting && setDeleteTarget(null)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
                        <div className="text-center mb-6">
                            <div className="text-5xl mb-3">⚠️</div>
                            <h3 className="text-xl font-bold text-gray-800">Delete Template?</h3>
                            <p className="text-gray-500 mt-2 text-sm">
                                This will permanently delete the folder
                            </p>
                            <p className="font-mono text-red-600 font-bold mt-1 text-lg">
                                {deleteTarget}
                            </p>
                            <p className="text-gray-400 text-xs mt-2">
                                This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteTarget(null)}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-medium transition-colors border border-gray-200 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : '🗑️ Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <TemplateUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={() => {
                    setIsUploadModalOpen(false);
                    fetchTemplates();
                }}
            />

            <MetaEditModal
                isOpen={!!editMetaFolder}
                folderName={editMetaFolder}
                onClose={() => setEditMetaFolder(null)}
                onSuccess={() => {
                    setEditMetaFolder(null);
                    fetchTemplates();
                }}
            />
        </div>
    );
};

export default TemplateList;
