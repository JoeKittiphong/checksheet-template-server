import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Dark theme styles for Modal
const darkInputStyle = "bg-slate-700 border border-slate-600 rounded-lg px-4 h-10 w-full text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all";

const DeleteModal = ({ isOpen, onClose, onSuccess, itemToDelete }) => {
    const [deleteConfirmInput, setDeleteConfirmInput] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setDeleteConfirmInput('');
        }
    }, [isOpen]);

    if (!isOpen || !itemToDelete) return null;

    const isDeleteEnabled = deleteConfirmInput === itemToDelete.machine_no;

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await axios.delete(`${import.meta.env.VITE_DATABASE_URL}/api/delete-form/${itemToDelete.id}`);
            alert('🗑️ ลบข้อมูลสำเร็จ!');
            onSuccess(); // Close modal and refresh data
        } catch (error) {
            console.error('Error deleting data:', error);
            alert('❌ เกิดข้อผิดพลาด: ' + error.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
                {/* Warning Icon */}
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-red-500">
                            <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
                        </svg>
                    </div>
                </div>

                <h2 className="text-xl font-bold text-white text-center mb-2">
                    ยืนยันการลบข้อมูล?
                </h2>
                <p className="text-slate-400 text-sm text-center mb-6">
                    การลบข้อมูลนี้ไม่สามารถกู้คืนได้ กรุณาพิมพ์ <span className="text-red-400 font-bold">{itemToDelete.machine_no}</span> เพื่อยืนยัน
                </p>

                {/* Delete Target Info */}
                <div className="bg-slate-700/50 rounded-lg p-4 mb-6 border border-slate-600">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-slate-500">Model:</span>
                            <span className="text-white ml-2 font-medium">{itemToDelete.model}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Machine:</span>
                            <span className="text-white ml-2 font-medium">{itemToDelete.machine_no}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Dept:</span>
                            <span className="text-white ml-2 font-medium">{itemToDelete.department}</span>
                        </div>
                        <div>
                            <span className="text-slate-500">Group:</span>
                            <span className="text-white ml-2 font-medium">{itemToDelete.as_group}</span>
                        </div>
                    </div>
                </div>

                {/* Confirmation Input */}
                <div className="space-y-2 mb-6">
                    <label className="text-xs font-semibold text-slate-400 uppercase">
                        พิมพ์ Machine No เพื่อยืนยัน
                    </label>
                    <input
                        type="text"
                        className={`${darkInputStyle} ${deleteConfirmInput === itemToDelete.machine_no ? 'border-green-500 ring-2 ring-green-500/30' : deleteConfirmInput ? 'border-red-500 ring-2 ring-red-500/30' : ''}`}
                        placeholder={`พิมพ์ ${itemToDelete.machine_no}`}
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value.toUpperCase())}
                        autoFocus
                    />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={handleConfirmDelete}
                        disabled={!isDeleteEnabled}
                        className={`flex-1 py-2.5 rounded-lg font-bold transition-all transform active:scale-95 ${isDeleteEnabled
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/50'
                            : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        🗑️ ลบข้อมูล
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteModal;
