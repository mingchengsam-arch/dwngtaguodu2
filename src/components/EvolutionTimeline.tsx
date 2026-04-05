import React, { useState, useMemo } from 'react';
import { ArrowLeft, Edit2, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useIsMobile } from '../hooks/useIsMobile';

interface Milestone {
  id: string;
  day: number;
  label: string;
  defaultGrowth: number;
  description: string;
}

const MILESTONES: Milestone[] = [
  { id: 'd1', day: 1, label: 'Day 1', defaultGrowth: 1, description: '微小的改变，是伟大的开始。' },
  { id: 'd7', day: 7, label: 'Day 7', defaultGrowth: 5, description: '习惯的种子已经种下，开始生根发芽。' },
  { id: 'd30', day: 30, label: 'Day 30', defaultGrowth: 20, description: '量变引起质变，你已经能感受到明显的不同。' },
  { id: 'd90', day: 90, label: 'Day 90', defaultGrowth: 50, description: '脱胎换骨。过去的你，已经无法想象现在的你。' },
  { id: 'd180', day: 180, label: 'Day 180', defaultGrowth: 100, description: '心智的重塑。你已经建立起坚不可摧的心理防线。' },
];

export default function EvolutionTimeline({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const [customGrowths, setCustomGrowths] = useState<Record<string, number>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const isMobile = useIsMobile();

  const handleEdit = (id: string, currentVal: number) => {
    setEditingId(id);
    setEditValue(currentVal.toString());
  };

  const handleSave = (id: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      setCustomGrowths(prev => ({ ...prev, [id]: val }));
    }
    setEditingId(null);
  };

  // Calculate Evolution Log Markers
  const markers = useMemo(() => {
    const stats = Object.entries(store.dailyStats)
      .filter(([_, stat]) => stat.papers > 0 || stat.litDots > 0)
      .sort((a, b) => a[0].localeCompare(b[0]));

    if (stats.length === 0) return [];

    const startDate = new Date(stats[0][0]);
    
    return stats.map(([dateStr, stat]) => {
      const currentDate = new Date(dateStr);
      const diffTime = Math.abs(currentDate.getTime() - startDate.getTime());
      const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // 1-based

      // Find which segment it belongs to
      let segmentIndex = 0;
      let progress = 0;

      for (let i = 0; i < MILESTONES.length - 1; i++) {
        if (dayIndex >= MILESTONES[i].day && dayIndex <= MILESTONES[i+1].day) {
          segmentIndex = i;
          progress = (dayIndex - MILESTONES[i].day) / (MILESTONES[i+1].day - MILESTONES[i].day);
          break;
        }
      }
      
      if (dayIndex > MILESTONES[MILESTONES.length - 1].day) {
        segmentIndex = MILESTONES.length - 1;
        progress = 1; // Cap at the end
      }

      return {
        dateStr,
        dayIndex,
        stat,
        segmentIndex,
        progress
      };
    });
  }, [store.dailyStats]);

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-16 pb-24' : 'p-8 pt-32 max-w-[1400px] mx-auto'} w-full h-full overflow-hidden`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center gap-6'} mb-12`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-4 rounded-full bg-white/60 hover:bg-white/80 text-[#6B635E] hover:text-[#3A3532] transition-colors shadow-sm border border-[#D5CEC4]"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest text-[#3A3532]`}>
            心理稳定器
          </h1>
        </div>
        <div>
          <p className="text-[#8C8279] mt-2 font-medium tracking-wider">
            长期演化时间线 —— 不要高估一天的努力，也不要低估一年的积累。
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto custom-scrollbar pb-8 relative flex items-center">
        {/* Horizontal Line Container */}
        <div className="absolute top-1/2 left-8 right-8 h-2 bg-[#D5CEC4] rounded-full -translate-y-1/2">
          {/* Render Markers */}
          {markers.map((marker, i) => {
            // Each node is 320px (w-80) + 48px (gap-12) = 368px apart.
            // The first node is at left: 0 relative to the flex container, but the line starts at left-8.
            // Let's just use percentage based on the segment.
            // Actually, since the container is flex with fixed gaps, the line length is dynamic.
            // It's easier to render markers inside the flex items.
            return null;
          })}
        </div>

        <div className="flex gap-12 px-8 min-w-max items-center h-full relative">
          {MILESTONES.map((milestone, index) => {
            const growth = customGrowths[milestone.id] ?? milestone.defaultGrowth;
            const isEditing = editingId === milestone.id;

            // Find markers for this segment
            const segmentMarkers = markers.filter(m => m.segmentIndex === index);

            return (
              <div key={milestone.id} className="relative flex flex-col items-center gap-6 group w-80">
                {/* Node */}
                <div className="relative z-10 flex-shrink-0 flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#F5F2EB] border-4 border-[#3A3532] shadow-sm mb-3 group-hover:scale-110 transition-transform" />
                  <span className="text-xl font-bold text-[#3A3532] font-mono bg-[#F5F2EB] px-2">{milestone.label}</span>
                </div>

                {/* Markers for this segment */}
                {index < MILESTONES.length - 1 && segmentMarkers.map((marker, i) => {
                  // Calculate position between this node and the next node
                  // The distance to the next node is 320px (width) + 48px (gap) = 368px
                  // We position it absolutely relative to this node's center.
                  const leftOffset = 160 + (368 * marker.progress); // 160 is half of 320
                  return (
                    <div 
                      key={marker.dateStr}
                      className="absolute top-[50%] -translate-y-[50%] z-20 group/marker cursor-pointer"
                      style={{ left: `${leftOffset}px` }}
                    >
                      <div className="w-4 h-4 rounded-full bg-[#D2A03C] border-2 border-[#F5F2EB] shadow-md hover:scale-150 transition-transform" />
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/marker:opacity-100 transition-opacity bg-[#3A3532] text-[#F5F2EB] text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none z-30">
                        <div className="font-bold mb-1">Day {marker.dayIndex} ({marker.dateStr})</div>
                        <div>刷卷: +{marker.stat.papers}</div>
                        <div>点亮: +{marker.stat.litDots}</div>
                      </div>
                    </div>
                  );
                })}

                {/* Content Card */}
                <div className="w-full bg-white/80 border border-[#D5CEC4] rounded-3xl p-6 shadow-sm transition-all hover:bg-white hover:shadow-md hover:-translate-y-2">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-baseline gap-3">
                      <span className="text-sm font-bold text-[#8C8279] tracking-wider">预期成长率</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="w-20 bg-transparent border-b-2 border-[#3A3532] text-2xl font-bold text-[#D2A03C] focus:outline-none text-center font-mono"
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSave(milestone.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                          />
                          <span className="text-2xl font-bold text-[#D2A03C]">%</span>
                          <button onClick={() => handleSave(milestone.id)} className="p-1 text-[#3CA050] hover:bg-[#3CA050]/10 rounded-full transition-colors">
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => handleEdit(milestone.id, growth)}>
                          <span className="text-3xl font-bold text-[#D2A03C] font-mono">+{growth}%</span>
                          <button className="p-1.5 text-[#8C8279] opacity-0 group-hover/edit:opacity-100 hover:bg-[#EAE6DF] rounded-full transition-all">
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-lg text-[#3A3532] font-medium leading-relaxed">
                    {milestone.description}
                  </p>
                  
                  {/* Visual Progress Bar */}
                  <div className="mt-6 h-2 bg-[#EAE6DF] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#D2A03C] rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${Math.min(100, (growth / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
