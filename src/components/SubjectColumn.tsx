import React, { useState } from 'react';
import { Settings, Plus, Minus } from 'lucide-react';
import { Subject, useStore, LearningStatus } from '../store';
import { getScoreColor } from '../lib/colorUtils';
import { cn } from '../lib/utils';

const STATUSES: LearningStatus[] = ['none', 'course', 'practice', 'perfect'];
const STATUS_LABELS = {
  none: '无',
  course: '网课',
  practice: '刷题',
  perfect: '圆满'
};
const STATUS_COLORS = {
  none: 'bg-[#EAE6DF] text-[#8C8279]',
  course: 'bg-blue-100 text-blue-600',
  practice: 'bg-orange-100 text-orange-600',
  perfect: 'bg-[#10B981] text-white' // Green for perfect
};

export default function SubjectColumn({ subject, isPast, onClick }: { key?: React.Key; subject: Subject; isPast: boolean; onClick: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const updateSubject = useStore(state => state.updateSubject);

  const color = getScoreColor(subject.score, subject.maxScore);
  const percentage = (subject.score / subject.maxScore) * 100;

  // Calculate exploration rate based on small modules
  let totalSmallModules = 0;
  let exploredSmallModules = 0;
  subject.bigModules.forEach(bm => {
    totalSmallModules += bm.smallModules.length;
    exploredSmallModules += bm.smallModules.filter(sm => sm.status !== '毫无了解').length;
  });
  const explorationRate = totalSmallModules > 0 ? Math.round((exploredSmallModules / totalSmallModules) * 100) : 0;

  const handleScoreChange = (delta: number) => {
    const newScore = Math.max(0, Math.min(subject.maxScore, subject.score + delta));
    updateSubject(isPast, subject.id, { score: newScore });
  };

  const handlePapersChange = (delta: number) => {
    const newPapers = Math.max(0, subject.papers + delta);
    updateSubject(isPast, subject.id, { papers: newPapers });
  };

  const currentStatus = subject.learningStatus || 'none';
  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIndex = STATUSES.indexOf(currentStatus);
    const nextStatus = STATUSES[(currentIndex + 1) % STATUSES.length];
    updateSubject(isPast, subject.id, { learningStatus: nextStatus });
  };

  return (
    <div 
      className="relative flex flex-col bg-white/60 border border-[#D5CEC4] rounded-3xl overflow-hidden group hover:bg-white/80 transition-all cursor-pointer shadow-sm hover:shadow-md h-full"
      onClick={(e) => {
        if (!isEditing) onClick();
      }}
    >
      {/* Top Color Bar */}
      <div className="h-3 w-full transition-colors duration-500" style={{ backgroundColor: color }} />

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-8">
          <h2 className="text-2xl font-bold tracking-widest text-[#3A3532]">{subject.name}</h2>
          <button 
            onClick={handleStatusClick}
            className={cn(
              "w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold tracking-widest transition-colors shadow-sm",
              STATUS_COLORS[currentStatus]
            )}
            title="点击切换学习状态"
          >
            {STATUS_LABELS[currentStatus]}
          </button>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center gap-8">
          {/* Score Circle */}
          <div className="relative w-32 h-32 rounded-full flex flex-col items-center justify-center border-[6px] transition-colors duration-500 bg-white/50 shadow-inner" style={{ borderColor: color, color: color }}>
            <span className="text-4xl font-mono font-bold">{subject.score}</span>
            <span className="text-sm text-[#8C8279] font-bold absolute bottom-3">/ {subject.maxScore}</span>
            
            {isEditing && (
              <div className="absolute -right-10 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleScoreChange(1); }} className="p-1.5 bg-[#EAE6DF] rounded-full hover:bg-[#D5CEC4] text-[#3A3532] shadow-sm"><Plus className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); handleScoreChange(-1); }} className="p-1.5 bg-[#EAE6DF] rounded-full hover:bg-[#D5CEC4] text-[#3A3532] shadow-sm"><Minus className="w-4 h-4"/></button>
              </div>
            )}
          </div>

          {/* Papers */}
          <div className="text-center relative">
            <div className="text-sm text-[#8C8279] font-bold mb-1 tracking-widest">刷卷数</div>
            <div className="text-3xl font-mono font-bold text-[#3A3532]">{subject.papers}</div>
            
            {isEditing && (
              <div className="absolute -right-10 top-4 flex flex-col gap-2">
                <button onClick={(e) => { e.stopPropagation(); handlePapersChange(1); }} className="p-1.5 bg-[#EAE6DF] rounded-full hover:bg-[#D5CEC4] text-[#3A3532] shadow-sm"><Plus className="w-4 h-4"/></button>
                <button onClick={(e) => { e.stopPropagation(); handlePapersChange(-1); }} className="p-1.5 bg-[#EAE6DF] rounded-full hover:bg-[#D5CEC4] text-[#3A3532] shadow-sm"><Minus className="w-4 h-4"/></button>
              </div>
            )}
          </div>
        </div>

        {/* Exploration Rate & Settings */}
        <div className="mt-8">
          <div className="flex justify-between items-center text-sm font-bold text-[#8C8279] mb-2">
            <div className="flex items-center gap-2">
              <span>探索率</span>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsEditing(!isEditing);
                }}
                className="p-1.5 rounded-full text-[#8C8279] hover:text-[#3A3532] hover:bg-[#EAE6DF] transition-colors opacity-0 group-hover:opacity-100"
                title="设置分数与刷卷数"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            <span>{explorationRate}%</span>
          </div>
          <div className="h-2 w-full bg-[#EAE6DF] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-1000 ease-out"
              style={{ width: `${explorationRate}%`, backgroundColor: color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
