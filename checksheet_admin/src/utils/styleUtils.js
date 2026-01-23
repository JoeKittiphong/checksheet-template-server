// Color mapping by department (for folder body)
export const getDepartmentColor = (dept) => {
    const colors = {
        'EDM': 'bg-blue-600',
        'EDW': 'bg-amber-600',
        'IMM': 'bg-emerald-600'
    };
    return colors[dept] || 'bg-slate-700';
};

// Color mapping by AS Group (for folder tab)
export const getGroupColor = (group) => {
    const colors = {
        'SEMI': 'bg-purple-600',
        'BODY': 'bg-sky-600',
        'MACHINE CHECK': 'bg-orange-500',
        'FINAL': 'bg-green-600',
        'FINISH GOOD': 'bg-rose-600'
    };
    return colors[group] || 'bg-slate-600';
};
