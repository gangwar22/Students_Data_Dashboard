import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { TrendingUp, TrendingDown, Minus, Users, ChevronDown, ChevronUp, Loader2, BarChart2 } from "lucide-react";

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
const CustomTooltip = ({ active, payload, label }) => {
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
    if (!prevMonthUrl) { setPrevStudents([]); return; }
    setLoadingPrev(true);
    fetch(prevMonthUrl)
      .then(r => r.text())
      .then(text => {
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
      })
      .catch(() => setLoadingPrev(false));
  }, [prevMonthUrl]);

  const { chartData, improved, steady, declined } = useMemo(() => {
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Improved", data: improved, icon: TrendingUp, ...STATUS_COLORS.Improved },
          { label: "Steady", data: steady, icon: Minus, ...STATUS_COLORS.Steady },
          { label: "Declined", data: declined, icon: TrendingDown, ...STATUS_COLORS.Declined }
        ].map(({ label, data, icon: Icon, bg, light, text, border }) => (
          <div key={label} className={`${card} border-b-[6px] ${border} group hover:-translate-y-2`}>
            <div className={`p-6 flex items-center justify-between ${light} border-b border-white/40 dark:border-black/20`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${bg} text-white shadow-xl shadow-opacity-20 transition-transform group-hover:scale-110`}><Icon className="w-5 h-5" /></div>
                <div>
                   <h4 className={`text-[11px] font-black uppercase tracking-[0.2em] opacity-60 ${text}`}>{label}</h4>
                   <p className={`text-sm font-black ${text}`}>Total Students</p>
                </div>
              </div>
              <span className={`text-4xl font-black ${text} drop-shadow-sm`}>{data.length}</span>
            </div>
            <div className="p-5 max-h-[320px] overflow-y-auto custom-scrollbar space-y-3">
              {data.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                   <Users className="w-10 h-10 mb-2" />
                   <p className="text-xs font-black uppercase tracking-widest">No Records</p>
                </div>
              ) : (
                data.map(s => (
                  <div key={s.name} className="flex items-center justify-between p-4 rounded-3xl bg-slate-50/50 dark:bg-slate-900/40 border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="flex flex-col min-w-0">
                      <span className="text-[13px] font-black text-slate-800 dark:text-slate-100 truncate tracking-tight">{s.name}</span>
                      <div className="flex items-center gap-2 mt-1 bg-slate-200/50 dark:bg-slate-800/50 w-fit px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold text-slate-500">{s.prevLevel}</span>
                        <ChevronUp className="w-3 h-3 text-slate-400 rotate-90" />
                        <span className={`text-[10px] font-black ${text}`}>{s.currLevel}</span>
                      </div>
                    </div>
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-black ${bg} text-white shadow-lg transition-all group-hover:rotate-12`}>
                      {label === "Improved" ? <TrendingUp className="w-4 h-4" /> : label === "Declined" ? <TrendingDown className="w-4 h-4" /> : <Minus className="w-4 h-4" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className={`${card} p-10`}>
        <div className="flex items-center justify-between mb-10">
           <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
                <BarChart2 className="w-6 h-6 text-indigo-500" />
                Proficiency Heatmap
              </h3>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-widest">Across all evaluated students</p>
           </div>
           <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500/20" />
                 <span className="text-[10px] items-center font-black uppercase text-slate-400">Previous</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-indigo-500" />
                 <span className="text-[10px] font-black uppercase text-slate-400">Current</span>
              </div>
           </div>
        </div>
        <div className="h-[400px] relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
              <defs>
                <linearGradient id="colorCurr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPrev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" dark-stroke="#334155" opacity={0.5} />
              <XAxis 
                dataKey="shortName" 
                tick={{ fontSize: 10, fill: "#64748b", fontWeight: 700 }} 
                angle={-45} 
                textAnchor="end" 
                interval={0} 
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tick={<LevelTick />} 
                domain={[0, LEVEL_ORDER.length - 1]} 
                ticks={LEVEL_ORDER.map((_, i) => i)} 
                width={40} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area 
                type="monotone" 
                dataKey="prevScore" 
                stroke="#94a3b8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorPrev)" 
                strokeDasharray="5 5"
              />
              <Area 
                type="monotone" 
                dataKey="currScore" 
                stroke="#6366f1" 
                strokeWidth={4} 
                fillOpacity={1} 
                fill="url(#colorCurr)" 
                animationDuration={1500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap justify-center gap-6">
           {LEVEL_ORDER.map((lvl, i) => (
             <div key={lvl} className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400">{i}</span>
                <span className="text-xs font-black text-slate-600 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md">{lvl}</span>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
};

export default EnglishProgressCharts;
