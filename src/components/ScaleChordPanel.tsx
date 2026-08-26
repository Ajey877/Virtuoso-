import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Lock,
  Music,
  Pause,
  Play,
  Repeat,
  Sliders,
  Sparkles,
  Unlock,
  Volume2,
  Zap,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import {
  ProgressionEngine,
  PRODUCER_PROGRESSIONS,
} from '../audio/synthesis/ProgressionEngine';
import { CHORDS, NOTE_NAMES, SCALES, TUNINGS } from '../audio/synthesis/scales';
import { ChordDefinition } from '../types/audio';
import { RotaryKnob } from './common/RotaryKnob';
import { useAppStore } from '../store/useAppStore';

export const ScaleChordPanel: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const progEngine = ProgressionEngine.getInstance();
  const { syncFromEngine } = useAppStore();
  const [rev, setRev] = useState(0);

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => syncFromEngine());
    return () => unsub();
  }, [engine, syncFromEngine]);

  const activeProg = progEngine.getActiveProgression();

  const handlePlaySingleChord = (chord: ChordDefinition) => {
    const baseMidi = 60 + engine.octaveShift * 12 + engine.semitoneTranspose + engine.currentRootNote;
    chord.intervals.forEach((interval, idx) => {
      setTimeout(() => {
        engine.playNote(baseMidi + interval, 0.85);
      }, idx * progEngine.strumSpeedMs);
    });

    setTimeout(() => {
      chord.intervals.forEach((interval) => {
        engine.stopNote(baseMidi + interval);
      });
    }, 1200);
  };

  const handleTestOctaveSlide = (semitones: number) => {
    const base = 48 + engine.currentRootNote;
    engine.playNote(base, 0.9);
    setTimeout(() => {
      engine.playNote(base + semitones, 0.9);
    }, 120);
    setTimeout(() => {
      engine.stopNote(base);
      engine.stopNote(base + semitones);
    }, 700);
  };

  return (
    <div id="scale-chord-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#28282A] gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Smart Progressions, Scales & Legato Slide Engine
          </h3>
          <span className="text-[10px] font-mono text-[#9B82FF] bg-[#7C5DFF]/15 px-2 py-0.5 rounded border border-[#7C5DFF]/30">
            Trap 9ths • Neo-Soul 11ths • 808 Glide • Strummer
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Legato Glide Toggle */}
          <button
            onClick={() => {
              engine.glideEnabled = !engine.glideEnabled;
              engine.notifyStateChange();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              engine.glideEnabled
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'bg-[#18181B] border-[#28282A] text-[#71717A]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{engine.glideEnabled ? '808 GLIDE: ACTIVE' : 'GLIDE: OFF'}</span>
          </button>

          {/* Scale Lock Toggle */}
          <button
            id="scale-lock-btn-panel"
            onClick={() => {
              engine.scaleLockEnabled = !engine.scaleLockEnabled;
              engine.notifyStateChange();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
              engine.scaleLockEnabled
                ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#9B82FF] shadow-[0_0_10px_rgba(124,93,255,0.25)]'
                : 'bg-[#18181B] border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0]'
            }`}
          >
            {engine.scaleLockEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{engine.scaleLockEnabled ? 'SCALE LOCK: ON' : 'SCALE LOCK: OFF'}</span>
          </button>
        </div>
      </div>

      {/* TOP SECTION: Smart Chord Progression Builder & Rhythm Strummer */}
      <div className="bg-[#18181B] p-4 rounded-xl border border-[#7C5DFF]/35 shadow-lg">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 mb-3 border-b border-[#28282A]">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <h4 className="text-xs font-bold text-[#F0F0F0] tracking-wide">
                SMART CHORD PROGRESSION GENERATOR & RHYTHM STRUMMER
              </h4>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                {activeProg.tag}
              </span>
            </div>
            <p className="text-[11px] text-[#9E9E9E] mt-0.5">
              Key of <span className="text-[#F0F0F0] font-bold">{NOTE_NAMES[engine.currentRootNote]}</span> • {activeProg.genre} ({activeProg.mood})
            </p>
          </div>

          {/* Strum & Playback Controls */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Strum Speed Control */}
            <div className="flex items-center gap-2 bg-[#0A0A0B] px-2.5 py-1 rounded-lg border border-[#28282A]">
              <span className="text-[10px] font-mono text-[#9E9E9E]">STRUM:</span>
              <select
                value={progEngine.strumSpeedMs}
                onChange={(e) => {
                  progEngine.strumSpeedMs = parseInt(e.target.value);
                  setRev((t) => t + 1);
                }}
                className="bg-transparent text-[#F0F0F0] text-[10px] font-bold focus:outline-none"
              >
                <option value="0" className="bg-[#18181B]">Tight Block (0ms)</option>
                <option value="12" className="bg-[#18181B]">Fast Roll (12ms)</option>
                <option value="22" className="bg-[#18181B]">Piano Strum (22ms)</option>
                <option value="42" className="bg-[#18181B]">Guitar Roll (42ms)</option>
                <option value="60" className="bg-[#18181B]">Harp Arp (60ms)</option>
              </select>
            </div>

            {/* Humanize Velocity Toggle */}
            <button
              onClick={() => {
                progEngine.humanizeVelocity = !progEngine.humanizeVelocity;
                setRev((t) => t + 1);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                progEngine.humanizeVelocity
                  ? 'bg-[#7C5DFF]/20 border-[#7C5DFF]/60 text-[#C4B5FD]'
                  : 'bg-[#0A0A0B] border-[#28282A] text-[#71717A]'
              }`}
            >
              HUMANIZE: {progEngine.humanizeVelocity ? 'ON' : 'OFF'}
            </button>

            {/* Loop Play/Pause Button */}
            <button
              onClick={() => {
                if (progEngine.isPlaying) {
                  progEngine.stopPlayback();
                } else {
                  progEngine.startPlayback();
                }
              }}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
                progEngine.isPlaying
                  ? 'bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : 'bg-[#7C5DFF] text-[#0A0A0B] hover:bg-[#9B82FF] shadow-[0_0_12px_rgba(124,93,255,0.3)]'
              }`}
            >
              {progEngine.isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{progEngine.isPlaying ? 'STOP LOOP' : 'PLAY LOOP'}</span>
            </button>
          </div>
        </div>

        {/* Genre Progression Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin">
          {PRODUCER_PROGRESSIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                progEngine.currentProgressionId = p.id;
                if (progEngine.isPlaying) {
                  progEngine.startPlayback();
                } else {
                  setRev((t) => t + 1);
                }
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all border ${
                progEngine.currentProgressionId === p.id
                  ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold border-[#7C5DFF] shadow-[0_0_12px_rgba(124,93,255,0.3)]'
                  : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0]'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Interactive Step Cards Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {activeProg.steps.map((step, idx) => {
            const isCurrent = progEngine.isPlaying && progEngine.currentStepIndex === idx;
            const rootName = NOTE_NAMES[(engine.currentRootNote + step.rootOffset) % 12];

            return (
              <button
                key={idx}
                onClick={() => progEngine.triggerStep(idx)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                  isCurrent
                    ? 'bg-[#7C5DFF]/25 border-[#7C5DFF] shadow-[0_0_16px_rgba(124,93,255,0.35)] ring-1 ring-[#7C5DFF]'
                    : 'bg-[#0A0A0B] border-[#28282A] hover:border-[#7C5DFF]/50 hover:bg-[#18181B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-mono font-bold text-[#71717A] group-hover:text-[#9B82FF]">
                    STEP {idx + 1}
                  </span>
                  <span className="text-[9px] font-mono px-1 rounded bg-[#18181B] text-[#9B82FF] border border-[#28282A]">
                    {step.roman}
                  </span>
                </div>

                <div className="text-sm font-extrabold text-[#F0F0F0] mb-0.5 group-hover:text-[#C4B5FD] transition-colors">
                  {rootName} {step.name}
                </div>

                <div className="flex items-center justify-between text-[10px] text-[#71717A] pt-1 border-t border-[#28282A]/80">
                  <span>{step.intervals.length} Voices</span>
                  <Play className="w-3 h-3 text-[#71717A] group-hover:text-[#9B82FF] fill-current" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* THREE COLUMN GRID: Key/Scale, Tunings/Arp & 808 Glide Lab */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Scale & Root Note Selection */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#F0F0F0] block mb-2">SCALE & KEY MODALITY</span>

            {/* Root Note selector buttons */}
            <div className="flex flex-wrap gap-1 mb-3">
              {NOTE_NAMES.map((name, idx) => (
                <button
                  key={name}
                  onClick={() => {
                    engine.currentRootNote = idx;
                    engine.notifyStateChange();
                  }}
                  className={`px-2 py-1 rounded text-xs font-mono font-bold transition-colors ${
                    engine.currentRootNote === idx
                      ? 'bg-[#7C5DFF] text-white shadow-[0_0_10px_rgba(124,93,255,0.4)]'
                      : 'bg-[#0A0A0B] text-[#9E9E9E] hover:bg-[#232326] hover:text-[#F0F0F0] border border-[#28282A]'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Scale Presets list */}
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              {SCALES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => {
                    engine.currentScaleId = s.id;
                    engine.notifyStateChange();
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition-all border flex items-center justify-between ${
                    engine.currentScaleId === s.id
                      ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] font-bold shadow-[0_0_10px_rgba(124,93,255,0.15)]'
                      : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#232326] hover:text-[#F0F0F0]'
                  }`}
                >
                  <span>{s.name}</span>
                  <span className="text-[9px] font-mono text-[#71717A]">{s.intervals.length} notes</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E]">
            {SCALES.find((s) => s.id === engine.currentScaleId)?.description}
          </div>
        </div>

        {/* Column 2: Microtonal Tunings & Arpeggiator */}
        <div className="space-y-4">
          {/* Microtonal Tunings */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <span className="text-xs font-bold text-[#F0F0F0] block mb-2">MICROTONAL TUNING SYSTEM</span>
            <div className="space-y-1.5">
              {TUNINGS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    engine.currentTuningId = t.id;
                    engine.notifyStateChange();
                  }}
                  className={`w-full text-left p-2 rounded text-xs transition-all border ${
                    engine.currentTuningId === t.id
                      ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] font-bold shadow-[0_0_10px_rgba(124,93,255,0.15)]'
                      : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#232326] hover:text-[#F0F0F0]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{t.name}</span>
                  </div>
                  <p className="text-[10px] text-[#71717A] mt-0.5">{t.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Arpeggiator Engine */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F0F0F0] flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-[#9B82FF]" />
                ARPEGGIATOR
              </span>
              <button
                onClick={() => {
                  engine.arpeggiator.enabled = !engine.arpeggiator.enabled;
                  engine.notifyStateChange();
                }}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  engine.arpeggiator.enabled
                    ? 'bg-[#7C5DFF] text-white shadow-[0_0_10px_rgba(124,93,255,0.4)]'
                    : 'bg-[#0A0A0B] text-[#71717A] border border-[#28282A]'
                }`}
              >
                {engine.arpeggiator.enabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col gap-1 text-[10px]">
                <span className="text-[#9E9E9E] font-mono">MODE:</span>
                <select
                  value={engine.arpeggiator.mode}
                  onChange={(e) => {
                    engine.arpeggiator.mode = e.target.value as any;
                    engine.notifyStateChange();
                  }}
                  className="bg-[#0A0A0B] text-[#E0E0E0] border border-[#28282A] rounded p-1 text-[10px] focus:outline-none focus:border-[#7C5DFF]"
                >
                  <option value="up">Up</option>
                  <option value="down">Down</option>
                  <option value="upDown">Up & Down</option>
                  <option value="random">Random</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-[10px]">
                <span className="text-[#9E9E9E] font-mono">RATE:</span>
                <select
                  value={engine.arpeggiator.rate}
                  onChange={(e) => {
                    engine.arpeggiator.rate = e.target.value as any;
                    engine.notifyStateChange();
                  }}
                  className="bg-[#0A0A0B] text-[#E0E0E0] border border-[#28282A] rounded p-1 text-[10px] focus:outline-none focus:border-[#7C5DFF]"
                >
                  <option value="1/4">1/4</option>
                  <option value="1/8">1/8</option>
                  <option value="1/16">1/16</option>
                  <option value="1/32">1/32</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 text-[10px]">
                <span className="text-[#9E9E9E] font-mono">OCTAVES:</span>
                <select
                  value={engine.arpeggiator.octaves}
                  onChange={(e) => {
                    engine.arpeggiator.octaves = parseInt(e.target.value);
                    engine.notifyStateChange();
                  }}
                  className="bg-[#0A0A0B] text-[#E0E0E0] border border-[#28282A] rounded p-1 text-[10px] focus:outline-none focus:border-[#7C5DFF]"
                >
                  <option value="1">1 Oct</option>
                  <option value="2">2 Oct</option>
                  <option value="3">3 Oct</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Column 3: 808 Legato Glide & Slide Test Pad */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F0F0F0] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-amber-400" />
                808 DRILL SLIDE & GLIDE LAB
              </span>
              <span className="text-[10px] font-mono text-amber-400">Trap / Drill</span>
            </div>
            <p className="text-[11px] text-[#9E9E9E] mb-3 leading-relaxed">
              Monophonic legato pitch glides without retriggering attack clicks:
            </p>

            {/* Glide Controls */}
            <div className="space-y-2.5 mb-3 bg-[#0A0A0B] p-2.5 rounded-lg border border-[#28282A]">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono text-[#9E9E9E]">GLIDE DURATION:</span>
                <span className="font-mono text-amber-400 font-bold">
                  {Math.round(engine.glideTime * 1000)} ms
                </span>
              </div>
              <input
                type="range"
                min="0.02"
                max="0.4"
                step="0.01"
                value={engine.glideTime}
                onChange={(e) => {
                  engine.glideTime = parseFloat(e.target.value);
                  engine.notifyStateChange();
                }}
                className="w-full h-1.5 bg-[#28282A] rounded-lg appearance-none cursor-pointer accent-amber-400"
              />

              <div className="flex items-center justify-between text-[10px]">
                <span className="font-mono text-[#9E9E9E]">GLIDE MODE:</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      engine.glideMode = 'legato';
                      engine.notifyStateChange();
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      engine.glideMode === 'legato'
                        ? 'bg-amber-400 text-black'
                        : 'bg-[#18181B] text-[#71717A]'
                    }`}
                  >
                    Legato Only
                  </button>
                  <button
                    onClick={() => {
                      engine.glideMode = 'always';
                      engine.notifyStateChange();
                    }}
                    className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                      engine.glideMode === 'always'
                        ? 'bg-amber-400 text-black'
                        : 'bg-[#18181B] text-[#71717A]'
                    }`}
                  >
                    Always
                  </button>
                </div>
              </div>
            </div>

            {/* Drill Slide Test Triggers */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleTestOctaveSlide(12)}
                className="p-2 rounded-lg bg-[#0A0A0B] border border-[#28282A] hover:border-amber-400/50 hover:bg-amber-500/10 text-left transition-all"
              >
                <span className="text-[11px] font-bold text-[#E0E0E0] block">+1 Octave Slide</span>
                <span className="text-[9px] font-mono text-amber-400">Drill Snap ↑</span>
              </button>

              <button
                onClick={() => handleTestOctaveSlide(7)}
                className="p-2 rounded-lg bg-[#0A0A0B] border border-[#28282A] hover:border-amber-400/50 hover:bg-amber-500/10 text-left transition-all"
              >
                <span className="text-[11px] font-bold text-[#E0E0E0] block">+5th Glide Slide</span>
                <span className="text-[9px] font-mono text-amber-400">Trap Melodic ↑</span>
              </button>
            </div>
          </div>

          <div className="pt-2 mt-3 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Legato Curve: Exponential</span>
            <span className="font-mono text-amber-400">32-Voice Synced</span>
          </div>
        </div>
      </div>
    </div>
  );
};

