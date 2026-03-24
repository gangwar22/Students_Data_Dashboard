import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { TrendingUp, TrendingDown, Minus, Users, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

// ─── Level ordering ────────────────────────────────────────────────────────────
const LEVEL_ORDER = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVEL_SCORE = Object.fromEntries(LEVEL_ORDER.map((l, i) => [l, i]));

function normaliseLevel(raw = '') {
  const up = raw.trim().toUpperCase();
  const match = LEVEL_ORDER.find(l => up.includes(l));
  return match || null; // null = absent / leave / NA
}

// ─── Colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Improved: { hex: '#22c55e', bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  Steady:   { hex: '#eab308', bg: 'bg-yellow-500',  light: 'bg-yellow-50 dark:bg-yellow-900/30',   text: 'text-yellow-700 dark:text-yellow-300',   border: 'border-yellow-200 dark:border-yellow-800'   },
  Declined: { hex: '#ef4444', bg: 'bg-red-500',    light: 'bg-red-50 dark:bg-red-900/30',          text: 'text-red-700 dark:text-red-300',          border: 'border-red-200 dark:border-red-800'          },
};

// ─── Custom Grouped Bar Tooltip ─────────────────────────────────────────────
const ProgressTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const prevVal = payload.find(p => p.dataKey === 'prevScore');
  const currVal = payload.find(p => p.dataKey === 'currScore');
  const status  = payload[0]?.payload?.status;
  const color   = STATUS_COLORS[status] || STATUS_COLORS.Steady;

  return (
    <div className="bg-slate-900 text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/10 min-w-[180px]">
      <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2 truncate">{label}</p>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="w-3 h-3 rounded-full bg-indigo-400 inline-block" />
          Prev: <span className="text-white">{payload[0]?.payload?.prevLevel || 'N/A'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm font-bold">
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
          Current: <span className="text-white">{payload[0]?.payload?.currLevel || 'N/A'}</span>
        </div>
        {status && (
          <div className={`mt-2 px-3 py-1 rounded-lg text-xs font-black ${
            status === 'Improved' ? 'bg-emerald-500/30 text-emerald-300' :
            status === 'Declined' ? 'bg-red-500/30 text-red-300' :
            'bg-yellow-500/30 text-yellow-300'
          }`}>
            {status === 'Improved' ? '⬆ Improved' : status === 'Declined' ? '⬇ Declined' : '➖ Steady'}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Custom Pie Tooltip ─────────────────────────────────────────────────────
const PieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/10">
      <p className="text-sm font-black">{payload[0].name}: <span className="text-2xl">{payload[0].value}</span> students</p>
      <p className="text-xs opacity-60 mt-1">Click segment to see names</p>
    </div>
  );
};

// ─── Y-Axis tick mapped to level label ──────────────────────────────────────
const LevelTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={12} fontWeight={700}>
    {LEVEL_ORDER[payload.value] || ''}
  </text>
);

// ─── Main Component ─────────────────────────────────────────────────────────
const EnglishProgressCharts = ({ currentStudents, currentMonthLabel, prevMonthUrl, prevMonthLabel }) => {
  const [prevStudents, setPrevStudents] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(false);
  const [selectedBar, setSelectedBar] = useState(null);      // clicked student
  const [selectedSegment, setSelectedSegment] = useState(null); // clicked pie segment
  const [pieExpanded, setPieExpanded] = useState(false);

  // ── Fetch previous month data ─────────────────────────────────────────────
  useEffect(() => {
    if (!prevMonthUrl) { setPrevStudents([]); return; }
    setLoadingPrev(true);
    setPrevStudents([]);
    setSelectedBar(null);
    setSelectedSegment(null);

    fetch(prevMonthUrl)
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.text(); })
      .then(text => {
        let lines = text.split('\n');
        const hi = lines.findIndex(l => l.toLowerCase().includes('student'));
        if (hi !== -1) lines = lines.slice(hi);
        Papa.parse(lines.join('\n'), {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const mapped = data.map(row => ({
              Name: row['Students'] || row['Student'] || row['Name'] || '',
              'Over All Level': row['Over All Level'] || row['Overall Level'] || row['Overall'] || 'NA',
            })).filter(s => s.Name && s.Name.toLowerCase() !== 'students');
            setPrevStudents(mapped);
            setLoadingPrev(false);
          },
          error: () => setLoadingPrev(false),
        });
      })
      .catch(() => setLoadingPrev(false));
  }, [prevMonthUrl]);

  // ── Build comparison data ─────────────────────────────────────────────────
  const { chartData, improved, steady, declined } = useMemo(() => {
    const prevMap = Object.fromEntries(prevStudents.map(s => [s.Name.trim(), s['Over All Level']]));

    const rows = currentStudents
      .map(s => {
        const name    = s.Name.trim();
        const currRaw = s['Over All Level'] || 'NA';
        const prevRaw = prevMap[name] || null;

        const currLevel = normaliseLevel(currRaw);
        const prevLevel = prevLevel_ => normaliseLevel(prevLevel_);
        const prev      = prevRaw ? normaliseLevel(prevRaw) : null;

        const currScore = currLevel ? LEVEL_SCORE[currLevel] : null;
        const prevScore = prev      ? LEVEL_SCORE[prev]      : null;

        let status = 'Steady';
        if (currScore !== null && prevScore !== null) {
          if (currScore > prevScore) status = 'Improved';
          else if (currScore < prevScore) status = 'Declined';
        } else if (currScore !== null && prevScore === null) {
          status = 'Steady'; // new entry
        }

        return {
          name,
          shortName: name.split(' ')[0],
          currLevel: currLevel || currRaw || 'N/A',
          prevLevel: prev || prevRaw || 'N/A',
          currScore: currScore ?? -1,
          prevScore: prevScore ?? -1,
          status,
        };
      })
      .filter(r => r.currScore >= 0); // only students with valid current level

    const imp = rows.filter(r => r.status === 'Improved');
    const ste = rows.filter(r => r.status === 'Steady');
    const dec = rows.filter(r => r.status === 'Declined');

    return { chartData: rows, improved: imp, steady: ste, declined: dec };
  }, [currentStudents, prevStudents]);

  const pieData = [
    { name: 'Improved', value: improved.length, students: improved },
    { name: 'Steady',   value: steady.length,   students: steady   },
    { name: 'Declined', value: declined.length,  students: declined },
  ].filter(d => d.value > 0);

  const PIE_COLORS = [STATUS_COLORS.Improved.hex, STATUS_COLORS.Steady.hex, STATUS_COLORS.Declined.hex];

  const selectedDetail = selectedBar ? chartData.find(d => d.name === selectedBar) : null;
  const segData        = selectedSegment ? pieData.find(p => p.name === selectedSegment) : null;

  // Card style shared
  const card = 'bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 transition-all duration-300';

  return (
    <div className="space-y-8 mt-8">

      {/* ── Section Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight">
            📊 Progress Comparison
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
            {prevMonthLabel
              ? <><span className="text-indigo-500">{prevMonthLabel}</span> → <span className="text-cyan-500">{currentMonthLabel}</span></>
              : <>Showing {currentMonthLabel} (select a previous month to enable comparison)</>}
          </p>
        </div>
        {loadingPrev && (
          <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading previous month…
          </div>
        )}
      </div>

      {/* ── Summary Metric Badges ─────────────────────────────────────────── */}
      {prevMonthUrl && !loadingPrev && chartData.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Improved', count: improved.length, icon: TrendingUp,   ...STATUS_COLORS.Improved },
            { label: 'Steady',   count: steady.length,   icon: Minus,        ...STATUS_COLORS.Steady   },
            { label: 'Declined', count: declined.length, icon: TrendingDown, ...STATUS_COLORS.Declined  },
          ].map(({ label, count, icon: Icon, hex, light, text, border }) => (
            <div key={label} className={`${light} ${border} border rounded-2xl p-4 flex flex-col items-center gap-1 shadow-sm`}>
              <Icon className={`w-5 h-5 ${text}`} />
              <span className={`text-3xl font-black ${text}`}>{count}</span>
              <span className={`text-xs font-black uppercase tracking-widest ${text} opacity-80`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Grouped Bar Chart ─────────────────────────────────────────────── */}
      <div className={`${card} p-6 hover:-translate-y-1 hover:shadow-2xl`}>
        <div className="mb-6">
          <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">Student Level Comparison</h3>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-1">
            Click a bar to see student details below
          </p>
        </div>
        <div className="h-80 relative">
          <div className="absolute inset-0 bg-blue-100/10 dark:bg-blue-900/10 rounded-2xl -z-10" />
          {chartData.length === 0 && !loadingPrev ? (
            <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-500 font-bold text-sm">
              {prevMonthUrl ? 'No comparable data found' : 'Select a previous month above to see progress'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 20, left: 10, bottom: 60 }}
                onClick={(data) => {
                  if (data?.activePayload?.[0]) {
                    const name = data.activePayload[0].payload.name;
                    setSelectedBar(prev => prev === name ? null : name);
                  }
                }}
              >
                <defs>
                  <linearGradient id="prevGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="currGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#67e8f9" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="shortName"
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 700 }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  dy={10}
                />
                <YAxis
                  tick={<LevelTick />}
                  tickLine={false}
                  axisLine={false}
                  domain={[0, LEVEL_ORDER.length - 1]}
                  ticks={LEVEL_ORDER.map((_, i) => i)}
                  width={40}
                />
                <Tooltip content={<ProgressTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)', radius: 8 }} />
                <Legend
                  wrapperStyle={{ fontSize: 13, fontWeight: 700, color: '#64748b', paddingTop: 8 }}
                  formatter={(v) => v === 'prevScore' ? prevMonthLabel || 'Previous Month' : currentMonthLabel || 'Current Month'}
                />
                {prevMonthUrl && (
                  <Bar
                    dataKey="prevScore"
                    name="prevScore"
                    fill="url(#prevGrad)"
                    radius={[8, 8, 4, 4]}
                    barSize={14}
                    opacity={0.85}
                  />
                )}
                <Bar
                  dataKey="currScore"
                  name="currScore"
                  radius={[8, 8, 4, 4]}
                  barSize={14}
                  cursor="pointer"
                >
                  {chartData.map((entry) => {
                    const isSelected = selectedBar === entry.name;
                    const color =
                      entry.status === 'Improved' ? STATUS_COLORS.Improved.hex :
                      entry.status === 'Declined' ? STATUS_COLORS.Declined.hex :
                      STATUS_COLORS.Steady.hex;
                    return (
                      <Cell
                        key={entry.name}
                        fill={color}
                        opacity={isSelected ? 1 : 0.8}
                        style={{ filter: isSelected ? `drop-shadow(0 0 8px ${color})` : 'none', transition: 'all 0.2s' }}
                      />
                    );
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* ── Legend for bar colors ───────────────────────────────────────── */}
        {prevMonthUrl && chartData.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-3 justify-center">
            {Object.entries(STATUS_COLORS).map(([s, c]) => (
              <div key={s} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.hex }} />
                Current: {s}
              </div>
            ))}
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded-full bg-indigo-500" />
              Previous Month
            </div>
          </div>
        )}
      </div>

      {/* ── Clicked Student Detail Panel ─────────────────────────────────── */}
      {selectedDetail && (
        <div className={`${card} p-6 border-2 ${
          selectedDetail.status === 'Improved' ? 'border-emerald-400/50 dark:border-emerald-600/40' :
          selectedDetail.status === 'Declined' ? 'border-red-400/50 dark:border-red-600/40' :
          'border-yellow-400/50 dark:border-yellow-600/40'
        }`}
          style={{ animation: 'fadeSlideIn 0.3s ease' }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">Student Detail</p>
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">{selectedDetail.name}</h3>
            </div>
            <button
              onClick={() => setSelectedBar(null)}
              className="text-xs font-black text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-colors px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700"
            >
              ✕ Close
            </button>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-4">
            <div className="bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl p-4 text-center border border-indigo-100 dark:border-indigo-800">
              <p className="text-[11px] font-black uppercase tracking-widest text-indigo-500 mb-1">Previous Level</p>
              <p className="text-3xl font-black text-indigo-700 dark:text-indigo-300">{selectedDetail.prevLevel}</p>
              <p className="text-xs font-bold text-indigo-400 mt-1">{prevMonthLabel || 'Prev Month'}</p>
            </div>
            <div className="bg-cyan-50 dark:bg-cyan-900/30 rounded-2xl p-4 text-center border border-cyan-100 dark:border-cyan-800">
              <p className="text-[11px] font-black uppercase tracking-widest text-cyan-500 mb-1">Current Level</p>
              <p className="text-3xl font-black text-cyan-700 dark:text-cyan-300">{selectedDetail.currLevel}</p>
              <p className="text-xs font-bold text-cyan-400 mt-1">{currentMonthLabel || 'Current'}</p>
            </div>
            <div className={`${STATUS_COLORS[selectedDetail.status].light} rounded-2xl p-4 text-center border ${STATUS_COLORS[selectedDetail.status].border}`}>
              <p className={`text-[11px] font-black uppercase tracking-widest mb-1 ${STATUS_COLORS[selectedDetail.status].text}`}>Progress</p>
              <p className={`text-3xl font-black ${STATUS_COLORS[selectedDetail.status].text}`}>
                {selectedDetail.status === 'Improved' ? '⬆' : selectedDetail.status === 'Declined' ? '⬇' : '➖'}
              </p>
              <p className={`text-xs font-black mt-1 ${STATUS_COLORS[selectedDetail.status].text}`}>{selectedDetail.status}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Student Progress Circle Analysis ─────────────────────────── */}
      {prevMonthUrl && !loadingPrev && pieData.length > 0 && (
        <div className={`${card} p-8`}>
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span className="p-2 bg-indigo-500 rounded-xl text-white">
                <Users className="w-5 h-5" />
              </span>
              Level Progress Analysis
            </h3>
            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2">
              Summary of students who improved, stayed steady, or declined
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Doughnut Chart */}
            <div className="h-[340px] relative bg-slate-50/50 dark:bg-slate-900/40 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <defs>
                    {PIE_COLORS.map((color, i) => (
                      <linearGradient key={i} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={1} />
                        <stop offset="100%" stopColor={color} stopOpacity={0.7} />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={130}
                    paddingAngle={8}
                    dataKey="value"
                    stroke="none"
                    onClick={(data) => setSelectedSegment(prev => prev === data.name ? null : data.name)}
                    style={{ cursor: 'pointer', outline: 'none' }}
                  >
                    {pieData.map((entry, i) => {
                      const isSelected = selectedSegment === entry.name;
                      const color = PIE_COLORS[pieData.findIndex(p => p.name === entry.name)];
                      return (
                        <Cell
                          key={entry.name}
                          fill={`url(#grad-${i})`}
                          opacity={isSelected || !selectedSegment ? 1 : 0.4}
                          className="transition-all duration-300"
                          style={{
                            filter: isSelected ? `drop-shadow(0 0 15px ${color})` : 'none',
                            transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                            transformOrigin: 'center',
                          }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<PieTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(v, entry) => (
                      <span className="text-sm font-black text-slate-600 dark:text-slate-400 px-2">
                        {v} ({entry.payload.value})
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
              
              {/* Center Info */}
              {!selectedSegment && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                  <p className="text-4xl font-black text-slate-800 dark:text-slate-100">{chartData.length}</p>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Total Validated</p>
                </div>
              )}
            </div>

            {/* Categorized Student Lists */}
            <div className="space-y-6">
              {['Improved', 'Steady', 'Declined'].map(category => {
                const data = pieData.find(p => p.name === category);
                if (!data) return null;
                const config = STATUS_COLORS[category];
                const isSelected = selectedSegment === category;
                const isOtherSelected = selectedSegment && selectedSegment !== category;

                return (
                  <div 
                    key={category}
                    onClick={() => setSelectedSegment(prev => prev === category ? null : category)}
                    className={`transition-all duration-300 cursor-pointer rounded-3xl border-2 p-5 ${
                      isSelected 
                        ? `${config.light} ${config.border} translate-x-2 shadow-lg` 
                        : isOtherSelected 
                          ? 'opacity-40 grayscale-[0.5] border-transparent' 
                          : 'bg-white/50 dark:bg-slate-800/40 border-slate-50 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${config.bg} text-white shadow-lg`}>
                          {category === 'Improved' ? <TrendingUp className="w-4 h-4" /> : category === 'Declined' ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                        </div>
                        <h4 className={`font-black text-lg ${config.text}`}>{category}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full bg-white dark:bg-slate-900 border font-black text-sm ${config.text}`}>
                        {data.value} {data.value === 1 ? 'Student' : 'Students'}
                      </span>
                    </div>

                    {/* Student Mini Grid */}
                    <div className={`grid grid-cols-2 gap-2 transition-all duration-500 overflow-hidden ${isSelected ? 'max-h-[400px] mt-4 pt-4 border-t border-white/50 dark:border-slate-700/50' : 'max-h-0'}`}>
                      {data.students.map((s) => (
                        <div 
                          key={s.name}
                          className="flex items-center gap-2 p-2 rounded-xl bg-white/80 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800"
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${config.bg} flex-shrink-0`} />
                          <div className="flex flex-col min-w-0">
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate leading-tight">{s.name}</span>
                            <span className="text-[9px] font-black opacity-50 uppercase tracking-tighter">
                              {s.prevLevel} → {s.currLevel}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {!isSelected && !isOtherSelected && (
                      <p className="text-[10px] font-bold text-slate-400 mt-1 ml-11">Click to view students</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default EnglishProgressCharts;
