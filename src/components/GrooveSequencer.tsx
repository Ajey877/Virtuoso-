import React, { useState, useEffect } from 'react';
import {
  Activity,
  Copy,
  Disc,
  Download,
  Flame,
  Music,
  Play,
  Plus,
  Radio,
  RotateCcw,
  Shuffle,
  Sliders,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  Waves,
  Zap,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import {
  DrumTrackState,
  SEQUENCER_PRESETS,
  SequencerEngine,
  SequencerPreset,
} from '../audio/SequencerEngine';
import { DrumEngine, DrumSoundId } from '../audio/synthesis/DrumEngine';
import { NOTE_NAMES } from '../audio/synthesis/scales';
import { RotaryKnob } from './common/RotaryKnob';

export const GrooveSequencer: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const sequencer = SequencerEngine.getInstance();
  const drumEngine = DrumEngine.getInstance();

  const [isPlaying, setIsPlaying] = useState(sequencer.isPlaying);
  const [activeStep, setActiveStep] = useState(sequencer.currentStep);
  const [, setTick] = useState(0);
  const [selectedPresetId, setSelectedPresetId] = useState<string>(SEQUENCER_PRESETS[0].id);
  const [activeEditStep, setActiveEditStep] = useState<number | null>(null);

  useEffect(() => {
    const unsubStep = sequencer.subscribeStep((step) => {
      setActiveStep(step);
    });

    const unsubState = sequencer.subscribeState(() => {
      setIsPlaying(sequencer.isPlaying);
      setTick((t) => t + 1);
    });

    const unsubEngine = engine.subscribeStateChange(() => {
      setTick((t) => t + 1);
    });

    return () => {
      unsubStep();
      unsubState();
      unsubEngine();
    };
  }, [sequencer, engine]);

  const handleTogglePlay = () => {
    sequencer.togglePlay();
  };

  const handleStepClick = (track: DrumTrackState, stepIdx: number) => {
    track.steps[stepIdx].active = !track.steps[stepIdx].active;
    // Audition sound if activated
    if (track.steps[stepIdx].active && engine.ctx && engine.masterGain) {
      drumEngine.triggerDrum(engine.ctx, engine.masterGain, track.soundId, 0.85);
    }
    setTick((t) => t + 1);
  };

  const handleMelodicStepClick = (stepIdx: number) => {
    const step = sequencer.melodicTrack.steps[stepIdx];
    step.active = !step.active;
    if (step.active) {
      const rootMidi = 60 + engine.octaveShift * 12 + sequencer.melodicTrack.octaveOffset * 12;
      const pitch = rootMidi + (step.pitchOffset || 0);
      engine.playNote(pitch, step.velocity);
      setTimeout(() => engine.stopNote(pitch), 250);
    }
    setTick((t) => t + 1);
  };

  const handleAuditionDrum = (soundId: DrumSoundId) => {
    if (engine.ctx && engine.masterGain) {
      drumEngine.triggerDrum(engine.ctx, engine.masterGain, soundId, 0.9);
    }
  };

  const handleSelectPreset = (preset: SequencerPreset) => {
    setSelectedPresetId(preset.id);
    sequencer.loadPreset(preset);
  };

  const handleBounceToDaw = () => {
    // Add track into DAW recorded tracks
    const inst = engine.currentInstrument;
    const now = Date.now();
    const newTrack = {
      id: `seq_track_${now}`,
      name: `Beat Pattern (${SEQUENCER_PRESETS.find((p) => p.id === selectedPresetId)?.name || 'Custom'})`,
      color: '#7C5DFF',
      instrumentId: inst.id,
      instrumentName: `${inst.name} + Drums`,
      midiEvents: [],
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false,
      busId: 'busA',
      duration: 4.0,
    };
    engine.recordedTracks.push(newTrack);
    engine.notifyStateChange();
    alert('Pattern loop recorded directly into Multi-Track DAW session!');
  };

  const getMelodicNoteLabel = (pitchOffset: number = 0) => {
    const rootMidi = 60 + engine.octaveShift * 12 + sequencer.melodicTrack.octaveOffset * 12;
    const pitch = rootMidi + pitchOffset;
    const noteClass = ((pitch % 12) + 12) % 12;
    const oct = Math.floor(pitch / 12) - 1;
    return `${NOTE_NAMES[noteClass]}${oct}`;
  };

  return (
    <div id="groove-sequencer-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl space-y-4">
      {/* Top Header & Transport Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#28282A]">
        {/* Left: Section Title & Badge */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#7C5DFF]/15 border border-[#7C5DFF]/30 text-[#9B82FF]">
            <Disc className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#F0F0F0]">
                16-Step Beat Sequencer & Groovebox
              </h3>
              <span className="text-[10px] font-mono text-[#9B82FF] bg-[#7C5DFF]/15 px-2 py-0.5 rounded border border-[#7C5DFF]/30">
                WebAudio Analog DSP Drums + Melodic Synth
              </span>
            </div>
            <p className="text-xs text-[#9E9E9E]">
              Zero-latency drum machine synced to project BPM with swing and scale harmony
            </p>
          </div>
        </div>

        {/* Center/Right: Play/Stop, BPM, Swing, Presets */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 bg-[#18181B] px-2.5 py-1 rounded-lg border border-[#28282A]">
            <Sparkles className="w-3.5 h-3.5 text-[#9B82FF]" />
            <span className="text-[10px] text-[#9E9E9E] font-mono font-bold">GENRE:</span>
            <select
              value={selectedPresetId}
              onChange={(e) => {
                const found = SEQUENCER_PRESETS.find((p) => p.id === e.target.value);
                if (found) handleSelectPreset(found);
              }}
              className="bg-[#0A0A0B] text-xs font-mono text-[#F0F0F0] border border-[#28282A] rounded px-2 py-0.5 focus:outline-none focus:border-[#7C5DFF]"
            >
              {SEQUENCER_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.genre} • {p.bpm} BPM)
                </option>
              ))}
            </select>
          </div>

          {/* Swing Control */}
          <div className="flex items-center gap-2 bg-[#18181B] px-2.5 py-1 rounded-lg border border-[#28282A] text-xs">
            <span className="text-[10px] text-[#9E9E9E] font-mono">SWING:</span>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.05"
              value={sequencer.swing}
              onChange={(e) => {
                sequencer.swing = parseFloat(e.target.value);
                setTick((t) => t + 1);
              }}
              className="w-16 accent-[#7C5DFF] cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-[#9B82FF]">
              {Math.round(sequencer.swing * 100)}%
            </span>
          </div>

          {/* Sidechain Ducking Pumping Bus */}
          <button
            onClick={() => {
              engine.sidechainEnabled = !engine.sidechainEnabled;
              engine.notifyStateChange();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all ${
              engine.sidechainEnabled
                ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : 'bg-[#18181B] border-[#28282A] text-[#71717A]'
            }`}
            title="Ducks master audio on every kick hit for EDM/Trap rhythm pump"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>{engine.sidechainEnabled ? 'SIDECHAIN: PUMPING' : 'SIDECHAIN: OFF'}</span>
          </button>

          {/* Randomize & Clear */}
          <button
            onClick={() => sequencer.randomize()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] text-xs font-semibold text-[#E0E0E0] hover:bg-[#232326] hover:border-[#7C5DFF]/40 transition-all"
            title="Randomize Drum & Melodic Steps"
          >
            <Shuffle className="w-3.5 h-3.5 text-[#9B82FF]" />
            <span>Randomize</span>
          </button>

          <button
            onClick={() => sequencer.clearAll()}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] text-xs font-semibold text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#232326] transition-all"
            title="Clear all steps"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          {/* Master Play/Stop Button */}
          <button
            id="sequencer-play-btn"
            onClick={handleTogglePlay}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md cursor-pointer ${
              isPlaying
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse'
                : 'bg-[#7C5DFF] hover:bg-[#6C47FF] text-white shadow-[0_0_15px_rgba(124,93,255,0.35)]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                <span>STOP</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>START BEAT</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 16-Step Header Indicator Bar */}
      <div className="grid grid-cols-[140px_1fr] gap-2 items-center">
        <div className="text-[10px] font-mono text-[#9E9E9E] uppercase tracking-wider pl-1">
          TRACK / VOICE
        </div>

        {/* 16 Step Beat Markers */}
        <div className="grid grid-cols-16 gap-1">
          {Array.from({ length: 16 }).map((_, stepIdx) => {
            const isDownbeat = stepIdx % 4 === 0;
            const isCurrent = activeStep === stepIdx && isPlaying;
            return (
              <div
                key={stepIdx}
                className={`text-center py-1 rounded text-[10px] font-mono font-bold transition-all ${
                  isCurrent
                    ? 'bg-[#7C5DFF] text-[#0A0A0B] shadow-[0_0_10px_#7C5DFF]'
                    : isDownbeat
                    ? 'bg-[#18181B] text-[#F0F0F0] border border-[#28282A]'
                    : 'text-[#71717A]'
                }`}
              >
                {stepIdx + 1}
              </div>
            );
          })}
        </div>
      </div>

      {/* Drum Tracks Grid */}
      <div className="space-y-2">
        {sequencer.drumTracks.map((track) => {
          const hasSolo = sequencer.drumTracks.some((t) => t.solo);
          const isSilenced = track.muted || (hasSolo && !track.solo);

          return (
            <div
              key={track.soundId}
              className={`grid grid-cols-[140px_1fr] gap-2 items-center p-1.5 rounded-xl border transition-all ${
                isSilenced
                  ? 'bg-[#0E0E10] border-[#202022] opacity-60'
                  : 'bg-[#18181B]/80 border-[#28282A] hover:border-[#38383C]'
              }`}
            >
              {/* Track Controls */}
              <div className="flex items-center justify-between pr-2">
                <button
                  onClick={() => handleAuditionDrum(track.soundId)}
                  className="flex items-center gap-1.5 text-left group hover:text-white transition-colors"
                  title="Click to audition sound"
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: track.color }}
                  />
                  <span className="text-xs font-bold text-[#F0F0F0] group-hover:text-[#9B82FF] truncate max-w-[70px]">
                    {track.shortName}
                  </span>
                </button>

                {/* Mute & Solo */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      track.muted = !track.muted;
                      setTick((t) => t + 1);
                    }}
                    className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all ${
                      track.muted
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#0A0A0B] text-[#71717A] hover:text-[#E0E0E0] border border-[#28282A]'
                    }`}
                    title="Mute Track"
                  >
                    M
                  </button>
                  <button
                    onClick={() => {
                      track.solo = !track.solo;
                      setTick((t) => t + 1);
                    }}
                    className={`w-5 h-5 rounded text-[9px] font-mono font-bold flex items-center justify-center transition-all ${
                      track.solo
                        ? 'bg-blue-500 text-white'
                        : 'bg-[#0A0A0B] text-[#71717A] hover:text-[#E0E0E0] border border-[#28282A]'
                    }`}
                    title="Solo Track"
                  >
                    S
                  </button>
                </div>
              </div>

              {/* 16 Step Pads */}
              <div className="grid grid-cols-16 gap-1">
                {track.steps.map((step, stepIdx) => {
                  const isBeatStart = stepIdx % 4 === 0;
                  const isCurrent = activeStep === stepIdx && isPlaying;

                  return (
                    <button
                      key={stepIdx}
                      id={`drum-step-${track.soundId}-${stepIdx}`}
                      onClick={() => handleStepClick(track, stepIdx)}
                      className={`h-9 rounded-md transition-all flex flex-col items-center justify-end p-0.5 relative group cursor-pointer ${
                        step.active
                          ? 'shadow-[0_0_12px_rgba(124,93,255,0.3)]'
                          : isBeatStart
                          ? 'bg-[#121214] border border-[#28282A] hover:bg-[#232326]'
                          : 'bg-[#0A0A0B] border border-[#202022] hover:bg-[#18181B]'
                      } ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                      style={{
                        backgroundColor: step.active ? track.color : undefined,
                        borderColor: step.active ? track.color : undefined,
                      }}
                    >
                      {/* Step Indicator Dot */}
                      {step.active && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white mb-1 shadow-sm" />
                      )}

                      {/* Velocity bar at bottom */}
                      {step.active && (
                        <div
                          className="w-full bg-black/40 rounded-sm"
                          style={{ height: `${Math.max(2, step.velocity * 6)}px` }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Melodic Synth Lead Track */}
      <div className="pt-2 border-t border-[#28282A]">
        <div className="grid grid-cols-[140px_1fr] gap-2 items-center p-2 rounded-xl bg-[#18181B] border border-[#7C5DFF]/30 shadow-md">
          {/* Melodic Track Info */}
          <div className="pr-2">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-[#9B82FF]" />
              <span className="text-xs font-bold text-[#F0F0F0] truncate">MELODIC LINE</span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[9px] font-mono text-[#9B82FF] bg-[#7C5DFF]/15 px-1 rounded truncate max-w-[80px]">
                {engine.currentInstrument.name}
              </span>
            </div>
          </div>

          {/* 16 Melodic Step Pads with Pitch */}
          <div className="grid grid-cols-16 gap-1">
            {sequencer.melodicTrack.steps.map((step, stepIdx) => {
              const isBeatStart = stepIdx % 4 === 0;
              const isCurrent = activeStep === stepIdx && isPlaying;
              const pitchLabel = getMelodicNoteLabel(step.pitchOffset || 0);

              return (
                <div key={stepIdx} className="relative">
                  <button
                    id={`melodic-step-${stepIdx}`}
                    onClick={() => handleMelodicStepClick(stepIdx)}
                    className={`w-full h-11 rounded-md transition-all flex flex-col items-center justify-between p-1 cursor-pointer ${
                      step.active
                        ? 'bg-[#7C5DFF] text-[#0A0A0B] font-bold shadow-[0_0_12px_rgba(124,93,255,0.4)]'
                        : isBeatStart
                        ? 'bg-[#121214] border border-[#28282A] text-[#71717A] hover:bg-[#232326]'
                        : 'bg-[#0A0A0B] border border-[#202022] text-[#52525B] hover:bg-[#18181B]'
                    } ${isCurrent ? 'ring-2 ring-white scale-105 z-10' : ''}`}
                  >
                    <span className="text-[9px] font-mono leading-none">
                      {step.active ? pitchLabel : stepIdx + 1}
                    </span>

                    {step.active && (
                      <div className="w-full flex items-center justify-center">
                        <select
                          value={step.pitchOffset || 0}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => {
                            step.pitchOffset = parseInt(e.target.value);
                            setTick((t) => t + 1);
                          }}
                          className="bg-black/60 text-[8px] font-mono text-white rounded px-0.5 py-0 border-0 focus:outline-none cursor-pointer"
                        >
                          <option value="-12">-12 (Oct↓)</option>
                          <option value="-5">-5 (4th↓)</option>
                          <option value="0">Root (0)</option>
                          <option value="2">+2 (Maj 2nd)</option>
                          <option value="3">+3 (Min 3rd)</option>
                          <option value="4">+4 (Maj 3rd)</option>
                          <option value="5">+5 (4th)</option>
                          <option value="7">+7 (5th)</option>
                          <option value="9">+9 (6th)</option>
                          <option value="10">+10 (Min 7th)</option>
                          <option value="11">+11 (Maj 7th)</option>
                          <option value="12">+12 (Oct↑)</option>
                        </select>
                      </div>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-[#9E9E9E]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#F0F0F0]">PRODUCER WORKFLOW:</span>
          <span>Click any pad to toggle beat. Change pitch per step on the melodic line.</span>
        </div>

        <button
          onClick={handleBounceToDaw}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#18181B] hover:bg-[#232326] border border-[#28282A] text-[#F0F0F0] text-xs font-semibold rounded-lg transition-all hover:border-[#7C5DFF]/50 shadow-sm cursor-pointer"
        >
          <Copy className="w-3.5 h-3.5 text-[#9B82FF]" />
          <span>Bounce Groove into Multi-Track DAW</span>
        </button>
      </div>
    </div>
  );
};
