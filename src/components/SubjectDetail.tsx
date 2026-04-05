import React, { useState } from 'react';
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Trash2, Link, Link2Off, BookOpen, CloudFog, Ghost, X, Palette } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore, BigModule, SmallModule, Status, Proficiency, ColorMode } from '../store';
import { cn } from '../lib/utils';
import { getScoreColor } from '../lib/colorUtils';
import { useIsMobile } from '../hooks/useIsMobile';

const STATUSES: Status[] = ['毫无了解', '看完课程', '基本掌握'];
const PROFICIENCIES: Proficiency[] = ['差劲', '一般', '还行', '不错', '登峰'];

function getAutoColorDepth(sm: SmallModule): number {
  if (sm.status === '毫无了解') return 0;
  if (sm.status === '看完课程') return 30;
  if (sm.status === '基本掌握') {
    switch (sm.proficiency) {
      case '差劲': return 40;
      case '一般': return 60;
      case '还行': return 75;
      case '不错': return 90;
      case '登峰': return 100;
      default: return 60;
    }
  }
  return 0;
}

function getBgColor(depth: number | undefined, mode: ColorMode | undefined) {
  if (!mode || mode === 'off') return undefined;
  const d = depth || 0;
  if (d === 0 && mode === 'auto') return undefined;
  return `rgba(34, 197, 94, ${d / 100 * 0.4})`; // Max 40% opacity green
}

export default function SubjectDetail({ isPast, subjectId, onBack }: { isPast: boolean; subjectId: string; onBack: () => void }) {
  const store = useStore();
  const subject = isPast ? store.pastSubjects[subjectId] : store.currentSubjects[subjectId];
  const isMobile = useIsMobile();

  const [newBigModuleName, setNewBigModuleName] = useState('');
  const [isAddingBigModule, setIsAddingBigModule] = useState(false);
  const [isFogEnabled, setIsFogEnabled] = useState(false);
  const [showGraveyard, setShowGraveyard] = useState(false);
  const [newGraveyardTitle, setNewGraveyardTitle] = useState('');

  if (!subject) return null;

  const color = getScoreColor(subject.score, subject.maxScore);

  const handleAddBigModule = () => {
    if (newBigModuleName.trim()) {
      store.addBigModule(isPast, subjectId, newBigModuleName.trim());
      setNewBigModuleName('');
      setIsAddingBigModule(false);
    }
  };

  const handleAddGraveyardEntry = () => {
    if (newGraveyardTitle.trim()) {
      store.addGraveyardEntry({
        subjectId,
        bigModuleName: '',
        smallModuleName: '',
        content: '',
        title: newGraveyardTitle.trim(),
      });
      setNewGraveyardTitle('');
    }
  };

  const graveyardEntries = store.graveyard.filter(g => g.subjectId === subjectId);

  // Calculate Fog
  let foundUnmastered = false;
  const bigModulesWithFog = subject.bigModules.map(bm => {
    const smallModules = bm.smallModules.map(sm => {
      const fogged = isFogEnabled && foundUnmastered;
      if (sm.status !== '基本掌握') {
        foundUnmastered = true;
      }
      return { ...sm, isFogged: fogged };
    });
    return { ...bm, smallModules };
  });

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-16 pb-24' : 'p-8 pt-12 max-w-5xl mx-auto'} w-full h-full overflow-hidden relative`}>
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'} mb-8`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-3 rounded-full hover:bg-black/5 text-[#6B635E] hover:text-[#3A3532] transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest`} style={{ color }}>
              {subject.name}
            </h1>
            <div className={`text-sm text-[#8C8279] mt-2 flex ${isMobile ? 'gap-3 flex-wrap' : 'gap-6'} font-medium`}>
              <span>分数: {subject.score}/{subject.maxScore}</span>
              <span>刷卷数: {subject.papers}</span>
              <span>板块数: {subject.bigModules.length}</span>
            </div>
          </div>
        </div>

        <div className={`flex ${isMobile ? 'flex-wrap' : 'items-center'} gap-4`}>
          <div className="flex items-center bg-white/50 rounded-full border border-[#D5CEC4] p-1 shadow-sm">
            <button
              onClick={() => store.updateSubject(isPast, subjectId, { colorMode: 'off' })}
              className={cn("px-3 py-1.5 rounded-full text-sm font-bold transition-colors", (!subject.colorMode || subject.colorMode === 'off') ? "bg-[#3A3532] text-[#F5F2EB]" : "text-[#8C8279] hover:text-[#3A3532]")}
            >无色</button>
            <button
              onClick={() => store.updateSubject(isPast, subjectId, { colorMode: 'auto' })}
              className={cn("px-3 py-1.5 rounded-full text-sm font-bold transition-colors", subject.colorMode === 'auto' ? "bg-[#3A3532] text-[#F5F2EB]" : "text-[#8C8279] hover:text-[#3A3532]")}
            >自动深浅</button>
            <button
              onClick={() => store.updateSubject(isPast, subjectId, { colorMode: 'manual' })}
              className={cn("px-3 py-1.5 rounded-full text-sm font-bold transition-colors", subject.colorMode === 'manual' ? "bg-[#3A3532] text-[#F5F2EB]" : "text-[#8C8279] hover:text-[#3A3532]")}
            >手动深浅</button>
          </div>

          <button
            onClick={() => setIsFogEnabled(!isFogEnabled)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-bold tracking-wider shadow-sm",
              isFogEnabled 
                ? "bg-[#3A3532] text-[#F5F2EB] border-[#3A3532]" 
                : "bg-white/50 text-[#6B635E] border-[#D5CEC4] hover:bg-white"
            )}
          >
            <CloudFog className="w-5 h-5" />
            战争迷雾
          </button>

          <button
            onClick={() => setShowGraveyard(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 text-[#6B635E] border border-[#D5CEC4] hover:bg-white transition-all font-bold tracking-wider shadow-sm"
          >
            <Ghost className="w-5 h-5" />
            错题墓地
          </button>

          {/* English Special Feature */}
          {subjectId === 'english' && (
            <div className="flex items-center gap-4 bg-white/50 px-6 py-3 rounded-full border border-[#D5CEC4] shadow-sm ml-4">
              <div className="flex items-center gap-2 text-[#6B635E]">
                <BookOpen className="w-5 h-5" />
                <span className="font-bold tracking-wider">单词积累</span>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => store.updateEnglishWords(-10)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EAE6DF] hover:bg-[#D5CEC4] text-[#3A3532] transition-colors font-bold"
                >-10</button>
                <span className="text-2xl font-mono font-bold text-[#3A3532] w-16 text-center">{store.englishWords}</span>
                <button 
                  onClick={() => store.updateEnglishWords(10)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-[#EAE6DF] hover:bg-[#D5CEC4] text-[#3A3532] transition-colors font-bold"
                >+10</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pr-4 space-y-6 custom-scrollbar">
        {bigModulesWithFog.map(bm => (
          <BigModuleCard key={bm.id} bigModule={bm} subjectId={subjectId} isPast={isPast} colorMode={subject.colorMode} />
        ))}

        {/* Add Big Module */}
        {isAddingBigModule ? (
          <div className="bg-white/60 border border-[#D5CEC4] rounded-2xl p-6 shadow-sm">
            <input 
              type="text"
              value={newBigModuleName}
              onChange={(e) => setNewBigModuleName(e.target.value)}
              placeholder="输入大板块名称 (如: 数列)"
              className="bg-transparent border-b-2 border-[#D5CEC4] px-2 py-2 text-[#3A3532] w-full focus:outline-none focus:border-[#8C8279] text-lg font-medium placeholder:text-[#B5ACA3]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddBigModule();
                if (e.key === 'Escape') setIsAddingBigModule(false);
              }}
            />
            <div className="flex gap-3 mt-6">
              <button onClick={handleAddBigModule} className="px-6 py-2 bg-[#3A3532] hover:bg-[#2C2A29] rounded-full text-sm text-[#F5F2EB] transition-colors font-bold">确定</button>
              <button onClick={() => setIsAddingBigModule(false)} className="px-6 py-2 hover:bg-[#EAE6DF] rounded-full text-sm text-[#6B635E] transition-colors font-bold">取消</button>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingBigModule(true)}
            className="flex items-center justify-center gap-2 w-full py-6 border-2 border-dashed border-[#D5CEC4] rounded-2xl text-[#8C8279] hover:text-[#3A3532] hover:border-[#8C8279] hover:bg-white/30 transition-all font-bold tracking-wider"
          >
            <Plus className="w-6 h-6" />
            <span>添加大板块</span>
          </button>
        )}
      </div>

      {/* Graveyard Modal */}
      <AnimatePresence>
        {showGraveyard && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#F5F2EB]/90 backdrop-blur-sm flex flex-col p-12"
          >
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl font-bold tracking-widest text-[#3A3532] flex items-center gap-4">
                <Ghost className="w-10 h-10" />
                错题墓地
              </h2>
              <button onClick={() => setShowGraveyard(false)} className="p-4 rounded-full bg-white hover:bg-[#EAE6DF] shadow-sm border border-[#D5CEC4] transition-colors">
                <X className="w-6 h-6 text-[#3A3532]" />
              </button>
            </div>

            <div className="flex gap-4 mb-12">
              <input 
                type="text"
                value={newGraveyardTitle}
                onChange={(e) => setNewGraveyardTitle(e.target.value)}
                placeholder="刻下被你击败的难题名字..."
                className="flex-1 bg-white border-2 border-[#D5CEC4] rounded-2xl px-6 py-4 text-xl font-bold text-[#3A3532] focus:outline-none focus:border-[#8C8279] placeholder:text-[#B5ACA3] shadow-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddGraveyardEntry();
                }}
              />
              <button 
                onClick={handleAddGraveyardEntry}
                className="px-8 py-4 bg-[#3A3532] hover:bg-[#2C2A29] text-[#F5F2EB] rounded-2xl font-bold tracking-widest text-xl shadow-md transition-colors"
              >
                立碑
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 content-start">
              <AnimatePresence>
                {graveyardEntries.map(entry => (
                  <motion.div 
                    key={entry.id}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-gradient-to-b from-[#EAE6DF] to-[#D5CEC4] p-6 rounded-t-full rounded-b-lg border-2 border-[#8C8279] shadow-lg flex flex-col items-center text-center relative group"
                    style={{ minHeight: '240px' }}
                  >
                    <div className="w-16 h-16 border-4 border-[#8C8279] rounded-full flex items-center justify-center mb-4 mt-2">
                      <Ghost className="w-8 h-8 text-[#6B635E]" />
                    </div>
                    <h3 className="text-xl font-bold text-[#3A3532] mb-2 px-4">{entry.title}</h3>
                    <p className="text-sm font-mono text-[#6B635E] mt-auto">
                      {new Date(entry.date).toLocaleDateString('zh-CN')}
                    </p>
                    <div className="absolute bottom-4 text-xs font-bold tracking-widest text-[#8C8279]">R.I.P</div>
                    
                    <button 
                      onClick={() => store.deleteGraveyardEntry(entry.id)}
                      className="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
              {graveyardEntries.length === 0 && (
                <div className="col-span-full text-center text-[#8C8279] font-bold tracking-widest mt-20 text-xl">
                  墓地空空如也，去击败一些难题吧。
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BigModuleCard({ bigModule, subjectId, isPast, colorMode }: { key?: React.Key; bigModule: any; subjectId: string; isPast: boolean; colorMode?: ColorMode }) {
  const store = useStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [newSmallModuleName, setNewSmallModuleName] = useState('');
  const [isAddingSmallModule, setIsAddingSmallModule] = useState(false);

  const handleAddSmallModule = () => {
    if (newSmallModuleName.trim()) {
      store.addSmallModule(isPast, subjectId, bigModule.id, newSmallModuleName.trim());
      setNewSmallModuleName('');
      setIsAddingSmallModule(false);
    }
  };

  let displayDepth = bigModule.colorDepth || 0;
  if (colorMode === 'auto') {
    if (bigModule.smallModules.length > 0) {
      const total = bigModule.smallModules.reduce((acc: number, sm: any) => acc + getAutoColorDepth(sm), 0);
      displayDepth = total / bigModule.smallModules.length;
    } else {
      displayDepth = 0;
    }
  }

  return (
    <div 
      className={cn(
        "border rounded-2xl overflow-hidden shadow-sm transition-all",
        bigModule.unlinkedFromMap ? "border-dashed border-[#D5CEC4] opacity-80" : "border-[#D5CEC4]"
      )}
      style={{ backgroundColor: getBgColor(displayDepth, colorMode) || 'rgba(255, 255, 255, 0.6)' }}
    >
      <div 
        className={`px-4 py-4 flex ${window.innerWidth <= 768 ? 'flex-col gap-3' : 'items-center justify-between'} cursor-pointer hover:bg-white/80 transition-colors`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          {isExpanded ? <ChevronDown className="w-6 h-6 text-[#8C8279]" /> : <ChevronRight className="w-6 h-6 text-[#8C8279]" />}
          <h3 className={cn(
            "text-xl font-bold tracking-wider",
            bigModule.unlinkedFromMap ? "text-[#8C8279] line-through decoration-[#D5CEC4]" : "text-[#3A3532]"
          )}>{bigModule.name}</h3>
        </div>
        <div className={`flex items-center ${window.innerWidth <= 768 ? 'justify-between w-full pl-10' : 'gap-6'}`}>
          {colorMode === 'manual' && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
              <span className="text-xs text-[#8C8279]">深浅</span>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={bigModule.colorDepth || 0} 
                onChange={(e) => store.updateBigModule(isPast, subjectId, bigModule.id, { colorDepth: parseInt(e.target.value) })}
                className="w-20 accent-[#3A3532]"
              />
            </div>
          )}
          <span className="text-sm font-medium text-[#8C8279]">{bigModule.smallModules.length} 个小节</span>
          
          <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => store.toggleUnlinkBigModule(isPast, subjectId, bigModule.id)}
              className={cn(
                "p-2 rounded-full transition-colors",
                bigModule.unlinkedFromMap ? "bg-[#EAE6DF] text-[#8C8279]" : "hover:bg-[#EAE6DF] text-[#6B635E]"
              )}
              title={bigModule.unlinkedFromMap ? "已断开星图连结" : "连结星图"}
            >
              {bigModule.unlinkedFromMap ? <Link2Off className="w-5 h-5" /> : <Link className="w-5 h-5" />}
            </button>
            <button 
              onClick={() => store.deleteBigModule(isPast, subjectId, bigModule.id)}
              className="p-2 rounded-full text-[#8C8279] hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 pb-6 pt-2 space-y-4">
          {bigModule.smallModules.map((sm: any) => (
            <SmallModuleRow key={sm.id} smallModule={sm} bigModuleId={bigModule.id} subjectId={subjectId} isPast={isPast} colorMode={colorMode} />
          ))}

          {isAddingSmallModule ? (
             <div className="flex items-center gap-4 mt-6 bg-white/40 p-3 rounded-xl border border-[#EAE6DF]">
               <input 
                 type="text"
                 value={newSmallModuleName}
                 onChange={(e) => setNewSmallModuleName(e.target.value)}
                 placeholder="输入小节名称"
                 className="bg-transparent border-b-2 border-[#D5CEC4] px-2 py-1 text-[#3A3532] flex-1 focus:outline-none focus:border-[#8C8279] font-medium placeholder:text-[#B5ACA3]"
                 autoFocus
                 onKeyDown={(e) => {
                   if (e.key === 'Enter') handleAddSmallModule();
                   if (e.key === 'Escape') setIsAddingSmallModule(false);
                 }}
               />
               <button onClick={handleAddSmallModule} className="px-5 py-2 bg-[#3A3532] hover:bg-[#2C2A29] rounded-full text-sm text-[#F5F2EB] transition-colors font-bold">确定</button>
               <button onClick={() => setIsAddingSmallModule(false)} className="px-5 py-2 hover:bg-[#EAE6DF] rounded-full text-sm text-[#6B635E] transition-colors font-bold">取消</button>
             </div>
          ) : (
            <button 
              onClick={() => setIsAddingSmallModule(true)}
              className="flex items-center gap-2 text-sm font-bold text-[#8C8279] hover:text-[#3A3532] transition-colors mt-6 px-2"
            >
              <Plus className="w-5 h-5" />
              <span>添加小节</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function SmallModuleRow({ smallModule, bigModuleId, subjectId, isPast, colorMode }: { key?: React.Key; smallModule: any; bigModuleId: string; subjectId: string; isPast: boolean; colorMode?: ColorMode }) {
  const store = useStore();

  const handleStatusChange = (status: Status) => {
    store.updateSmallModule(isPast, subjectId, bigModuleId, smallModule.id, { status, proficiency: status === '基本掌握' ? '一般' : undefined });
  };

  const handleProficiencyChange = (proficiency: Proficiency) => {
    store.updateSmallModule(isPast, subjectId, bigModuleId, smallModule.id, { proficiency });
  };

  let displayDepth = smallModule.colorDepth || 0;
  if (colorMode === 'auto') {
    displayDepth = getAutoColorDepth(smallModule);
  }

  return (
    <div 
      className={cn(
        `flex ${window.innerWidth <= 768 ? 'flex-col items-start gap-3' : 'items-center justify-between'} py-3 px-4 rounded-xl group border transition-all duration-500`,
        smallModule.isFogged 
          ? "border-transparent blur-[2px] opacity-60 grayscale pointer-events-none" 
          : "border-[#EAE6DF]"
      )}
      style={{ backgroundColor: smallModule.isFogged ? 'rgba(234, 230, 223, 0.5)' : (getBgColor(displayDepth, colorMode) || '#F5F2EB') }}
    >
      <div className={cn(
        "text-base font-bold flex items-center gap-3",
        smallModule.unlinkedFromMap ? "text-[#8C8279] line-through decoration-[#D5CEC4]" : "text-[#3A3532]"
      )}>
        {smallModule.isFogged && <CloudFog className="w-5 h-5 text-[#8C8279]" />}
        {smallModule.name}
      </div>
      
      <div className={`flex ${window.innerWidth <= 768 ? 'flex-wrap w-full justify-between' : 'items-center gap-6'}`}>
        <div className="flex bg-white rounded-full p-1 border border-[#EAE6DF] shadow-sm overflow-x-auto max-w-full">
          {STATUSES.map(s => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={cn(
                "px-4 py-1.5 text-sm font-bold rounded-full transition-colors",
                smallModule.status === s 
                  ? "bg-[#3A3532] text-[#F5F2EB]" 
                  : "text-[#8C8279] hover:text-[#3A3532] hover:bg-[#F5F2EB]"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {smallModule.status === '基本掌握' && (
          <div className="flex bg-white rounded-full p-1 border border-[#EAE6DF] shadow-sm overflow-x-auto max-w-full mt-2 sm:mt-0">
            {PROFICIENCIES.map(p => (
              <button
                key={p}
                onClick={() => handleProficiencyChange(p)}
                className={cn(
                  "px-4 py-1.5 text-sm font-bold rounded-full transition-colors",
                  smallModule.proficiency === p 
                    ? (p === '登峰' ? "bg-amber-500 text-white shadow-sm" : p === '还行' || p === '不错' ? "bg-emerald-500 text-white shadow-sm" : "bg-[#6B635E] text-white")
                    : "text-[#8C8279] hover:text-[#3A3532] hover:bg-[#F5F2EB]"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {colorMode === 'manual' && (
          <div className="flex items-center gap-2 mr-4 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
            <span className="text-xs text-[#8C8279]">深浅</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={smallModule.colorDepth || 0} 
              onChange={(e) => store.updateSmallModule(isPast, subjectId, bigModuleId, smallModule.id, { colorDepth: parseInt(e.target.value) })}
              className="w-20 accent-[#3A3532]"
            />
          </div>
        )}

        <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity mt-2 sm:mt-0">
          <button 
            onClick={() => store.toggleUnlinkSmallModule(isPast, subjectId, bigModuleId, smallModule.id)}
            className={cn(
              "p-2 rounded-full transition-colors",
              smallModule.unlinkedFromMap ? "bg-[#EAE6DF] text-[#8C8279]" : "hover:bg-[#EAE6DF] text-[#6B635E]"
            )}
            title={smallModule.unlinkedFromMap ? "已断开星图连结" : "连结星图"}
          >
            {smallModule.unlinkedFromMap ? <Link2Off className="w-4 h-4" /> : <Link className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => store.deleteSmallModule(isPast, subjectId, bigModuleId, smallModule.id)}
            className="p-2 rounded-full text-[#8C8279] hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
