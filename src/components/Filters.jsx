import React from "react";
import { Search, FilterX } from "lucide-react";

const Filters = ({
  isEnglishDashboard,
  searchQuery,
  setSearchQuery,
  filterMonth,
  setFilterMonth,
  filterHouse,
  setFilterHouse,
  filterStatus,
  setFilterStatus,
  filterEducation,
  setFilterEducation,
  filterTeam,
  setFilterTeam,
  filterOverallLevel,
  setFilterOverallLevel,
  filterStudentType,
  setFilterStudentType,
  uniqueMonths,
  uniqueHouses,
  uniqueStatuses,
  uniqueEducations,
  uniqueTeams,
  uniqueLevels,
  uniqueStudentTypes,
  uniqueMentors,
  clearFilters
}) => {
  return (
    <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 mt-6 transition-colors duration-300">
      <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3 drop-shadow-sm tracking-wide">
        <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900\/60 dark:to-purple-900\/60 rounded-xl shadow-inner border border-white\/50 dark:border-slate-700">
          <FilterX className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
        </div>
        Advanced Data Filters
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-10">
        <div className="relative group">
          <label className="block text-[11px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Search by Name</label>
          <div className="relative">
            <Search className="absolute left-5 top-1\/2 -translate-y-1\/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Start typing student name..."
              className="w-full pl-14 pr-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500\/10 focus:border-b-indigo-500 outline-none transition-all font-bold placeholder:text-slate-400 dark:placeholder:text-slate-600 placeholder:font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {!isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Joining Month</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500\/10 focus:border-b-blue-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {uniqueMonths.map(month => <option key={month} value={month}>{month}</option>)}
            </select>
          </div>
        )}

        {isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Overall Level</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-rose-500\/10 focus:border-b-rose-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterOverallLevel}
              onChange={(e) => setFilterOverallLevel(e.target.value)}
            >
              <option value="">All Levels</option>
              {uniqueLevels.map(level => <option key={level} value={level}>{level}</option>)}
            </select>
          </div>
        )}

        {!isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Student House</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500\/10 focus:border-b-emerald-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterHouse}
              onChange={(e) => setFilterHouse(e.target.value)}
            >
              <option value="">All Houses</option>
              {uniqueHouses.map(house => <option key={house} value={house}>{house}</option>)}
            </select>
          </div>
        )}

        {!isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Current Status</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-amber-500\/10 focus:border-b-amber-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        )}

        {!isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-teal-500 dark:text-teal-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Student Education</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-teal-500\/10 focus:border-b-teal-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterEducation}
              onChange={(e) => setFilterEducation(e.target.value)}
            >
              <option value="">All Educations</option>
              {uniqueEducations.map(edu => <option key={edu} value={edu}>{edu}</option>)}
            </select>
          </div>
        )}

        <div className="relative group">
          <label className="block text-[11px] font-black text-pink-500 dark:text-pink-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">Team / Mentor</label>
          <select
            className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-pink-500\/10 focus:border-b-pink-500 outline-none transition-all font-bold appearance-none cursor-pointer"
            value={filterTeam}
            onChange={(e) => setFilterTeam(e.target.value)}
          >
            <option value="">All Teams</option>
            {isEnglishDashboard 
              ? uniqueMentors.map(mentor => <option key={mentor} value={mentor}>{mentor}</option>)
              : uniqueTeams.map(team => <option key={team} value={team}>{team}</option>)
            }
          </select>
        </div>

        {!isEnglishDashboard && (
          <div className="relative group">
            <label className="block text-[11px] font-black text-cyan-500 dark:text-cyan-400 uppercase tracking-widest mb-2.5 ml-1 drop-shadow-sm group-hover:translate-x-1 transition-transform">School / Category</label>
            <select
              className="w-full px-6 py-4 bg-slate-100\/50 dark:bg-slate-900\/50 border-b-2 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-cyan-500\/10 focus:border-b-cyan-500 outline-none transition-all font-bold appearance-none cursor-pointer"
              value={filterStudentType}
              onChange={(e) => setFilterStudentType(e.target.value)}
            >
              <option value="">All Types</option>
              {uniqueStudentTypes.map(type => <option key={type} value={type}>{type}</option>)}
            </select>
          </div>
        )}

        <div className="flex items-end">
          <button
            onClick={clearFilters}
            className="w-full px-6 py-4 bg-white dark:bg-slate-800 border-b-[4px] border-r-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-black text-[15px] tracking-wide rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700\/50 hover:-translate-y-1 hover:shadow-xl active:translate-y-0 active:border-b-2 transition-all flex items-center justify-center gap-3 group"
          >
            <FilterX className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default Filters;
