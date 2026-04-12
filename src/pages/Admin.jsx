import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { Settings, Database, Server, RefreshCw, AlertCircle, Loader2, Users, Layout, FileText, Lock, ShieldAlert, Cloud, ExternalLink, CheckCircle2 } from 'lucide-react';
import EditableTable from '../components/EditableTable';
import MetricCard from '../components/MetricCard';
import Filters from '../components/Filters';
import { UserCheck, GraduationCap, User } from 'lucide-react';

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

const BASE_ENGLISH_URL = 'https://docs.google.com/spreadsheets/d/1_TeEWuTC6DgkDW5GkY910rLzS4ScFspROQHXpWDVamM/export?format=csv&gid=';

const Admin = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState([]);
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterHouse, setFilterHouse] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTeam, setFilterTeam] = useState('');
  const [filterOverallLevel, setFilterOverallLevel] = useState('');

  // --- Authentication ---
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- Syncing ---
  const [syncUrl, setSyncUrl] = useState(localStorage.getItem('admin_sync_url') || '');
  const [adminToken] = useState(localStorage.getItem('admin_sync_token') || Math.random().toString(36).substring(2, 12));
  const [showSyncSettings, setShowSyncSettings] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ state: 'idle', message: '' }); // idle, syncing, success, error
  const [syncHistory, setSyncHistory] = useState([]);

  useEffect(() => {
    localStorage.setItem('admin_sync_token', adminToken);
  }, [adminToken]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (inputPassword === 'sheikhubaby') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Incorrect Admin Password');
      setInputPassword('');
    }
  };

  const handleSyncRow = async (rowIndex, rowData) => {
    if (!syncUrl) return; 
    
    setSyncStatus({ state: 'syncing', message: 'Connecting to Cloud...' });
    const timestamp = new Date().toLocaleTimeString();
    
    try {
      const sheetName = activeTab.label;
      // Smart row finding: Priority columns for identity
      const keyColumn = Object.keys(rowData).find(k => 
        ['name', 'student name', 'id', 's no', 'phone number', 'roll no', 'adhar'].some(id => k.toLowerCase().includes(id))
      ) || Object.keys(rowData)[0];
      const keyValue = rowData[keyColumn];

      await fetch(syncUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          type: 'update',
          sheetName: sheetName,
          token: adminToken,
          rowIndex: rowIndex,
          keyColumn: keyColumn,
          keyValue: keyValue,
          row: rowData
        }),
      });

      setSyncStatus({ state: 'success', message: 'Cloud Signal Sent!' });
      setSyncHistory(prev => [{ time: timestamp, status: 'Success', row: keyValue || 'System Ping', sheet: sheetName }, ...prev].slice(0, 5));
      setTimeout(() => setSyncStatus({ state: 'idle', message: '' }), 3000);
    } catch (err) {
      setSyncStatus({ state: 'error', message: 'Connection Error: ' + err.message });
      setSyncHistory(prev => [{ time: timestamp, status: 'Error', error: err.message, sheet: activeTab.label }, ...prev].slice(0, 5));
      setTimeout(() => setSyncStatus({ state: 'idle', message: '' }), 5000);
    }
  };

  const saveSyncUrl = (url) => {
    setSyncUrl(url);
    localStorage.setItem('admin_sync_url', url);
  };

  // For testing/fallback since english has multiple months. We just fetch default month here, 
  // or you could expand this similar to StudentDashboard.
  const DEFAULT_ENGLISH_GID = '2144259521'; // mar2026

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' ||
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
  }, []);

  useEffect(() => {
    fetchData(activeTab.id);
  }, [activeTab]);

  const fetchData = async (tabId) => {
    setLoading(true);
    setError(null);
    setData([]);
    setColumns([]);
    
    try {
      const url = tabId === 'english' ? BASE_ENGLISH_URL + DEFAULT_ENGLISH_GID : MAIN_URLS[tabId];
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch CSV");
      const text = await response.text();

      // Pre-process similar to StudentDashboard to find header
      let lines = text.split(/\r?\n/);
      if (tabId === 'main') {
        const headerRowIdx = lines.findIndex(line => line.includes('S No') && line.includes('Name'));
        if (headerRowIdx !== -1) {
          lines = lines.slice(headerRowIdx);
        }
      } else if (tabId === 'english') {
        const headerIdx = lines.findIndex(line => {
          const l = line.toLowerCase();
          return (l.includes("student") || l.includes("name") || l.includes("mentor")) && l.includes("reading");
        });
        if (headerIdx !== -1) {
          lines = lines.slice(headerIdx);
        }
      }

      Papa.parse(lines.join('\n'), {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header, index) => {
          const trimmed = header ? String(header).trim() : '';
          if (!trimmed && index === 0 && tabId === 'english') return 'Student Name';
          return trimmed;
        },
        transform: (value) => value ? String(value).trim() : '',
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setData(results.data.filter(row => Object.values(row).some(v => v !== ''))); // filter complete empty
            // Extract clean column names from first object keys
            let cols = Object.keys(results.data[0]);
            
            // Filter out unwanted columns
            const exclude = [
              "Column 1", "Status after call", "Placment date", "Dropout Date", 
              "Students Photo", "Students Adhaar", "_1", "_2", "Girls", "Boys", 
              "Total in campus B + G", "Total joined", "_3", "_4", "_5", "_6"
            ];
            
            setColumns(cols.filter(c => {
              const trimmedCol = (c || '').trim();
              if (!trimmedCol) return false;
              const lowerCol = trimmedCol.toLowerCase();
              return !exclude.some(ex => lowerCol === ex.toLowerCase());
            }));
            setLastSynced(new Date().toLocaleTimeString());
          } else {
            setError("No valid data found in CSV.");
          }
          setLoading(false);
        },
        error: (err) => {
          setError(`Parse error: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err) {
      setError(`Network Error: ${err.message}`);
      setLoading(false);
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

  const isEnglishDashboard = activeTab.id === 'english';

  const filteredData = useMemo(() => {
    return data.filter(row => {
      // Find name key dynamically as admin keys vary
      const nameKey = Object.keys(row).find(k => k.toLowerCase().includes('name')) || 'Name';
      const name = String(row[nameKey] || '').toLowerCase();
      const matchSearch = name.includes(searchQuery.toLowerCase());
      
      const matchMonth = filterMonth ? row['Joining Month'] === filterMonth || row['Joinning Month'] === filterMonth || row['Joining Month '] === filterMonth : true;
      const matchHouse = filterHouse ? row['House'] === filterHouse || row['Students House'] === filterHouse : true;
      const matchStatus = filterStatus ? row['Current Status'] === filterStatus || row['Status'] === filterStatus : true;
      const matchTeam = filterTeam ? (row['Team'] === filterTeam || row['Mentor'] === filterTeam || row['Team '] === filterTeam) : true;
      const matchLevel = filterOverallLevel ? row['Over All Level'] === filterOverallLevel || row['Overall Level'] === filterOverallLevel : true;

      return matchSearch && matchMonth && matchHouse && matchStatus && matchTeam && matchLevel;
    });
  }, [data, searchQuery, filterMonth, filterHouse, filterStatus, filterTeam, filterOverallLevel]);

  // Derived Metrics for top cards
  const totalCount = filteredData.length;
  const boysCount = !isEnglishDashboard ? filteredData.filter(s => {
    const g = String(s['Gender'] || s['Gender '] || '').toLowerCase();
    return g === 'm' || g === 'male';
  }).length : 0;
  const girlsCount = !isEnglishDashboard ? filteredData.filter(s => {
    const g = String(s['Gender'] || s['Gender '] || '').toLowerCase();
    return g === 'f' || g === 'female';
  }).length : 0;
  
  const levelBAandAbove = isEnglishDashboard ? filteredData.filter(s => {
    const lvl = String(s['Over All Level'] || s['Overall Level'] || '').toUpperCase();
    return lvl.includes('B1') || lvl.includes('B2') || lvl.includes('C1') || lvl.includes('C2');
  }).length : 0;

  const levelA2 = isEnglishDashboard ? filteredData.filter(s => {
    const lvl = String(s['Over All Level'] || s['Overall Level'] || '').toUpperCase();
    return lvl.includes('A2');
  }).length : 0;

  const needsImprovement = isEnglishDashboard ? filteredData.filter(s => {
    const lvl = String(s['Over All Level'] || s['Overall Level'] || '').toUpperCase();
    return lvl.includes('A1') || lvl.includes('A0') || lvl.includes('LEAVE') || lvl.includes('NA') || lvl.includes('ABSENT');
  }).length : 0;

  const dropoutCount = !isEnglishDashboard ? filteredData.filter(s => {
    const status = String(s['Current Status'] || s['Status'] || '').toLowerCase();
    return status.includes('drop');
  }).length : 0;

  // Unique options for filters
  const uniqueMonths = [...new Set(data.map(s => s['Joining Month'] || s['Joinning Month'] || s['Joining Month ']).filter(Boolean))].sort();
  const uniqueHouses = [...new Set(data.map(s => s['House'] || s['Students House']).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(data.map(s => s['Current Status'] || s['Status']).filter(Boolean))].sort();
  const uniqueTeams = [...new Set(data.map(s => s['Team'] || s['Team '] || s['Leader']).filter(Boolean))].sort();
  const uniqueLevels = [...new Set(data.map(s => s['Over All Level'] || s['Overall Level']).filter(Boolean))].sort();
  const uniqueMentors = [...new Set(data.map(s => s['Mentor']).filter(Boolean))].sort();

  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors p-6 ${isDarkMode ? 'dark' : ''}`}>
        <div className="max-w-md w-full animate-in zoom-in-95 duration-500">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="p-10 text-center">
              <div className="inline-flex p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl mb-6 shadow-xl border border-indigo-100 dark:border-indigo-800">
                <Lock className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2 drop-shadow-sm tracking-tight">Admin Portal</h2>
              <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-[0.2em] mb-10">Restricted Access</p>
              
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <ShieldAlert className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    placeholder="Enter Admin Password"
                    className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-slate-800 dark:text-white font-bold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:font-medium text-lg text-center"
                    value={inputPassword}
                    onChange={(e) => setInputPassword(e.target.value)}
                    autoFocus
                  />
                </div>
                
                {authError && (
                  <p className="text-rose-500 dark:text-rose-400 text-sm font-black uppercase tracking-widest animate-pulse drop-shadow-sm">
                    {authError}
                  </p>
                )}
                
                <button
                  type="submit"
                  className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/40 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  Verify Access
                </button>
              </form>
            </div>
            
            <div className="p-5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 text-center">
              <button 
                onClick={() => window.history.back()}
                className="text-[11px] font-black text-slate-400 hover:text-indigo-500 uppercase tracking-[0.2em] transition-colors"
              >
                ← Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 font-sans transition-colors ${isDarkMode ? 'dark' : ''}`}>
      {/* Header */}
      <div className="bg-slate-900 text-white shadow-xl relative z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-xl backdrop-blur-md border border-white/10">
              <Database className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent leading-none mb-1">
                Admin Panel
              </h1>
              <p className="text-slate-400 font-medium text-xs tracking-wider uppercase">Data Management</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
                onClick={() => setShowSyncSettings(!showSyncSettings)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${
                    showSyncSettings ? 'bg-indigo-500 text-white shadow-lg' : 'bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-white/5'
                }`}
            >
                <Cloud className="w-4 h-4" />
                {syncUrl ? 'Sync Active' : 'Setup Sync'}
            </button>
            {lastSynced && (
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-slate-800/50 rounded-full border border-white/5 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                <RefreshCw className="w-3 h-3 text-emerald-500" />
                Last Synced: {lastSynced}
              </div>
            )}
            <button 
              onClick={() => window.history.back()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              Exit Admin
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1500px] mx-auto px-6 py-8">
        {/* Quick Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <MetricCard 
                title={isEnglishDashboard ? "Tested Students" : "Total Students"}
                value={totalCount}
                icon={<Users />}
                colorTheme="blue"
                subtitle={`From ${activeTab.label}`}
            />
            {isEnglishDashboard ? (
              <>
                <MetricCard 
                    title="B1 & Above"
                    value={levelBAandAbove}
                    icon={<UserCheck />}
                    colorTheme="purple"
                />
                <MetricCard 
                    title="A2 Progress"
                    value={levelA2}
                    icon={<GraduationCap />}
                    colorTheme="emerald"
                />
                <MetricCard 
                    title="Needs Imp."
                    value={needsImprovement}
                    icon={<User />}
                    colorTheme="red"
                />
              </>
            ) : (
              <>
                <MetricCard 
                    title="Total Boys"
                    value={boysCount}
                    icon={<User className="text-blue-500" />}
                    colorTheme="blue"
                />
                <MetricCard 
                    title="Total Girls"
                    value={girlsCount}
                    icon={<GraduationCap className="text-pink-500" />}
                    colorTheme="purple"
                />
                <MetricCard 
                    title="Dropout Students"
                    value={dropoutCount}
                    icon={<User className="text-rose-500" />}
                    colorTheme="red"
                />
              </>
            )}
        </div>

        {/* Sync Settings Panel */}
        {showSyncSettings && (
            <div className="mb-8 p-8 bg-indigo-600 rounded-[2.5rem] shadow-2xl shadow-indigo-500/30 text-white animate-in slide-in-from-top-4 duration-500 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                            <ExternalLink className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black tracking-tight">Cloud Sync Configuration</h3>
                            <p className="text-indigo-100 text-sm font-bold mt-1 uppercase tracking-widest">Connect to Google Apps Script</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                          <input 
                              type="text" 
                              placeholder="Paste your Apps Script Web App URL here..."
                              className="w-full px-6 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:outline-none focus:border-white transition-all font-bold"
                              value={syncUrl}
                              onChange={(e) => saveSyncUrl(e.target.value)}
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                            <span className="text-[10px] font-black bg-indigo-500 px-2 py-1 rounded text-white uppercase tracking-tighter">Target: {activeTab.label}</span>
                          </div>
                        </div>
                        <button 
                            onClick={() => setShowSyncSettings(false)}
                            className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-slate-50 transition-all uppercase tracking-widest text-xs shadow-xl"
                        >
                            Save Settings
                        </button>
                    </div>
                    
                    <div className="mt-4 p-4 bg-rose-500/20 border border-rose-500/30 rounded-2xl text-rose-100 text-xs font-bold flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-300" />
                        <p>IMPORTANT: Your Google Sheet tab name <b>MUST</b> be named exactly "<b>{activeTab.label}</b>" (case-sensitive) for the sync to work.</p>
                    </div>
                    
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="p-5 bg-white/10 rounded-2xl border border-white/10 md:col-span-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-4">Step 1: Copy this Script</p>
                            <div className="relative group">
                              <pre className="p-4 bg-slate-900/80 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto border border-white/10 max-h-48 scrollbar-hide select-all cursor-copy">
{`function doPost(e) {
  const SECRET_TOKEN = "${adminToken}";
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.token !== SECRET_TOKEN) throw new Error("Unauthorized");

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(data.sheetName);
    if (!sheet) {
      const sheets = ss.getSheets();
      sheet = sheets.find(s => s.getName().toLowerCase().trim() === data.sheetName.toLowerCase().trim());
    }
    
    if (!sheet) throw new Error("Sheet '" + data.sheetName + "' not found. Rename your sheet tab to match.");

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
    const rowData = data.row;
    
    // Auto-Timestamp
    const timeIdx = headers.findIndex(h => ['last updated', 'modified', 'timestamp'].includes(h.toLowerCase()));
    if (timeIdx >= 0) sheet.getRange(data.rowIndex + 2, timeIdx + 1).setValue(new Date().toLocaleString());

    let rowIndex = -1;
    if (data.keyColumn && data.keyValue) {
      const colIdx = headers.indexOf(data.keyColumn) + 1;
      if (colIdx > 0) {
        const columnValues = sheet.getRange(2, colIdx, Math.max(1, sheet.getLastRow() - 1)).getValues();
        rowIndex = columnValues.findIndex(row => String(row[0]).trim() === String(data.keyValue).trim()) + 2;
      }
    }
    
    if (rowIndex <= 1) rowIndex = data.rowIndex + 2; 

    if (rowIndex > 1 && rowIndex <= sheet.getLastRow()) {
      const cleanRowData = {};
      Object.keys(rowData).forEach(k => cleanRowData[String(k).trim()] = rowData[k]);
      const values = [headers.map(h => cleanRowData[h] !== undefined ? cleanRowData[h] : "")];
      sheet.getRange(rowIndex, 1, 1, headers.length).setValues(values);
      return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
    }
    throw new Error("Row not found.");
  } catch (err) {
    return ContentService.createTextOutput("Error: " + err.message).setMimeType(ContentService.MimeType.TEXT);
  }
}`}
                              </pre>
                              <div className="mt-4 flex flex-wrap items-center gap-4 px-2">
                                <button 
                                  onClick={() => {
                                    const code = document.querySelector('pre').innerText;
                                    navigator.clipboard.writeText(code);
                                    alert('Master Script Copied! Clear your old Apps Script and paste this one.');
                                  }}
                                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-white font-black uppercase tracking-widest text-[10px] rounded-xl shadow-lg transition-all"
                                >
                                  Copy Master Script
                                </button>
                                <button 
                                  onClick={() => handleSyncRow(0, { "Test": "System Check" })}
                                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white font-black uppercase tracking-widest text-[10px] rounded-xl border border-white/20 transition-all"
                                >
                                  Test Connection
                                </button>
                              </div>
                            </div>
                            <p className="text-sm font-bold leading-relaxed mt-4">1. Clear ALL old code from Apps Script. 2. Paste this Master Script. 3. <b>Save & Deploy</b> as Web App (Anyone).</p>
                        </div>
                        <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Step 2: Deploy</p>
                            <p className="text-sm font-bold leading-relaxed">Click <b>Deploy &gt; New Deployment</b>. Target: 'Web App'. Access: 'Anyone'.</p>
                        </div>
                        <div className="p-5 bg-white/10 rounded-2xl border border-white/10">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Step 3: Connect</p>
                            <p className="text-sm font-bold leading-relaxed">Copy the Web App URL and paste it into the box above.</p>
                        </div>
                    </div>

                    {/* Troubleshooting Guide */}
                    <div className="mt-8 p-6 bg-slate-900/60 border border-white/5 rounded-3xl">
                        <div className="flex items-center gap-3 mb-4">
                            <ShieldAlert className="w-5 h-5 text-amber-400" />
                            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-100">Common Sync Traps & Fixes</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter text-amber-500">1. CORS / BLOCKED REQUEST</p>
                                <p className="text-[11px] font-medium text-slate-300 leading-snug">Ensure you chose "<b>Anyone</b>" under "Who has access" during deployment.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter text-amber-500">2. WRONG URL</p>
                                <p className="text-[11px] font-medium text-slate-300 leading-snug">Don't copy the Script Editor URL. Use the <b>Web App URL</b> from the Deploy dialog.</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter text-amber-500">3. SHEET NOT FOUND</p>
                                <p className="text-[11px] font-medium text-slate-300 leading-snug">The tab name at bottom of your Google Sheet must be named exactly "<b>{activeTab.label}</b>".</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-black text-white uppercase tracking-tighter text-amber-500">4. UPDATE NOT SHOWING</p>
                                <p className="text-[11px] font-medium text-slate-300 leading-snug">Check if "<b>Name</b>" or "<b>Phone Number</b>" columns are correctly filled in Google Sheets.</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Sync Activity Monitor */}
                    {syncHistory.length > 0 && (
                      <div className="mt-8 border-t border-white/20 pt-8 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Database className="w-4 h-4 text-indigo-200" />
                                <h4 className="text-xs font-black uppercase tracking-widest text-indigo-100">Sync Activity Log</h4>
                            </div>
                            <button onClick={() => setSyncHistory([])} className="text-[10px] font-black uppercase tracking-widest text-indigo-300 hover:text-white transition-colors">Clear Logs</button>
                        </div>
                        <div className="bg-slate-900/40 rounded-2xl overflow-hidden border border-white/5">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[9px] font-black uppercase tracking-widest text-indigo-200">
                                    <tr>
                                        <th className="px-5 py-3">Time</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Reference</th>
                                        <th className="px-5 py-3">Tab</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {syncHistory.map((h, i) => (
                                        <tr key={i} className="text-[11px] font-bold">
                                            <td className="px-5 py-3 text-indigo-200 uppercase tracking-tighter">{h.time}</td>
                                            <td className="px-5 py-3">
                                                <span className={`px-2 py-0.5 rounded-full ${h.status === 'Success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                                    {h.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-white">{h.row || h.error}</td>
                                            <td className="px-5 py-3 text-indigo-300">{h.sheet}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                      </div>
                    )}
                </div>
            </div>
        )}

        {/* Sync Status Toast */}
        {syncStatus.state !== 'idle' && (
            <div className={`fixed bottom-10 right-10 z-[100] p-6 rounded-3xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500 border-2 ${
                syncStatus.state === 'syncing' ? 'bg-white dark:bg-slate-800 text-indigo-600 border-indigo-500' :
                syncStatus.state === 'success' ? 'bg-emerald-500 text-white border-emerald-400' :
                'bg-rose-500 text-white border-rose-400'
            }`}>
                {syncStatus.state === 'syncing' ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                <span className="font-black text-sm uppercase tracking-wider">{syncStatus.message}</span>
            </div>
        )}

        {/* Info Box */}
        <div className="mb-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-800/50 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xl flex gap-6 items-center">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                <Server className="w-8 h-8 text-indigo-600 dark:text-indigo-400 shrink-0" />
            </div>
            <div className="flex-1">
                <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-1">Central Data Management</h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium leading-relaxed max-w-4xl">
                  Edits are kept in local storage for safety. To apply changes permanently to Google Sheets: 
                  <span className="mx-2 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black rounded-lg border border-emerald-500/20">
                    Export CSV
                  </span> 
                  and upload or paste the result into your source document.
                </p>
            </div>
        </div>

        {/* Tabs Control Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
            <div className="flex gap-2 bg-slate-200/50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 w-full md:w-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-300 ${
                    activeTab.id === tab.id 
                      ? 'bg-white dark:bg-slate-700 shadow-lg text-indigo-600 dark:text-indigo-400 scale-[1.02]' 
                      : 'text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <button 
                onClick={() => { clearFilters(); fetchData(activeTab.id); }}
                className="w-full md:w-auto flex items-center justify-center gap-3 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-black text-xs uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
            >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Reload Source Data
            </button>
        </div>

        <div className="mb-10">
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
            showProgress={false}
            setShowProgress={() => {}}
          />
        </div>

        {/* Status / Error */}
        {error && (
          <div className="mb-8 p-5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-500/20 flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <span className="font-black text-sm uppercase tracking-wider">{error}</span>
          </div>
        )}

        {/* Content Area */}
        <div className="min-h-[500px] relative">
          {loading ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-md z-10 rounded-[2.5rem] border-4 border-dashed border-slate-200 dark:border-slate-800">
              <div className="p-6 bg-white dark:bg-slate-800 rounded-3xl shadow-2xl mb-6">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-black text-sm uppercase tracking-[0.2em] animate-pulse">Syncing Database...</p>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                <EditableTable 
                  data={filteredData} 
                  setData={setData} 
                  columns={columns} 
                  title={activeTab.label}
                  isDark={isDarkMode}
                  onSyncRow={handleSyncRow}
                  isSyncAvailable={!!syncUrl}
                />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
