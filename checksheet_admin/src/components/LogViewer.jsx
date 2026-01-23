import React, { useState, useEffect } from 'react';
import axios from 'axios';

const LogViewer = ({ onBack }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        user_code: '',
        action_type: '',
        start_date: '',
        end_date: '',
        limit: 100
    });

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);
        try {
            const params = new URLSearchParams(filter);
            const res = await axios.get(`/logs?${params.toString()}`, { withCredentials: true });
            if (res.data.success) {
                setLogs(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchLogs();
    };

    const handleLoadMore = () => {
        setFilter(prev => ({ ...prev, limit: prev.limit + 100 }));
        // Logic will trigger fetch in a follow-up or via useEffect
    };

    // Trigger fetch when limit changes for Load More
    useEffect(() => {
        if (filter.limit > 100) {
            fetchLogs(true);
        }
    }, [filter.limit]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">System Activity Logs</h1>
                    </div>

                    <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Employee Code</label>
                            <input
                                type="text"
                                placeholder="Any Code"
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 w-32"
                                value={filter.user_code}
                                onChange={(e) => setFilter({ ...filter, user_code: e.target.value })}
                            />
                        </div>

                        <div className="flex flex-col">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Action Type</label>
                            <select
                                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                value={filter.action_type}
                                onChange={(e) => setFilter({ ...filter, action_type: e.target.value })}
                            >
                                <option value="">All Actions</option>
                                <option value="LOGIN_SUCCESS">Login Success</option>
                                <option value="LOGIN_FAILURE">Login Failure</option>
                                <option value="LOGOUT">Logout</option>
                                <option value="CREATE_CHECKSHEET">Create Checksheet</option>
                                <option value="UPDATE_CHECKSHEET">Update Checksheet</option>
                                <option value="DELETE_CHECKSHEET">Delete Checksheet</option>
                                <option value="CREATE_USER">Create User</option>
                                <option value="UPDATE_USER">Update User</option>
                                <option value="DELETE_USER">Delete User</option>
                            </select>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Start Date</label>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filter.start_date}
                                    onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
                                />
                            </div>
                            <span className="text-gray-300 mt-4">→</span>
                            <div className="flex flex-col">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">End Date</label>
                                <input
                                    type="date"
                                    className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                                    value={filter.end_date}
                                    onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="mt-4 xl:mt-0 px-6 py-2 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                        >
                            ค้นหา (Filter)
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Timestamp</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">User</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Action</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider">Details</th>
                                    <th className="px-6 py-4 font-semibold text-gray-600 text-xs uppercase tracking-wider text-right">IP</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400">Loading logs...</td>
                                    </tr>
                                ) : logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors text-sm">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500">
                                                {new Date(log.created_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-800">{log.user_code}</div>
                                                <div className="text-xs text-gray-400">{log.username}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${log.action_type.includes('FAILURE') || log.action_type.includes('DELETE')
                                                    ? 'bg-red-50 text-red-600'
                                                    : log.action_type.includes('CREATE')
                                                        ? 'bg-emerald-50 text-emerald-600'
                                                        : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {log.action_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="max-w-xs truncate text-xs text-gray-600 font-mono" title={log.details}>
                                                    {log.details || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400 font-mono text-xs">
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-10 text-center text-gray-400">No activity logs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {!loading && logs.length >= filter.limit && (
                    <div className="mt-6 flex justify-center">
                        <button
                            onClick={handleLoadMore}
                            className="px-6 py-2 bg-white border border-gray-200 text-gray-600 font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                        >
                            <span>ดูเพิ่ม (Load More)</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LogViewer;
