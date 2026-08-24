import React, { useState, useEffect, useRef } from 'react';
import { Activity, Maximize2, Sparkles, Waves } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

export type VisualizerMode = 'oscilloscope' | 'fft' | 'goniometer';

export const AudioVisualizer: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mode, setMode] = useState<VisualizerMode>('oscilloscope');
  const [theme, setTheme] = useState<'violet' | 'emerald' | 'amber' | 'cyan'>('violet');
  const animFrameId = useRef<number | null>(null);

  const colors = {
    violet: { main: '#7C5DFF', glow: 'rgba(124, 93, 255, 0.35)', bg: '#18181B' },
    emerald: { main: '#10b981', glow: 'rgba(16, 185, 129, 0.25)', bg: '#064e3b' },
    amber: { main: '#f59e0b', glow: 'rgba(245, 158, 11, 0.25)', bg: '#78350f' },
    cyan: { main: '#06b6d4', glow: 'rgba(6, 182, 212, 0.25)', bg: '#164e63' },
  }[theme];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const timeData = new Uint8Array(1024);
    const freqData = new Uint8Array(128);

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Subtle background grid lines
      ctx.strokeStyle = '#18181B';
      ctx.lineWidth = 1;
      for (let x = 0; x < w; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      if (engine.masterAnalyser && engine.isRunning) {
        if (mode === 'oscilloscope') {
          // Time Domain Oscilloscope
          engine.masterAnalyser.getByteTimeDomainData(timeData);

          ctx.strokeStyle = colors.main;
          ctx.lineWidth = 2;
          ctx.shadowBlur = 8;
          ctx.shadowColor = colors.glow;
          ctx.beginPath();

          const sliceWidth = w / timeData.length;
          let x = 0;

          for (let i = 0; i < timeData.length; i++) {
            const v = timeData[i] / 128.0;
            const y = (v * h) / 2;

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);

            x += sliceWidth;
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        } else if (mode === 'fft') {
          // Frequency FFT Bars
          engine.masterAnalyser.getByteFrequencyData(freqData);

          const barWidth = (w / freqData.length) * 1.5;
          let x = 0;

          for (let i = 0; i < freqData.length; i++) {
            const barHeight = (freqData[i] / 255) * (h - 10);

            const gradient = ctx.createLinearGradient(0, h, 0, h - barHeight);
            gradient.addColorStop(0, colors.main);
            gradient.addColorStop(1, '#F0F0F0');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, h - barHeight, barWidth - 1, barHeight);

            x += barWidth;
          }
        } else if (mode === 'goniometer') {
          // Stereo Vectorscope
          engine.masterAnalyser.getByteTimeDomainData(timeData);

          ctx.strokeStyle = colors.main;
          ctx.lineWidth = 1.5;
          ctx.shadowBlur = 6;
          ctx.shadowColor = colors.glow;
          ctx.beginPath();

          const cx = w / 2;
          const cy = h / 2;

          for (let i = 0; i < timeData.length - 2; i += 2) {
            const left = (timeData[i] - 128) / 128;
            const right = (timeData[i + 1] - 128) / 128;

            const px = cx + (left - right) * (w * 0.4);
            const py = cy - (left + right) * (h * 0.4);

            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;
        }
      } else {
        // Idle flat line
        ctx.strokeStyle = '#28282A';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, h / 2);
        ctx.lineTo(w, h / 2);
        ctx.stroke();
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, [engine, mode, colors]);

  return (
    <div id="audio-visualizer-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#9B82FF]" />
          <span className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Real-Time Audio Scope & Spectrum Analyzer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode switch */}
          <div className="flex items-center bg-[#18181B] p-0.5 rounded-lg border border-[#28282A] text-[10px]">
            <button
              onClick={() => setMode('oscilloscope')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                mode === 'oscilloscope' ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold shadow-[0_0_10px_rgba(124,93,255,0.3)]' : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
              }`}
            >
              Waveform
            </button>
            <button
              onClick={() => setMode('fft')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                mode === 'fft' ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold shadow-[0_0_10px_rgba(124,93,255,0.3)]' : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
              }`}
            >
              FFT Spectrum
            </button>
            <button
              onClick={() => setMode('goniometer')}
              className={`px-2 py-1 rounded-md font-semibold transition-all ${
                mode === 'goniometer' ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold shadow-[0_0_10px_rgba(124,93,255,0.3)]' : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
              }`}
            >
              Stereo Vector
            </button>
          </div>

          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-[#18181B] p-1 rounded-lg border border-[#28282A]">
            <button
              onClick={() => setTheme('violet')}
              className={`w-3.5 h-3.5 rounded-full bg-[#7C5DFF] ${theme === 'violet' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              title="Violet theme"
            />
            <button
              onClick={() => setTheme('emerald')}
              className={`w-3.5 h-3.5 rounded-full bg-emerald-500 ${theme === 'emerald' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              title="Emerald theme"
            />
            <button
              onClick={() => setTheme('amber')}
              className={`w-3.5 h-3.5 rounded-full bg-amber-500 ${theme === 'amber' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              title="Amber theme"
            />
            <button
              onClick={() => setTheme('cyan')}
              className={`w-3.5 h-3.5 rounded-full bg-cyan-500 ${theme === 'cyan' ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
              title="Cyan theme"
            />
          </div>
        </div>
      </div>

      <div className="relative w-full h-32 bg-[#0A0A0B] rounded-lg overflow-hidden border border-[#28282A]">
        <canvas ref={canvasRef} width={800} height={128} className="w-full h-full" />
      </div>
    </div>
  );
};
