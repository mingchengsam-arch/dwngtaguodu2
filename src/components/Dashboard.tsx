import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import SubjectColumn from './SubjectColumn';
import { Trophy, BookOpen, Target, Zap, Clock, Settings } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

function DeadlineWall() {
  const store = useStore();
  const { gaokao, grade11, nextExam, nextExamName } = store.deadlines;
  const [now, setNow] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ gaokao, grade11, nextExam, nextExamName });

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const calculateDiff = (targetDate: string, exact: boolean = false) => {
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diffMs = target.getTime() - now.getTime();
    if (diffMs <= 0) return exact ? "00:00:00:00" : "0";
    
    if (exact) {
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    } else {
      return Math.ceil(diffMs / (1000 * 60 * 60 * 24)).toString();
    }
  };

  const handleSave = () => {
    store.updateDeadlines(editData);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-[#2C2A29] rounded-3xl p-6 border border-[#1A1818] shadow-lg flex flex-col gap-4 text-[#F5F2EB]">
        <h3 className="text-lg font-bold tracking-widest text-[#8C8279]">设置倒计时</h3>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#8C8279]">高考日期</label>
          <input type="date" value={editData.gaokao} onChange={e => setEditData({...editData, gaokao: e.target.value})} className="bg-transparent border-b border-[#8C8279] text-white focus:outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#8C8279]">高二结束日期</label>
          <input type="date" value={editData.grade11} onChange={e => setEditData({...editData, grade11: e.target.value})} className="bg-transparent border-b border-[#8C8279] text-white focus:outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#8C8279]">下次大考名称</label>
          <input type="text" value={editData.nextExamName} onChange={e => setEditData({...editData, nextExamName: e.target.value})} className="bg-transparent border-b border-[#8C8279] text-white focus:outline-none" />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm text-[#8C8279]">下次大考日期</label>
          <input type="date" value={editData.nextExam} onChange={e => setEditData({...editData, nextExam: e.target.value})} className="bg-transparent border-b border-[#8C8279] text-white focus:outline-none" />
        </div>
        <button onClick={handleSave} className="mt-2 bg-[#D2A03C] text-white font-bold py-2 rounded-xl">保存</button>
      </div>
    );
  }

  return (
    <div className="bg-[#2C2A29] rounded-3xl p-6 border border-[#1A1818] shadow-lg flex flex-col gap-6 relative group">
      <button onClick={() => setIsEditing(true)} className="absolute top-4 right-4 text-[#8C8279] hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
        <Settings className="w-4 h-4" />
      </button>
      <div className="flex items-center gap-2 text-[#8C8279] font-bold tracking-widest">
        <Clock className="w-5 h-5" />
        绝境倒计时
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="text-xs text-[#8C8279] tracking-widest">距离高考</div>
        <div className="text-3xl font-mono font-bold text-[#F5F2EB] tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
          {calculateDiff(gaokao, true)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <div className="text-xs text-[#8C8279] tracking-widest">高二结束</div>
          <div className="text-2xl font-mono font-bold text-[#D2A03C]">
            {calculateDiff(grade11)} <span className="text-sm text-[#8C8279]">天</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="text-xs text-[#8C8279] tracking-widest">{nextExamName}</div>
          <div className="text-2xl font-mono font-bold text-[#D2A03C]">
            {calculateDiff(nextExam)} <span className="text-sm text-[#8C8279]">天</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ isPast, onNavigate }: { isPast: boolean; onNavigate: (id: string) => void }) {
  const store = useStore();
  const isMobile = useIsMobile();
  const subjects = isPast ? store.pastSubjects : store.currentSubjects;

  let totalScore = 0;
  let totalMaxScore = 0;
  let totalPapers = 0;
  let masteredModules = 0;
  let totalModules = 0;

  Object.values(subjects).forEach(sub => {
    totalScore += sub.score;
    totalMaxScore += sub.maxScore;
    totalPapers += sub.papers;
    sub.bigModules.forEach(bm => {
      bm.smallModules.forEach(sm => {
        totalModules++;
        if (sm.status === '基本掌握') masteredModules++;
      });
    });
  });

  const progressPercentage = totalMaxScore > 0 ? ((totalScore / totalMaxScore) * 100).toFixed(1) : '0.0';
  const masteryRate = totalModules > 0 ? ((masteredModules / totalModules) * 100).toFixed(1) : '0.0';

  // Calculate daily growth based on dailyStats
  const today = new Date().toISOString().split('T')[0];
  const todayStat = store.dailyStats[today];
  const hasGrowth = todayStat && (todayStat.papers > 0 || todayStat.litDots > 0);

  return (
    <div className={`flex-1 flex ${isMobile ? 'flex-col p-4 pt-20 overflow-y-auto' : 'p-8 pt-32 max-w-[1600px] mx-auto w-full gap-8 h-full overflow-hidden'}`}>
      
      {/* Left Panel: Total Evolution Progress & Deadline Wall */}
      <div className={`${isMobile ? 'w-full mb-6' : 'w-80 flex-shrink-0 h-full overflow-y-auto custom-scrollbar pb-8'} flex flex-col gap-6`}>
        <div className="mb-2">
          <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest text-[#3A3532] mb-2`}>
            {isPast ? '过往沉淀' : '当下征途'}
          </h1>
          <p className={`${isMobile ? 'text-base' : 'text-lg'} text-[#8C8279] tracking-wider font-medium`}>
            {isPast ? '初中至高二上学期' : '高二下学期'}
          </p>
        </div>

        <div className="bg-white/80 rounded-3xl p-6 border border-[#D5CEC4] shadow-sm flex flex-col gap-6">
          <div>
            <div className="text-[#8C8279] font-bold tracking-wider mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              总进化进度
            </div>
            <div className="text-5xl font-mono font-bold text-[#D2A03C]">
              {progressPercentage}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-sm text-[#8C8279] font-bold mb-1 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> 刷卷总数
              </div>
              <div className="text-2xl font-mono font-bold text-[#3A3532]">{totalPapers}</div>
            </div>
            <div>
              <div className="text-sm text-[#8C8279] font-bold mb-1 flex items-center gap-1">
                <Target className="w-4 h-4" /> 掌握模块
              </div>
              <div className="text-2xl font-mono font-bold text-[#3A3532]">{masteredModules}/{totalModules}</div>
            </div>
            <div>
              <div className="text-sm text-[#8C8279] font-bold mb-1 flex items-center gap-1">
                <Zap className="w-4 h-4" /> 掌握率
              </div>
              <div className="text-2xl font-mono font-bold text-[#3A3532]">{masteryRate}%</div>
            </div>
            <div>
              <div className="text-sm text-[#8C8279] font-bold mb-1 flex items-center gap-1">
                <span className="font-serif">A</span> 词汇积累
              </div>
              <div className="text-2xl font-mono font-bold text-[#3A3532]">{store.englishWords}</div>
            </div>
          </div>

          <div className="pt-6 border-t border-[#EAE6DF]">
            {hasGrowth ? (
              <div className="text-sm text-[#3CA050] font-bold mb-1">📈 今日成长：已记录</div>
            ) : (
              <div className="text-sm text-[#8C8279] font-bold mb-1">📈 今日成长：等待输入</div>
            )}
            <div className="text-sm text-[#8C8279] font-bold">📊 当前状态：{hasGrowth ? '稳定上升' : '保持平稳'}</div>
          </div>
        </div>

        <DeadlineWall />
      </div>

      {/* Right Panel: Subjects Grid */}
      <div className={`${isMobile ? 'w-full pb-24' : 'flex-1 h-full pb-8'}`}>
        <div className={`grid ${isMobile ? 'grid-cols-1 sm:grid-cols-2 gap-4' : 'grid-cols-3 grid-rows-2 gap-6 h-full'}`}>
          {Object.values(subjects).map(subject => (
            <div key={subject.id} className={`${isMobile ? 'h-64' : 'h-full'}`}>
              <SubjectColumn 
                subject={subject} 
                isPast={isPast}
                onClick={() => onNavigate(subject.id)}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
