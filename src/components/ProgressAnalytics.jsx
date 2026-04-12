import React, { useState, useEffect, useMemo } from "react";
import Papa from "papaparse";
import { TrendingUp, TrendingDown, Minus, Users, ChevronUp, Award, Star, Trophy } from "lucide-react";
import EnglishProgressCharts from "./EnglishProgressCharts";

// ─── Level ordering ────────────────────────────────────────────────────────────
const LEVEL_ORDER = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_SCORE = Object.fromEntries(LEVEL_ORDER.map((l, i) => [l, i]));

const METRIC_ORDER = ["Reading", "Writing", "Listening", "Speaking"];
const SKILL_ABBREVIATIONS = { Reading: "R", Writing: "W", Listening: "L", Speaking: "S" };

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

const ProgressAnalytics = ({ currentStudents, currentMonthLabel, prevMonthUrl, prevMonthLabel, onBack }) => {
  const [prevStudents, setPrevStudents] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(false);

  // Use useMemo for result to avoid recalculating on every render
  const analyticsData = useMemo(() => {
    if (!currentStudents || currentStudents.length === 0) return { improved: [], steady: [], declined: [], teamWinners: {} };
    
    const prevMap = Object.fromEntries(prevStudents.map(s => [s.Name.trim(), s]));
    
    const rows = currentStudents.map(s => {
      const name = s.Name.trim();
      const currRaw = s["Over All Level"] || "NA";
      const prevData = prevMap[name] || null;
      const prevRaw = prevData ? prevData["Over All Level"] : null;
      
      const currLevel = normaliseLevel(currRaw);
      const prev = prevRaw ? normaliseLevel(prevRaw) : null;
      const currScore = currLevel ? LEVEL_SCORE[currLevel] : null;
      const prevScore = prev ? LEVEL_SCORE[prev] : null;

      const skillImprovements = [];
      METRIC_ORDER.forEach(skill => {
        const currSkillRaw = s[skill] || "NA";
        const prevSkillRaw = prevData ? prevData[skill] : null;
        const currSkillLvl = normaliseLevel(currSkillRaw);
        const prevSkillLvl = prevSkillRaw ? normaliseLevel(prevSkillRaw) : null;
        const currSkillScore = currSkillLvl ? LEVEL_SCORE[currSkillLvl] : -1;
        const prevSkillScore = prevSkillLvl ? LEVEL_SCORE[prevSkillLvl] : -1;
        if (currSkillScore > prevSkillScore && prevSkillScore !== -1) {
          skillImprovements.push(SKILL_ABBREVIATIONS[skill]);
        }
      });

      let status = "Steady";
      if (currScore !== null && prevScore !== null) {
        if (currScore > prevScore) status = "Improved";
        else if (currScore < prevScore) status = "Declined";
      }
      return { 
        name, 
        currLevel: currLevel || (currRaw.length > 5 ? "NA" : currRaw) || "N/A", 
        prevLevel: prev || "N/A", 
        currScore: currScore ?? -1, 
        prevScore: prevScore ?? -1, 
        status,
        mentor: s.Mentor || "Unknown",
        skillImprovements,
        totalSkillImproves: skillImprovements.length,
        overallImprovement: (currScore ?? -1) - (prevScore ?? -1)
      };
    }).filter(r => r.currScore >= 0).sort((a, b) => b.currScore - a.currScore);

    const winners = {};
    const teams = [...new Set(rows.map(r => r.mentor))].filter(m => m !== "Unknown" && m !== "NA");
    teams.forEach(team => {
      const teamMembers = rows.filter(r => r.mentor === team);
      const sortedMembers = [...teamMembers].sort((a, b) => {
        if (b.overallImprovement !== a.overallImprovement) return b.overallImprovement - a.overallImprovement;
        return b.totalSkillImproves - a.totalSkillImproves;
      });
      const topCandidate = sortedMembers[0];
      if (topCandidate && (topCandidate.overallImprovement > 0 || topCandidate.totalSkillImproves > 0)) {
        winners[team] = topCandidate;
      }
    });

    return { 
      improved: rows.filter(r => r.status === "Improved"), 
      steady: rows.filter(r => r.status === "Steady"), 
      declined: rows.filter(r => r.status === "Declined"),
      teamWinners: winners
    };
  }, [currentStudents, prevStudents]);

  const { improved, steady, declined, teamWinners } = analyticsData;

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      if (!prevMonthUrl) { 
        setPrevStudents([]);
        return; 
      }
      setLoadingPrev(true);
      try {
        const response = await fetch(prevMonthUrl);
        const text = await response.text();
        if (!isMounted) return;
        
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
          complete: ({ data }) => {
            if (!isMounted) return;
            const mapped = data.map(row => {
               const keys = Object.keys(row);
               const firstKeyTrigger = keys[0];
               const nameFromFirstCol = (row[firstKeyTrigger] || '').trim();
               return {
                Name: row["Students"] || row["Student"] || row["Name"] || nameFromFirstCol || "",
                "Over All Level": row["Over All Level"] || row["Overall Level"] || row["Overall"] || "NA",
                Mentor: row["Mentor"] || row["Mentor "] || "Unknown",
                Reading: row["Reading"] || "NA",
                Writing: row["Writing"] || "NA",
                Listening: row["Listening"] || "NA",
                Speaking: row["Speaking"] || "NA"
               };
            }).filter(s => s.Name && !["students", "name", "student name"].includes(s.Name.toLowerCase()) && s.Mentor !== "Mentor");
            setPrevStudents(mapped);
            setLoadingPrev(false);
          },
          error: () => {
            if (isMounted) setLoadingPrev(false);
          },
        });
      } catch {
        if (isMounted) setLoadingPrev(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, [prevMonthUrl]);

  const card = "bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1),0_8px_0_rgba(203,213,225,0.7)] dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5),0_8px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 transition-all duration-500 overflow-hidden";

  if (loadingPrev) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Comparing historical data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-black text-xs uppercase tracking-widest transition-all border border-slate-200 dark:border-slate-700 shadow-sm"
        >
          <TrendingDown className="w-4 h-4 rotate-90" />
          Back to Student List
        </button>
        <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/50">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <p className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
            {prevMonthLabel} <span className="mx-2 text-slate-300">vs</span> {currentMonthLabel}
          </p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center text-center space-y-4 px-4 max-w-3xl mx-auto">
        <div className="p-4 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-200 dark:shadow-none animate-bounce-slow">
           <TrendingUp className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Journey of Progress
          </h2>
          <p className="text-lg font-medium text-slate-500 dark:text-slate-400 italic">
            "Small steps every day lead to big results over time. Keep pushing your limits!"
          </p>
        </div>
      </div>

      {Object.keys(teamWinners).length > 0 && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-5 duration-700 max-w-7xl mx-auto w-full px-4">
           <div className="flex flex-col items-center justify-center text-center mb-12 gap-4">
              <div className="inline-flex items-center gap-3 px-8 py-3 bg-yellow-500 text-white rounded-[2rem] text-sm font-black shadow-2xl shadow-yellow-200 dark:shadow-none hover:scale-105 transition-transform cursor-default border-4 border-yellow-400">
                 <Trophy className="w-6 h-6 fill-current animate-pulse text-yellow-100" />
                 <span className="uppercase tracking-[0.2em]">Monthly Team Winners</span>
                 <Star className="w-5 h-5 fill-current text-white" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-[0.3em] opacity-60">Top Performers of this month</p>
           </div>
           
           <div className="flex flex-wrap items-center justify-center gap-10">
              {Object.entries(teamWinners).map(([teamName, winner]) => (
                <div key={teamName} className="group relative w-full md:w-[calc(50%-2rem)] max-w-md perspective-1000">
                  {/* Decorative Background Glow */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-[3rem] blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
                  
                  <div className={`${card} relative h-full flex flex-col border-b-[12px] border-amber-400 dark:border-amber-600 hover:-translate-y-4 transition-all duration-500 ease-out shadow-[0_30px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)]`}>
                    
                    {/* Top Section with Large Badge */}
                    <div className="relative p-8 pb-0">
                      <div className="absolute top-6 right-6 w-20 h-20 bg-gradient-to-br from-yellow-300 via-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-500 z-10 border-4 border-white dark:border-slate-800">
                        <Trophy className="w-10 h-10 text-white drop-shadow-lg" />
                      </div>
                      
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-full border border-amber-100 dark:border-amber-800/50 mb-6">
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-black text-amber-700 dark:text-amber-400 uppercase tracking-[0.2em]">TEAM {teamName}</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Champion of the Month</p>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-slate-100 leading-tight truncate pr-16 bg-gradient-to-r from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">
                          {winner.name}
                        </h4>
                      </div>
                    </div>

                    <div className="p-8 space-y-8 flex-1">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="group/stat bg-slate-50 dark:bg-slate-900/50 p-5 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 hover:border-emerald-200 transition-colors text-center">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Proficiency</p>
                          <div className="flex items-center justify-center gap-2">
                             <div className="p-1.5 bg-emerald-500 rounded-lg shadow-lg shadow-emerald-200 dark:shadow-none">
                                <Award className="w-3 h-3 text-white" />
                             </div>
                             <span className="text-2xl font-black text-slate-800 dark:text-white">{winner.currLevel}</span>
                          </div>
                        </div>
                        <div className="group/stat bg-indigo-50/50 dark:bg-indigo-900/20 p-5 rounded-[2rem] border-2 border-indigo-100/50 dark:border-indigo-900/30 hover:border-indigo-300 transition-colors text-center">
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-2">Growth Score</p>
                          <div className="flex items-center justify-center gap-2">
                             <TrendingUp className="w-5 h-5 text-indigo-500" />
                             <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">+{winner.overallImprovement}</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills Section */}
                      {winner.skillImprovements?.length > 0 && (
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Skill Mastery</p>
                            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                          </div>
                          <div className="flex flex-wrap justify-center gap-2.5">
                            {winner.skillImprovements.map(skill => (
                              <div key={skill} className="relative group/skill">
                                <span className="absolute -inset-1 bg-indigo-500 rounded-xl blur-sm opacity-0 group-hover/skill:opacity-30 transition-opacity"></span>
                                <span className="relative px-5 py-2.5 bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 text-[11px] font-black rounded-xl border-2 border-indigo-50 dark:border-indigo-900 shadow-sm flex items-center gap-2 hover:scale-105 transition-transform duration-300">
                                  <Star className="w-3.5 h-3.5 fill-indigo-500 text-indigo-500" />
                                  {skill}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer Button-like visual */}
                    <div className="px-8 pb-8">
                       <div className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 dark:from-indigo-600 dark:to-indigo-500 text-white rounded-[2rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl flex items-center justify-center gap-3 group-hover:scale-[1.02] transition-transform">
                          Outstanding Performance
                          <div className="flex -space-x-1">
                             <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                             <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                             <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          </div>
                       </div>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { label: "Improved", data: improved, icon: TrendingUp, ...STATUS_COLORS.Improved },
          { label: "Steady", data: steady, icon: Minus, ...STATUS_COLORS.Steady },
          { label: "Declined", data: declined, icon: TrendingDown, ...STATUS_COLORS.Declined }
        ].map((item) => {
          const { label, data, bg, light, text, border } = item;
          const Icon = item.icon;
          return (
            <div key={label} className={`${card} border-b-[6px] ${border} group hover:-translate-y-2`}>
              <div className={`p-6 flex items-center justify-between ${light} border-b border-white/40 dark:border-black/20 text-indigo-600`}>
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
                    <div className="flex items-center gap-2">
                       {s.skillImprovements?.length > 0 && (
                          <div className="flex gap-1 mr-2">
                             {s.skillImprovements.map(skill => (
                               <span key={skill} className="w-5 h-5 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[9px] font-black rounded-md border border-indigo-200 dark:border-indigo-800 shadow-sm">
                                 {skill}
                               </span>
                             ))}
                          </div>
                       )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          );
        })}
      </div>

      <EnglishProgressCharts 
        currentStudents={currentStudents}
        currentMonthLabel={currentMonthLabel}
        prevMonthUrl={prevMonthUrl}
        prevMonthLabel={prevMonthLabel}
      />
    </div>
  );
};

export default ProgressAnalytics;
