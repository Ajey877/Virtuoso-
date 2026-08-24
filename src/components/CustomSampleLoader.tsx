import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  Download,
  Flame,
  Grid,
  Layers,
  Mic,
  Music,
  Play,
  Plus,
  RotateCcw,
  Scissors,
  Sparkles,
  Square,
  Upload,
  Volume2,
  Zap,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { InstrumentPreset } from '../types/audio';

export interface SampleSlice {
  id: number;
  startRatio: number; // 0 to 1
  endRatio: number; // 0 to 1
  keyLabel: string;
}

export const CustomSampleLoader: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [sampleName, setSampleName] = useState('Vintage_Soul_Guitar_Chop');
  const [baseMidi, setBaseMidi] = useState(60); // C4
  const [loadedBuffer, setLoadedBuffer] = useState<AudioBuffer | null>(null);
  const [loading, setLoading] = useState(false);
  const [trimStart, setTrimStart] = useState(0); // 0 to 1
  const [trimEnd, setTrimEnd] = useState(1); // 0 to 1
  const [numSlices, setNumSlices] = useState<4 | 8 | 16>(8);
  const [activePad, setActivePad] = useState<number | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [gainBoost, setGainBoost] = useState(1.0);

  // Generate an initial high-quality analog sample buffer on first mount
  useEffect(() => {
    generateFactorySample('soul_guitar');
  }, []);

  // Draw Waveform onto HTML Canvas
  useEffect(() => {
    if (!canvasRef.current || !loadedBuffer) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#121214');
    bgGrad.addColorStop(1, '#0A0A0B');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Draw active trim highlight
    const startX = trimStart * width;
    const endX = trimEnd * width;
    ctx.fillStyle = 'rgba(124, 93, 255, 0.12)';
    ctx.fillRect(startX, 0, endX - startX, height);

    // Draw slice boundary lines
    const sliceWidth = (endX - startX) / numSlices;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i < numSlices; i++) {
      const sx = startX + i * sliceWidth;
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw audio waveform channel 0
    const rawData = loadedBuffer.getChannelData(0);
    const step = Math.ceil(rawData.length / width);
    const amp = height / 2;

    ctx.fillStyle = '#7C5DFF';
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      for (let j = 0; j < step; j++) {
        const datum = rawData[i * step + j];
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }

      // Highlight waveform inside trim zone
      if (i >= startX && i <= endX) {
        ctx.fillStyle = '#C4B5FD';
      } else {
        ctx.fillStyle = '#3F3F46';
      }

      const y1 = (1 + min) * amp;
      const y2 = (1 + max) * amp;
      ctx.fillRect(i, y1, 1, Math.max(1, y2 - y1));
    }

    // Draw start and end trim vertical bars
    ctx.fillStyle = '#7C5DFF';
    ctx.fillRect(startX - 2, 0, 4, height);
    ctx.fillStyle = '#EC4899';
    ctx.fillRect(endX - 2, 0, 4, height);
  }, [loadedBuffer, trimStart, trimEnd, numSlices]);

  const generateFactorySample = async (type: 'soul_guitar' | '808_boom' | 'vocal_chop' | 'lofi_keys') => {
    if (!engine.ctx) await engine.init();
    if (!engine.ctx) return;

    setLoading(true);
    const sampleRate = engine.ctx.sampleRate || 44100;
    const duration = type === '808_boom' ? 3.0 : 4.0;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = engine.ctx.createBuffer(2, numSamples, sampleRate);
    const chL = buffer.getChannelData(0);
    const chR = buffer.getChannelData(1);

    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;

      if (type === 'soul_guitar') {
        // Warm jazz-soul nylon arpeggio with pluck harmonics
        const chord = [220, 277.18, 329.63, 415.3]; // A minor maj7
        let val = 0;
        chord.forEach((freq, idx) => {
          const noteStart = idx * 0.75;
          if (t >= noteStart) {
            const dt = t - noteStart;
            const env = Math.exp(-dt * 3.5);
            val += (Math.sin(2 * Math.PI * freq * dt) + 0.4 * Math.sin(4 * Math.PI * freq * dt)) * env * 0.3;
          }
        });
        chL[i] = val;
        chR[i] = val * 0.95;
      } else if (type === '808_boom') {
        // Deep sliding 808 sub with warm saturation
        const env = Math.exp(-t * 1.8);
        const pitchGlide = 55 * Math.exp(-t * 2.2) + 40;
        const val = Math.sin(2 * Math.PI * pitchGlide * t) * env * 0.9;
        const saturated = Math.tanh(val * 1.8);
        chL[i] = saturated;
        chR[i] = saturated;
      } else if (type === 'vocal_chop') {
        // Formant vocal vowel sweep "Ah-Oh"
        const env = Math.sin(Math.PI * (t % 1.0));
        const f1 = 600 + 200 * Math.sin(2 * Math.PI * 1.5 * t);
        const f2 = 1200 + 300 * Math.cos(2 * Math.PI * 1.5 * t);
        const val = (Math.sin(2 * Math.PI * 220 * t) * 0.5 + Math.sin(2 * Math.PI * f1 * t) * 0.3 + Math.sin(2 * Math.PI * f2 * t) * 0.2) * env * 0.6;
        chL[i] = val;
        chR[i] = val;
      } else {
        // Lo-fi vinyl rhodes chord
        const f = 261.63; // C4
        const env = Math.exp(-t * 2.0);
        const wobble = 1 + 0.005 * Math.sin(2 * Math.PI * 4 * t);
        const val = Math.sin(2 * Math.PI * f * wobble * t) * env * 0.7;
        chL[i] = val;
        chR[i] = val;
      }
    }

    setLoadedBuffer(buffer);
    setSampleName(type.toUpperCase());
    updateEnginePreset(buffer, type.toUpperCase(), baseMidi);
    setLoading(false);
  };

  const updateEnginePreset = (buf: AudioBuffer, name: string, midi: number) => {
    const customInst: InstrumentPreset = {
      id: `custom_sample_${Date.now()}`,
      name,
      category: 'custom',
      synthesisType: 'custom_sample',
      description: 'Imported audio sample mapped to keyboard with real-time pitch shifting.',
      origin: 'Studio Sample',
      icon: 'Music',
      envelope: { attack: 0.001, decay: 2.0, sustain: 0.8, release: 0.3 },
      filter: { type: 'lowpass', cutoff: 18000, resonance: 1.0, envelopeAmount: 0 },
      vibrato: { rate: 5.0, depth: 0, delay: 0 },
      portamento: 0,
      harmonics: 1.0,
      resonanceTone: 0.8,
      noiseAmount: 0,
      sampleData: buf,
      sampleBaseNote: midi,
    };
    engine.currentInstrument = customInst;
    engine.notifyStateChange();
  };

  const processAudioFile = async (file: File) => {
    if (!engine.ctx) await engine.init();
    if (!engine.ctx) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const decoded = await engine.ctx.decodeAudioData(arrayBuffer);
      setLoadedBuffer(decoded);
      const cleanName = file.name.replace(/\.[^/.]+$/, '');
      setSampleName(cleanName);
      updateEnginePreset(decoded, cleanName, baseMidi);
    } catch (err) {
      console.error('Error decoding audio sample:', err);
    } finally {
      setLoading(false);
    }
  };

  // Play a specific Slice Pad (0 to numSlices - 1)
  const triggerSlicePad = (sliceIndex: number) => {
    if (!engine.ctx || !loadedBuffer) return;
    setActivePad(sliceIndex);
    setTimeout(() => setActivePad(null), 180);

    const fullDuration = loadedBuffer.duration;
    const regionDuration = (trimEnd - trimStart) * fullDuration;
    const sliceDuration = regionDuration / numSlices;
    const startTime = trimStart * fullDuration + sliceIndex * sliceDuration;

    const src = engine.ctx.createBufferSource();
    src.buffer = loadedBuffer;

    const gain = engine.ctx.createGain();
    gain.gain.setValueAtTime(gainBoost, engine.ctx.currentTime);
    src.connect(gain);
    gain.connect(engine.masterGain || engine.ctx.destination);

    src.start(0, startTime, sliceDuration);
  };

  const handleReverseBuffer = () => {
    if (!loadedBuffer || !engine.ctx) return;
    const numChannels = loadedBuffer.numberOfChannels;
    const reversedBuffer = engine.ctx.createBuffer(
      numChannels,
      loadedBuffer.length,
      loadedBuffer.sampleRate
    );

    for (let c = 0; c < numChannels; c++) {
      const srcData = loadedBuffer.getChannelData(c);
      const destData = reversedBuffer.getChannelData(c);
      for (let i = 0; i < srcData.length; i++) {
        destData[i] = srcData[srcData.length - 1 - i];
      }
    }

    setLoadedBuffer(reversedBuffer);
    setIsReversed(!isReversed);
    updateEnginePreset(reversedBuffer, `${sampleName}_REV`, baseMidi);
  };

  return (
    <div id="custom-sample-loader-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C5DFF]/15 border border-[#7C5DFF]/40 flex items-center justify-center text-[#9B82FF]">
            <Scissors className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#F0F0F0] flex items-center gap-2">
              Waveform Sampler & MPC Transient Slicer
            </h3>
            <span className="text-[11px] font-mono text-[#9E9E9E]">
              Chop loops, trim boundaries & trigger 16-pad slices in real time
            </span>
          </div>
        </div>

        {/* Quick Factory Sample Presets */}
        <div className="flex items-center gap-1.5 flex-wrap bg-[#18181B] p-1 rounded-lg border border-[#28282A]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 ml-1" />
          <span className="text-[10px] font-mono text-[#9E9E9E] mr-1">PRESETS:</span>
          <button
            onClick={() => generateFactorySample('soul_guitar')}
            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] hover:text-[#C4B5FD] transition-colors"
          >
            Soul Guitar
          </button>
          <button
            onClick={() => generateFactorySample('vocal_chop')}
            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] hover:text-[#C4B5FD] transition-colors"
          >
            Vocal Hook
          </button>
          <button
            onClick={() => generateFactorySample('808_boom')}
            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] hover:text-[#C4B5FD] transition-colors"
          >
            808 Boom
          </button>
          <button
            onClick={() => generateFactorySample('lofi_keys')}
            className="px-2 py-1 rounded text-[11px] font-semibold bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] hover:text-[#C4B5FD] transition-colors"
          >
            Lo-Fi Rhodes
          </button>
        </div>
      </div>

      {/* Waveform Display Canvas */}
      <div className="relative bg-[#0A0A0B] rounded-xl border border-[#28282A] p-2 shadow-inner overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={140}
          className="w-full h-[140px] rounded-lg block"
        />

        {/* Waveform Overlay Badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#18181B]/80 backdrop-blur border border-[#28282A] font-mono text-[11px] font-bold text-[#F0F0F0]">
            {sampleName}
          </span>
          {loadedBuffer && (
            <span className="px-2 py-0.5 rounded bg-[#7C5DFF]/20 border border-[#7C5DFF]/40 font-mono text-[10px] text-[#C4B5FD]">
              {loadedBuffer.duration.toFixed(2)}s • {numSlices} Chops
            </span>
          )}
        </div>

        {/* Trim Start & End Range Sliders */}
        <div className="mt-2 grid grid-cols-2 gap-4 px-2 py-1 bg-[#18181B]/70 rounded-lg border border-[#28282A] text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-[#9E9E9E]">TRIM START:</span>
            <input
              type="range"
              min="0"
              max="0.95"
              step="0.01"
              value={trimStart}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val < trimEnd) setTrimStart(val);
              }}
              className="w-full accent-[#7C5DFF]"
            />
            <span className="text-[#F0F0F0] font-bold w-10">
              {Math.round(trimStart * 100)}%
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#9E9E9E]">TRIM END:</span>
            <input
              type="range"
              min="0.05"
              max="1.0"
              step="0.01"
              value={trimEnd}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (val > trimStart) setTrimEnd(val);
              }}
              className="w-full accent-[#EC4899]"
            />
            <span className="text-[#F0F0F0] font-bold w-10">
              {Math.round(trimEnd * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* MPC 16-Pad Slicer & Chopper Matrix */}
      <div className="bg-[#18181B] p-4 rounded-xl border border-[#28282A] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4 text-amber-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
              MPC Slicer Drum Pads
            </h4>
          </div>

          {/* Slices count selector & tools */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-[#0A0A0B] rounded-lg border border-[#28282A] p-0.5">
              {([4, 8, 16] as const).map((cnt) => (
                <button
                  key={cnt}
                  onClick={() => setNumSlices(cnt)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all ${
                    numSlices === cnt
                      ? 'bg-[#7C5DFF] text-white'
                      : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
                  }`}
                >
                  {cnt} SLICES
                </button>
              ))}
            </div>

            <button
              onClick={handleReverseBuffer}
              className={`px-2.5 py-1 rounded text-xs font-mono font-semibold border transition-all ${
                isReversed
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:text-[#E0E0E0]'
              }`}
              title="Reverse the entire audio buffer"
            >
              <RotateCcw className="w-3.5 h-3.5 inline mr-1" />
              <span>REVERSE</span>
            </button>
          </div>
        </div>

        {/* Pads Grid (4, 8, or 16 pads) */}
        <div
          className={`grid gap-2.5 ${
            numSlices === 4
              ? 'grid-cols-4'
              : numSlices === 8
              ? 'grid-cols-4 sm:grid-cols-8'
              : 'grid-cols-4 sm:grid-cols-8'
          }`}
        >
          {Array.from({ length: numSlices }).map((_, idx) => {
            const isActive = activePad === idx;
            const padKeys = ['1', '2', '3', '4', '5', '6', '7', '8', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I'];
            const keyShortcut = padKeys[idx] || '';

            return (
              <button
                key={idx}
                onClick={() => triggerSlicePad(idx)}
                className={`h-16 rounded-xl border flex flex-col items-center justify-between p-2 transition-all select-none shadow-md ${
                  isActive
                    ? 'bg-amber-500 text-[#0A0A0B] border-amber-400 scale-95 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                    : 'bg-[#0E0E10] border-[#28282A] hover:border-[#7C5DFF] hover:bg-[#1E1E24] text-[#E0E0E0]'
                }`}
              >
                <div className="w-full flex justify-between items-center text-[10px] font-mono">
                  <span className="font-bold opacity-75">PAD {idx + 1}</span>
                  {keyShortcut && (
                    <span className="px-1 bg-[#18181B] rounded border border-[#3F3F46] text-[#C4B5FD] font-bold">
                      {keyShortcut}
                    </span>
                  )}
                </div>
                <Play className="w-4 h-4 opacity-50 fill-current" />
                <span className="text-[9px] font-mono text-[#9E9E9E]">
                  Slice {idx + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drag & Drop Sound File Import Box */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processAudioFile(e.dataTransfer.files[0]);
          }
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`p-6 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#7C5DFF] bg-[#7C5DFF]/15'
            : 'border-[#28282A] bg-[#0E0E10]/50 hover:bg-[#18181B] hover:border-[#7C5DFF]/50'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          accept="audio/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              processAudioFile(e.target.files[0]);
            }
          }}
        />

        <div className="w-10 h-10 rounded-full bg-[#7C5DFF]/10 border border-[#7C5DFF]/30 flex items-center justify-center text-[#9B82FF] mb-2">
          <Upload className="w-5 h-5" />
        </div>

        <p className="text-xs font-bold text-[#F0F0F0]">
          {loading ? 'Decoding Audio Sample...' : 'Import Custom Sample (WAV, MP3, AIFF)'}
        </p>
        <p className="text-[11px] text-[#9E9E9E] mt-0.5">
          Drag & drop your own audio samples or vocal acapellas here to chop and pitch-shift
        </p>
      </div>
    </div>
  );
};
