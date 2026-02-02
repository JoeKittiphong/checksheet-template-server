import React from 'react';
import { getDepartmentColor, getGroupColor } from '../utils/styleUtils';

const statusIcons = {
    prepare: '📋',
    work_in_progress: '🔄',
    finish: '✅',
    confirm: '✔️',
    error: '❌'
};

const statusColors = {
    prepare: 'text-slate-500 bg-slate-100',
    work_in_progress: 'text-blue-600 bg-blue-50',
    finish: 'text-green-600 bg-green-50',
    confirm: 'text-emerald-700 bg-emerald-50',
    error: 'text-red-600 bg-red-50'
};

// Fixed column widths for consistency
const COL_WIDTHS = {
    dept: 'w-[60px]',
    group: 'w-[50px]',
    model: 'w-[100px]',
    machine: 'w-[70px]',
    form: 'w-[140px]',
    status: 'w-[150px]',
    indicator: 'w-[12px]'
};

function ListItem({ item, isSelected, onClick, availableForms = [] }) {
    const deptColor = getDepartmentColor(item.department);
    const groupColor = getGroupColor(item.as_group);
    const statusIcon = statusIcons[item.status] || '📋';
    const statusStyle = statusColors[item.status] || 'text-slate-500 bg-slate-100';

    // Find title from available forms
    // Data from meta.json is spread directly, so title is at formConfig.title
    const formConfig = availableForms.find(f => f.name === item.checksheet_name);
    const title = formConfig?.title || formConfig?.header || formConfig?.label || item.checksheet_name || '-';


    return (
        <div
            onClick={onClick}
            className={`
                flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all duration-150
                border-l-4 border-b border-slate-100
                ${isSelected
                    ? 'bg-blue-50 border-l-blue-500'
                    : 'bg-white border-l-transparent hover:bg-slate-50 hover:border-l-slate-300'}
            `}
        >
            {/* Department Badge */}
            <div className={`${COL_WIDTHS.dept} shrink-0`}>
                <span className={`${deptColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide block text-center truncate`}>
                    {item.department || 'DEPT'}
                </span>
            </div>

            {/* Group Badge */}
            <div className={`${COL_WIDTHS.group} shrink-0`}>
                <span className={`${groupColor} text-white text-[9px] font-bold px-1.5 py-0.5 rounded uppercase block text-center truncate`}>
                    {item.as_group || 'GRP'}
                </span>
            </div>

            {/* Model */}
            <div className={`${COL_WIDTHS.model} shrink-0`}>
                <span className="font-semibold text-slate-700 text-sm truncate block">
                    {item.model || 'MODEL'}
                </span>
            </div>

            {/* Machine No */}
            <div className={`${COL_WIDTHS.machine} shrink-0`}>
                <span className="font-bold text-slate-900 text-sm truncate block">
                    {item.machine_no || 'NO.00'}
                </span>
            </div>

            {/* Title - Flexible width */}
            <div className="flex-1 min-w-0">
                <span className="text-sm text-slate-600 truncate block" title={title}>
                    {title}
                </span>
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-slate-200 shrink-0"></div>

            {/* Form Name */}
            <div className={`${COL_WIDTHS.form} shrink-0`}>
                <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded truncate block text-center">
                    {item.checksheet_name || 'FORM'}
                </span>
            </div>

            {/* Status */}
            <div className={`${COL_WIDTHS.status} shrink-0`}>
                <span className={`${statusStyle} text-xs font-bold px-2 py-1 rounded flex items-center gap-1 justify-center`}>
                    <span>{statusIcon}</span>
                    <span className="capitalize truncate">{item.status?.replace('_', ' ') || 'prepare'}</span>
                </span>
            </div>

            {/* Has Data Indicator */}
            <div className={`${COL_WIDTHS.indicator} shrink-0 flex items-center justify-center`}>
                {item.has_data && (
                    <span className="w-2 h-2 bg-blue-500 rounded-full" title="Has data"></span>
                )}
            </div>
        </div>
    );
}

export default ListItem;
