import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FolderCard from './FolderCard';

const AddModal = ({ isOpen, onClose, onSuccess, availableForms }) => { // Removed 'options' prop as we fetch locally
    const [newDepartment, setNewDepartment] = useState('');
    const [newModel, setNewModel] = useState('');
    const [newMachineNo, setNewMachineNo] = useState('');
    const [newAsGroup, setNewAsGroup] = useState('');
    const [newChecksheetName, setNewChecksheetName] = useState('');
    const [isCustomModel, setIsCustomModel] = useState(false);

    // Cascading Lists
    const [filteredModels, setFilteredModels] = useState([]);
    const [filteredForms, setFilteredForms] = useState([]);
    const [isLoadingModels, setIsLoadingModels] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            // Reset fields on close
            setNewDepartment('');
            setNewModel('');
            setNewMachineNo('');
            setNewAsGroup('');
            setNewChecksheetName('');
            setIsCustomModel(false);
            setFilteredModels([]);
            setFilteredForms([]);
        }
    }, [isOpen]);

    // 1. Fetch Models when Department changes
    useEffect(() => {
        const fetchModels = async () => {
            if (!newDepartment) {
                setFilteredModels([]);
                setNewModel('');
                return;
            }

            setIsLoadingModels(true);
            try {
                // Fetch models for this department from DB
                const response = await axios.get(`${import.meta.env.VITE_DATABASE_URL}/options?department=${newDepartment}`);
                setFilteredModels(response.data.models || []);
            } catch (error) {
                console.error("Error fetching models:", error);
            } finally {
                setIsLoadingModels(false);
            }
        };

        fetchModels();
    }, [newDepartment]);

    // 2. Filter Forms when Dept, Model, or AS Group changes
    useEffect(() => {
        if (!newDepartment || (!newModel && !isCustomModel) || !newAsGroup) {
            setFilteredForms([]);
            return;
        }

        console.log("Filtering Forms:", { newDepartment, newModel, newAsGroup, isCustomModel });

        const matches = availableForms.filter(f => {
            // GLOBAL EXCEPTION: Always show ASSY_PROBLEM regardless of filters
            // Note: We check f.name or f.form_name. Based on debugs, f.name is "ASSY PROBLEM FORM" or similar.
            // Let's use includes or a known constant if possible.
            // Better to check specific unique ID if available, but name works.
            if (f.name && f.name.includes("ASSY PROBLEM")) {
                return true;
            }

            const deptMatch = f.department === newDepartment;
            const groupMatch = f.as_group === newAsGroup;

            // Logic: 
            // 1. If Custom Model -> Show All in Dept/Group (or true)
            // 2. If Strict Match -> f.model === newModel
            // 3. If Variant Match -> newModel starts with f.model (e.g. "AL40G Plus" uses "AL40G" template)
            const modelMatch = isCustomModel ? true : (f.model === newModel || (f.model && newModel.startsWith(f.model)));

            return deptMatch && groupMatch && modelMatch;
        });

        // SORTING: Prioritize ASSY_PROBLEM at the top
        matches.sort((a, b) => {
            const isAssyA = a.name && a.name.includes("ASSY PROBLEM");
            const isAssyB = b.name && b.name.includes("ASSY PROBLEM");
            if (isAssyA && !isAssyB) return -1;
            if (!isAssyA && isAssyB) return 1;
            return 0; // Keep relative order otherwise
        });

        console.log("Matches Found:", matches.length);

        if (matches.length > 0) {
            setFilteredForms(matches);
        } else {
            // Strict Mode: If no match, show empty (don't fallback to all)
            // This prevents confusion of seeing forms for other models.
            setFilteredForms([]);
        }

    }, [newDepartment, newModel, newAsGroup, isCustomModel, availableForms]);


    if (!isOpen) return null;

    const handleAddClick = async () => {
        if (!newDepartment || !newModel || !newMachineNo || !newAsGroup || !newChecksheetName) {
            alert('กรุณากรอกข้อมูลให้ครบทุกช่อง');
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_DATABASE_URL}/new`, {
                department: newDepartment,
                model: newModel,
                as_group: newAsGroup,
                machine_no: newMachineNo,
                checksheet_name: newChecksheetName
            });

            alert('✅ สร้าง Form ใหม่สำเร็จ!');
            onSuccess(); // Close and refresh
        } catch (error) {
            console.error('Error adding data:', error);
            alert('❌ เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-0 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row animate-in fade-in zoom-in-95 duration-200">

                {/* Left Side: Inputs */}
                <div className="p-8 flex-1 flex flex-col gap-5">
                    <div className="mb-2">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-blue-600">✨</span> Create New
                        </h2>
                        <p className="text-slate-500 text-sm">Create a new checksheet assignment.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">Department</label>
                            <div className="relative">
                                <select
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                    value={newDepartment}
                                    onChange={(e) => setNewDepartment(e.target.value)}
                                >
                                    <option value="">Select Dept...</option>
                                    {['EDM', 'EDW', 'IMM'].map((dept, i) => (
                                        <option key={i} value={dept} className="text-slate-900">{dept}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-500 uppercase">AS Group</label>
                            <div className="relative">
                                <select
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none"
                                    value={newAsGroup}
                                    onChange={(e) => setNewAsGroup(e.target.value)}
                                >
                                    <option value="">Select Group...</option>
                                    {['SEMI', 'BODY', 'MACHINE CHECK', 'FINAL', 'FINISH GOOD'].map((group, i) => (
                                        <option key={i} value={group} className="text-slate-900">{group}</option>
                                    ))}
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">
                            Model {isLoadingModels && <span className="text-blue-500 font-normal normal-case">(Loading...)</span>}
                        </label>
                        {!isCustomModel ? (
                            <div className="relative">
                                <select
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                                    value={newModel}
                                    onChange={(e) => {
                                        if (e.target.value === '__NEW__') {
                                            setIsCustomModel(true);
                                            setNewModel('');
                                        } else {
                                            setNewModel(e.target.value);
                                        }
                                    }}
                                    disabled={!newDepartment}
                                >
                                    <option value="">{newDepartment ? 'Select Model...' : 'Select Department First'}</option>
                                    {filteredModels.map((opt, i) => (
                                        <option key={i} value={opt} className="text-slate-900">{opt}</option>
                                    ))}
                                    <option value="__NEW__" className="text-blue-600 font-bold">+ Add New Model</option>
                                </select>
                                <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <input
                                    className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    placeholder="Enter New Model..."
                                    value={newModel}
                                    onChange={(e) => setNewModel(e.target.value.toUpperCase())}
                                    autoFocus
                                />
                                <button
                                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg border border-slate-300 text-xs font-medium"
                                    onClick={() => {
                                        setIsCustomModel(false);
                                        setNewModel('');
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Machine No</label>
                        <input
                            className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                            placeholder="Ex. NO.01"
                            value={newMachineNo}
                            onChange={(e) => setNewMachineNo(e.target.value.toUpperCase())}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-slate-500 uppercase">Form Type</label>
                        <div className="relative">
                            <select
                                className="bg-slate-50 border border-slate-300 rounded-lg px-4 h-10 w-full text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none disabled:bg-slate-100 disabled:text-slate-400"
                                value={
                                    newChecksheetName === ""
                                        ? ""
                                        : filteredForms.findIndex(f => f.name === newChecksheetName && f.machine_no === newMachineNo)
                                }
                                onChange={(e) => {
                                    const idx = e.target.value;
                                    if (idx === "") {
                                        setNewChecksheetName("");
                                        setNewMachineNo(""); // Clear machine no if form type is cleared
                                        return;
                                    }
                                    const selectedForm = filteredForms[parseInt(idx, 10)];
                                    if (selectedForm) {
                                        setNewChecksheetName(selectedForm.name);
                                        if (selectedForm.machine_no && selectedForm.machine_no !== 'UNKNOWN') {
                                            setNewMachineNo(selectedForm.machine_no);
                                        } else {
                                            setNewMachineNo(""); // Clear if the selected form doesn't have a specific machine_no
                                        }
                                    }
                                }}
                                disabled={!newModel || !newAsGroup}
                            >
                                <option value="">{newModel && newAsGroup ? 'Select Checksheet Template...' : 'Select Model & Group First'}</option>
                                {filteredForms.map((form, i) => (
                                    <option key={i} value={i} className="text-slate-900">{form.label}</option>
                                ))}
                                {filteredForms.length === 0 && newModel && newAsGroup && (
                                    <option value="" disabled className="text-slate-400 font-style-italic">-- No recommended forms --</option>
                                )}
                            </select>
                            <div className="absolute right-3 top-2.5 pointer-events-none text-slate-400">▼</div>
                        </div>
                        {newModel && newAsGroup && filteredForms.length === 0 && (
                            <p className="text-[10px] text-amber-600 mt-1">Warning: No specific forms found for this combination.</p>
                        )}
                    </div>

                    <div className="mt-4 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-medium transition-colors border border-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddClick}
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-500/30 transition-all transform active:scale-95"
                        >
                            Create Folder
                        </button>
                    </div>
                </div>

                {/* Right Side: Preview */}
                <div className="bg-slate-50 p-8 w-full md:w-[320px] border-l border-slate-100 flex flex-col items-center justify-center relative">
                    <div className="absolute top-4 left-0 w-full text-center">
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Live Preview</span>
                    </div>

                    {/* The Folder Card Preview */}
                    <div className="w-full max-w-[200px] transform hover:scale-105 transition-duration-500">
                        <FolderCard
                            item={{
                                department: newDepartment,
                                model: newModel,
                                machine_no: newMachineNo,
                                as_group: newAsGroup,
                                checksheet_name: newChecksheetName,
                                has_data: false // New forms are empty
                            }}
                            isPreview={true}
                        />
                    </div>

                    <p className="mt-8 text-center text-slate-400 text-xs px-4">
                        This is how the folder will appear on the dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AddModal;
