import React from 'react';

const Timeline = ({ student }) => {
  const isDropout = student['Current Status']?.toLowerCase() === 'dropout';

  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] h-full transition-colors duration-200">
      
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">Timeline</h3>
      </div>
      
      <div className="relative pl-6 space-y-8 before:absolute before:inset-y-2 before:left-[11px] before:w-px before:bg-slate-200 dark:before:bg-slate-800">
        
        {/* Joining Event */}
        <div className="relative">
          <div className="absolute -left-6 top-1.5 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 ring-4 ring-white dark:ring-[#141414]"></div>
          <div>
            <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-200">Joined Program</p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">{student['Joining Date']}</p>
          </div>
        </div>

        {/* Current State Event */}
        <div className="relative">
          <div className={`absolute -left-6 top-1.5 w-2 h-2 rounded-full ring-4 ring-white dark:ring-[#141414] ${
            isDropout ? 'bg-rose-500' : 'bg-emerald-500'
          }`}></div>
          <div>
            <p className={`text-[13px] font-semibold ${isDropout ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
              {isDropout ? 'Left Program' : 'Currently Active'}
            </p>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1">
              {isDropout ? student['Dropout Date'] : 'Present'}
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
};

export default Timeline;
