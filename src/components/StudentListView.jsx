import React from 'react';
import { Menu } from 'lucide-react';
import DashboardCharts from './DashboardCharts';
import StudentTable from './StudentTable';
import EnglishProgressCharts from './EnglishProgressCharts';

const StudentListView = ({ 
  filteredStudents, 
  isEnglishDashboard, 
  setSelectedStudent
}) => {
  if (filteredStudents.length === 0) return null;

  return (
    <>
      <DashboardCharts students={filteredStudents} isEnglishData={isEnglishDashboard} />

      {isEnglishDashboard && (
        <div className="flex flex-wrap gap-4 mt-6 items-center bg-white/60 dark:bg-slate-800/60 p-5 rounded-2xl border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300">
          <div className="text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mr-2 flex items-center gap-2 drop-shadow-sm">
            <Menu className="w-4 h-4 text-blue-500" />
            Level Breakdown:
          </div>
          {Object.entries(
            filteredStudents.reduce((acc, student) => {
              let lvl = (student['Over All Level'] || 'NA').trim().toUpperCase();
              if (!lvl) lvl = 'NA';
              acc[lvl] = (acc[lvl] || 0) + 1;
              return acc;
            }, {})
          ).sort((a, b) => a[0].localeCompare(b[0])).map(([lvl, count]) => {
            let badgeColor = "bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-700 dark:text-slate-200 dark:border-slate-600";
            if (lvl.includes('C1') || lvl.includes('C2')) badgeColor = "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-800";
            else if (lvl.includes('B1') || lvl.includes('B2')) badgeColor = "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800";
            else if (lvl.includes('A2')) badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800";
            else if (lvl.includes('A1') || lvl.includes('A0')) badgeColor = "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800";
            else if (lvl.includes('LEAVE') || lvl.includes('ABSENT')) badgeColor = "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800";

            return (
              <div key={lvl} className={`flex items-center gap-3 px-4 py-2 rounded-xl shadow-sm border backdrop-blur-md ${badgeColor}`}>
                <span className="font-extrabold text-[15px] drop-shadow-sm">{lvl}</span>
                <span className="bg-white/60 dark:bg-black/20 px-2.5 py-0.5 rounded-lg text-sm font-black shadow-inner">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <StudentTable students={filteredStudents} onSelectStudent={setSelectedStudent} />
    </>
  );
};

export default StudentListView;
