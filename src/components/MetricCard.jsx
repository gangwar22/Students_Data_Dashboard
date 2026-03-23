import React from 'react';

const colorThemes = {
  blue: {
    bg: 'bg-gradient-to-br from-blue-400 via-blue-500 to-indigo-600',
    border: 'border-t-2 border-l-2 border-white/30 border-b-[4px] border-r-2 border-indigo-700/60',
    shadow: 'shadow-[0_10px_25px_rgba(59,130,246,0.5)]',
    hoverShadow: 'hover:shadow-[0_15px_35px_rgba(59,130,246,0.6)] hover:-translate-y-2 hover:border-b-[6px]',
    iconBg: 'bg-white/20 shadow-inner border border-white/20',
    text: 'text-white'
  },
  emerald: {
    bg: 'bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600',
    border: 'border-t-2 border-l-2 border-white/30 border-b-[4px] border-r-2 border-teal-700/60',
    shadow: 'shadow-[0_10px_25px_rgba(16,185,129,0.5)]',
    hoverShadow: 'hover:shadow-[0_15px_35px_rgba(16,185,129,0.6)] hover:-translate-y-2 hover:border-b-[6px]',
    iconBg: 'bg-white/20 shadow-inner border border-white/20',
    text: 'text-white'
  },
  red: {
    bg: 'bg-gradient-to-br from-rose-400 via-pink-500 to-red-600',
    border: 'border-t-2 border-l-2 border-white/30 border-b-[4px] border-r-2 border-red-800/60',
    shadow: 'shadow-[0_10px_25px_rgba(244,63,94,0.5)]',
    hoverShadow: 'hover:shadow-[0_15px_35px_rgba(244,63,94,0.6)] hover:-translate-y-2 hover:border-b-[6px]',
    iconBg: 'bg-white/20 shadow-inner border border-white/20',
    text: 'text-white'
  },
  purple: {
    bg: 'bg-gradient-to-br from-purple-400 via-fuchsia-500 to-violet-600',
    border: 'border-t-2 border-l-2 border-white/30 border-b-[4px] border-r-2 border-violet-800/60',
    shadow: 'shadow-[0_10px_25px_rgba(168,85,247,0.5)]',
    hoverShadow: 'hover:shadow-[0_15px_35px_rgba(168,85,247,0.6)] hover:-translate-y-2 hover:border-b-[6px]',
    iconBg: 'bg-white/20 shadow-inner border border-white/20',
    text: 'text-white'
  }
};

const MetricCard = ({ title, value, subtitle, icon, colorTheme = 'blue' }) => {
  const theme = colorThemes[colorTheme];

  return (
    <div className={`${theme.bg} ${theme.border} ${theme.shadow} ${theme.hoverShadow} rounded-3xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden group min-h-[140px] cursor-pointer`}>
      {/* 3D Core Glow Effects */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/20 rounded-full blur-2xl group-hover:bg-white/30 transition-all duration-500 pointer-events-none"></div>
      <div className="absolute -left-10 -bottom-10 w-24 h-24 bg-black/10 rounded-full blur-xl pointer-events-none"></div>
      
      <div className="flex items-start justify-between relative z-10 w-full mb-2">
        <p className="text-[13px] font-extrabold text-white/95 uppercase tracking-widest drop-shadow-sm">{title}</p>
        <div className={`p-3 rounded-2xl ${theme.iconBg} backdrop-blur-md text-white transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 drop-shadow-lg`}>
          {React.cloneElement(icon, { className: "w-7 h-7" })}
        </div>
      </div>
      
      <div className={`relative z-10 ${theme.text}`}>
        <h3 className="text-5xl font-black tracking-tight drop-shadow-lg">{value}</h3>
        {subtitle && <p className="text-sm text-white/90 mt-2 font-bold drop-shadow-sm">{subtitle}</p>}
      </div>
    </div>
  );
};

export default MetricCard;
