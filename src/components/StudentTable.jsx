import React from 'react';
import { ChevronRight, SearchX } from 'lucide-react';

const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [
    'bg-gradient-to-br from-blue-400 to-indigo-500 text-white shadow-[0_5px_15px_rgba(59,130,246,0.5)] border-[3px] border-white/50', 
    'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-[0_5px_15px_rgba(16,185,129,0.5)] border-[3px] border-white/50', 
    'bg-gradient-to-br from-purple-400 to-fuchsia-500 text-white shadow-[0_5px_15px_rgba(168,85,247,0.5)] border-[3px] border-white/50', 
    'bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-[0_5px_15px_rgba(244,63,94,0.5)] border-[3px] border-white/50', 
    'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_5px_15px_rgba(245,158,11,0.5)] border-[3px] border-white/50'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getLevelColor = (level) => {
  const l = (level || '').toUpperCase();
  if (l.includes('C1') || l.includes('C2')) return 'bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 border-b-2 border-purple-300 dark:from-purple-900/40 dark:to-fuchsia-900/40 dark:text-purple-300 dark:border-purple-700/60 shadow-sm';
  if (l.includes('B1') || l.includes('B2')) return 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-b-2 border-blue-300 dark:from-blue-900/40 dark:to-cyan-900/40 dark:text-blue-300 dark:border-blue-700/60 shadow-sm';
  if (l.includes('A2')) return 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-b-2 border-emerald-300 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-sm';
  if (l.includes('A1') || l.includes('A0')) return 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-b-2 border-amber-300 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-sm';
  return 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-b-2 border-slate-300 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300 dark:border-slate-600 shadow-sm';
};

const getLevelDot = (level) => {
  const l = (level || '').toUpperCase();
  if (l.includes('C1') || l.includes('C2')) return 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] dark:bg-purple-400';
  if (l.includes('B1') || l.includes('B2')) return 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] dark:bg-blue-400';
  if (l.includes('A2')) return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] dark:bg-emerald-400';
  if (l.includes('A1') || l.includes('A0')) return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] dark:bg-amber-400';
  return 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.8)] dark:bg-slate-400';
};

const StudentTable = ({ students, onSelectStudent, isPlacementDashboard = false, isDropoutDashboard = false }) => {
  const isEnglishData = students.length > 0 && students[0].Reading !== undefined;
  const isPlacementData = isPlacementDashboard;
  const isDropoutData = isDropoutDashboard;
  
  return (
    <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 mt-8 overflow-hidden transition-colors duration-300">
      <div className="p-8 px-10 border-b-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-black text-slate-800 dark:text-white drop-shadow-sm tracking-tight">{isDropoutData ? 'Dropout Directory' : 'Student Directory'}</h3>
          <p className="text-[15px] font-bold text-slate-500 dark:text-slate-400 mt-1">{students.length} record{students.length !== 1 && 's'} found in the database.</p>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-white/40 dark:bg-slate-800/40 border-b-2 border-slate-200 dark:border-slate-700/50 text-[13px] uppercase tracking-widest text-slate-500 dark:text-slate-400 font-extrabold transition-colors">
              <th className="p-6 px-10 font-black">{isPlacementData || isDropoutData ? 'Student' : 'Student Profile'}</th>
              {isEnglishData ? (
                <>
                  <th className="p-6 font-black whitespace-nowrap">Mentor</th>
                  <th className="p-6 font-black text-center whitespace-nowrap">R / L / W / S</th>
                  <th className="p-6 font-black">Overall Level</th>
                </>
              ) : isPlacementData ? (
                <>
                  <th className="p-6 font-black whitespace-nowrap">Company</th>
                  <th className="p-6 font-black whitespace-nowrap">Salary Offered</th>
                  <th className="p-6 font-black whitespace-nowrap">Spent Time in NavGurukul</th>
                </>
              ) : isDropoutData ? (
                <>
                  <th className="p-6 font-black whitespace-nowrap">Dropout Date</th>
                  <th className="p-6 font-black whitespace-nowrap">Specify</th>
                  <th className="p-6 font-black whitespace-nowrap">Reason</th>
                </>
              ) : (
                <>
                  <th className="p-6 font-black whitespace-nowrap">Housing & Zone</th>
                  <th className="p-6 font-black whitespace-nowrap">Joining Period</th>
                  <th className="p-6 font-black whitespace-nowrap">Current Status</th>
                </>
              )}
              <th className="p-6 text-right pr-10 font-black">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y-[3px] divide-slate-100/80 dark:divide-slate-700/50">
            {students.length === 0 ? (
              <tr>
                <td colSpan={isPlacementData || isDropoutData ? 5 : 5} className="p-16 text-center bg-slate-50/30 dark:bg-slate-800/30">
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                    <div className="w-20 h-20 bg-white dark:bg-slate-700/50 rounded-3xl flex items-center justify-center mb-5 border-b-4 border-slate-200 dark:border-slate-600 shadow-[0_5px_15px_rgba(0,0,0,0.05)] transform rotate-3">
                      <SearchX className="w-10 h-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-xl font-black text-slate-600 dark:text-slate-300 drop-shadow-sm">No matching students</p>
                    <p className="text-[15px] font-bold mt-2">Try adjusting your colorful filters!</p>
                  </div>
                </td>
              </tr>
            ) : (
              students.map((student, i) => {
                const isDropout = student['Current Status']?.toLowerCase().includes('drop');
                const isInactive = student['Current Status']?.toLowerCase().includes('in-active');
                
                let statusColor = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-b-2 border-emerald-300 dark:from-emerald-900/40 dark:to-teal-900/40 dark:text-emerald-300 dark:border-emerald-700/60 shadow-sm';
                let dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] dark:bg-emerald-400';
                
                if (isDropout) {
                  statusColor = 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border-b-2 border-rose-300 dark:from-rose-900/40 dark:to-pink-900/40 dark:text-rose-300 dark:border-rose-700/60 shadow-sm';
                  dotColor = 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] dark:bg-rose-400';
                } else if (isInactive) {
                  statusColor = 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-b-2 border-amber-300 dark:from-amber-900/40 dark:to-orange-900/40 dark:text-amber-300 dark:border-amber-700/60 shadow-sm';
                  dotColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] dark:bg-amber-400';
                }

                return (
                  <tr key={i} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-all duration-300 cursor-pointer group hover:scale-[1.01]" onClick={() => onSelectStudent(student)}>
                    <td className="p-5 px-10 flex items-center gap-5 min-w-[250px]">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center font-black text-xl group-hover:rotate-[15deg] transition-all duration-300 ${getAvatarColor(student.Name)} shrink-0`}>
                        {getInitials(student.Name)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="font-black text-lg text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors drop-shadow-sm tracking-tight truncate">{student.Name}</div>
                        <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">{student.Email || student['Student Type'] || (isEnglishData ? 'English Testing' : 'No additional info')}</div>
                      </div>
                    </td>

                    {isEnglishData ? (
                      <>
                        <td className="p-5">
                          <div className="text-[15px] font-black text-slate-700 dark:text-slate-300 drop-shadow-sm truncate">{student.Mentor || 'Unassigned'}</div>
                        </td>
                        <td className="p-5 text-center">
                          <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-2 rounded-xl shadow-inner border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            <span className="w-8 text-center text-[13px] font-black text-blue-600 dark:text-blue-400">{student.Reading}</span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="w-8 text-center text-[13px] font-black text-rose-500 dark:text-rose-400">{student.Listening}</span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="w-8 text-center text-[13px] font-black text-emerald-600 dark:text-emerald-400">{student.Writing}</span>
                            <span className="text-slate-300 dark:text-slate-600">/</span>
                            <span className="w-8 text-center text-[13px] font-black text-amber-500 dark:text-amber-400">{student.Speaking}</span>
                          </div>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[14px] font-black whitespace-nowrap ${getLevelColor(student['Over All Level'])}`}>
                            <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${getLevelDot(student['Over All Level'])}`}></span>
                            {student['Over All Level'] || 'NA'}
                          </span>
                        </td>
                      </>
                    ) : isPlacementData ? (
                      <>
                        <td className="p-5 min-w-[180px]">
                          <div className="text-[15px] font-black text-slate-700 dark:text-slate-300 drop-shadow-sm truncate">
                            {student.Company || '-'}
                          </div>
                        </td>
                        <td className="p-5 text-[15px] font-black text-slate-600 dark:text-slate-400 drop-shadow-sm whitespace-nowrap">
                          {student['Salary offered'] || '-'}
                        </td>
                        <td className="p-5 text-[15px] font-black text-slate-600 dark:text-slate-400 drop-shadow-sm whitespace-nowrap">
                          {student['Spent time in NavGurukul'] || student['Spent Days in NavGurukul'] || '-'}
                        </td>
                      </>
                    ) : isDropoutData ? (
                      <>
                        <td className="p-5 text-[15px] font-black text-slate-600 dark:text-slate-400 drop-shadow-sm whitespace-nowrap">
                          {student['Dropout Date'] || student['Date of leaving'] || '-'}
                        </td>
                        <td className="p-5 max-w-[150px]">
                          <div className="text-[14px] font-black text-slate-700 dark:text-slate-300 drop-shadow-sm truncate" title={student['Specify'] || student['Specify reason']}>
                            {student['Specify'] || student['Specify reason'] || '-'}
                          </div>
                        </td>
                        <td className="p-5 max-w-[200px]">
                          <div className="text-[14px] font-bold text-slate-500 dark:text-slate-400 line-clamp-1 leading-tight" title={student['Reason for leaving'] || student['Reason']}>
                            {student['Reason for leaving'] || student['Reason'] || '-'}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-5 min-w-[150px]">
                          <div className="text-[15px] font-black text-slate-700 dark:text-slate-300 drop-shadow-sm truncate">{student.House || 'Unknown'}</div>
                          <div className="text-[13px] font-bold text-slate-500 dark:text-slate-400 mt-1 truncate">{student.School || student.Team || 'Unassigned'}</div>
                        </td>
                        <td className="p-5 text-[15px] font-black text-slate-600 dark:text-slate-400 drop-shadow-sm whitespace-nowrap">
                          {student['Joining Month'] || '-'}
                        </td>
                        <td className="p-5 min-w-[140px]">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[13px] font-black whitespace-nowrap ${statusColor}`}>
                            <span className={`w-2 h-2 rounded-full mr-2.5 ${dotColor}`}></span>
                            {student['Current Status'] || 'Unknown'}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="p-5 text-right pr-10 whitespace-nowrap">
                      <button className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors inline-flex items-center justify-end">
                        <span className="text-[15px] font-black mr-3 opacity-0 -translate-x-4 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 shadow-sm">View</span>
                        <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-700 border-b-4 border-slate-200 dark:border-slate-800 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 shadow-sm transition-colors group-hover:-translate-y-1">
                          <ChevronRight className="w-5 h-5 drop-shadow-md" />
                        </div>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentTable;
