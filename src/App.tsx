import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Activity, Map, Timer, Maximize, Minimize, Play, Pause, X, Home, Box, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import Dashboard from './components/Dashboard';
import SubjectDetail from './components/SubjectDetail';
import StarMap from './components/StarMap';
import CalendarNotes from './components/CalendarNotes';
import GrowthCurve from './components/GrowthCurve';
import EvolutionTimeline from './components/EvolutionTimeline';
import TimerSetup from './components/TimerSetup';
import BlackBox from './components/BlackBox';
import { useStore } from './store';
import { useIsMobile } from './hooks/useIsMobile';

export type ViewState = 
  | { type: 'past' }
  | { type: 'main' }
  | { type: 'growth' }
  | { type: 'timeline' }
  | { type: 'subject'; isPast: boolean; subjectId: string }
  | { type: 'starmap' }
  | { type: 'calendar' }
  | { type: 'timer_setup' }
  | { type: 'blackbox' };

const VIEW_ORDER = {
  'past': 0,
  'main': 1,
  'growth': 2,
  'timeline': 3,
  'starmap': 4
};

export default function App() {
  const [view, setView] = useState<ViewState>({ type: 'main' });
  const [prevView, setPrevView] = useState<ViewState>({ type: 'main' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const toasts = useStore(state => state.toasts);
  const isMobile = useIsMobile();

  const handleSetView = (newView: ViewState) => {
    setPrevView(view);
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Timer
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
  }, []);

  useEffect(() => {
    let timerInterval: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timerInterval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      if (audioRef.current) {
        audioRef.current.play().catch(e => console.error(e));
      }
    }
    return () => clearInterval(timerInterval);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const startTimer = (mins: number) => {
    setTimeLeft(mins * 60);
    setIsTimerRunning(true);
    handleSetView({ type: 'main' });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view.type === 'main') {
        if (e.key === 'ArrowLeft') handleSetView({ type: 'past' });
        else if (e.key === 'ArrowRight') handleSetView({ type: 'growth' });
      } else if (view.type === 'past') {
        if (e.key === 'ArrowRight') handleSetView({ type: 'main' });
      } else if (view.type === 'growth') {
        if (e.key === 'ArrowLeft') handleSetView({ type: 'main' });
        else if (e.key === 'ArrowRight') handleSetView({ type: 'timeline' });
      } else if (view.type === 'timeline') {
        if (e.key === 'ArrowLeft') handleSetView({ type: 'growth' });
        else if (e.key === 'ArrowRight') handleSetView({ type: 'starmap' });
      } else if (view.type === 'starmap') {
        if (e.key === 'ArrowLeft') handleSetView({ type: 'timeline' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view]);

  const getSlideDirection = () => {
    const currentOrder = VIEW_ORDER[view.type as keyof typeof VIEW_ORDER] ?? -1;
    const prevOrder = VIEW_ORDER[prevView.type as keyof typeof VIEW_ORDER] ?? -1;
    
    if (currentOrder !== -1 && prevOrder !== -1) {
      return currentOrder > prevOrder ? 100 : -100;
    }
    return 0; // Default or non-ordered views
  };

  const renderView = () => {
    switch (view.type) {
      case 'past':
        return <Dashboard isPast={true} onNavigate={(id) => handleSetView({ type: 'subject', isPast: true, subjectId: id })} />;
      case 'main':
        return <Dashboard isPast={false} onNavigate={(id) => handleSetView({ type: 'subject', isPast: false, subjectId: id })} />;
      case 'growth':
        return <GrowthCurve onBack={() => handleSetView({ type: 'main' })} />;
      case 'timeline':
        return <EvolutionTimeline onBack={() => handleSetView({ type: 'growth' })} />;
      case 'subject':
        return <SubjectDetail isPast={view.isPast} subjectId={view.subjectId} onBack={() => handleSetView({ type: view.isPast ? 'past' : 'main' })} />;
      case 'starmap':
        return <StarMap onBack={() => handleSetView({ type: 'main' })} />;
      case 'calendar':
        return <CalendarNotes onBack={() => handleSetView({ type: 'main' })} />;
      case 'timer_setup':
        return <TimerSetup onBack={() => handleSetView({ type: 'main' })} onStart={startTimer} />;
      case 'blackbox':
        return <BlackBox onBack={() => handleSetView({ type: 'main' })} />;
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-[#F5F2EB] text-[#3A3532] font-sans selection:bg-[#D2A03C] selection:text-white overflow-hidden film-grain relative">
      {/* Toasts */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="bg-[#3A3532] text-[#F5F2EB] px-6 py-3 rounded-full shadow-lg font-bold tracking-wider border border-[#6B635E]"
            >
              {toast.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Top Left Clock */}
      {view.type !== 'starmap' && view.type !== 'blackbox' && !isMobile && (
        <div className="absolute top-8 left-8 z-50">
          <div className="text-[#3A3532] font-mono text-2xl font-bold tracking-widest bg-white/60 px-6 py-3 rounded-full border border-[#D5CEC4] shadow-sm backdrop-blur-sm">
            {currentTime.toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      )}

      {/* Top Center Buttons (Desktop) */}
      {view.type !== 'starmap' && view.type !== 'blackbox' && !isMobile && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-6">
          <button onClick={() => handleSetView({ type: 'main' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="主页">
            <Home className="w-6 h-6" />
          </button>
          <button onClick={() => handleSetView({ type: 'calendar' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="岁月留痕">
            <Calendar className="w-6 h-6" />
          </button>
          <button onClick={() => handleSetView({ type: 'growth' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="成长曲线">
            <TrendingUp className="w-6 h-6" />
          </button>
          <button onClick={() => handleSetView({ type: 'timeline' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="心理稳定器">
            <Activity className="w-6 h-6" />
          </button>
          <button onClick={() => handleSetView({ type: 'starmap' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="成长博物馆">
            <Map className="w-6 h-6" />
          </button>
          <button onClick={() => handleSetView({ type: 'timer_setup' })} className="p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="专注计时">
            <Timer className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* Bottom Navigation (Mobile) */}
      {isMobile && view.type !== 'starmap' && view.type !== 'blackbox' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-[#D5CEC4] z-50 px-4 py-2 flex justify-around items-center pb-safe">
          <button onClick={() => handleSetView({ type: 'main' })} className={`p-2 flex flex-col items-center gap-1 ${view.type === 'main' ? 'text-[#D2A03C]' : 'text-[#6B635E]'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[10px]">主页</span>
          </button>
          <button onClick={() => handleSetView({ type: 'calendar' })} className={`p-2 flex flex-col items-center gap-1 ${view.type === 'calendar' ? 'text-[#D2A03C]' : 'text-[#6B635E]'}`}>
            <Calendar className="w-6 h-6" />
            <span className="text-[10px]">日历</span>
          </button>
          
          {/* Main Action Button */}
          <div className="relative -top-5">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-4 rounded-full bg-[#D2A03C] text-white shadow-lg border-4 border-[#F5F2EB]">
              <Menu className="w-6 h-6" />
            </button>
            
            {/* Expanded Menu */}
            <AnimatePresence>
              {isMobileMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.9 }}
                  className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 flex flex-col gap-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-[#D5CEC4]"
                >
                  <button onClick={() => handleSetView({ type: 'growth' })} className="flex items-center gap-3 p-2 text-[#6B635E] whitespace-nowrap">
                    <TrendingUp className="w-5 h-5" /> <span>成长曲线</span>
                  </button>
                  <button onClick={() => handleSetView({ type: 'timeline' })} className="flex items-center gap-3 p-2 text-[#6B635E] whitespace-nowrap">
                    <Activity className="w-5 h-5" /> <span>心理稳定器</span>
                  </button>
                  <button onClick={() => handleSetView({ type: 'starmap' })} className="flex items-center gap-3 p-2 text-[#6B635E] whitespace-nowrap">
                    <Map className="w-5 h-5" /> <span>成长博物馆</span>
                  </button>
                  <button onClick={() => handleSetView({ type: 'timer_setup' })} className="flex items-center gap-3 p-2 text-[#6B635E] whitespace-nowrap">
                    <Timer className="w-5 h-5" /> <span>专注计时</span>
                  </button>
                  <button onClick={() => handleSetView({ type: 'blackbox' })} className="flex items-center gap-3 p-2 text-[#6B635E] whitespace-nowrap">
                    <Box className="w-5 h-5" /> <span>黑盒复盘</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={() => handleSetView({ type: 'past' })} className={`p-2 flex flex-col items-center gap-1 ${view.type === 'past' ? 'text-[#D2A03C]' : 'text-[#6B635E]'}`}>
            <ChevronLeft className="w-6 h-6" />
            <span className="text-[10px]">过往</span>
          </button>
          <button onClick={() => handleSetView({ type: 'growth' })} className={`p-2 flex flex-col items-center gap-1 ${view.type === 'growth' ? 'text-[#D2A03C]' : 'text-[#6B635E]'}`}>
            <TrendingUp className="w-6 h-6" />
            <span className="text-[10px]">曲线</span>
          </button>
        </div>
      )}

      {/* Bottom Center Encouragement */}
      {view.type !== 'starmap' && view.type !== 'blackbox' && !isMobile && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 text-[#8C8279] font-bold tracking-widest text-sm">
          “每一步算数，每一颗星都闪耀”
        </div>
      )}

      {/* Bottom Right Fullscreen */}
      {view.type !== 'blackbox' && view.type !== 'starmap' && !isMobile && (
        <button onClick={toggleFullscreen} className="absolute bottom-8 right-8 z-50 p-4 rounded-full bg-white/80 hover:bg-white shadow-sm border border-[#D5CEC4] text-[#6B635E] hover:text-[#3A3532] transition-all hover:scale-110" title="全屏">
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
      )}

      {/* Bottom Left BlackBox */}
      {view.type === 'main' && !isMobile && (
        <button onClick={() => handleSetView({ type: 'blackbox' })} className="absolute bottom-8 left-8 z-50 p-6 rounded-2xl bg-[#1A1818] hover:bg-black shadow-2xl border-2 border-[#3A3532] text-[#8C8279] hover:text-white transition-all hover:scale-105 group" title="黑盒复盘">
          <Box className="w-8 h-8 group-hover:animate-pulse" />
        </button>
      )}

      {/* Floating Timer */}
      {(isTimerRunning || timeLeft > 0) && view.type !== 'timer_setup' && view.type !== 'starmap' && view.type !== 'blackbox' && (
        <motion.div 
          drag={!isMobile}
          dragMomentum={false}
          className={`fixed ${isMobile ? 'top-4 right-4' : 'bottom-24 right-8'} z-[100] bg-[#3A3532] text-[#F5F2EB] px-6 py-4 rounded-3xl shadow-2xl border border-[#6B635E] flex items-center gap-4 ${!isMobile && 'cursor-move'}`}
        >
          <div className="text-3xl font-mono font-bold tracking-widest">
            {formatTime(timeLeft)}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setIsTimerRunning(!isTimerRunning)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              {isTimerRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
            <button onClick={() => { setIsTimerRunning(false); setTimeLeft(0); }} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      <div className="h-screen w-full relative flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={view.type + (view.type === 'subject' ? view.subjectId : '')}
            initial={{ opacity: 0, x: getSlideDirection() }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -getSlideDirection() }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }} // Smooth physical feel
            className="absolute inset-0 flex flex-col"
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {['past', 'main', 'growth', 'timeline', 'starmap'].includes(view.type) && !isMobile && (
          <>
            <div 
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-40 group h-32 w-12",
                view.type !== 'past' ? "block" : "hidden"
              )}
              onClick={() => {
                if (view.type === 'main') handleSetView({ type: 'past' });
                else if (view.type === 'growth') handleSetView({ type: 'main' });
                else if (view.type === 'timeline') handleSetView({ type: 'growth' });
                else if (view.type === 'starmap') handleSetView({ type: 'timeline' });
              }}
            >
              <div className="bg-white/80 h-full w-full rounded-r-xl shadow-md border border-l-0 border-[#D5CEC4] flex items-center justify-center text-[#6B635E] hover:text-[#3A3532] hover:bg-white transition-colors">
                <ChevronLeft className="w-6 h-6" />
              </div>
            </div>
            <div 
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer z-40 group h-32 w-12",
                view.type !== 'starmap' ? "block" : "hidden"
              )}
              onClick={() => {
                if (view.type === 'past') handleSetView({ type: 'main' });
                else if (view.type === 'main') handleSetView({ type: 'growth' });
                else if (view.type === 'growth') handleSetView({ type: 'timeline' });
                else if (view.type === 'timeline') handleSetView({ type: 'starmap' });
              }}
            >
              <div className="bg-white/80 h-full w-full rounded-l-xl shadow-md border border-r-0 border-[#D5CEC4] flex items-center justify-center text-[#6B635E] hover:text-[#3A3532] hover:bg-white transition-colors">
                <ChevronRight className="w-6 h-6" />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
