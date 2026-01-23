import { useState, useEffect } from 'react';
import axios from 'axios';
import FolderCard from './FolderCard';
import AddModal from './AddModal';
import DeleteModal from './DeleteModal';
import { useAuth } from '../context/AuthContext';

// Determine API Base URL
// In development, we might be on port 5173 but server is 3000.
// In production, we are on the same origin.
const API_BASE = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin;
const FORM_BASE_URL = `${API_BASE}/form`;

// --- Main Component ---
function Search({ onNavigate, searchData, setSearchData, onToUsers, onToLogs }) {
    const [department, setDepartment] = useState('');
    const [model, setModel] = useState('');
    const [machineNo, setMachineNo] = useState('');
    const [asGroup, setAsGroup] = useState('');
    const [checksheetName, setChecksheetName] = useState('');

    // Track if a search has been initiated so we can auto-refresh
    const [hasSearched, setHasSearched] = useState(false);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [options, setOptions] = useState({
        departments: [],
        models: [],
        machines: [],
        asGroups: []
    });
    const [availableForms, setAvailableForms] = useState([]);

    const { user, logout } = useAuth();
    const isAdmin = ['admin', 'manager', 'supervisor', 'engineer'].includes(user?.role);

    // ... (rest of the logic remains the same until return)
    // Adjusting around line 185 in the actual file for the return statement

    // Fetch Options
    const fetchOptions = async (dept = '', mod = '') => {
        try {
            const apiBase = import.meta.env.VITE_DATABASE_URL || '';
            const params = new URLSearchParams();
            if (dept) params.append('department', dept);
            if (mod) params.append('model', mod);

            const response = await axios.get(`${apiBase}/options?${params.toString()}&_t=${Date.now()}`, { withCredentials: true, headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
            setOptions(response.data);
        } catch (error) {
            console.error('Error fetching options:', error);
        }
    };

    // Initial Fetch
    useEffect(() => {
        fetchOptions();
        const fetchForms = async () => {
            try {
                const apiBase = import.meta.env.VITE_DATABASE_URL || '';
                const response = await axios.get(`${apiBase}/available-forms?_t=${Date.now()}`, { withCredentials: true, headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
                setAvailableForms(response.data);
            } catch (error) {
                console.error('Error fetching forms:', error);
            }
        };
        fetchForms();
    }, []);

    // Handlers
    const handleDepartmentChange = (value) => {
        setDepartment(value);
        setModel('');
        setMachineNo('');
        setAsGroup('');
        fetchOptions(value, '');
    };

    const handleModelChange = (value) => {
        setModel(value);
        setMachineNo('');
        setAsGroup('');
        fetchOptions(department, value);
    };

    const handleSearch = async () => {
        try {
            const apiBase = import.meta.env.VITE_DATABASE_URL || '';
            const params = new URLSearchParams();
            if (department) params.append('department', department);
            if (model) params.append('model', model);
            if (machineNo) params.append('machine_no', machineNo);
            if (asGroup) params.append('as_group', asGroup);
            if (checksheetName) params.append('checksheet_name', checksheetName);

            const url = `${apiBase}/search?${params.toString()}&_t=${Date.now()}`;
            const response = await axios.get(url, { withCredentials: true, headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } });
            setSearchData(response.data);
            setHasSearched(true);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // Auto-refresh when window gains focus
    useEffect(() => {
        const onFocus = () => {
            if (hasSearched) {
                handleSearch();
            }
        };

        window.addEventListener('focus', onFocus);
        return () => window.removeEventListener('focus', onFocus);
    }, [hasSearched, department, model, machineNo, asGroup, checksheetName]);

    // Delete Logic
    const handleDeleteClick = (item) => {
        if (!isAdmin) return;
        setItemToDelete(item);
        setShowDeleteModal(true);
    };

    const handleDeleteSuccess = async () => {
        setShowDeleteModal(false);
        setItemToDelete(null);
        handleSearch();
        const apiBase = import.meta.env.VITE_DATABASE_URL || '';
        const optionsResponse = await axios.get(`${apiBase}/options`, { withCredentials: true });
        setOptions(optionsResponse.data);
    };

    const handleAddSuccess = async () => {
        setShowAddModal(false);
        const apiBase = import.meta.env.VITE_DATABASE_URL || '';
        const optionsResponse = await axios.get(`${apiBase}/options`, { withCredentials: true });
        setOptions(optionsResponse.data);
        handleSearch();
    };


    const handleOpenForm = (item) => {
        const formConfig = availableForms.find(f => f.name === item.checksheet_name);
        if (formConfig) {
            let url;
            if (item.has_data) {
                url = `${FORM_BASE_URL}${formConfig.path}/?id=${item.id}`;
            } else {
                const params = new URLSearchParams({
                    record_id: item.id,
                    department: item.department,
                    model: item.model,
                    machine_no: item.machine_no,
                    as_group: item.as_group,
                    new: 'true'
                });
                url = `${FORM_BASE_URL}${formConfig.path}/?${params.toString()}`;
            }
            window.open(url, '_blank');
        } else {
            alert('ไม่พบ Form สำหรับ: ' + item.checksheet_name);
        }
    };

    return (
        <div className="p-4 bg-slate-100 min-h-screen font-sans">
            {/* Unified Header + Filter Bar */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 mb-6">
                <div className="flex flex-wrap items-center gap-2">
                    {/* Title */}
                    <h1 className="text-lg font-bold text-slate-700 flex items-center gap-2 mr-4">
                        <span className="text-xl">📋</span> Checksheet Admin
                    </h1>

                    {/* Divider */}
                    <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>

                    {/* Filters */}
                    <select className="border border-slate-200 rounded-lg px-3 h-9 text-sm bg-white text-slate-600 focus:ring-2 focus:ring-slate-400 focus:border-slate-400" value={department} onChange={(e) => handleDepartmentChange(e.target.value)}>
                        <option value="">Dept</option>
                        {options.departments.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                    <select className="border border-slate-200 rounded-lg px-3 h-9 text-sm bg-white text-slate-600 focus:ring-2 focus:ring-slate-400 focus:border-slate-400" value={model} onChange={(e) => handleModelChange(e.target.value)}>
                        <option value="">Model</option>
                        {options.models.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                    <select className="border border-slate-200 rounded-lg px-3 h-9 text-sm bg-white text-slate-600 focus:ring-2 focus:ring-slate-400 focus:border-slate-400" value={machineNo} onChange={(e) => setMachineNo(e.target.value)}>
                        <option value="">Machine</option>
                        {options.machines.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                    <select className="border border-slate-200 rounded-lg px-3 h-9 text-sm bg-white text-slate-600 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 hidden lg:block" value={asGroup} onChange={(e) => setAsGroup(e.target.value)}>
                        <option value="">Group</option>
                        {options.asGroups.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                    </select>
                    <select className="border border-slate-200 rounded-lg px-3 h-9 text-sm bg-white text-slate-600 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 hidden xl:block" value={checksheetName} onChange={(e) => setChecksheetName(e.target.value)}>
                        <option value="">Form</option>
                        {availableForms.map((form, i) => <option key={i} value={form.name}>{form.name}</option>)}
                    </select>

                    {/* Spacer */}
                    <div className="flex-grow"></div>

                    {/* Action Buttons */}
                    <button
                        className="h-9 px-4 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                        onClick={handleSearch}
                    >
                        🔍 Search
                    </button>
                    {isAdmin && (
                        <>
                            <button
                                className="h-9 w-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center text-xl"
                                onClick={() => setShowAddModal(true)}
                                title="Add New Form"
                            >
                                +
                            </button>
                            <button
                                className="h-9 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
                                onClick={onToUsers}
                                title="User Management"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                                Users
                            </button>
                            <button
                                className="h-9 px-3 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-bold rounded-lg transition-colors flex items-center gap-1"
                                onClick={onToLogs}
                                title="System Logs"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                                Logs
                            </button>
                        </>
                    )}

                    {/* Divider */}
                    <div className="w-px h-8 bg-slate-200 mx-1"></div>

                    {/* User Profile & Logout */}
                    <div className="flex items-center gap-3 ml-2 pl-2 border-l border-slate-200">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs font-bold text-slate-700 leading-tight uppercase">{user?.username || 'User'}</p>
                            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">{user?.role || 'Guest'}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="h-9 w-9 flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors"
                            title="Logout"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            {searchData.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                    {searchData.map((item, index) => (
                        <FolderCard
                            key={index}
                            item={item}
                            onClick={() => handleOpenForm(item)}
                            onDeleteClick={handleDeleteClick}
                            isAdmin={isAdmin}
                        />
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="text-6xl mb-4 opacity-50">📂</div>
                    <p className="text-lg font-medium">No Forms Found</p>
                    <p className="text-sm opacity-70">Use the filter to search or create a new one.</p>
                </div>
            )}

            <AddModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={handleAddSuccess}
                options={options}
                availableForms={availableForms}
            />

            <DeleteModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onSuccess={handleDeleteSuccess}
                itemToDelete={itemToDelete}
            />
        </div>
    );
}

export default Search;
