import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#6366f1', '#ec4899', '#14b8a6', '#f59e0b', '#8b5cf6', '#3b82f6', '#ef4444', '#10b981', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white px-5 py-4 rounded-2xl shadow-[0_10px_25px_rgba(0,0,0,0.5)] border-t border-l border-white/20 transition-colors z-[100]">
        <p className="text-[13px] font-black opacity-80 mb-2 uppercase tracking-widest leading-tight max-w-[200px] break-words">{label}</p>
        <p className="font-extrabold text-2xl flex items-center gap-3 drop-shadow-lg">
          <span className="w-4 h-4 rounded-full shadow-inner border-[3px] border-white/40 flex-shrink-0" style={{ backgroundColor: payload[0].payload.fill || payload[0].color }}></span>
          {payload[0].value} Students
        </p>
      </div>
    );
  }
  return null;
};

const DashboardCharts = ({ students, isEnglishData, isPlacementData = false }) => {
  if (isEnglishData) {
    // English Data: Aggregate by Overall Level
    const levelCounts = students.reduce((acc, student) => {
      const level = student['Over All Level'] || 'NA';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
    
    const levelData = Object.keys(levelCounts).map(level => ({
      name: level,
      Students: levelCounts[level]
    })).sort((a, b) => a.name.localeCompare(b.name));

    // English Data: Aggregate by Mentor
    const mentorCounts = students.reduce((acc, student) => {
      const mentor = student.Mentor || 'Unassigned';
      acc[mentor] = (acc[mentor] || 0) + 1;
      return acc;
    }, {});

    const mentorData = Object.keys(mentorCounts).map(mentor => ({
      name: mentor,
      value: mentorCounts[mentor]
    })).sort((a,b) => b.value - a.value);

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm tracking-tight">Level Distribution</h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-bold mt-1">Number of students by CEFR Level</p>
          </div>
          <div className="h-80 relative">
            <div className="absolute inset-0 bg-blue-100/20 dark:bg-blue-900/10 rounded-2xl -z-10"></div>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={levelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{fontSize: 14, fill: '#64748b', fontWeight: 800}} axisLine={{strokeWidth: 2, stroke: '#e2e8f0'}} tickLine={false} dy={10} />
                <YAxis allowDecimals={false} tick={{fontSize: 14, fill: '#64748b', fontWeight: 800}} axisLine={false} tickLine={false} dx={-10} />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(59, 130, 246, 0.1)', radius: 12}} />
                <Bar dataKey="Students" fill="url(#colorUv)" radius={[12, 12, 12, 12]} barSize={50}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={1}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={1}/>
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="mb-8">
            <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm tracking-tight">Mentor Load</h3>
            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-bold mt-1">Students assigned per mentor</p>
          </div>
          <div className="h-80 relative">
            <div className="absolute inset-0 bg-purple-100/20 dark:bg-purple-900/10 rounded-2xl -z-10"></div>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  {COLORS.map((color, index) => (
                    <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={1}/>
                      <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2}/>
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  data={mentorData}
                  cx="50%"
                  cy="45%"
                  innerRadius={85}
                  outerRadius={120}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {mentorData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index})`} style={{ filter: 'drop-shadow(0px 8px 10px rgba(0,0,0,0.2))' }}/>
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  verticalAlign="bottom" 
                  height={80} 
                  iconType="circle"
                  layout="horizontal"
                  align="center"
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    fontWeight: 700, 
                    color: '#64748b', 
                    paddingTop: '20px',
                    width: '100%',
                    left: 0
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  }

  // Normal Data: Aggregate data by month
  const monthCounts = students.reduce((acc, student) => {
    const month = student['Joining Month'] || 'Unknown';
    acc[month] = (acc[month] || 0) + 1;
    return acc;
  }, {});

  const monthlyData = Object.keys(monthCounts).map(month => ({
    name: month,
    Students: monthCounts[month]
  }));

  // Aggregate by Status
  const statusCounts = students.reduce((acc, student) => {
    let status = student['Current Status'] || 'Unknown';
    if (isPlacementData) {
      // For placement, check if it looks like a long detail string (contains house, company info etc)
      if (status.length > 30 || status.includes(':') || status.includes('\n')) {
        status = 'In Conversation/Pending';
      }
    }
    status = status.trim();
    if (status === '' || status.toLowerCase() === 'nan') status = 'Unknown';
    
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  let statusData = Object.keys(statusCounts).map(status => ({
    name: status,
    value: statusCounts[status]
  })).sort((a,b) => b.value - a.value);

  // Grouping logic for clean UI
  if (statusData.length > 6) {
    const topN = 5;
    const top = statusData.slice(0, topN);
    const othersValue = statusData.slice(topN).reduce((sum, item) => sum + item.value, 0);
    statusData = [...top, { name: 'Others', value: othersValue }];
  }

  // Aggregate by education/field for the first chart if it's placement data
  let mainChartData = monthlyData;
  let mainChartTitle = "Enrollment Trends";
  let mainChartSub = "Number of students joining per month";

  if (isPlacementData) {
    const fieldCounts = students.reduce((acc, s) => {
      const field = s['Job Field'] || s['Education'] || 'General';
      acc[field] = (acc[field] || 0) + 1;
      return acc;
    }, {});
    mainChartData = Object.keys(fieldCounts)
      .map(k => ({ name: k, Students: fieldCounts[k] }))
      .sort((a,b) => b.Students - a.Students)
      .slice(0, 8);
    mainChartTitle = "Job Fields";
    mainChartSub = "Distribution of placements by field";
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
      <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm tracking-tight">{mainChartTitle}</h3>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 font-bold mt-1">{mainChartSub}</p>
        </div>
        <div className="h-80 relative">
          <div className="absolute inset-0 bg-blue-100/20 dark:bg-blue-900/10 rounded-2xl -z-10"></div>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mainChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b', fontWeight: 800}} axisLine={{strokeWidth: 2, stroke: '#e2e8f0'}} tickLine={false} dy={10} />
              <YAxis allowDecimals={false} tick={{fontSize: 14, fill: '#64748b', fontWeight: 800}} axisLine={false} tickLine={false} dx={-10} />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(59, 130, 246, 0.1)', radius: 12}} />
              <Bar dataKey="Students" fill="url(#colorUv)" radius={[12, 12, 12, 12]} barSize={40}>
                <defs>
                  <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={1}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={1}/>
                  </linearGradient>
                </defs>
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      <div className="bg-white/70 dark:bg-slate-800/80 backdrop-blur-2xl p-8 rounded-[2rem] shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1),0_6px_0_rgba(203,213,225,0.7)] dark:shadow-[0_15px_40px_-15px_rgba(0,0,0,0.5),0_6px_0_rgba(30,41,59,0.7)] border-t-2 border-l-2 border-white/80 dark:border-slate-700/50 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
        <div className="mb-8">
          <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 drop-shadow-sm tracking-tight">{isPlacementData ? "Placement Status" : "Status Distribution"}</h3>
          <p className="text-[15px] text-slate-500 dark:text-slate-400 font-bold mt-1">{isPlacementData ? "Overview of hiring progress" : "Current state of enrollments"}</p>
        </div>
        <div className="h-[450px] relative">
          <div className="absolute inset-0 bg-purple-100/20 dark:bg-purple-900/10 rounded-2xl -z-10"></div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                {COLORS.map((color, index) => (
                  <linearGradient key={`grad-${index}`} id={`pieGrad-${index}`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={1}/>
                    <stop offset="100%" stopColor="#ffffff" stopOpacity={0.2}/>
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={statusData}
                cx="50%"
                cy="40%"
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#pieGrad-${index % COLORS.length})`} style={{ filter: 'drop-shadow(0px 8px 10px rgba(0,0,0,0.2))' }}/>
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="bottom" 
                height={150} 
                iconType="circle"
                layout="horizontal"
                align="center"
                wrapperStyle={{ 
                  fontSize: '11px', 
                  fontWeight: 800, 
                  color: '#64748b', 
                  paddingTop: '20px',
                  width: '100%',
                  left: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
