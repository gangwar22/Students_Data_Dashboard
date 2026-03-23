import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Search, Loader2, RefreshCw, Users, UserCheck, UserX, GraduationCap, ArrowLeft, FilterX, FileSpreadsheet, Moon, Sun } from 'lucide-react';
import StudentProfile from './StudentProfile';
import Timeline from './Timeline';
import InfoCard from './InfoCard';
import MetricCard from './MetricCard';
import DashboardCharts from './DashboardCharts';
import StudentTable from './StudentTable';
import { User, BookOpen, Calendar, AlertCircle, Menu } from 'lucide-react';

const TABS = [
  { id: 'main', label: 'Main Sheet' },
  { id: 'sop', label: 'SOP Data' },
  { id: 'sob', label: 'SOB Data' },
  { id: 'english', label: 'English Level' }
];

const MAIN_URLS = {
  main: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=993432848',
  sop: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=1828888147',
  sob: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=30053432'
};

const ENGLISH_MONTHS = [
  { id: 'feb2026', label: 'February 2026', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=491881762' },
  { id: 'jan2026', label: 'January 2026', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=1830077708' },
  { id: 'dec2025', label: 'December', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=570738015' },
  { id: 'nov2025', label: 'November', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=1245422337' },
  { id: 'oct2025', label: 'October', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=1885586740' },
  { id: 'sep2025', label: 'September', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=2061532534' },
  { id: 'aug2025', label: 'August', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=359835442' },
];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [activeEnglishMonth, setActiveEnglishMonth] = useState(ENGLISH_MONTHS[0]);
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterEducation, setFilterEducation] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterOverallLevel, setFilterOverallLevel] = useState('');
  const [filterStudentType, setFilterStudentType] = useState('');

  useEffect(() => {
    // Check initial theme
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, []);

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  };

  useEffect(() => {
    setSelectedStudent(null);
    clearFilters();

    if (activeTab.id === 'english') {
      fetchEnglishCSV(activeEnglishMonth.url);
    } else {
      fetchCSV(MAIN_URLS[activeTab.id]);
    }
  }, [activeTab, activeEnglishMonth]);

  const fetchEnglishCSV = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch English Level CSV.");
      const text = await response.text();

      let lines = text.split('\n');
      if (lines.length > 0 && !lines[0].toLowerCase().includes('student')) {
        const headerIdx = lines.findIndex(line => line.toLowerCase().includes('student'));
        if (headerIdx !== -1) {
          lines = lines.slice(headerIdx);
        }
      }

      const csvStr = lines.join('\n');
      Papa.parse(csvStr, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const mappedData = results.data.map(row => ({
              Name: row['Students'] || row['Student'] || row['Name'] || 'Unknown',
              Mentor: row['Mentor'] || row['Mentor '] || 'Unknown',
              Reading: row['Reading'] || 'NA',
              Listening: row['Listening'] || 'NA',
              Writing: row['Writing'] || 'NA',
              Speaking: row['Speaking'] || 'NA',
              'Over All Level': row['Over All Level'] || row['Overall Level'] || row['Overall'] || 'NA'
            })).filter(s => s.Name && s.Name !== 'Unknown' && s.Name.toLowerCase() !== 'students');
            setStudents(mappedData);
          } else {
            setError("No valid English student data found.");
            setStudents([]);
          }
          setLoading(false);
        },
        error: (err) => {
          setError(`Parse error: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setLoading(false);
    }
  };

  const fetchCSV = (url) => {
    setLoading(true);
    setError(null);
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const mappedData = results.data.map(row => ({
            Name: row['Name '] || row['Name'] || 'Unknown',
            Email: row['Email'],
            Gender: row['Gender '] || row['Gender'] || row['`Gender'],
            'Joining Date': row['Joining Date '] || row['Joining Date'],
            'Joining Month': row['Joinning Month'] || row['Joinning Month '] || row['Joining Month'],
            Education: row['Education'] || row['Students Level'],
            House: row['Students House'] || row['House'],
            Team: row['Team '] || row['Team'] || row['Leader'],
            School: row['School'] || row['SOP/SOB'],
            'Student Type': row['Students OLD & NEW'] || row['Student Type'],
            'Current Status': row['Status'] || row['Current Status'] || row['Students Status'],
            'Dropout Date': row['Dropout Date'],
            Address: row['Address'],
            'Local Area': row['Local Area'] || row['Locak Area'] || row['LocalArea'],
            'Panchayat/city': row['Panchayat / City'] || row['Panchayat/city'] || row['City'],
            Phone: row['Student Phone Number '] || row['Phone'] || row['Contact Number 1'],
            'Parent Info': `${row['Faather Name '] || ''} / ${row['Parents Phone number '] || ''}`.trim().replace(/^[/ ]+|[/ ]+$/g, ''),
            Feedback: row['Feedback Update'] || ''
          })).filter(s => s.Name && s.Name !== 'Unknown');

          if (mappedData.length > 0) {
            setStudents(mappedData);
          } else {
            setError("No valid student data found in the CSV.");
          }
        } else {
          setError("No data found in the CSV. Please check the structure.");
        }
        setLoading(false);
      },
      error: (error) => {
        setError(`Failed to fetch CSV: ${error.message}`);
        setLoading(false);
      }
    });
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMonth = filterMonth ? student['Joining Month'] === filterMonth : true;
      const matchHouse = filterHouse ? student.House === filterHouse : true;
      const matchStatus = filterStatus ? student['Current Status'] === filterStatus : true;
      const matchEducation = filterEducation ? student.Education === filterEducation : true;
      const matchTeam = filterTeam ? (student.Team === filterTeam || student.Mentor === filterTeam) : true;
      const matchLevel = filterOverallLevel ? student['Over All Level'] === filterOverallLevel : true;
      const matchStudentType = filterStudentType ? student.School === filterStudentType : true;

      return matchSearch && matchMonth && matchHouse && matchStatus && matchEducation && matchTeam && matchLevel && matchStudentType;
    });
  }, [students, searchQuery, filterMonth, filterHouse, filterStatus, filterEducation, filterTeam, filterOverallLevel, filterStudentType]);

  // Aggregate Metrics based on filtered students
  const totalStudents = filteredStudents.length;
  const isEnglishDashboard = activeTab.id === 'english';

  // Normal metrics
  const activeStudents = !isEnglishDashboard ? filteredStudents.filter(s => {
    const status = (s['Current Status'] || '').toLowerCase().trim();
    return status === 'in' || status === 'active' || status === 'in campus';
  }).length : 0;
  const dropoutStudents = !isEnglishDashboard ? filteredStudents.filter(s => {
    const status = (s['Current Status'] || '').toLowerCase().trim();
    return status.includes('drop-out') || status.includes('dropout') || status.includes('in-active');
  }).length : 0;
  const girlsCount = !isEnglishDashboard ? filteredStudents.filter(s => s.Gender && (s.Gender.toLowerCase() === 'f' || s.Gender.toLowerCase() === 'female')).length : 0;

  // English Metrics
  const levelBAandAbove = isEnglishDashboard ? filteredStudents.filter(s => {
    const lvl = (s['Over All Level'] || '').toUpperCase();
    return lvl.includes('B1') || lvl.includes('B2') || lvl.includes('C1') || lvl.includes('C2');
  }).length : 0;

  const levelA2 = isEnglishDashboard ? filteredStudents.filter(s => {
    const lvl = (s['Over All Level'] || '').toUpperCase();
    return lvl.includes('A2');
  }).length : 0;

  const needsImprovement = isEnglishDashboard ? filteredStudents.filter(s => {
    const lvl = (s['Over All Level'] || '').toUpperCase();
    return lvl.includes('A1') || lvl.includes('A0') || lvl.includes('LEAVE') || lvl.includes('NA') || lvl.includes('ABSENT');
  }).length : 0;

  // Unique options for filters based on ALL students
  const uniqueMentors = isEnglishDashboard ? [...new Set(students.map(s => s.Mentor).filter(Boolean))].sort() : [];
  const uniqueLevels = isEnglishDashboard ? [...new Set(students.map(s => s['Over All Level']).filter(Boolean))].sort() : [];
  const uniqueMonths = !isEnglishDashboard ? [...new Set(students.map(s => s['Joining Month']).filter(Boolean))].sort() : [];
  const uniqueHouses = [...new Set(students.map(s => s.House).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(students.map(s => s['Current Status']).filter(Boolean))].sort();
  const uniqueEducations = [...new Set(students.map(s => s.Education).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(students.map(s => s.Team).filter(Boolean))].sort();
  const uniqueStudentTypes = !isEnglishDashboard ? [...new Set(students.map(s => s.School).filter(Boolean))].sort() : [];

  const clearFilters = () => {
    setSearchQuery('');
    setFilterMonth('');
    setFilterHouse('');
    setFilterStatus('');
    setFilterEducation('');
    setFilterTeam('');
    setFilterOverallLevel('');
    setFilterStudentType('');
  };

  // View: Single Student Profile
  if (selectedStudent) {
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
              {activeTab.id === 'main' && <Timeline student={selectedStudent} />}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // View: Aggregate Dashboard
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-300">

      {/* 3D Header & Tabs */}
      <div className="flex flex-col gap-8 bg-white/70 dark:bg-slate-800/70 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 relative overflow-visible transition-all duration-300">

        {/* Deep 3D Glow */}
        <div className="absolute -top-32 -right-32 w-[35rem] h-[35rem] bg-gradient-to-tr from-blue-500/30 via-purple-500/30 to-pink-500/30 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20 rounded-full blur-[80px] pointer-events-none -z-10"></div>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10 w-full">
          <div>
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-800 to-purple-600 dark:from-indigo-300 dark:to-purple-300 tracking-tight drop-shadow-sm">Dantewada Campus Navgurukul</h1>
            <p className="text-slate-600 dark:text-slate-300 text-[15px] font-bold mt-2 tracking-wide drop-shadow-sm">Holistic view of Navgurukul student data - <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300">{activeTab.label}</span></p>
          </div>
          <div className="flex items-center gap-4">
            {/* 3D Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-4 rounded-2xl bg-white dark:bg-slate-800 border-b-[4px] border-r-2 border-slate-300 dark:border-slate-700 shadow-[0_5px_15px_rgba(0,0,0,0.05)] text-slate-600 dark:text-slate-300 hover:-translate-y-1 hover:shadow-[0_10px_20px_rgba(37,99,235,0.2)] active:translate-y-0 active:border-b-2 transition-all"
            >
              {isDarkMode ? <Sun className="w-6 h-6 drop-shadow-md" /> : <Moon className="w-6 h-6 drop-shadow-md" />}
            </button>

            {/* 3D Sync Button */}
            <button
              onClick={() => isEnglishDashboard ? fetchEnglishCSV(activeEnglishMonth.url) : fetchCSV(MAIN_URLS[activeTab.id])}
              disabled={loading}
              className="px-8 py-4 bg-gradient-to-r from-slate-800 to-slate-900 dark:from-blue-600 dark:to-indigo-700 text-white font-black text-[15px] tracking-wide rounded-2xl border-b-[5px] border-r-2 border-slate-950 dark:border-indigo-900 shadow-[0_10px_20px_rgba(15,23,42,0.4)] dark:shadow-[0_10px_20px_rgba(59,130,246,0.4)] hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(15,23,42,0.5)] active:translate-y-1 active:border-b-2 active:shadow-md transition-all flex items-center gap-3 disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 drop-shadow-lg ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
          </div>
        </div>

        {/* 3D Segmented Control Tabs */}
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

        {/* English Secondary Navigation Dropdown */}
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

      {error && (
        <div className="p-5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 text-red-800 dark:text-red-300 rounded-2xl flex items-center gap-3 text-[15px] font-bold border-t-2 border-l-2 border-white/60 dark:border-red-800/50 shadow-[0_5px_15px_rgba(225,29,72,0.1),0_3px_0_rgba(254,205,211,0.8)] dark:shadow-[0_5px_15px_rgba(225,29,72,0.2),0_3px_0_rgba(136,19,55,0.8)] backdrop-blur-xl">
          <div className="p-2 bg-white/60 dark:bg-rose-900/50 rounded-xl shadow-inner border border-white/50">
            <AlertCircle className="w-6 h-6 text-rose-600 drop-shadow-md" />
          </div>
          {error}
        </div>
      )}

      {loading && students.length === 0 ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 gap-5">
          <div className="p-5 bg-white dark:bg-slate-800 rounded-3xl shadow-[0_10px_25px_rgba(59,130,246,0.15)] border-t-2 border-l-2 border-white/60 dark:border-slate-700">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 dark:text-blue-400 drop-shadow-lg" />
          </div>
          <p className="font-extrabold tracking-widest uppercase text-sm drop-shadow-sm">Fetching {activeTab.label} data...</p>
        </div>
      ) : (
        <>
          {/* Metrics */}
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

          {/* 3D Filters */}
          <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/80 mt-6 transition-colors duration-300">
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100 mb-8 flex items-center gap-3 drop-shadow-sm tracking-wide">
              <div className="p-3 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/60 dark:to-purple-900/60 rounded-xl shadow-inner border border-white/50 dark:border-slate-700">
                <FilterX className="w-6 h-6 text-indigo-600 dark:text-indigo-400 drop-shadow-md" />
              </div>
              Advanced Data Filters
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 items-end">
              <div className="xl:col-span-2 relative">
                <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Search Student</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 drop-shadow-sm" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search name..."
                    className="w-full pl-14 pr-4 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 dark:focus:ring-blue-500/20 dark:focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold placeholder:text-slate-400 dark:placeholder:text-slate-500 placeholder:font-semibold"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {isEnglishDashboard ? (
                <>
                  {uniqueMentors.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Mentor</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                      >
                        <option value="">All Mentors</option>
                        {uniqueMentors.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueLevels.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Overall Level</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterOverallLevel}
                        onChange={(e) => setFilterOverallLevel(e.target.value)}
                      >
                        <option value="">All Levels</option>
                        {uniqueLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                      </select>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {uniqueMonths.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Month</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                      >
                        <option value="">All Months</option>
                        {uniqueMonths.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueHouses.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">House</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterHouse}
                        onChange={(e) => setFilterHouse(e.target.value)}
                      >
                        <option value="">All Houses</option>
                        {uniqueHouses.map(h => <option key={h} value={h}>{h}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueStatuses.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Status</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                      >
                        <option value="">All Statuses</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueEducations.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Level / Edu</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterEducation}
                        onChange={(e) => setFilterEducation(e.target.value)}
                      >
                        <option value="">All Levels</option>
                        {uniqueEducations.map(e => <option key={e} value={e}>{e}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueStudentTypes.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Student Type</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterStudentType}
                        onChange={(e) => setFilterStudentType(e.target.value)}
                      >
                        <option value="">All Types</option>
                        {uniqueStudentTypes.map(st => <option key={st} value={st}>{st}</option>)}
                      </select>
                    </div>
                  )}

                  {uniqueTeams.length > 0 && (
                    <div className="w-full">
                      <label className="block text-[13px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2.5 drop-shadow-sm">Leader</label>
                      <select
                        className="w-full px-5 py-3.5 bg-slate-50/80 dark:bg-slate-900/80 border-b-4 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/20 focus:border-b-blue-500 outline-none transition-all shadow-inner font-bold appearance-none cursor-pointer"
                        value={filterTeam}
                        onChange={(e) => setFilterTeam(e.target.value)}
                      >
                        <option value="">All Leaders</option>
                        {uniqueTeams.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  )}
                </>
              )}

              {(searchQuery || filterMonth || filterHouse || filterStatus || filterEducation || filterTeam || filterOverallLevel || filterStudentType) && (
                <div className="w-full mt-4 xl:mt-0 xl:col-span-6 flex justify-end">
                  <button
                    onClick={clearFilters}
                    className="px-8 py-3.5 text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-xl transition-all flex items-center justify-center gap-2 border-b-4 border-rose-200 dark:border-rose-800/50 whitespace-nowrap font-black shadow-sm active:translate-y-1 active:border-b-0"
                  >
                    <FilterX className="w-5 h-5 drop-shadow-sm" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Charts component is now fully dynamic and functional for all datasets! */}
          {filteredStudents.length > 0 && <DashboardCharts students={filteredStudents} isEnglishData={isEnglishDashboard} />}

          {/* Quick Level Breakdown for English Data */}
          {isEnglishDashboard && filteredStudents.length > 0 && (
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

          {/* Table */}
          <StudentTable students={filteredStudents} onSelectStudent={setSelectedStudent} />
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
