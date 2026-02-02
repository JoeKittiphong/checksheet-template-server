import React from 'react';
import FolderCard from './FolderCard';

function PreviewPanel({ item, onOpen, onConfirm, onDelete, isAdmin }) {
    if (!item) {
        return (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <div className="text-6xl mb-4 opacity-30">📂</div>
                <p className="text-lg font-medium">Select an item</p>
                <p className="text-sm opacity-70">Click on a row to preview</p>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-700 text-white px-4 py-3 flex items-center justify-between">
                <h3 className="font-bold text-sm uppercase tracking-wide">Preview</h3>
                <span className="text-xs bg-white/20 px-2 py-1 rounded">ID: {item.id}</span>
            </div>

            {/* Preview Card */}
            <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="w-48">
                    <FolderCard item={item} isPreview={true} isAdmin={isAdmin} />
                </div>
            </div>

            {/* Details */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <span className="text-slate-400">Department:</span>
                        <span className="ml-1 font-bold text-slate-700">{item.department}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">Model:</span>
                        <span className="ml-1 font-bold text-slate-700">{item.model}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">Machine:</span>
                        <span className="ml-1 font-bold text-slate-700">{item.machine_no}</span>
                    </div>
                    <div>
                        <span className="text-slate-400">Group:</span>
                        <span className="ml-1 font-bold text-slate-700">{item.as_group}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="text-slate-400">Form:</span>
                        <span className="ml-1 font-bold text-slate-700">{item.checksheet_name}</span>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 bg-white border-t border-slate-200 flex gap-2">
                <button
                    onClick={() => onOpen(item)}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                    Open
                </button>

                {isAdmin && item.status === 'finish' && (
                    <button
                        onClick={() => onConfirm(item)}
                        className="py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-lg transition-colors flex items-center justify-center gap-1"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                        Confirm
                    </button>
                )}

                {isAdmin && (
                    <button
                        onClick={() => onDelete(item)}
                        className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-sm rounded-lg transition-colors flex items-center justify-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                        </svg>
                    </button>
                )}
            </div>
        </div>
    );
}

export default PreviewPanel;
