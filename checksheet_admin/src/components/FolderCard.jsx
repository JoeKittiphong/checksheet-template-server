import React from 'react';
import { getDepartmentColor, getGroupColor } from '../utils/styleUtils';

// Trash Icon SVG Component
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
        <path fillRule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 0 1 3.878.512.75.75 0 1 1-.256 1.478l-.209-.035-1.005 13.07a3 3 0 0 1-2.991 2.77H8.084a3 3 0 0 1-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 0 1-.256-1.478A48.567 48.567 0 0 1 7.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 0 1 3.369 0c1.603.051 2.815 1.387 2.815 2.951Zm-6.136-1.452a51.196 51.196 0 0 1 3.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 0 0-6 0v-.113c0-.794.609-1.428 1.364-1.452Zm-.355 5.945a.75.75 0 1 0-1.5.058l.347 9a.75.75 0 1 0 1.499-.058l-.346-9Zm5.48.058a.75.75 0 1 0-1.498-.058l-.347 9a.75.75 0 0 0 1.5.058l.345-9Z" clipRule="evenodd" />
    </svg>
);

const FolderCard = ({ item, onClick, onDeleteClick, isPreview = false, isAdmin = false }) => {
    const folderColor = getDepartmentColor(item.department);
    const tabColor = getGroupColor(item.as_group);

    const handleTrashClick = (e) => {
        e.stopPropagation(); // Prevent triggering onClick of the card
        if (onDeleteClick) {
            onDeleteClick(item);
        }
    };

    return (
        <div
            onClick={onClick}
            className={`group relative transition-all duration-300 ${onClick ? 'cursor-pointer hover:-translate-y-1' : ''} ${isPreview ? 'scale-100 pointer-events-none' : ''}`}
        >
            {/* Folder Tab - Shows AS Group with Group-based color */}
            <div className={`absolute top-0 left-0 px-2.5 h-6 rounded-t-lg z-0 transition-colors duration-300 ${tabColor} flex items-center`}>
                <span className="text-[10px] font-bold text-white uppercase tracking-wide whitespace-nowrap">
                    {item.as_group || 'GRP'}
                </span>
            </div>

            {/* Folder Body - Uses Department color */}
            <div className={`relative mt-4 w-full aspect-[3/2] rounded-xl rounded-tl-none p-3 flex flex-col justify-between shadow-lg z-10 transition-all duration-300 ${folderColor} group-hover:ring-4 group-hover:ring-white/40 text-white`}>

                {/* Header with Trash Icon */}
                <div className="flex justify-end h-4">
                    {!isPreview && isAdmin && (
                        <button
                            onClick={handleTrashClick}
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 -m-1 rounded-full hover:bg-red-500/30 text-white/60 hover:text-red-400"
                            title="Delete this folder"
                        >
                            <TrashIcon />
                        </button>
                    )}
                </div>

                {/* Main Content (Center) */}
                <div className="flex flex-col items-center justify-center flex-grow -mt-2">
                    <div className="text-center">
                        <h3 className="text-sm font-bold text-white/90 tracking-wide leading-tight group-hover:scale-105 transition-transform uppercase">
                            {item.model || 'MODEL'}
                        </h3>
                        <p className="text-2xl font-black text-white mt-1 tracking-tight group-hover:scale-110 transition-transform">
                            {item.machine_no || 'NO.00'}
                        </p>
                    </div>
                </div>

                {/* Footer Info (Bottom) - Only Department now */}
                <div className="mt-1 pt-1 border-t border-white/20 flex justify-between items-center text-[10px] text-white/80 font-medium">
                    <span className="tracking-wide">{item.department || 'DEPT'}</span>
                    <span className={`truncate max-w-[70%] px-1.5 py-0.5 rounded text-[9px] ${item.has_data ? 'bg-white/20 text-white' : 'text-white/60'}`}>
                        {item.checksheet_name || 'FORM'}
                    </span>
                </div>
            </div>

            {/* Shadow effect for preview */}
            {isPreview && <div className="absolute -inset-4 bg-white/5 blur-xl -z-10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>}
        </div>
    );
};

export default FolderCard;
