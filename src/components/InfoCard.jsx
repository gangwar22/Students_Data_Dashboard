import React from 'react';

const InfoCard = ({ title, icon, items }) => {
  return (
    <div className="bg-white dark:bg-[#141414] rounded-2xl p-6 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:shadow-[0_2px_8px_rgba(0,0,0,0.2)] h-full transition-colors duration-200">
      <div className="flex items-center gap-2 mb-5">
        <div className="text-slate-400 dark:text-slate-500">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white tracking-tight">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div key={index} className="flex flex-col">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
              {item.label}
            </span>
            <span className={`text-[13px] ${!item.value ? 'text-slate-400 dark:text-slate-600 italic' : 'text-slate-900 dark:text-slate-200 font-medium'}`}>
              {item.value || item.placeholder || '-'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoCard;
