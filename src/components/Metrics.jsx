import React from "react";
import { Users, UserCheck, GraduationCap, Loader2, User } from "lucide-react";
import MetricCard from "./MetricCard";

const Metrics = ({ 
  isEnglishDashboard, 
  isPlacementDashboard = false,
  isDropoutDashboard = false,
  totalStudents, 
  activeStudents, 
  activeBoysCount,
  activeGirlsCount,
  levelBAandAbove,
  levelA2,
  needsImprovement,
  highestSalary = '0',
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
        title={isPlacementDashboard ? "Students Placed" : (isDropoutDashboard ? "Total Dropouts" : (isEnglishDashboard ? "Tested Students" : "Total Students"))}
        value={totalStudents}
        icon={<Users className="w-6 h-6" />}
        colorTheme="blue"
      />
      {isEnglishDashboard ? (
        <>
          <MetricCard
            title="Level B1 & Above"
            value={levelBAandAbove}
            icon={<UserCheck className="w-6 h-6" />}
            colorTheme="purple"
          />
          <MetricCard
            title="Level A2"
            value={levelA2}
            icon={<GraduationCap className="w-6 h-6" />}
            colorTheme="emerald"
          />
          <MetricCard
            title="A1, A0 & NA"
            value={needsImprovement}
            icon={<User className="w-6 h-6" />}
            colorTheme="red"
          />
        </>
      ) : isPlacementDashboard ? (
        <>
          <MetricCard
            title="Boys Placed"
            value={activeBoysCount}
            icon={<User className="w-6 h-6 text-blue-500" />}
            colorTheme="blue"
          />
          <MetricCard
            title="Girls Placed"
            value={activeGirlsCount}
            icon={<GraduationCap className="w-6 h-6 text-pink-500" />}
            colorTheme="purple"
          />
          <MetricCard
            title="Common Salary"
            value={highestSalary}
            icon={<UserCheck className="w-6 h-6" />}
            colorTheme="emerald"
          />
        </>
      ) : isDropoutDashboard ? (
        <>
          <MetricCard
            title="Dropout Boys"
            value={activeBoysCount}
            icon={<User className="w-6 h-6 text-blue-500" />}
            colorTheme="blue"
          />
          <MetricCard
            title="Dropout Girls"
            value={activeGirlsCount}
            icon={<GraduationCap className="w-6 h-6 text-pink-500" />}
            colorTheme="purple"
          />
        </>
      ) : (
        <>
          <MetricCard
            title="Active Students"
            value={activeStudents}
            icon={<UserCheck className="w-6 h-6" />}
            colorTheme="emerald"
          />
          <MetricCard
            title="Active Boys"
            value={activeBoysCount}
            icon={<User className="w-6 h-6 text-blue-500" />}
            colorTheme="blue"
          />
          <MetricCard
            title="Active Girls"
            value={activeGirlsCount}
            icon={<GraduationCap className="w-6 h-6 text-pink-500" />}
            colorTheme="purple"
          />
        </>
      )}
    </div>
  );
};

export default Metrics;
