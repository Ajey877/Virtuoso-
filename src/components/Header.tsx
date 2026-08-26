import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Disc,
  Download,
  HelpCircle,
  Maximize,
  Minimize,
  Mic,
  Music,
  Power,
  Radio,
  Scissors,
  Sliders,
  Sparkles,
  Volume2,
  VolumeX,
  Wand2,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { AppTab } from '../types/audio';
import { RotaryKnob } from './common/RotaryKnob';
import { VuMeter } from './common/VuMeter';

interface HeaderProps {
  activeTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  onOpenExport: () => void;
  onOpenShortcuts?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  onOpenExport,
  onOpenShortcuts,
}) => {
  const engine = AudioEngine.getInstance();
  const [, setTick] = useState(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const wakeLockRef = useRef<any>(null);

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => {
      setTick((t) => t + 1);

      // Manage Wake Lock based on engine state
      if (engine.isRunning && !wakeLockRef.current && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen')
          .then((wl) => { wakeLockRef.current = wl; })
          .catch((err) => console.warn('Wake Lock failed:', err));
      } else if (!engine.isRunning && wakeLockRef.current) {
        wakeLockRef.current.release()
          .then(() => { wakeLockRef.current = null; })
          .catch((err: any) => console.warn('Wake Lock release failed:', err));
      }
    });

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      unsub();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (wakeLockRef.current) {
        wakeLockRef.current.release().catch(() => {});
      }
    };
  }, [engine]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const handleTapTempo = () => {
    const now = performance.now();
    const newTaps = [...tapTimes.filter((t) => now - t < 3000), now];
    setTapTimes(newTaps);

    if (newTaps.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTaps.length; i++) {
        intervals.push(newTaps[i] - newTaps[i - 1]);
      }
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const calculatedBpm = Math.round(60000 / avgInterval);
      const boundedBpm = Math.max(40, Math.min(260, calculatedBpm));
      engine.bpm = boundedBpm;
      engine.notifyStateChange();
    }
  };

  const handleToggleAudio = async () => {
    if (!engine.isRunning) {
      await engine.init();
    } else if (engine.ctx) {
      if (engine.ctx.state === 'running') {
        await engine.ctx.suspend();
        engine.isRunning = false;
      } else {
        await engine.ctx.resume();
        engine.isRunning = true;
      }
      engine.notifyStateChange();
    }
  };

  const tabs: Array<{ id: AppTab; label: string; icon: React.ReactNode }> = [
    { id: 'instruments', label: 'Instruments', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'pianoroll', label: 'Piano Roll', icon: <Music className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'sequencer', label: 'Groovebox', icon: <Disc className="w-3.5 h-3.5" /> },
    { id: 'sampler', label: 'MPC Slicer', icon: <Scissors className="w-3.5 h-3.5 text-[#9B82FF]" /> },
    { id: 'scales', label: 'Scales & Chords', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'designer', label: 'Sound Design', icon: <Wand2 className="w-3.5 h-3.5" /> },
    { id: 'vst', label: 'VST Rack (8)', icon: <Sliders className="w-3.5 h-3.5" /> },
    { id: 'routing', label: 'Routing Matrix', icon: <Radio className="w-3.5 h-3.5" /> },
    { id: 'recorder', label: 'Multi-Track DAW', icon: <Activity className="w-3.5 h-3.5" /> },
    { id: 'midi', label: 'MIDI Studio', icon: <Sliders className="w-3.5 h-3.5" /> },
  ];

  return (
    <header id="app-header" className="bg-[#0A0A0B]/95 backdrop-blur-md border-b border-[#28282A] text-[#E0E0E0] select-none sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
        {/* Left: Branding & Engine Power */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5DFF]/30 to-[#9B82FF]/10 border border-[#7C5DFF]/40 flex items-center justify-center text-[#F0F0F0] font-black text-sm tracking-tighter shadow-[0_0_12px_rgba(124,93,255,0.25)]">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wider text-[#F0F0F0] bg-gradient-to-r from-white via-[#F0F0F0] to-[#C4B5FD] bg-clip-text text-transparent">
                  COOKUP
                </span>
                <span className="text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-[#7C5DFF]/20 text-[#9B82FF] border border-[#7C5DFF]/35 tracking-wider">
                  BEAT LAB
                </span>
              </div>
              <span className="text-[10px] text-[#9E9E9E] block -mt-0.5">
                32-Voice Low Latency DSP • 808s & Sound Engine
              </span>
            </div>
          </div>

          <button
            id="audio-power-btn"
            onClick={handleToggleAudio}
            title={engine.isRunning ? 'Audio Engine Running' : 'Click to Enable Audio'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              engine.isRunning
                ? 'bg-[#7C5DFF]/15 border-[#7C5DFF]/40 text-[#9B82FF] shadow-[0_0_12px_rgba(124,93,255,0.2)]'
                : 'bg-red-950/40 border-red-500/40 text-red-300 animate-pulse'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{engine.isRunning ? 'DSP ON' : 'DSP OFF'}</span>
          </button>
        </div>

        {/* Center: Navigation Tabs */}
        <nav className="hidden md:flex items-center bg-[#121214] p-1 rounded-lg border border-[#28282A]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold shadow-[0_0_12px_rgba(124,93,255,0.3)]'
                  : 'text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#18181B]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Right: Master Clock, Volume, Rec & Export */}
        <div className="flex items-center gap-2.5">
          {/* BPM & Metronome */}
          <div className="flex items-center gap-1 bg-[#121214] px-2.5 py-1 rounded-lg border border-[#28282A] text-xs">
            <div className="flex flex-col">
              <span className="text-[9px] text-[#9E9E9E] font-mono">TEMPO</span>
              <div className="flex items-center gap-1 font-mono font-bold text-[#E0E0E0]">
                <input
                  type="number"
                  min="40"
                  max="260"
                  value={engine.bpm}
                  onChange={(e) => {
                    engine.bpm = Math.max(40, Math.min(260, parseInt(e.target.value) || 120));
                    engine.notifyStateChange();
                  }}
                  className="w-10 bg-transparent text-right focus:outline-none text-[#9B82FF] font-mono text-xs"
                />
                <span className="text-[10px] text-[#9E9E9E]">BPM</span>
              </div>
            </div>

            <button
              id="tap-tempo-btn"
              onClick={handleTapTempo}
              className="px-1.5 py-1 text-[10px] uppercase font-mono font-bold rounded bg-[#18181B] text-[#E0E0E0] hover:bg-[#28282A] hover:text-[#9B82FF] ml-1 transition-colors"
            >
              Tap
            </button>

            <button
              id="metronome-toggle-btn"
              onClick={() => engine.toggleMetronome()}
              className={`px-1.5 py-1 rounded text-xs ml-0.5 transition-all ${
                engine.metronomeEnabled
                  ? 'bg-[#7C5DFF]/20 text-[#9B82FF] border border-[#7C5DFF]/40'
                  : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
              }`}
              title="Toggle Metronome (Click)"
            >
              {engine.metronomeEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Master Volume & VU Meter */}
          <div className="flex items-center gap-2 bg-[#121214] px-2 py-1 rounded-lg border border-[#28282A]">
            <RotaryKnob
              id="master-vol-knob"
              label="MASTER"
              value={engine.masterVolume}
              min={0}
              max={1.2}
              step={0.01}
              defaultValue={0.85}
              size="sm"
              color="#7C5DFF"
              onChange={(val) => {
                engine.masterVolume = val;
                if (engine.masterGain && engine.ctx) {
                  engine.masterGain.gain.setValueAtTime(val, engine.ctx.currentTime);
                }
                engine.notifyStateChange();
              }}
            />
            <VuMeter id="master-vu-meter" />
          </div>

          {/* Export Action */}
          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg bg-[#121214] border border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#18181B] transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>

          <button
            id="export-modal-btn"
            onClick={onOpenExport}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#7C5DFF] hover:bg-[#6C4DE6] text-[#FFFFFF] font-bold text-xs shadow-[0_0_15px_rgba(124,93,255,0.35)] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">EXPORT</span>
          </button>

          {/* Shortcuts Guide (Optional) */}
          {onOpenShortcuts && (
            <button
              id="shortcuts-btn"
              onClick={onOpenShortcuts}
              title="Keyboard Shortcuts & Guide"
              className="p-2 rounded-lg bg-[#121214] border border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#18181B] transition-colors"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Row */}
      <div className="md:hidden flex items-center overflow-x-auto px-4 py-2 bg-[#121214] border-t border-[#28282A] gap-1.5 scrollbar-thin">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold'
                : 'text-[#9E9E9E] hover:bg-[#18181B]'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};
