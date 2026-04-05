import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Mic, MicOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { useIsMobile } from '../hooks/useIsMobile';

export default function BlackBox({ onBack }: { onBack: () => void }) {
  const [text, setText] = useState('');
  const [isExploding, setIsExploding] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);
  const store = useStore();
  const isMobile = useIsMobile();

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'zh-CN';

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setText(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          store.addToast("请允许使用麦克风以启用语音输入。");
        } else {
          store.addToast(`语音识别错误: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleExplode = () => {
    if (!text.trim() || isExploding) return;
    setIsExploding(true);
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = text.split('');
    const particles: any[] = [];

    // Create particles originating from the center
    for (let i = 0; i < chars.length; i++) {
      particles.push({
        x: window.innerWidth / 2 + (Math.random() - 0.5) * 600,
        y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
        char: chars[i],
        vx: (Math.random() - 0.5) * 15, // Explode outwards in all directions
        vy: (Math.random() - 0.5) * 15,
        life: 1,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.2
      });
    }

    setText('');

    const animate = () => {
      // Use solid black to prevent trails and make it look like a clean shatter
      ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      let allDead = true;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (p.life <= 0) continue;
        allDead = false;

        p.x += p.vx;
        p.y += p.vy;
        
        // Air resistance
        p.vx *= 0.98;
        p.vy *= 0.98;
        
        // Very light gravity
        p.vy += 0.02;
        
        p.rotation += p.rotSpeed;
        
        // Decay life very slowly (approx 10 seconds at 60fps)
        p.life -= 0.0016;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, p.life)})`;
        ctx.font = '24px serif';
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      }

      if (!allDead) {
        requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsExploding(false);
      }
    };

    animate();
  };

  return (
    <div className={`absolute inset-0 bg-black z-[300] flex flex-col items-center justify-center ${isMobile ? 'p-4' : 'p-8'}`}>
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
      
      <button 
        onClick={onBack}
        className={`absolute ${isMobile ? 'top-4 left-4' : 'top-8 left-8'} p-3 rounded-full hover:bg-white/10 text-[#8C8279] hover:text-white transition-colors z-20`}
      >
        <ArrowLeft className="w-6 h-6" />
      </button>

      {!isExploding && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-3xl flex flex-col gap-6 z-20"
        >
          <div className="text-center text-[#8C8279] font-mono tracking-widest text-sm mb-4">
            [ 黑盒复盘 ] - 倾泻负面情绪，按回车粉碎
          </div>
          
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleExplode();
              }
            }}
            placeholder="写下让你崩溃、愤怒、想放弃的一切..."
            className={`w-full ${isMobile ? 'h-48 text-xl' : 'h-64 text-2xl'} bg-transparent border-none text-white font-serif focus:outline-none resize-none placeholder:text-[#3A3532]`}
            autoFocus
          />

          <div className="flex justify-between items-center">
            <button 
              onClick={toggleListening}
              className={`p-4 rounded-full transition-all ${isListening ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-white/5 text-[#8C8279] hover:bg-white/10 hover:text-white'}`}
            >
              {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </button>

            <button 
              onClick={handleExplode}
              disabled={!text.trim()}
              className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-mono tracking-widest transition-colors disabled:opacity-50"
            >
              粉碎 (ENTER)
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
