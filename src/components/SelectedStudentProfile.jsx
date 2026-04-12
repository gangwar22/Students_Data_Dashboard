import React from 'react';
import { User, BookOpen, Calendar, AlertCircle, ArrowLeft, Sun, Moon } from 'lucide-react';
import StudentProfile from './StudentProfile';
import Timeline from './Timeline';
import InfoCard from './InfoCard';

const SelectedStudentProfile = ({ 
  selectedStudent, 
  setSelectedStudent, 
  isDarkMode, 
  toggleTheme, 
  activeTabId 
}) => {
  const isPlacementRecord = activeTabId === 'placement';
  const normalizeDetailKey = (key) => String(key || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const placementHiddenKeys = new Set([
    'name',
    'student',
    'student name',
    's no',
    'email',
    'email id',
    'mail id',
    'gender',
    'gander',
    'company',
    'salary offered',
    'date of joining campus',
    'joining date',
    'spent time in navgurukul',
    'spent days in navgurukul',
    'current status',
    'status',
    'joining month',
    'dropout date',
    'batch',
    'phone',
    'contact number',
    'address',
    'school',
    'house',
    'student type',
    'education',
    'feedback'
  ]);

  const placementExtraDetails = isPlacementRecord
    ? (() => {
      const seenKeys = new Set();
      const seenPairs = new Set();
      return Object.entries(selectedStudent)
      .filter(([rawKey, value]) => {
        const key = String(rawKey || '').trim();
        const cleanKey = String(key || '').trim();
        const cleanValue = String(value ?? '').trim();
        if (!cleanKey || cleanKey === '__parsed_extra') return false;
        if (!cleanValue) return false;

        const normalizedKey = normalizeDetailKey(cleanKey);
        if (placementHiddenKeys.has(normalizedKey)) return false;
        if (seenKeys.has(normalizedKey)) return false;

        const normalizedPair = `${normalizedKey}::${cleanValue.toLowerCase()}`;
        if (seenPairs.has(normalizedPair)) return false;

        seenKeys.add(normalizedKey);
        seenPairs.add(normalizedPair);
        return true;
      })
      .map(([key, value]) => ({ key, value: String(value).trim() }))
    })()
    : [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors duration-300">
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setSelectedStudent(null)}
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition-colors font-bold border-b-4 border-r-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-6 py-3 rounded-2xl shadow-[0_5px_15px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:translate-y-0 active:border-b-2"
        >
          <ArrowLeft className="w-5 h-5 drop-shadow-sm" />
          Back to Dashboard
        </button>

        <button onClick={toggleTheme} className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-b-4 border-r-2 border-slate-300 dark:border-slate-700 shadow-[0_5px_15px_rgba(0,0,0,0.05)] text-slate-600 dark:text-slate-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:translate-y-0 active:border-b-2 transition-all">
          {isDarkMode ? <Sun className="w-6 h-6 drop-shadow-md" /> : <Moon className="w-6 h-6 drop-shadow-md" />}
        </button>
      </div>

      <div className="space-y-8">
        <StudentProfile student={selectedStudent} />

        {selectedStudent.Feedback && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/40 dark:to-indigo-900/40 border-t-2 border-l-2 border-white/60 dark:border-blue-700/50 p-6 rounded-3xl shadow-[0_10px_30px_-10px_rgba(0,0,0,0.1),0_4px_0_rgba(191,219,254,0.8)] dark:shadow-[0_10px_30px_-10px_rgba(0,0,0,0.4),0_4px_0_rgba(30,58,138,0.8)] backdrop-blur-xl transition-all duration-300">
            <h3 className="text-blue-800 dark:text-blue-300 font-extrabold mb-3 flex items-center gap-2 drop-shadow-sm text-lg">
              <div className="p-2 bg-white/50 dark:bg-blue-800/50 rounded-xl shadow-inner border border-white/40">
                <AlertCircle className="w-5 h-5" />
              </div>
              Feedback & Notes
            </h3>
            <p className="text-blue-900 dark:text-blue-100/90 text-[15px] leading-relaxed font-bold">{selectedStudent.Feedback}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <InfoCard
            title="Personal Information"
            icon={<User className="w-6 h-6 text-blue-500" />}
            items={[
              { label: 'Gender', value: selectedStudent.Gender },
              { label: 'Address', value: selectedStudent.Address },
              { label: 'Phone', value: selectedStudent.Phone, placeholder: 'Not Provided' },
              { label: 'Parent Info', value: selectedStudent['Parent Info'], placeholder: 'Not Provided' }
            ]}
          />
          <InfoCard
            title="Academic & Area Info"
            icon={<BookOpen className="w-6 h-6 text-indigo-500" />}
            items={[
              { label: 'Education / Level', value: selectedStudent.Education },
              { label: 'School / Category', value: selectedStudent.School },
              { label: 'House', value: selectedStudent.House },
              { label: 'Local Area', value: selectedStudent['Local Area'] },
              { label: 'Panchayat / City', value: selectedStudent['Panchayat/city'] },
              { label: 'Student Type', value: selectedStudent['Student Type'] }
            ]}
          />
          <div className="space-y-8">
            <InfoCard
              title="Status & Dates"
              icon={<Calendar className="w-6 h-6 text-emerald-500" />}
              items={[
                { label: 'Joining Month', value: selectedStudent['Joining Month'] },
                { label: 'Joining Date', value: selectedStudent['Joining Date'] },
                { label: 'Status', value: selectedStudent['Current Status'] },
                { label: 'Dropout Date', value: selectedStudent['Dropout Date'], placeholder: 'N/A' }
              ]}
            />
            {activeTabId === 'main' && <Timeline student={selectedStudent} />}
          </div>
        </div>

        {isPlacementRecord && placementExtraDetails.length > 0 && (
          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2rem] p-8 border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)]">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-6">Other Placement Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {placementExtraDetails.map((item) => (
                <div key={item.key} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                  <p className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">
                    {item.key}
                  </p>
                  <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200 break-words">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelectedStudentProfile;
