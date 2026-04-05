import { useMemo, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Maximize, Minimize } from 'lucide-react';
import { useStore, AppState } from '../store';
import { cn } from '../lib/utils';
import { useIsMobile } from '../hooks/useIsMobile';

function calculateLitDots(state: AppState) {
  let count = 0;
  let totalPapers = 0;
  
  const processSubjects = (subjects: AppState['currentSubjects']) => {
    Object.values(subjects).forEach(subject => {
      totalPapers += subject.papers;
      
      subject.bigModules.forEach(bm => {
        if (bm.unlinkedFromMap) return; // Skip unlinked big modules
        if (bm.smallModules.length === 0) return;
        
        let allOkayOrBetter = true;
        let allPeak = true;
        let hasLinkedSmallModules = false;

        bm.smallModules.forEach(sm => {
          if (sm.unlinkedFromMap) return; // Skip unlinked small modules
          hasLinkedSmallModules = true;

          if (sm.status === '基本掌握' && sm.proficiency) {
            if (sm.proficiency === '还行' || sm.proficiency === '不错') {
              count += 1;
              allPeak = false;
            } else if (sm.proficiency === '登峰') {
              count += 2;
            } else {
              allOkayOrBetter = false;
              allPeak = false;
            }
          } else {
            allOkayOrBetter = false;
            allPeak = false;
          }
        });

        if (hasLinkedSmallModules) {
          if (allPeak) {
            count += 5;
          } else if (allOkayOrBetter) {
            count += 3;
          }
        }
      });
    });
  };

  processSubjects(state.currentSubjects);
  processSubjects(state.pastSubjects);

  count += Math.floor(state.englishWords / 30);
  count += Math.floor(totalPapers / 5);

  return Math.min(count, 1000); // Increased max to 1000 to fill screen better
}

interface Dot {
  x: number;
  y: number;
  phase: number;
}

export default function StarMap({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const litCount = useMemo(() => calculateLitDots(store), [store]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  // Generate 1000 dots, spread across the entire screen evenly
  const dots = useMemo(() => {
    const generated: Dot[] = [];
    for (let i = 0; i < 1000; i++) {
      generated.push({
        x: Math.random(), // 0 to 1
        y: Math.random(), // 0 to 1
        phase: Math.random() * Math.PI * 2
      });
    }
    // Sort roughly from center outwards for the lighting effect
    return generated.sort((a, b) => {
      const distA = Math.pow(a.x - 0.5, 2) + Math.pow(a.y - 0.5, 2);
      const distB = Math.pow(b.x - 0.5, 2) + Math.pow(b.y - 0.5, 2);
      return distA - distB;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const render = () => {
      time += 0.02;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      const dotRadius = 2.5; // Uniform, slightly larger size

      dots.forEach((dot, index) => {
        const px = dot.x * width;
        const py = dot.y * height;
        const isLit = index < litCount;

        ctx.beginPath();
        
        if (isLit) {
          // Breathing effect
          const breath = Math.sin(time + dot.phase) * 0.5 + 0.5; // 0 to 1
          const currentRadius = dotRadius * (1 + breath * 0.3);
          
          ctx.arc(px, py, currentRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 215, 0, ${0.7 + breath * 0.3})`; // Gold
          ctx.fill();

          // Glow
          ctx.shadowBlur = 12 + breath * 8;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.9)';
        } else {
          ctx.arc(px, py, dotRadius * 0.8, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(100, 116, 139, 0.4)'; // Dim gray
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    // Handle resize
    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial size
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dots, litCount]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#0A0A0C] overflow-hidden film-grain">
      {/* Top Left: Back */}
      <div className={`absolute ${isMobile ? 'top-4 left-4' : 'top-8 left-8'} flex gap-4 z-10`}>
        <button 
          onClick={onBack}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-sm"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      {/* Bottom Right: Fullscreen & Counter */}
      <div className={`absolute ${isMobile ? 'bottom-4 right-4' : 'bottom-8 right-8'} z-10 flex items-center gap-4`}>
        <div className="text-white/30 text-sm tracking-widest font-mono bg-white/5 px-4 py-2 rounded-full backdrop-blur-sm border border-white/10">
          {litCount} / 1000
        </div>
        <button 
          onClick={toggleFullscreen}
          className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors backdrop-blur-sm border border-white/10"
          title="全屏沉浸"
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
      </div>
      
      <canvas 
        ref={canvasRef} 
        className="w-full h-full block"
      />
    </div>
  );
}
