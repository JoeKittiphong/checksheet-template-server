import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const UserManagement = ({ onBack }) => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        code: '',
        username: '',
        department: '',
        password: '',
        role: 'worker'
    });
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('all'); // 'all' or 'online'

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await axios.get('/users', { withCredentials: true });
            if (res.data.success) {
                setUsers(res.data.data);
            }
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    // Filter users based on search term and online status
    const filteredUsers = users.filter(u => {
        const matchesSearch = u.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.username.toLowerCase().includes(searchTerm.toLowerCase());

        if (filterMode === 'online') {
            return matchesSearch && u.last_action === 'LOGIN_SUCCESS';
        }
        return matchesSearch;
    });

    const handleOpenAdd = () => {
        setEditingUser(null);
        setFormData({ code: '', username: '', department: '', password: '', role: 'worker' });
        setError('');
        setShowModal(true);
    };

    const handleOpenEdit = (user) => {
        setEditingUser(user);
        setFormData({
            code: user.code,
            username: user.username,
            department: user.department || '',
            password: '',
            role: user.role
        });
        setError('');
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (editingUser) {
                const res = await axios.put(`/users/${editingUser.id}`, formData, { withCredentials: true });
                if (res.data.success) {
                    setShowModal(false);
                    fetchUsers();
                }
            } else {
                const res = await axios.post('/users', formData, { withCredentials: true });
                if (res.data.success) {
                    setShowModal(false);
                    fetchUsers();
                }
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Operation failed');
        }
    };

    const handleDelete = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            const res = await axios.delete(`/users/${userId}`, { withCredentials: true });
            if (res.data.success) {
                fetchUsers();
            }
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    if (loading) return <div className="p-8 text-center">Loading users...</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    </div>

                    <div className="flex flex-1 max-w-2xl gap-2">
                        <div className="relative flex-1">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by Code or Name..."
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Status Filter Toggle */}
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            <button
                                onClick={() => setFilterMode('all')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filterMode === 'all' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterMode('online')}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${filterMode === 'online' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                            >
                                <span className={`w-1.5 h-1.5 rounded-full bg-green-500 ${filterMode === 'online' ? 'animate-pulse' : ''}`}></span>
                                Online
                            </button>
                        </div>

                        <button
                            onClick={handleOpenAdd}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Add User
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm overflow-hidden overflow-x-auto border border-gray-100">
                    <table className="min-w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Code (Employee ID)</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Username</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Department</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Role</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Last Activity</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredUsers.length > 0 ? (
                                filteredUsers.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 text-sm font-medium">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${u.last_action === 'LOGIN_SUCCESS' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                                                <span className={u.last_action === 'LOGIN_SUCCESS' ? 'text-green-700 font-semibold' : 'text-gray-500'}>
                                                    {u.last_action === 'LOGIN_SUCCESS' ? 'Online' : 'Offline'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-800">{u.code}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{u.username}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{u.department || '-'}</td>
                                        <td className="px-6 py-4 text-sm capitalize">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${['admin', 'manager', 'supervisor', 'engineer'].includes(u.role) ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {u.last_action_at ? (
                                                <div className="flex flex-col">
                                                    <span>{new Date(u.last_action_at).toLocaleString()}</span>
                                                    <span className="text-[10px] opacity-70">
                                                        {u.last_action === 'LOGIN_SUCCESS' ? 'Logged in' : 'Logged out'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="italic text-gray-300">No records</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenEdit(u)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors font-medium text-sm"
                                                >
                                                    Edit
                                                </button>
                                                {currentUser.id !== u.id && (
                                                    <button
                                                        onClick={() => handleDelete(u.id)}
                                                        className="px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors font-medium text-sm"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-400">
                                        No users found matching "{searchTerm}"
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-6 text-gray-800">
                            {editingUser ? 'Edit User' : 'Add New User'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Employee Code</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Department
                                </label>
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                >
                                    <option value="">Select Department</option>
                                    <option value="EDM">EDM</option>
                                    <option value="EDW">EDW</option>
                                    <option value="IMM">IMM</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password {editingUser && '(Leave blank to keep current)'}
                                </label>
                                <input
                                    type="password"
                                    required={!editingUser}
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    className="w-full border p-2 rounded-lg"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                >
                                    <optgroup label="Admin Level">
                                        <option value="admin">Admin</option>
                                        <option value="manager">Manager</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="engineer">Engineer</option>
                                    </optgroup>
                                    <optgroup label="Staff Level">
                                        <option value="sheif">Sheif</option>
                                        <option value="ast-sheif">Ast-Sheif</option>
                                        <option value="leader">Leader</option>
                                        <option value="worker">Worker</option>
                                    </optgroup>
                                </select>
                            </div>

                            {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

                            <div className="flex gap-3 justify-end mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {editingUser ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
