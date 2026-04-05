import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore, CalendarColor } from '../store';
import { cn } from '../lib/utils';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useIsMobile } from '../hooks/useIsMobile';

export default function CalendarNotes({ onBack }: { onBack: () => void }) {
  const store = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const isMobile = useIsMobile();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Add padding days for the first week
  const startDayOfWeek = monthStart.getDay(); // 0 is Sunday
  const paddingDays = Array.from({ length: startDayOfWeek === 0 ? 6 : startDayOfWeek - 1 }).map((_, i) => i);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const currentNote = store.notesData[selectedDateStr] || '';
  const currentColor = store.calendarData[selectedDateStr] || 'white';

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const handleColorChange = (color: CalendarColor) => {
    store.updateCalendar(selectedDateStr, color);
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    store.updateNote(selectedDateStr, e.target.value);
  };

  return (
    <div className={`flex-1 flex flex-col ${isMobile ? 'p-4 pt-16 pb-24' : 'p-8 pt-12 max-w-6xl mx-auto'} w-full h-full overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center ${isMobile ? 'gap-4' : 'gap-6'} mb-8`}>
        <button 
          onClick={onBack}
          className="p-3 rounded-full hover:bg-black/5 text-[#6B635E] hover:text-[#3A3532] transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className={`${isMobile ? 'text-3xl' : 'text-4xl'} font-bold tracking-widest text-[#3A3532]`}>
          岁月留痕
        </h1>
      </div>

      <div className={`flex-1 flex ${isMobile ? 'flex-col overflow-y-auto' : 'gap-8 overflow-hidden'}`}>
        {/* Calendar Section */}
        <div className={`${isMobile ? 'w-full mb-6' : 'w-[400px]'} flex flex-col bg-white/60 border border-[#D5CEC4] rounded-3xl p-6 shadow-sm`}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#3A3532]">
              {format(currentDate, 'yyyy年 M月', { locale: zhCN })}
            </h2>
            <div className="flex gap-2">
              <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-[#EAE6DF] text-[#6B635E] transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-[#EAE6DF] text-[#6B635E] transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {['一', '二', '三', '四', '五', '六', '日'].map(day => (
              <div key={day} className="text-center text-sm font-bold text-[#8C8279] py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {paddingDays.map(i => (
              <div key={`pad-${i}`} className="aspect-square" />
            ))}
            {daysInMonth.map(day => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const colorStatus = store.calendarData[dateStr] || 'white';
              const isSelected = isSameDay(day, selectedDate);
              
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "aspect-square rounded-full flex items-center justify-center text-sm font-bold transition-all relative",
                    isSelected ? "ring-2 ring-offset-2 ring-[#3A3532] bg-[#3A3532] text-[#F5F2EB]" : "hover:bg-[#EAE6DF] text-[#3A3532]",
                    !isSelected && colorStatus === 'red' && "bg-[#E88B82] text-white hover:bg-[#D97A71]",
                    !isSelected && colorStatus === 'yellow' && "bg-[#D2A03C] text-white hover:bg-[#C1902B]",
                    !isSelected && colorStatus === 'green' && "bg-[#3CA050] text-white hover:bg-[#2B8F3F]",
                    isToday(day) && !isSelected && "border-2 border-[#3A3532]"
                  )}
                >
                  {format(day, 'd')}
                  {store.notesData[dateStr] && !isSelected && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-50" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notes Section */}
        <div className="flex-1 flex flex-col bg-white/60 border border-[#D5CEC4] rounded-3xl p-8 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-[#3A3532]">
              {format(selectedDate, 'yyyy年M月d日', { locale: zhCN })} 日志
            </h2>
            
            <div className="flex items-center gap-3 bg-[#F5F2EB] p-1.5 rounded-full border border-[#EAE6DF]">
              <span className="text-sm font-bold text-[#8C8279] px-2">状态评估</span>
              {(['white', 'red', 'yellow', 'green'] as CalendarColor[]).map(c => (
                <button
                  key={c}
                  onClick={() => handleColorChange(c)}
                  className={cn(
                    "w-8 h-8 rounded-full transition-transform hover:scale-110",
                    c === 'white' && "bg-white border-2 border-[#EAE6DF]",
                    c === 'red' && "bg-[#E88B82]",
                    c === 'yellow' && "bg-[#D2A03C]",
                    c === 'green' && "bg-[#3CA050]",
                    currentColor === c && "ring-2 ring-offset-2 ring-[#3A3532]"
                  )}
                  title={c === 'white' ? '无记录' : c === 'red' ? '状态不佳' : c === 'yellow' ? '一般般' : '状态极佳'}
                />
              ))}
            </div>
          </div>

          <textarea
            value={currentNote}
            onChange={handleNoteChange}
            placeholder="今天学到了什么？有什么感悟？记录下来吧..."
            className="flex-1 bg-transparent resize-none outline-none text-lg text-[#3A3532] placeholder:text-[#B5ACA3] leading-relaxed custom-scrollbar"
          />
        </div>
      </div>
    </div>
  );
}
