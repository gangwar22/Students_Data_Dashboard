import React from 'react';
import { Mail, Briefcase, BookOpen, AlertCircle, GraduationCap, Users, MapPin, Phone, Calendar } from 'lucide-react';
import InfoCard from './InfoCard';
import Timeline from './Timeline';

const StudentProfile = ({ student }) => {
  const isDropout = student['Current Status']?.toLowerCase().includes('drop');
  const isInactive = student['Current Status']?.toLowerCase().includes('in-active');

  const isEnglishData = student.Reading !== undefined;

  let statusColor = 'bg-gradient-to-r from-slate-100 to-slate-200 text-slate-800 border-slate-300 dark:from-slate-800 dark:to-slate-700 dark:text-slate-300 dark:border-slate-600';
  let dotColor = 'bg-slate-500 shadow-[0_0_10px_rgba(100,116,139,0.8)] dark:bg-slate-400';
  let displayStatus = 'Unknown';
  let typeTag = 'General';

  if (!isEnglishData) {
    statusColor = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-900/60 dark:to-teal-900/60 dark:text-emerald-300 dark:border-emerald-700/60';
    dotColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] dark:bg-emerald-400';
    displayStatus = student['Current Status'] || 'Unknown';
    typeTag = student['Student Type'] || 'General';

    if (isDropout) {
      statusColor = 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-800 border-rose-300 dark:from-rose-900/60 dark:to-pink-900/60 dark:text-rose-300 dark:border-rose-700/60';
      dotColor = 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)] dark:bg-rose-400';
    } else if (isInactive) {
      statusColor = 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-300 dark:border-amber-700/60';
      dotColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] dark:bg-amber-400';
    }
  } else {
    // For English Data
    const lvl = (student['Over All Level'] || '').toUpperCase();
    displayStatus = lvl || 'NA';
    typeTag = 'Language Record';
    
    if (lvl.includes('C1') || lvl.includes('C2')) {
      statusColor = 'bg-gradient-to-r from-purple-100 to-fuchsia-100 text-purple-800 border-purple-300 dark:from-purple-900/60 dark:to-fuchsia-900/60 dark:text-purple-300 dark:border-purple-700/60';
      dotColor = 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.8)] dark:bg-purple-400';
    } else if (lvl.includes('B1') || lvl.includes('B2')) {
      statusColor = 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border-blue-300 dark:from-blue-900/60 dark:to-cyan-900/60 dark:text-blue-300 dark:border-blue-700/60';
      dotColor = 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)] dark:bg-blue-400';
    } else if (lvl.includes('A2')) {
      statusColor = 'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-800 border-emerald-300 dark:from-emerald-900/60 dark:to-teal-900/60 dark:text-emerald-300 dark:border-emerald-700/60';
      dotColor = 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)] dark:bg-emerald-400';
    } else if (lvl.includes('A1') || lvl.includes('A0')) {
      statusColor = 'bg-gradient-to-r from-amber-100 to-orange-100 text-amber-800 border-amber-300 dark:from-amber-900/60 dark:to-orange-900/60 dark:text-amber-300 dark:border-amber-700/60';
      dotColor = 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.8)] dark:bg-amber-400';
    }
  }

  return (
    <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 overflow-hidden transition-colors duration-300 mt-8 mb-8 pb-4">
      
      {/* Header Profile Section */}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 p-8 border-b-[3px] border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/50">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-5xl flex-shrink-0 text-white font-black border-[6px] border-white/80 dark:border-slate-800 shadow-[0_10px_25px_rgba(99,102,241,0.5)] transition-transform duration-300 relative hover:scale-105">
          {student.Name ? student.Name.charAt(0).toUpperCase() : '?'}
          <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border-[3px] border-white dark:border-slate-800 flex items-center justify-center shadow-md">
            <div className={`w-3.5 h-3.5 rounded-full ${dotColor}`}></div>
          </div>
        </div>
        
        <div className="flex-1 text-center md:text-left mt-2 md:mt-0">
          <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight drop-shadow-sm">{student.Name}</h2>
          <div className="flex flex-col md:flex-row gap-3 md:gap-4 mt-4 text-slate-700 dark:text-slate-300 justify-center md:justify-start font-bold">
            {!isEnglishData && (
              <div className="flex items-center justify-center md:justify-start gap-2 text-sm bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md hover:-translate-y-0.5 transition-transform">
                <Mail className="w-4 h-4 text-indigo-500 dark:text-indigo-400 drop-shadow-sm" />
                {student.Email || 'No Email Provided'}
              </div>
            )}
            <div className="flex items-center justify-center md:justify-start gap-2 text-sm bg-white/50 dark:bg-slate-900/50 px-4 py-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 backdrop-blur-md hover:-translate-y-0.5 transition-transform">
              <Briefcase className="w-4 h-4 text-pink-500 dark:text-pink-400 drop-shadow-sm" />
              {isEnglishData ? `Mentor: ${student.Mentor || 'Unassigned'}` : `${student.School || student.Team || 'Unassigned'} ${student.House ? `- ${student.House}` : ''}`}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 shrink-0 mt-4 md:mt-0">
          <div className={`px-6 py-2.5 rounded-2xl text-[15px] font-black flex items-center gap-2 border shadow-md ${statusColor}`}>
            <div className={`w-3 h-3 rounded-full ${dotColor}`}></div>
            {displayStatus}
          </div>
          <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 px-4 py-2 bg-gradient-to-b from-white to-slate-100 dark:from-slate-700 dark:to-slate-800 rounded-xl uppercase tracking-widest border border-slate-200 dark:border-slate-600 shadow-md">
            {typeTag}
          </span>
        </div>
      </div>

      {/* InfoCards Section */}
      <div className="p-8">
        <h3 className="text-[14px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 drop-shadow-sm">
          <BookOpen className="w-5 h-5 text-blue-500" />
          {isEnglishData ? 'Language Proficiency Scores' : 'Academic Information'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {isEnglishData ? (
            <>
              <InfoCard icon={<BookOpen className="text-blue-500" />} title="Reading" value={student.Reading || 'NA'} />
              <InfoCard icon={<AlertCircle className="text-rose-500" />} title="Listening" value={student.Listening || 'NA'} />
              <InfoCard icon={<GraduationCap className="text-emerald-500" />} title="Writing" value={student.Writing || 'NA'} />
              <InfoCard icon={<Users className="text-amber-500" />} title="Speaking" value={student.Speaking || 'NA'} />
            </>
          ) : (
            <>
              <InfoCard icon={<GraduationCap />} title="Education Level" value={student.Education} />
              <InfoCard icon={<MapPin />} title="Local Area" value={student['Local Area'] || student['Locak Area'] || student.LocalArea} />
              <InfoCard icon={<Users />} title="Panchayat / City" value={student['Panchayat/city'] || student['Panchayat / City'] || student.City} />
              <InfoCard icon={<Phone />} title="Contact Number" value={student['Contact Number 1'] || student.Phone} />
            </>
          )}
        </div>

        {!isEnglishData && (
          <div className="mt-8">
            <h3 className="text-[14px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-3 drop-shadow-sm">
              <Calendar className="w-5 h-5 text-blue-500" />
              Journey Timeline
            </h3>
            <Timeline student={student} />
          </div>
        )}
      </div>
      
    </div>
  );
};

export default StudentProfile;
