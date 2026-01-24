import { useState, useEffect } from 'react';
import axios from 'axios';

const TemplateList = ({ onBack }) => {
    const [templates, setTemplates] = useState([]);
    const [filteredTemplates, setFilteredTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters
    const [filterDept, setFilterDept] = useState('');
    const [filterModel, setFilterModel] = useState('');
    const [filterGroup, setFilterGroup] = useState('');

    useEffect(() => {
        const fetchTemplates = async () => {
            try {
                const response = await axios.get('/api/admin/templates', { withCredentials: true });
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

        setFilteredTemplates(result);
    }, [filterDept, filterModel, filterGroup, templates]);

    // Extract Unique Options
    const uniqueDepts = [...new Set(templates.map(t => t.meta?.department).filter(Boolean))];
    const uniqueModels = [...new Set(templates.map(t => t.meta?.model).filter(Boolean))];
    const uniqueGroups = [...new Set(templates.map(t => t.meta?.as_group).filter(Boolean))];

    if (loading) return <div className="p-8 text-center">Loading templates...</div>;
    if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center gap-4 mb-6">
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

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6 flex flex-wrap gap-4 items-center">
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
                            <tr key={tpl.folderName} className="hover:bg-gray-50 transition-colors">
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
                                    <a
                                        href={tpl.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                                    >
                                        Open Form ↗
                                    </a>
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
        </div>
    );
};

export default TemplateList;
