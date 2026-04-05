import React, { useState } from 'react';
import { ArrowLeft, Play } from 'lucide-react';
import { useIsMobile } from '../hooks/useIsMobile';

const PRESETS = [1, 5, 15, 25, 45, 60, 90, 120];

export default function TimerSetup({ onBack, onStart }: { onBack: () => void, onStart: (mins: number) => void }) {
  const [selectedMins, setSelectedMins] = useState(25);
  const isMobile = useIsMobile();

  return (
    <div className={`flex-1 flex flex-col items-center justify-center ${isMobile ? 'p-4 pt-16 pb-24' : 'p-8'}`}>
      <div className={`absolute ${isMobile ? 'top-4 left-4' : 'top-8 left-8'}`}>
        <button 
          onClick={onBack}
          className="p-4 rounded-full bg-white/60 hover:bg-white/80 text-[#6B635E] hover:text-[#3A3532] transition-colors shadow-sm border border-[#D5CEC4]"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest text-[#3A3532] mb-12`}>
        专注时刻
      </h1>

      <div className={`grid ${isMobile ? 'grid-cols-3 gap-4' : 'grid-cols-4 gap-6'} mb-12 max-w-2xl`}>
        {PRESETS.map(mins => (
          <button
            key={mins}
            onClick={() => setSelectedMins(mins)}
            className={`${isMobile ? 'w-20 h-20 text-xl' : 'w-24 h-24 text-2xl'} rounded-full flex flex-col items-center justify-center font-mono font-bold transition-all ${
              selectedMins === mins 
                ? 'bg-[#3A3532] text-[#F5F2EB] scale-110 shadow-lg' 
                : 'bg-white/60 text-[#8C8279] hover:bg-white/80 border border-[#D5CEC4] hover:scale-105'
            }`}
          >
            <span>{mins}</span>
            <span className="text-sm font-sans font-normal mt-1 opacity-80">min</span>
          </button>
        ))}
      </div>

      <button
        onClick={() => onStart(selectedMins)}
        className="flex items-center gap-3 px-10 py-5 bg-[#D2A03C] hover:bg-[#C1902B] text-white rounded-full text-xl font-bold tracking-widest transition-all hover:scale-105 shadow-md"
      >
        <Play className="w-6 h-6 fill-current" />
        开始专注
      </button>
    </div>
  );
}
