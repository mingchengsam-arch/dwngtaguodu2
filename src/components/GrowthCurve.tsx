import React, { useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useStore } from '../store';
import { useIsMobile } from '../hooks/useIsMobile';

export default function GrowthCurve({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const isMobile = useIsMobile();

  const chartData = useMemo(() => {
    const data = [];
    const today = new Date();
    let cumulativeScore = 0;

    // Calculate a base score from current state?
    // Actually, let's just accumulate from 30 days ago.
    // If we want it to be accurate, we'd need the total score at each day.
    // Since we only have deltas, let's just show the cumulative growth over the last 30 days.
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const stat = store.dailyStats[dateStr] || { papers: 0, litDots: 0 };
      
      // Score calculation: 1 paper = 2 points, 1 lit dot = 5 points
      const dailyScore = (stat.papers * 2) + (stat.litDots * 5);
      cumulativeScore += dailyScore;

      // Ghost Run (Ideal Line): Let's say ideal is 10 points per day
      const idealScore = (30 - i) * 10;

      data.push({
        day: `${d.getMonth() + 1}/${d.getDate()}`,
        实际进度: cumulativeScore,
        幽灵残影: idealScore, // Ghost Run
      });
    }
    return data;
  }, [store.dailyStats]);

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-16 pb-24' : 'p-8 pt-12 max-w-6xl mx-auto'} w-full h-full overflow-hidden relative z-10`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center gap-6'} mb-8`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-full hover:bg-black/5 text-[#6B635E] hover:text-[#3A3532] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest text-[#3A3532] flex items-center gap-4 flex-wrap`}>
            成长曲线
            <span className="text-sm font-mono bg-[#3A3532] text-[#F5F2EB] px-3 py-1 rounded-full">GHOST RUN 模式</span>
          </h1>
        </div>
        <div>
          <p className="text-[#8C8279] mt-2 font-medium tracking-wider">
            与理想中的自己赛跑，超越残影
          </p>
        </div>
      </div>

      <div className={`flex-1 bg-white/60 border border-[#D5CEC4] rounded-3xl ${isMobile ? 'p-4' : 'p-8'} shadow-sm flex flex-col`}>
        <div className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D2A03C" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#D2A03C" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGhost" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8C8279" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#8C8279" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#EAE6DF" vertical={false} />
              <XAxis 
                dataKey="day" 
                stroke="#8C8279" 
                tick={{ fill: '#8C8279', fontSize: 12, fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="#8C8279" 
                tick={{ fill: '#8C8279', fontSize: 12, fontWeight: 'bold' }}
                tickLine={false}
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#F5F2EB', 
                  borderRadius: '12px', 
                  border: '1px solid #D5CEC4',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                }}
                itemStyle={{ fontWeight: 'bold' }}
                labelStyle={{ color: '#8C8279', marginBottom: '4px', fontWeight: 'bold' }}
              />
              
              {/* Ghost Run (Ideal) */}
              <Area 
                type="monotone" 
                dataKey="幽灵残影" 
                stroke="#8C8279" 
                strokeWidth={2}
                strokeDasharray="5 5"
                fillOpacity={1} 
                fill="url(#colorGhost)" 
                activeDot={false}
              />

              {/* Actual Progress */}
              <Area 
                type="monotone" 
                dataKey="实际进度" 
                stroke="#D2A03C" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorActual)" 
                activeDot={{ r: 6, fill: '#3A3532', stroke: '#F5F2EB', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
