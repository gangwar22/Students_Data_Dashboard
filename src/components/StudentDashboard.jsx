import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { AlertCircle } from 'lucide-react';

// New Components
import Header from './Header';
import Metrics from './Metrics';
import Filters from './Filters';
import StudentListView from './StudentListView';
import SelectedStudentProfile from './SelectedStudentProfile';

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
  { id: 'mar2026', label: 'March 2026', url: 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=2144259521' },
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

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterOverallLevel, setFilterOverallLevel] = useState('');

  useEffect(() => {
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

  const clearFilters = () => {
    setSearchQuery('');
    setFilterMonth('');
    setFilterHouse('');
    setFilterStatus('');
    setFilterTeam('');
    setFilterOverallLevel('');
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
      // Look for the header row that contains 'Mentor' and 'Reading'
      const headerIdx = lines.findIndex(line => {
        const l = line.toLowerCase();
        return (l.includes('student') || l.includes('name')) && l.includes('mentor');
      });

      if (headerIdx !== -1) {
        lines = lines.slice(headerIdx);
      } else {
        // Fallback for March sheet where the first column might be empty or unnamed in mapping
        // The second line in March CSV is: " ,Mentor,Reading,Listening,Writing,Speaking,Over All Level"
        const marchHeaderIdx = lines.findIndex(line => line.toLowerCase().includes('mentor') && line.includes('Reading'));
        if (marchHeaderIdx !== -1) {
          lines = lines.slice(marchHeaderIdx);
        }
      }

      const csvStr = lines.join('\n');
      Papa.parse(csvStr, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const mappedData = results.data.map(row => {
              // Extract Name from first column if it's unnamed (CSV often has ",Mentor...")
              const keys = Object.keys(row);
              const firstKeyTrigger = keys[0];
              const nameFromFirstCol = (row[firstKeyTrigger] || '').trim();
              
              return {
                Name: row['Students'] || row['Student'] || row['Name'] || nameFromFirstCol || 'Unknown',
                Mentor: row['Mentor'] || row['Mentor '] || 'Unknown',
                Reading: row['Reading'] || 'NA',
                Listening: row['Listening'] || 'NA',
                Writing: row['Writing'] || 'NA',
                Speaking: row['Speaking'] || 'NA',
                'Over All Level': row['Over All Level'] || row['Overall Level'] || row['Overall'] || 'NA'
              };
            }).filter(s => s.Name && s.Name !== 'Unknown' && 
                           !['students', 'name', 'student name'].includes(s.Name.toLowerCase()) &&
                           s.Mentor !== 'Mentor');
            
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

  const fetchCSV = async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch CSV.");
      const text = await response.text();
      
      let lines = text.split('\n');
      if (activeTab.id === 'main') {
        const headerRowIdx = lines.findIndex(line => line.includes('S No') && line.includes('Name'));
        if (headerRowIdx !== -1) {
          lines = lines.slice(headerRowIdx);
        }
      }

      const csvStr = lines.join('\n');
      
      Papa.parse(csvStr, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const mappedData = results.data.map(row => ({
              Name: (row['Name '] || row['Name'] || row['Name  '] || '').trim() || 'Unknown',
              Email: row['Email'],
              Gender: row['Gender '] || row['Gender'] || row['`Gender'],
              'Joining Date': row['Joining Date '] || row['Joining Date'],
              'Joining Month': row['Joinning Month'] || row['Joinning Month '] || row['Joining Month'],
              Education: row['Education'] || row['Students Level'],
              House: row['Students House'] || row['House'],
              Team: row['Team '] || row['Team'] || row['Leader'] || row['Team (AA)'],
              School: row['School'] || row['SOP/SOB'],
              'Student Type': row['Students OLD & NEW'] || row['Student Type'],
              'Current Status': row['Status'] || row['Current Status'] || row['Students Status'],
              'Dropout Date': row['Dropout Date'],
              Address: row['Address'],
              'Local Area': row['Local Area'] || row['Locak Area'] || row['LocalArea'],
              'Panchayat/city': row['Panchayat / City'] || row['Panchayat/city'] || row['City'],
              Phone: row['Student Phone Number '] || row['Phone'] || row['Contact Number 1'],
              'Parent Info': `${row['Faather Name '] || ''} / ${row['Parents Phone number '] || ''}`.trim().replace(/^[/ ]+|[/ ]+$/g, ''),
              Feedback: row['Feedback Update'] || row['Where is improvement needed?'] || ''
            })).filter(s => s.Name && s.Name !== 'Unknown' && s.Name.toLowerCase() !== 'name');

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
    } catch (err) {
      setError(`Network error: ${err.message}`);
      setLoading(false);
    }
  };

  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMonth = filterMonth ? student['Joining Month'] === filterMonth : true;
      const matchHouse = filterHouse ? student.House === filterHouse : true;
      const matchStatus = filterStatus ? student['Current Status'] === filterStatus : true;
      const matchTeam = filterTeam ? (student.Team === filterTeam || student.Mentor === filterTeam) : true;
      const matchLevel = filterOverallLevel ? student['Over All Level'] === filterOverallLevel : true;

      return matchSearch && matchMonth && matchHouse && matchStatus && matchTeam && matchLevel;
    });
  }, [students, searchQuery, filterMonth, filterHouse, filterStatus, filterTeam, filterOverallLevel]);

  // Derived Metrics
  const isEnglishDashboard = activeTab.id === 'english';
  const totalStudents = filteredStudents.length;

  const activeStudents = !isEnglishDashboard ? filteredStudents.filter(s => {
    const status = (s['Current Status'] || '').toLowerCase().trim();
    return status === 'in' || status === 'active' || status === 'in campus';
  }).length : 0;

  const dropoutStudents = !isEnglishDashboard ? filteredStudents.filter(s => {
    const status = (s['Current Status'] || '').toLowerCase().trim();
    return status.includes('drop-out') || status.includes('dropout') || status.includes('in-active');
  }).length : 0;

  const girlsCount = !isEnglishDashboard ? filteredStudents.filter(s => s.Gender && (s.Gender.toLowerCase() === 'f' || s.Gender.toLowerCase() === 'female')).length : 0;

  const boysCount = !isEnglishDashboard ? filteredStudents.filter(s => s.Gender && (s.Gender.toLowerCase() === 'm' || s.Gender.toLowerCase() === 'male')).length : 0;

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

  // Filter Options Data
  const uniqueMentors = isEnglishDashboard ? [...new Set(students.map(s => s.Mentor).filter(Boolean))].sort() : [];
  const uniqueLevels = isEnglishDashboard ? [...new Set(students.map(s => s['Over All Level']).filter(Boolean))].sort() : [];
  const uniqueMonths = !isEnglishDashboard ? [...new Set(students.map(s => s['Joining Month']).filter(Boolean))].sort() : [];
  const uniqueHouses = [...new Set(students.map(s => s.House).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(students.map(s => s['Current Status']).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(students.map(s => s.Team).filter(Boolean))].sort();

  // Previous month for comparison
  const prevMonth = useMemo(() => {
    if (!isEnglishDashboard) return null;
    const currentIndex = ENGLISH_MONTHS.findIndex(m => m.id === activeEnglishMonth.id);
    if (currentIndex !== -1 && currentIndex < ENGLISH_MONTHS.length - 1) {
      return ENGLISH_MONTHS[currentIndex + 1];
    }
    return null;
  }, [isEnglishDashboard, activeEnglishMonth]);

  if (selectedStudent) {
    return (
      <SelectedStudentProfile 
        selectedStudent={selectedStudent}
        setSelectedStudent={setSelectedStudent}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        activeTabId={activeTab.id}
      />
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-300">
      <Header 
        activeTab={activeTab}
        TABS={TABS}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        loading={loading}
        onSync={() => activeTab.id === 'english' ? fetchEnglishCSV(activeEnglishMonth.url) : fetchCSV(MAIN_URLS[activeTab.id])}
        isEnglishDashboard={isEnglishDashboard}
        activeEnglishMonth={activeEnglishMonth}
        ENGLISH_MONTHS={ENGLISH_MONTHS}
        setActiveEnglishMonth={setActiveEnglishMonth}
      />

      {error && (
        <div className="p-5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 text-red-800 dark:text-red-300 rounded-2xl flex items-center gap-3 text-[15px] font-bold border-t-2 border-l-2 border-white/60 dark:border-red-800/50 shadow-md backdrop-blur-xl">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          {error}
        </div>
      )}

      <Metrics 
        isEnglishDashboard={isEnglishDashboard}
        totalStudents={totalStudents}
        activeStudents={activeStudents}
        boysCount={boysCount}
        girlsCount={girlsCount}
        levelBAandAbove={levelBAandAbove}
        levelA2={levelA2}
        needsImprovement={needsImprovement}
        loading={loading}
        studentsLength={students.length}
        activeTabLabel={activeTab.label}
      />

      {!loading && (
        <>
          <Filters 
            isEnglishDashboard={isEnglishDashboard}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterMonth={filterMonth}
            setFilterMonth={setFilterMonth}
            filterHouse={filterHouse}
            setFilterHouse={setFilterHouse}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterTeam={filterTeam}
            setFilterTeam={setFilterTeam}
            filterOverallLevel={filterOverallLevel}
            setFilterOverallLevel={setFilterOverallLevel}
            uniqueMonths={uniqueMonths}
            uniqueHouses={uniqueHouses}
            uniqueStatuses={uniqueStatuses}
            uniqueTeams={uniqueTeams}
            uniqueLevels={uniqueLevels}
            uniqueMentors={uniqueMentors}
            clearFilters={clearFilters}
          />

          <StudentListView 
            filteredStudents={filteredStudents}
            isEnglishDashboard={isEnglishDashboard}
            setSelectedStudent={setSelectedStudent}
            currentMonthLabel={activeEnglishMonth.label}
            prevMonthUrl={prevMonth?.url}
            prevMonthLabel={prevMonth?.label}
          />
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
