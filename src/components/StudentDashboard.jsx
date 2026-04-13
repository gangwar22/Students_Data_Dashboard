import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import { AlertCircle, Trophy, Award, Star, TrendingUp, Loader2 } from 'lucide-react';

// New Components
import Header from './Header';
import Metrics from './Metrics';
import Filters from './Filters';
import StudentListView from './StudentListView';
import SelectedStudentProfile from './SelectedStudentProfile';
import ProgressAnalytics from './ProgressAnalytics';
import { Settings, X, Save } from 'lucide-react';

// Level ordering
const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_SCORE = Object.fromEntries(LEVEL_ORDER.map((l, i) => [l, i]));
const METRIC_ORDER = ["Reading", "Writing", "Listening", "Speaking"];
const SKILL_ABBREVIATIONS = { Reading: "R", Writing: "W", Listening: "L", Speaking: "S" };


const TABS = [
  { id: 'main', label: 'Main Sheet' },
  { id: 'sop', label: 'SOP Data' },
  { id: 'sob', label: 'SOB Data' },
  { id: 'english', label: 'English Level' },
  { id: 'placement', label: 'Placement Data' }
];

const MAIN_URLS = {
  main: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=993432848',
  sop: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=1828888147',
  sob: 'https://docs.google.com/spreadsheets/d/1k2pJyCAW3hjNw3ElhG4Rj3rFIEKeswXflTq5lKjmDe4/export?format=csv&gid=30053432'
};

const BASE_ENGLISH_URL = 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=';
const PLACEMENT_URLS = {
  all: 'https://docs.google.com/spreadsheets/d/1cmdSpfLe9Qm_MpxdgBqULdPv9fR8tGRiYNGMbxEWjeI/export?format=csv&gid=0',
  batch2425: 'https://docs.google.com/spreadsheets/d/1cmdSpfLe9Qm_MpxdgBqULdPv9fR8tGRiYNGMbxEWjeI/export?format=csv&gid=1626127241'
};
const PLACEMENT_BATCH_OPTIONS = ['2023', '2024', '2025', '2026'];

const getPlacementUrlForBatch = (batch) => (
  batch === '2024' || batch === '2025' ? PLACEMENT_URLS.batch2425 : PLACEMENT_URLS.all
);

const pickFirstValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const extractPlacementYear = (value) => {
  const text = String(value || '').trim();
  if (!text) return '';

  // 1. Detect and clean special characters (e.g., "-26-Feb-2025")
  const cleanedText = text.replace(/^[-]+/, '');

  // 2. Look for 4 consecutive digits that aren't part of a larger number, prioritizing 202x
  const fullYearMatch = cleanedText.match(/\b(202[2-7])\b/);
  if (fullYearMatch) return fullYearMatch[1];

  // 3. DD/MM/YYYY or D/M/YYYY or variants with hyphens/slashes
  const dateMatch = cleanedText.match(/\b\d{1,2}[/-]\d{1,2}[/-](\d{4})\b/);
  if (dateMatch) {
    const year = dateMatch[1];
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(year)) return year;
  }

  // 4. DD-MMM-YYYY format (e.g., "08-Nov-2024", "26-Mar-2025")
  const mmmMatch = cleanedText.match(/\b\d{1,2}[-\s/](jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[-\s/](\d{4})\b/i);
  if (mmmMatch) {
    const year = mmmMatch[2];
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(year)) return year;
  }

  // Handle common typo patterns like 20205, 20204, etc.
  const typoYearMatch = cleanedText.match(/\b2020?([2-7])\b/);
  if (typoYearMatch) return `202${typoYearMatch[1]}`;

  const shortYearMatch = cleanedText.match(/\b(22|23|24|25|26|27)\b/);
  if (shortYearMatch) return `20${shortYearMatch[1]}`;

  // Fallback: extract from compact numeric strings.
  const digitsOnly = cleanedText.replace(/\D/g, '');
  if (digitsOnly.includes('2022') || digitsOnly.includes('20202')) return '2022';
  if (digitsOnly.includes('2023') || digitsOnly.includes('20203')) return '2023';
  if (digitsOnly.includes('2024') || digitsOnly.includes('20204')) return '2024';
  if (digitsOnly.includes('2025') || digitsOnly.includes('20205')) return '2025';
  if (digitsOnly.includes('2026') || digitsOnly.includes('20206')) return '2026';
  if (digitsOnly.includes('2027') || digitsOnly.includes('20207')) return '2027';

  const parsed = new Date(cleanedText);
  if (!Number.isNaN(parsed.getTime())) {
    const parsedYear = String(parsed.getFullYear());
    if (['2022', '2023', '2024', '2025', '2026', '2027'].includes(parsedYear)) return parsedYear;
  }

  return '';
};

const inferPlacementBatch = (row) => {
  // 1. Check MOST reliable year indicator: 'Job Year'
  // Support both 'Job Year' and 'Job Year ' (with trailing space)
  const jobYearValue = row['Job Year'] || row['Job Year '] || row['Job Year  '];
  const fromJobYear = extractPlacementYear(jobYearValue);
  if (fromJobYear) return fromJobYear;

  // 2. Check and prioritize specific date column: 'Date of leaving - Placed'
  // Support variants: 'Date of leaving - Placed', 'Date of leaving- Placed' (missing space), 'Date of leaving  - Placed'
  const placementDateCandidate = row['Date of leaving - Placed'] || row['Date of leaving- Placed'] || row['Date of leaving  - Placed'];
  const fromPlacedDate = extractPlacementYear(placementDateCandidate);
  if (fromPlacedDate) return fromPlacedDate;

  // 3. Fallbacks for other possible column names
  const fromAlternativeDate = extractPlacementYear(pickFirstValue(row, ['Date of leaving', 'Left Date', 'Placement Date', 'Placement Year', 'Date of Leaving']));
  if (fromAlternativeDate) return fromAlternativeDate;

  const fromJoiningDate = extractPlacementYear(pickFirstValue(row, ['Date of joining Campus', 'Date of joining']));
  if (fromJoiningDate) return fromJoiningDate;

  // 4. Fallback to email batch
  const email = (row['Email id'] || row['Mail ID'] || row['Email'] || '').toString().toLowerCase();
  const emailMatch = email.match(/(23|24|25|26)@/);
  if (emailMatch) return `20${emailMatch[1]}`;

  return '';
};

const getMonthToken = (dateText) => {
  if (!dateText) return '';
  const normalized = String(dateText).trim();
  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleString('en-US', { month: 'short' });
  }

  const monthMatch = normalized.match(/[A-Za-z]{3,9}/);
  if (monthMatch) return monthMatch[0].slice(0, 3);
  return '';
};

const DEFAULT_ENGLISH_MONTHS = [
  { id: 'dec2026', label: 'December 2026', gid: '0' },
  { id: 'nov2026', label: 'November 2026', gid: '0' },
  { id: 'oct2026', label: 'October 2026', gid: '0' },
  { id: 'sep2026', label: 'September 2026', gid: '0' },
  { id: 'aug2026', label: 'August 2026', gid: '0' },
  { id: 'jul2026', label: 'July 2026', gid: '0' },
  { id: 'jun2026', label: 'June 2026', gid: '0' },
  { id: 'may2026', label: 'May 2026', gid: '0' },
  { id: 'apr2026', label: 'April 2026', gid: '1152741549' },
  { id: 'mar2026', label: 'March 2026', gid: '2144259521' },
  { id: 'feb2026', label: 'February 2026', gid: '491881762' },
  { id: 'jan2026', label: 'January 2026', gid: '1830077708' },
  { id: 'dec2025', label: 'December 2025', gid: '570738015' },
  { id: 'nov2025', label: 'November 2025', gid: '1245422337' },
  { id: 'oct2025', label: 'October 2025', gid: '1885586740' },
  { id: 'sep2025', label: 'September 2025', gid: '2061532534' },
  { id: 'aug2025', label: 'August 2025', gid: '359835442' },
];

const StudentDashboard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [englishMonths, setEnglishMonths] = useState(() => {
    const saved = localStorage.getItem('english_months_config');
    return saved ? JSON.parse(saved) : DEFAULT_ENGLISH_MONTHS;
  });
  const [activeEnglishMonth, setActiveEnglishMonth] = useState(englishMonths.find(m => m.id === 'mar2026') || englishMonths[0]);
  const [students, setStudents] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterOverallLevel, setFilterOverallLevel] = useState('');
  const [filterPlacementBatch, setFilterPlacementBatch] = useState('all');

  const updateGid = (id, newGid) => {
    const updated = englishMonths.map(m => m.id === id ? { ...m, gid: newGid } : m);
    setEnglishMonths(updated);
    localStorage.setItem('english_months_config', JSON.stringify(updated));
    if (activeEnglishMonth.id === id) {
      setActiveEnglishMonth({ ...activeEnglishMonth, gid: newGid });
    }
  };

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
    setFilterPlacementBatch('all');
  };

  const handleSync = () => {
    if (activeTab.id === 'english') {
      fetchEnglishCSV(BASE_ENGLISH_URL + activeEnglishMonth.gid);
    } else if (activeTab.id === 'placement') {
      fetchPlacementCSV(getPlacementUrlForBatch(filterPlacementBatch), filterPlacementBatch);
    } else {
      fetchCSV(MAIN_URLS[activeTab.id]);
    }
  };

  // Previous month for comparison
  const prevMonth = useMemo(() => {
    if (activeTab.id !== 'english') return null;
    const currentIndex = englishMonths.findIndex(m => m.id === activeEnglishMonth.id);
    if (currentIndex !== -1 && currentIndex < englishMonths.length - 1) {
      return englishMonths[currentIndex + 1];
    }
    return null;
  }, [activeTab.id, activeEnglishMonth.id, englishMonths]);

  useEffect(() => {
    if (!prevMonth?.gid || prevMonth.gid === '0' || activeTab.id !== 'english') { 
      return; 
    }
    setLoadingPrev(true);
    fetch(BASE_ENGLISH_URL + prevMonth.gid)
      .then(r => r.text())
      .then(text => {
        let lines = text.split(/\r?\n/);
        const hi = lines.findIndex(l => {
          const lower = l.toLowerCase();
          return (lower.includes("student") || lower.includes("name") || lower.includes("mentor")) && lower.includes("reading");
        });
        if (hi !== -1) lines = lines.slice(hi);
        Papa.parse(lines.join("\n"), {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header ? String(header).trim() : '',
          transform: (value) => value ? String(value).trim() : '',
          complete: () => {
             // In this dashboard we don't store prevStudents anymore as it's handled by sub-components
             setLoadingPrev(false);
          },
          error: () => setLoadingPrev(false),
        });
      })
      .catch(() => setLoadingPrev(false));
  }, [prevMonth?.gid, activeTab.id]);

  const fetchEnglishCSV = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch English Level CSV.");
      const text = await response.text();

      let lines = text.split(/\r?\n/);
      const headerIdx = lines.findIndex(line => {
        const l = line.toLowerCase();
        return (l.includes("student") || l.includes("name") || l.includes("mentor")) && l.includes("reading");
      });

      if (headerIdx !== -1) {
        lines = lines.slice(headerIdx);
      }

      const csvStr = lines.join('\n');
      Papa.parse(csvStr, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header ? String(header).trim() : '',
        transform: (value) => value ? String(value).trim() : '',
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const mappedData = results.data.map(row => {
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
  }, []);

  const fetchPlacementCSV = useCallback(async (url, selectedBatch = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch Placement CSV.");
      const text = await response.text();

      let lines = text.split(/\r?\n/);
      const headerIdx = lines.findIndex(line => {
        const lower = line.toLowerCase();
        return lower.includes('student') && (lower.includes('company') || lower.includes('mail'));
      });
      if (headerIdx !== -1) {
        lines = lines.slice(headerIdx);
      }

      Papa.parse(lines.join('\n'), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header ? String(header).trim() : '',
        transform: (value) => value ? String(value).trim() : '',
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const mappedData = results.data.map(row => {
              const name = pickFirstValue(row, ['Student', 'Student name', 'Name']);
              const company = pickFirstValue(row, ['Company']);
              const salaryOffered = pickFirstValue(row, ['Salary offered']);
              const joiningCampusDate = pickFirstValue(row, ['Date of joining Campus', 'Date of joining']);
              const placementDate = pickFirstValue(row, ['Date of leaving - Placed', 'Date of leaving']);
              const spentTime = pickFirstValue(row, ['Spent time in NavGurukul', 'Spent Days in NavGurukul']);
              const currentWorkStatus = pickFirstValue(row, [
                'Placed Candidates – Current Work Status Update',
                'Placed Candidates - Current Work Status Update',
                'Placed Candidates â€“ Current Work Status Update'
              ]);
              const batch = inferPlacementBatch(row);

              return {
                ...row,
                'Job Year': row['Job Year'] || row['Job Year '] || row['Job Year  '] || batch,
                Name: name || 'Unknown',
                Email: pickFirstValue(row, ['Email id', 'Mail ID', 'Email']),
                Gender: pickFirstValue(row, ['Gender', 'Gander']),
                Company: company,
                'Salary offered': salaryOffered,
                'Date of joining Campus': joiningCampusDate,
                'Date of leaving - Placed': placementDate,
                'Spent time in NavGurukul': spentTime,
                'Joining Date': joiningCampusDate,
                'Joining Month': pickFirstValue(row, ['Job Month']) || getMonthToken(placementDate),
                Education: pickFirstValue(row, ['Course', 'Academic Module']),
                House: pickFirstValue(row, ['School']),
                Team: pickFirstValue(row, ['Type of job']) || company,
                School: pickFirstValue(row, ['School']),
                'Student Type': pickFirstValue(row, ['Academic Module', 'Course']),
                'Current Status': currentWorkStatus || 'Placed',
                'Dropout Date': placementDate,
                Address: pickFirstValue(row, ['Location']),
                'Local Area': '',
                'Panchayat/city': '',
                Phone: pickFirstValue(row, ['Contact number', 'Contact Number']),
                'Parent Info': '',
                Feedback: pickFirstValue(row, [
                  'How they get job?',
                  'Placed Candidates – Current Work Status Update',
                  'Placed Candidates - Current Work Status Update',
                  'Placed Candidates â€“ Current Work Status Update'
                ]),
                Batch: batch
              };
            }).filter(s => (
              s.Name &&
              s.Name !== 'Unknown' &&
              !['student', 'student name', 'name'].includes(s.Name.toLowerCase())
            ));

            const batchFiltered = selectedBatch === 'all'
              ? mappedData
              : mappedData.filter(student => student.Batch === selectedBatch);

            setStudents(batchFiltered);
            if (batchFiltered.length === 0 && selectedBatch !== 'all') {
              setError(`No placement records found for year ${selectedBatch}.`);
            }
          } else {
            setError("No valid placement data found.");
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
  }, []);

  const fetchCSV = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch CSV.");
      const text = await response.text();
      
      let lines = text.split(/\r?\n/);
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
        transformHeader: (header) => header ? String(header).trim() : '',
        transform: (value) => value ? String(value).trim() : '',
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
  }, [activeTab.id]);

  useEffect(() => {
    setSelectedStudent(null);
    clearFilters();
    setShowProgress(false);
  }, [activeTab.id]);

  useEffect(() => {
    if (activeTab.id === 'english') {
      if (activeEnglishMonth.gid === '0') {
        setError("Please update the GID for " + activeEnglishMonth.label + " in Settings.");
        setStudents([]);
        setLoading(false);
      } else {
        fetchEnglishCSV(BASE_ENGLISH_URL + activeEnglishMonth.gid);
      }
    } else if (activeTab.id === 'placement') {
      // Changed: Always fetch the appropriate URL but handle local filtering in useMemo
      fetchPlacementCSV(getPlacementUrlForBatch(filterPlacementBatch), 'all');
    } else {
      fetchCSV(MAIN_URLS[activeTab.id]);
    }
  }, [activeTab, activeEnglishMonth, filterPlacementBatch, fetchEnglishCSV, fetchPlacementCSV, fetchCSV]);



  // Filter Logic
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchSearch = student.Name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMonth = filterMonth ? student['Joining Month'] === filterMonth : true;
      const matchHouse = filterHouse ? student.House === filterHouse : true;
      const matchStatus = filterStatus ? student['Current Status'] === filterStatus : true;
      const matchTeam = filterTeam ? (student.Team === filterTeam || student.Mentor === filterTeam) : true;
      const matchLevel = filterOverallLevel ? student['Over All Level'] === filterOverallLevel : true;
      
      // Fixed: Check BOTH student.Batch (calculated) AND student['Job Year'] (raw)
      const matchPlacementBatch = (activeTab.id === 'placement' && filterPlacementBatch !== 'all')
        ? (student.Batch === filterPlacementBatch || student['Job Year'] === filterPlacementBatch)
        : true;

      return matchSearch && matchMonth && matchHouse && matchStatus && matchTeam && matchLevel && matchPlacementBatch;
    });
  }, [students, searchQuery, filterMonth, filterHouse, filterStatus, filterTeam, filterOverallLevel, activeTab.id, filterPlacementBatch]);

  // Derived Metrics
  const isEnglishDashboard = activeTab.id === 'english';
  const isPlacementDashboard = activeTab.id === 'placement';
  const totalStudents = filteredStudents.length;

  const activeStudents = !isEnglishDashboard ? (isPlacementDashboard ? filteredStudents.length : filteredStudents.filter(s => {
    const status = (s['Current Status'] || '').toLowerCase().trim();
    return status === 'in' || status === 'active' || status === 'in campus';
  }).length) : 0;


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
  const uniqueMonths = !isEnglishDashboard && !isPlacementDashboard ? [...new Set(students.map(s => s['Joining Month']).filter(Boolean))].sort() : [];
  const uniqueHouses = [...new Set(students.map(s => s.House).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(students.map(s => s['Current Status']).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(students.map(s => s.Team).filter(Boolean))].sort();

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 transition-colors duration-300 relative">
      <Header 
        activeTab={activeTab}
        TABS={TABS}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        loading={loading}
        onSync={handleSync}
        isEnglishDashboard={isEnglishDashboard}
        activeEnglishMonth={activeEnglishMonth}
        ENGLISH_MONTHS={englishMonths}
        setActiveEnglishMonth={setActiveEnglishMonth}
      />

      {isEnglishDashboard && (
        <button
          onClick={() => setIsConfigOpen(true)}
          className="fixed bottom-8 right-8 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 transition-all z-50 flex items-center gap-2 group"
        >
          <Settings className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 font-bold whitespace-nowrap">Update GID Settings</span>
        </button>
      )}

      {isConfigOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-2xl rounded-[2.5rem] shadow-2xl border-2 border-white/20 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
              <div>
                <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-indigo-500" />
                  GID Configuration
                </h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-1">Update Google Sheet Tab IDs for each month</p>
              </div>
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="p-3 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl transition-colors"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>
            
            <div className="p-8 overflow-y-auto space-y-6">
              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/50 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Open your Google Sheet, click the month tab, and copy the number after "gid=" in the browser URL.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {englishMonths.map(month => (
                  <div key={month.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{month.label}</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={month.gid}
                        onChange={(e) => updateGid(month.id, e.target.value)}
                        className="w-full pl-4 pr-10 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-bold transition-all"
                        placeholder="Enter GID (e.g. 123456)"
                      />
                      {month.gid !== '0' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700">
              <button 
                onClick={() => setIsConfigOpen(false)}
                className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-3"
              >
                <Save className="w-5 h-5" />
                Save & Close Settings
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="p-5 bg-gradient-to-r from-rose-50 to-red-50 dark:from-rose-900/30 dark:to-red-900/30 text-red-800 dark:text-red-300 rounded-2xl flex items-center gap-3 text-[15px] font-bold border-t-2 border-l-2 border-white/60 dark:border-red-800/50 shadow-md backdrop-blur-xl">
          <AlertCircle className="w-6 h-6 text-rose-600" />
          {error}
        </div>
      )}

      <Metrics 
        isEnglishDashboard={isEnglishDashboard}
        isPlacementDashboard={isPlacementDashboard}
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

      {isEnglishDashboard && activeEnglishMonth.gid === '0' && (
        <div className="p-10 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 dark:from-indigo-900/10 dark:to-slate-800/10 rounded-[2.5rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800/50 flex flex-col items-center justify-center text-center gap-6 animate-in fade-in zoom-in duration-500">
          <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-white dark:border-slate-700">
            <Settings className="w-12 h-12 text-indigo-500 animate-[spin_4s_linear_infinite]" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Setup Required for {activeEnglishMonth.label}</h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto mt-2 italic">
              "Maine december tak months add kar diye hain, par abhi inka GID update hona baki hai."
            </p>
          </div>
          <button 
            onClick={() => setIsConfigOpen(true)}
            className="px-8 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-3 transform hover:-translate-y-1 active:scale-95"
          >
            Update GID for {activeEnglishMonth.label}
          </button>
        </div>
      )}

      {isEnglishDashboard && loadingPrev && activeEnglishMonth.gid !== '0' && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-1000">
           <div className="flex flex-col items-center justify-center text-center mb-10 px-2 gap-4">
              <div className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/40 rounded-full text-xs font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 animate-pulse shadow-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Fetching performance benchmarks...
              </div>
           </div>
        </div>
      )}

      {!loading && (
        <>
          <Filters 
            isEnglishDashboard={isEnglishDashboard}
            isPlacementDashboard={isPlacementDashboard}
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
            filterPlacementBatch={filterPlacementBatch}
            setFilterPlacementBatch={setFilterPlacementBatch}
            placementBatchOptions={PLACEMENT_BATCH_OPTIONS}
            uniqueMonths={uniqueMonths}
            uniqueHouses={uniqueHouses}
            uniqueStatuses={uniqueStatuses}
            uniqueTeams={uniqueTeams}
            uniqueLevels={uniqueLevels}
            uniqueMentors={uniqueMentors}
            clearFilters={clearFilters}
            showProgress={showProgress}
            setShowProgress={setShowProgress}
          />

          {isEnglishDashboard && showProgress && activeEnglishMonth.gid !== '0' ? (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
               <ProgressAnalytics 
                 onBack={() => setShowProgress(false)}
                 currentStudents={filteredStudents}
                 currentMonthLabel={activeEnglishMonth.label}
                 prevMonthUrl={BASE_ENGLISH_URL + (prevMonth?.gid || '0')}
                 prevMonthLabel={prevMonth?.label}
               />
            </div>
          ) : (
            <StudentListView 
              filteredStudents={filteredStudents}
              isEnglishDashboard={isEnglishDashboard}
              isPlacementDashboard={isPlacementDashboard}
              setSelectedStudent={setSelectedStudent}
            />
          )}
        </>
      )}
    </div>
  );
};

export default StudentDashboard;
