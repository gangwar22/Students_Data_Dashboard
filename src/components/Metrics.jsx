import React from 'react';
import { Users, UserCheck, UserX, GraduationCap, Loader2 } from 'lucide-react';
import MetricCard from './MetricCard';

const Metrics = ({ 
  isEnglishDashboard, 
  totalStudents, 
  activeStudents, 
  dropoutStudents, 
  girlsCount, 
  levelBAandAbove, 
  levelA2, 
  needsImprovement,
  loading,
  studentsLength,
  activeTabLabel
}) => {
  if (loading && studentsLength === 0) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-5">
        <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_10px_25px_rgba(59,130,246,0.15)] border-t-2 border-l-2 border-white/60 dark:border-slate-700">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 drop-shadow-lg" />
        </div>
        <p className="font-extrabold tracking-widest uppercase text-sm drop-shadow-sm">Fetching {activeTabLabel} data...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
      <MetricCard
        title={isEnglishDashboard ? "Tested Students" : "Total Students"}
        value={totalStudents}
        icon={<Users />}
        colorTheme="blue"
      />
      {isEnglishDashboard ? (
        <>
          <MetricCard
            title="Level B1 & Above"
            value={levelBAandAbove}
            icon={<UserCheck />}
            colorTheme="purple"
          />
          <MetricCard
            title="Level A2"
            value={levelA2}
            icon={<GraduationCap />}
            colorTheme="emerald"
          />
          <MetricCard
            title="A1, A0 & NA"
            value={needsImprovement}
            icon={<UserX />}
            colorTheme="red"
          />
        </>
      ) : (
        <>
          <MetricCard
            title="Active Students"
            value={activeStudents}
            icon={<UserCheck />}
            colorTheme="emerald"
          />
          <MetricCard
            title="Inactive / Dropouts"
            value={dropoutStudents}
            icon={<UserX />}
            colorTheme="red"
          />
          <MetricCard
            title="Total Girls"
            value={girlsCount}
            icon={<GraduationCap />}
            colorTheme="purple"
          />
        </>
      )}
    </div>
  );
};

export default Metrics;
