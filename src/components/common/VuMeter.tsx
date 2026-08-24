import React, { useEffect, useRef } from 'react';
import { AudioEngine } from '../../audio/AudioEngine';

interface VuMeterProps {
  id?: string;
  className?: string;
}

export const VuMeter: React.FC<VuMeterProps> = ({ id, className = '' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameId = useRef<number | null>(null);
  const peakL = useRef<number>(0);
  const peakR = useRef<number>(0);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataArray = new Uint8Array(64);

    const render = () => {
      if (engine.masterAnalyser && engine.isRunning) {
        engine.masterAnalyser.getByteFrequencyData(dataArray);

        // Compute RMS and peak
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedL = Math.min(1.0, (avg / 128) * engine.masterVolume);
        const normalizedR = Math.min(1.0, (avg / 128) * engine.masterVolume * 0.96);

        peakL.current = Math.max(normalizedL, peakL.current * 0.95);
        peakR.current = Math.max(normalizedR, peakR.current * 0.95);

        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const drawBar = (x: number, width: number, val: number, peak: number) => {
          // Background channel
          ctx.fillStyle = '#0E0E10';
          ctx.fillRect(x, 0, width, h);

          // Segments
          const numSegments = 16;
          const segHeight = h / numSegments;

          for (let s = 0; s < numSegments; s++) {
            const segRatio = (numSegments - s) / numSegments;
            const isLit = val >= segRatio;

            let col = '#7C5DFF'; // Elegant Dark Violet
            if (s < 3) col = '#EF4444'; // Red (clip zone)
            else if (s < 6) col = '#F59E0B'; // Yellow/Amber

            ctx.fillStyle = isLit ? col : '#28282A';
            ctx.fillRect(x + 1, s * segHeight + 1, width - 2, segHeight - 2);
          }

          // Peak indicator line
          const peakY = Math.max(2, h * (1 - peak));
          ctx.fillStyle = peak > 0.95 ? '#EF4444' : '#F0F0F0';
          ctx.fillRect(x, peakY, width, 2);
        };

        const barWidth = (w - 4) / 2;
        drawBar(0, barWidth, normalizedL, peakL.current);
        drawBar(barWidth + 4, barWidth, normalizedR, peakR.current);
      } else {
        // Idle display
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#0E0E10';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      animFrameId.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  return (
    <div id={id} className={`flex items-center gap-1 bg-[#0E0E10] p-1.5 rounded-lg border border-[#28282A] ${className}`}>
      <canvas ref={canvasRef} width={28} height={52} className="rounded" />
      <div className="flex flex-col justify-between h-full text-[9px] font-mono text-[#9E9E9E] py-0.5">
        <span>0</span>
        <span>-6</span>
        <span>-18</span>
        <span>-inf</span>
      </div>
    </div>
  );
};
