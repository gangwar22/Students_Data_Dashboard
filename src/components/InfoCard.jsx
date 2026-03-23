import React from 'react';

const InfoCard = ({ title, icon, items = [], value }) => {
  return (
    <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl rounded-2xl p-6 ring-1 ring-black/5 dark:ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] h-full transition-all duration-300 border-b-4 border-slate-200 dark:border-slate-900 group/card hover:-translate-y-1">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 bg-slate-100 dark:bg-slate-700/50 rounded-lg group-hover/card:bg-blue-100 dark:group-hover/card:bg-blue-900/30 transition-colors">
          {icon}
        </div>
        <h3 className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest">{title}</h3>
      </div>
      
      <div className="space-y-4">
        {items.length > 0 ? (
          items.map((item, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                {item.label}
              </span>
              <span className={`text-[15px] font-bold ${!item.value ? 'text-slate-400 dark:text-slate-600 italic' : 'text-slate-700 dark:text-slate-200'}`}>
                {item.value || item.placeholder || '-'}
              </span>
            </div>
          ))
        ) : (
          <div className="flex flex-col">
            <span className={`text-[17px] font-black ${!value ? 'text-slate-400 dark:text-slate-600 italic' : 'text-blue-600 dark:text-blue-400 drop-shadow-sm'}`}>
              {value || '-'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InfoCard;
