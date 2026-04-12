import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, ChevronDown, ChevronUp, Loader2, BarChart2, ChevronRight } from "lucide-react";

// ─── Level ordering ────────────────────────────────────────────────────────────
const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_SCORE = Object.fromEntries(LEVEL_ORDER.map((l, i) => [l, i]));

function normaliseLevel(raw = "") {
  const up = raw.trim().toUpperCase();
  const match = LEVEL_ORDER.find(l => up.includes(l));
  return match || null;
}

// ─── Colour palette ────────────────────────────────────────────────────────────
const STATUS_COLORS = {
  Improved: { hex: "#22c55e", bg: "bg-emerald-500", light: "bg-emerald-50 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300", border: "border-emerald-200 dark:border-emerald-800" },
  Steady:   { hex: "#eab308", bg: "bg-yellow-500",  light: "bg-yellow-50 dark:bg-yellow-900/30",   text: "text-yellow-700 dark:text-yellow-300",   border: "border-yellow-200 dark:border-yellow-800"   },
  Declined: { hex: "#ef4444", bg: "bg-red-500",    light: "bg-red-50 dark:bg-red-900/30",          text: "text-red-700 dark:text-red-300",          border: "border-red-200 dark:border-red-800"          },
};

// ─── Tooltips ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-slate-900/90 backdrop-blur-xl text-white px-5 py-4 rounded-2xl shadow-2xl border border-white/20 min-w-[200px] animate-in fade-in zoom-in duration-200">
      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-3 border-b border-white/10 pb-2">{data.name}</p>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Previous</span>
          </div>
          <span className="text-sm font-black text-white bg-white/10 px-2 py-0.5 rounded-md">{data.prevLevel}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase">Current</span>
          </div>
          <span className="text-sm font-black text-indigo-300 bg-indigo-500/20 px-2 py-0.5 rounded-md">{data.currLevel}</span>
        </div>
        <div className={`mt-2 pt-2 border-t border-white/10 flex items-center justify-between`}>
           <span className="text-[10px] font-bold text-slate-400 uppercase">Status</span>
           <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${STATUS_COLORS[data.status].bg} text-white`}>
            {data.status}
           </span>
        </div>
      </div>
    </div>
  );
};

const LevelTick = ({ x, y, payload }) => (
  <text x={x} y={y} dy={4} textAnchor="end" fill="#94a3b8" fontSize={11} fontWeight={800}>
    {LEVEL_ORDER[payload.value] || ""}
  </text>
);

const EnglishProgressCharts = ({ currentStudents, currentMonthLabel, prevMonthUrl, prevMonthLabel }) => {
  const [prevStudents, setPrevStudents] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!prevMonthUrl) {
         setPrevStudents(prev => prev.length === 0 ? prev : []);
         return;
      }
      setLoadingPrev(true);
      try {
        const response = await fetch(prevMonthUrl);
        const text = await response.text();
        let lines = text.split("\n");
        const hi = lines.findIndex(l => l.toLowerCase().includes("student") && l.toLowerCase().includes("mentor"));
        if (hi !== -1) lines = lines.slice(hi);
        Papa.parse(lines.join("\n"), {
          header: true,
          skipEmptyLines: true,
          complete: ({ data }) => {
            const mapped = data.map(row => ({
              Name: row["Students"] || row["Student"] || row["Name"] || "",
              "Over All Level": row["Over All Level"] || row["Overall Level"] || row["Overall"] || "NA",
            })).filter(s => s.Name && s.Name.toLowerCase() !== "students");
            setPrevStudents(mapped);
            setLoadingPrev(false);
          },
          error: () => setLoadingPrev(false),
        });
      } catch {
        setLoadingPrev(false);
      }
    };
    fetchData();
  }, [prevMonthUrl]);

  const { chartData } = useMemo(() => {
    const prevMap = Object.fromEntries(prevStudents.map(s => [s.Name.trim(), s["Over All Level"]]));
    const rows = currentStudents.map(s => {
      const name = s.Name.trim();
      const currRaw = s["Over All Level"] || "NA";
      const prevRaw = prevMap[name] || null;
      const currLevel = normaliseLevel(currRaw);
      const prev = prevRaw ? normaliseLevel(prevRaw) : null;
      const currScore = currLevel ? LEVEL_SCORE[currLevel] : null;
      const prevScore = prev ? LEVEL_SCORE[prev] : null;

      let status = "Steady";
      if (currScore !== null && prevScore !== null) {
        if (currScore > prevScore) status = "Improved";
        else if (currScore < prevScore) status = "Declined";
      }
      return { 
        name, 
        shortName: name.split(" ")[0].substring(0, 10), 
        currLevel: currLevel || (currRaw.length > 5 ? "NA" : currRaw) || "N/A", 
        prevLevel: prev || "N/A", 
        currScore: currScore ?? -1, 
        prevScore: prevScore ?? -1, 
        status 
      };
    }).filter(r => r.currScore >= 0).sort((a, b) => b.currScore - a.currScore);

    return { 
      chartData: rows, 
      improved: rows.filter(r => r.status === "Improved"), 
      steady: rows.filter(r => r.status === "Steady"), 
      declined: rows.filter(r => r.status === "Declined") 
    };
  }, [currentStudents, prevStudents]);

  const card = "bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1),0_8px_0_rgba(203,213,225,0.7)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5),0_8px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 transition-all duration-500 overflow-hidden";

  return (
    <div className="space-y-10 mt-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
        <div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-indigo-200 dark:shadow-none shadow-lg">
               <TrendingUp className="w-6 h-6 text-white" />
            </div>
            Student Growth Tracker
          </h2>
          <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mt-2 ml-1 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {prevMonthLabel ? <><span className="text-indigo-500 font-extrabold">{prevMonthLabel}</span> comparison with <span className="text-cyan-500 font-extrabold">{currentMonthLabel}</span></> : "Performance Insights"}
          </p>
        </div>
        {loadingPrev && <div className="flex items-center gap-3 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-xs font-black text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 animate-pulse"><Loader2 className="w-3 h-3 animate-spin" /> Fetching Previous Data...</div>}
      </div>

      <div className={`${card} p-10 overflow-hidden`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10">
           <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100 dark:border-indigo-800">
                <BarChart2 className="w-3 h-3" />
                Performance Analytics
              </div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Proficiency Heatmap
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-[0.2em] opacity-60">Comparative growth of all evaluated students</p>
           </div>
           
           <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-[1.5rem] border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full" />
                 <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider">Previous Level</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                 <span className="text-[11px] font-black uppercase text-indigo-500 tracking-wider">Current Level</span>
              </div>
           </div>
        </div>

        {/* Scrollable Container for many students */}
        <div className="relative group/chart">
           <div className="overflow-x-auto pb-6 custom-scrollbar scroll-smooth">
              <div style={{ minWidth: Math.max(800, chartData.length * 60) + 'px' }} className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 10, bottom: 60 }}>
                    <defs>
                      <linearGradient id="colorCurr" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid 
                      strokeDasharray="4 4" 
                      vertical={false} 
                      stroke="#e2e8f0" 
                      dark-stroke="#334155" 
                      opacity={0.4} 
                    />
                    <XAxis 
                      dataKey="shortName" 
                      tick={({ x, y, payload }) => (
                        <g transform={`translate(${x},${y})`}>
                          <text 
                            x={0} y={0} dy={16} 
                            textAnchor="end" 
                            fill="#64748b" 
                            fontSize={10} 
                            fontWeight={800} 
                            transform="rotate(-45)"
                            className="transition-colors group-hover:fill-slate-900 dark:group-hover:fill-slate-200"
                          >
                            {payload.value}
                          </text>
                        </g>
                      )}
                      interval={0} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tick={<LevelTick />} 
                      domain={[0, LEVEL_ORDER.length - 1]} 
                      ticks={LEVEL_ORDER.map((_, i) => i)} 
                      width={45} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="prevScore" 
                      stroke="#94a3b8" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorPrev)" 
                      strokeDasharray="8 4"
                      connectNulls
                      animationDuration={1000}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="currScore" 
                      stroke="#6366f1" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorCurr)" 
                      animationDuration={2000}
                      dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 8, fill: '#6366f1', shadow: '0 0 20px rgba(99,102,241,0.5)' }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </div>
           
           {/* Hint for scrolling */}
           {chartData.length > 10 && (
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-1.5 bg-slate-900/80 backdrop-blur-md text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-bounce cursor-default pointer-events-none">
                <ChevronRight className="w-3 h-3" />
                Scroll right to see more
                <ChevronRight className="w-3 h-3" />
             </div>
           )}
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 text-center">Reference Scale</p>
           <div className="flex flex-wrap justify-center gap-4">
              {LEVEL_ORDER.map((lvl, i) => (
                <div key={lvl} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 transition-colors group/lvl">
                   <span className="text-[9px] font-black text-slate-400 group-hover/lvl:text-indigo-400">{i}</span>
                   <span className="text-xs font-black text-slate-700 dark:text-slate-300">{lvl}</span>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default EnglishProgressCharts;
