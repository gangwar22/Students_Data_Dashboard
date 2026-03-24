import React from 'react';
import { Sun, Moon, RefreshCw, FileSpreadsheet, Calendar, AlertCircle } from 'lucide-react';

const Header = ({ 
  activeTab, 
  TABS, 
  setActiveTab, 
  isDarkMode, 
  toggleTheme, 
  loading, 
  onSync, 
  isEnglishDashboard, 
  activeEnglishMonth, 
  ENGLISH_MONTHS, 
  setActiveEnglishMonth 
}) => {
  return (
    <div className="flex flex-col gap-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 relative overflow-visible transition-all duration-300">
      
      {/* Deep 3D Glow */}
      <div className="absolute -top-32 -right-32 w-[35rem] h-[35rem] bg-gradient-to-tr from-blue-500/30 via-purple-500/30 to-pink-500/30 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 w-full">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-600 dark:from-indigo-300 dark:to-purple-300 tracking-tight drop-shadow-sm">Dantewada Campus Navgurukul</h1>
          <p className="text-slate-600 dark:text-slate-300 text-[15px] font-bold mt-2 tracking-wide drop-shadow-sm">Holistic view of Navgurukul student data - <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">{activeTab.label}</span></p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-b-[4px] border-r-2 border-slate-300 dark:border-slate-700 shadow-[0_5px_15px_rgba(0,0,0,0.05)] text-slate-600 dark:text-slate-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:translate-y-0 active:border-b-2 transition-all"
          >
            {isDarkMode ? <Sun className="w-6 h-6 drop-shadow-md" /> : <Moon className="w-6 h-6 drop-shadow-md" />}
          </button>

          <button
            onClick={onSync}
            disabled={loading}
            className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-700 text-white font-black text-[15px] tracking-wide rounded-2xl border-b-[5px] border-r-2 border-slate-950 dark:border-indigo-900 shadow-[0_10px_20px_rgba(15,23,42,0.4)] dark:shadow-[0_10px_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(15,23,42,0.5)] active:translate-y-1 active:border-b-2 active:shadow-md transition-all flex items-center gap-3 disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 drop-shadow-lg ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      <div className="inline-flex p-2.5 bg-slate-200/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[1.25rem] w-fit relative z-10 border-b-2 border-t border-white/60 dark:border-slate-800/60 shadow-inner overflow-x-auto max-w-full">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3.5 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 text-[15px] whitespace-nowrap ${activeTab.id === tab.id
                ? 'bg-gradient-to-b from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 text-blue-700 dark:text-blue-300 shadow-[0_5px_15px_rgba(0,0,0,0.1),0_3px_0_rgba(148,163,184,0.6)] dark:shadow-[0_5px_15px_rgba(0,0,0,0.4),0_3px_0_rgba(15,23,42,0.8)] border-t border-white dark:border-slate-600 hover:-translate-y-0.5'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/40 dark:hover:bg-slate-700/40'
              }`}
          >
            <FileSpreadsheet className={`w-5 h-5 ${activeTab.id === tab.id ? 'text-blue-600 dark:text-blue-400 drop-shadow-sm scale-110' : 'scale-100'} transition-transform duration-300`} />
            {tab.label}
          </button>
        ))}
      </div>

      {isEnglishDashboard && (
        <div className="mt-6 flex flex-col md:flex-row items-start md:items-end gap-4 w-full">
          <div className="w-full md:max-w-xs">
            <label className="block text-[12px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 drop-shadow-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Select Sheet Month
            </label>
            <select
              className="w-full px-5 py-3.5 bg-white/60 dark:bg-slate-800/60 border-b-4 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-sm font-bold appearance-none cursor-pointer backdrop-blur-md hover:bg-white dark:hover:bg-slate-800"
              value={activeEnglishMonth.id}
              onChange={(e) => setActiveEnglishMonth(ENGLISH_MONTHS.find(m => m.id === e.target.value))}
            >
              {ENGLISH_MONTHS.map(month => (
                <option key={month.id} value={month.id}>{month.label}</option>
              ))}
            </select>
          </div>
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 pb-3 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            Showing data for {activeEnglishMonth.label}
          </div>
        </div>
      )}
    </div>
  );
};

export default Header;
