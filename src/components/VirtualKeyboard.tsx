import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Flame,
  Lock,
  Radio,
  Sliders,
  Sparkles,
  Unlock,
  Waves,
  Zap,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { COMPUTER_KEY_MAP, KeyboardMapper } from '../audio/KeyboardMapper';
import { NOTE_NAMES, SCALES } from '../audio/synthesis/scales';
import { RotaryKnob } from './common/RotaryKnob';

interface KeyInfo {
  midiNote: number;
  noteName: string;
  isBlack: boolean;
  computerKey?: string;
  octave: number;
}

export const VirtualKeyboard: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const mapper = KeyboardMapper.getInstance();

  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [pitchBendVal, setPitchBendVal] = useState(0);
  const [modWheelVal, setModWheelVal] = useState(0);
  const [, setTick] = useState(0);

  const isPitchDragging = useRef(false);
  const isModDragging = useRef(false);

  useEffect(() => {
    const unsubEngine = engine.subscribeStateChange(() => setTick((t) => t + 1));
    const unsubNote = engine.subscribeNoteEvent((note, _vel, isNoteOn) => {
      setActiveNotes((prev) => {
        const next = new Set(prev);
        if (isNoteOn) next.add(note);
        else next.delete(note);
        return next;
      });
    });

    return () => {
      unsubEngine();
      unsubNote();
    };
  }, [engine]);

  // Compute key layout (from C2 = 36 to B5 = 83, 4 octaves = 48 keys)
  const startMidi = 48; // C3
  const totalKeys = 36; // 3 full octaves
  const keys: KeyInfo[] = [];

  const baseNoteWithOctave = 60 + engine.octaveShift * 12 + engine.semitoneTranspose;

  // Build reverse lookup for computer keys
  const compKeyLookup: Record<number, string> = {};
  Object.entries(COMPUTER_KEY_MAP).forEach(([k, data]) => {
    const note = baseNoteWithOctave + data.noteOffset;
    if (!compKeyLookup[note]) compKeyLookup[note] = k.toUpperCase();
  });

  const scale = SCALES.find((s) => s.id === engine.currentScaleId);

  for (let i = 0; i < totalKeys; i++) {
    const midi = startMidi + i;
    const noteClass = ((midi % 12) + 12) % 12;
    const octave = Math.floor(midi / 12) - 1;
    const isBlack = [1, 3, 6, 8, 10].includes(noteClass);
    const noteName = `${NOTE_NAMES[noteClass]}${octave}`;

    keys.push({
      midiNote: midi,
      noteName,
      isBlack,
      computerKey: compKeyLookup[midi],
      octave,
    });
  }

  const isNoteInScale = (midi: number) => {
    if (!scale || scale.id === 'chromatic') return true;
    const noteClass = ((midi % 12) + 12) % 12;
    const interval = (noteClass - engine.currentRootNote + 12) % 12;
    return scale.intervals.includes(interval);
  };

  const handleKeyMouseDown = (midiNote: number) => {
    engine.playNote(midiNote, mapper.fixedVelocity);
  };

  const handleKeyMouseUp = (midiNote: number) => {
    engine.stopNote(midiNote);
  };

  const handleKeyMouseEnter = (e: React.MouseEvent, midiNote: number) => {
    if (e.buttons === 1) {
      engine.playNote(midiNote, mapper.fixedVelocity);
    }
  };

  const handleKeyMouseLeave = (e: React.MouseEvent, midiNote: number) => {
    if (e.buttons === 1) {
      engine.stopNote(midiNote);
    }
  };

  // Pitch bend wheel handlers
  const handlePitchMouseMove = (e: MouseEvent) => {
    if (!isPitchDragging.current) return;
    const deltaY = -e.movementY * 4;
    setPitchBendVal((prev) => {
      const next = Math.max(-200, Math.min(200, prev + deltaY));
      engine.setPitchBend(next);
      return next;
    });
  };

  const handlePitchMouseUp = () => {
    if (isPitchDragging.current) {
      isPitchDragging.current = false;
      // Spring back to center (0)
      setPitchBendVal(0);
      engine.setPitchBend(0);
      window.removeEventListener('mousemove', handlePitchMouseMove);
      window.removeEventListener('mouseup', handlePitchMouseUp);
    }
  };

  const handlePitchMouseDown = () => {
    isPitchDragging.current = true;
    window.addEventListener('mousemove', handlePitchMouseMove);
    window.addEventListener('mouseup', handlePitchMouseUp);
  };

  // Mod wheel handlers
  const handleModMouseMove = (e: MouseEvent) => {
    if (!isModDragging.current) return;
    const deltaY = -e.movementY * 0.01;
    setModWheelVal((prev) => {
      const next = Math.max(0, Math.min(1, prev + deltaY));
      engine.setModWheel(next);
      return next;
    });
  };

  const handleModMouseUp = () => {
    if (isModDragging.current) {
      isModDragging.current = false;
      window.removeEventListener('mousemove', handleModMouseMove);
      window.removeEventListener('mouseup', handleModMouseUp);
    }
  };

  const handleModMouseDown = () => {
    isModDragging.current = true;
    window.addEventListener('mousemove', handleModMouseMove);
    window.addEventListener('mouseup', handleModMouseUp);
  };

  // Separate white and black keys for proper piano overlap
  const whiteKeys = keys.filter((k) => !k.isBlack);

  return (
    <div id="virtual-keyboard-section" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-2xl">
      {/* Keyboard Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-[#28282A]">
        <div className="flex items-center gap-3">
          {/* Octave Shift */}
          <div className="flex items-center gap-1 bg-[#18181B] px-2 py-1 rounded-lg border border-[#28282A]">
            <span className="text-[11px] text-[#9E9E9E] font-mono">OCTAVE</span>
            <button
              id="octave-down-btn"
              onClick={() => {
                engine.octaveShift = Math.max(-3, engine.octaveShift - 1);
                engine.notifyStateChange();
              }}
              className="p-1 hover:bg-[#28282A] text-[#E0E0E0] rounded transition-colors"
              title="Octave Down [Hotkey: [ ]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-[#9B82FF] w-6 text-center">
              {engine.octaveShift >= 0 ? `+${engine.octaveShift}` : engine.octaveShift}
            </span>
            <button
              id="octave-up-btn"
              onClick={() => {
                engine.octaveShift = Math.min(3, engine.octaveShift + 1);
                engine.notifyStateChange();
              }}
              className="p-1 hover:bg-[#28282A] text-[#E0E0E0] rounded transition-colors"
              title="Octave Up [Hotkey: ] ]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Transpose */}
          <div className="flex items-center gap-1 bg-[#18181B] px-2 py-1 rounded-lg border border-[#28282A]">
            <span className="text-[11px] text-[#9E9E9E] font-mono">TRANSPOSE</span>
            <button
              id="transpose-down-btn"
              onClick={() => {
                engine.semitoneTranspose = Math.max(-12, engine.semitoneTranspose - 1);
                engine.notifyStateChange();
              }}
              className="p-1 hover:bg-[#28282A] text-[#E0E0E0] rounded transition-colors"
              title="Semitone Down [Hotkey: Alt + -]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-xs font-bold text-[#E0E0E0] w-6 text-center">
              {engine.semitoneTranspose >= 0 ? `+${engine.semitoneTranspose}` : engine.semitoneTranspose}
            </span>
            <button
              id="transpose-up-btn"
              onClick={() => {
                engine.semitoneTranspose = Math.min(12, engine.semitoneTranspose + 1);
                engine.notifyStateChange();
              }}
              className="p-1 hover:bg-[#28282A] text-[#E0E0E0] rounded transition-colors"
              title="Semitone Up [Hotkey: Alt + =]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scale Lock Status */}
          <button
            id="scale-lock-toggle"
            onClick={() => {
              engine.scaleLockEnabled = !engine.scaleLockEnabled;
              engine.notifyStateChange();
            }}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              engine.scaleLockEnabled
                ? 'bg-[#7C5DFF]/20 border-[#7C5DFF]/50 text-[#9B82FF] shadow-[0_0_12px_rgba(124,93,255,0.2)]'
                : 'bg-[#18181B] border-[#28282A] text-[#9E9E9E] hover:text-[#F0F0F0] hover:border-[#3A3A3C]'
            }`}
          >
            {engine.scaleLockEnabled ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            <span>{engine.scaleLockEnabled ? `Locked: ${scale?.name || 'Scale'}` : 'Scale Free'}</span>
          </button>
        </div>

        {/* Sustain Pedal & Velocity */}
        <div className="flex items-center gap-3">
          <button
            id="sustain-pedal-btn"
            onMouseDown={() => engine.setSustainPedal(true)}
            onMouseUp={() => engine.setSustainPedal(false)}
            onClick={() => engine.setSustainPedal(!engine.sustainPedal)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
              engine.sustainPedal
                ? 'bg-[#7C5DFF] text-white border-[#9B82FF] shadow-[0_0_15px_rgba(124,93,255,0.4)]'
                : 'bg-[#18181B] border-[#28282A] text-[#E0E0E0] hover:bg-[#232326]'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>SUSTAIN (SPACE)</span>
          </button>

          <div className="flex items-center gap-2 bg-[#18181B] px-2.5 py-1 rounded-lg border border-[#28282A]">
            <span className="text-[11px] text-[#9E9E9E] font-mono">VELOCITY:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={mapper.fixedVelocity}
              onChange={(e) => {
                mapper.fixedVelocity = parseFloat(e.target.value);
                setTick((t) => t + 1);
              }}
              className="w-20 accent-[#7C5DFF] cursor-pointer"
            />
            <span className="text-xs font-mono text-[#9B82FF] font-bold">
              {Math.round(mapper.fixedVelocity * 127)}
            </span>
          </div>
        </div>
      </div>

      {/* Producer Master Performance Macros Bar */}
      <div className="mb-3 px-3 py-2 bg-[#18181B]/70 rounded-xl border border-[#28282A] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-[#7C5DFF]/20 text-[#9B82FF]">
            <Sliders className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#E0E0E0] uppercase tracking-wider">
              PRODUCER PERFORMANCE MACROS
            </span>
            <span className="ml-2 text-[10px] text-[#9E9E9E] hidden sm:inline">
              Real-time DSP shaping with hardware rotary response
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Macro 1: Cutoff / Tone */}
          <div className="flex items-center gap-2">
            <RotaryKnob
              value={engine.macroCutoff}
              min={0.1}
              max={1.9}
              step={0.05}
              label="TONE"
              unit=""
              color="#7C5DFF"
              size={36}
              onChange={(v) => engine.setProducerMacro('cutoff', v)}
            />
          </div>

          {/* Macro 2: Drive / Heat */}
          <div className="flex items-center gap-2">
            <RotaryKnob
              value={engine.macroDrive}
              min={0}
              max={1}
              step={0.02}
              label="HEAT"
              unit=""
              color="#f59e0b"
              size={36}
              onChange={(v) => engine.setProducerMacro('drive', v)}
            />
          </div>

          {/* Macro 3: Space / Reverb */}
          <div className="flex items-center gap-2">
            <RotaryKnob
              value={engine.macroSpace}
              min={0}
              max={1}
              step={0.02}
              label="SPACE"
              unit=""
              color="#06b6d4"
              size={36}
              onChange={(v) => engine.setProducerMacro('space', v)}
            />
          </div>

          {/* Macro 4: Motion / Vibrato */}
          <div className="flex items-center gap-2">
            <RotaryKnob
              value={engine.macroMotion}
              min={0}
              max={1}
              step={0.02}
              label="MOTION"
              unit=""
              color="#10b981"
              size={36}
              onChange={(v) => engine.setProducerMacro('motion', v)}
            />
          </div>
        </div>
      </div>

      {/* Main Piano Canvas with Pitch & Mod Wheels */}
      <div className="flex gap-4 items-stretch">
        {/* Performance Wheels (Pitch Bend & Mod Wheel) */}
        <div className="flex gap-2 bg-[#18181B] p-2.5 rounded-xl border border-[#28282A] flex-shrink-0">
          {/* Pitch Bend */}
          <div className="flex flex-col items-center justify-between w-9 select-none">
            <span className="text-[9px] font-mono text-[#9E9E9E]">PITCH</span>
            <div
              className="relative w-8 h-32 bg-[#0A0A0B] rounded border border-[#28282A] cursor-ns-resize overflow-hidden flex items-center justify-center group"
              onMouseDown={handlePitchMouseDown}
              title="Pitch Bend (Drag or Up/Down Arrow)"
            >
              {/* Center line */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#3A3A3C] pointer-events-none" />
              {/* Indicator handle */}
              <div
                className="w-full h-6 bg-gradient-to-b from-[#28282A] to-[#3A3A3C] rounded shadow-md border-t border-b border-[#52525B] absolute"
                style={{
                  transform: `translateY(${-pitchBendVal * 0.25}px)`,
                  transition: isPitchDragging.current ? 'none' : 'transform 0.15s ease-out',
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#9B82FF]">
              {pitchBendVal > 0 ? `+${pitchBendVal}` : pitchBendVal}
            </span>
          </div>

          {/* Mod Wheel */}
          <div className="flex flex-col items-center justify-between w-9 select-none">
            <span className="text-[9px] font-mono text-[#9E9E9E]">MOD</span>
            <div
              className="relative w-8 h-32 bg-[#0A0A0B] rounded border border-[#28282A] cursor-ns-resize overflow-hidden flex items-end group"
              onMouseDown={handleModMouseDown}
              title="Modulation Wheel (Drag up)"
            >
              {/* Level fill */}
              <div
                className="w-full bg-[#7C5DFF]/25 absolute bottom-0 pointer-events-none"
                style={{ height: `${modWheelVal * 100}%` }}
              />
              {/* Handle */}
              <div
                className="w-full h-6 bg-gradient-to-b from-[#28282A] to-[#3A3A3C] rounded shadow border-t border-b border-[#52525B] absolute"
                style={{
                  bottom: `${modWheelVal * (128 - 24)}px`,
                  transition: isModDragging.current ? 'none' : 'bottom 0.1s ease',
                }}
              />
            </div>
            <span className="text-[9px] font-mono text-[#9B82FF]">
              {Math.round(modWheelVal * 100)}%
            </span>
          </div>
        </div>

        {/* Piano Keys Container */}
        <div className="relative flex-1 h-44 flex bg-[#0A0A0B] rounded-xl overflow-x-auto overflow-y-hidden border border-[#28282A] shadow-inner">
          {/* White Keys */}
          {whiteKeys.map((k) => {
            const isActive = activeNotes.has(k.midiNote);
            const inScale = isNoteInScale(k.midiNote);

            return (
              <div
                key={k.midiNote}
                id={`piano-key-${k.midiNote}`}
                onMouseDown={() => handleKeyMouseDown(k.midiNote)}
                onMouseUp={() => handleKeyMouseUp(k.midiNote)}
                onMouseEnter={(e) => handleKeyMouseEnter(e, k.midiNote)}
                onMouseLeave={(e) => handleKeyMouseLeave(e, k.midiNote)}
                className={`flex-1 relative flex flex-col justify-end items-center pb-2 border-r border-[#28282A] select-none cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#9B82FF] shadow-[inset_0_4px_12px_rgba(0,0,0,0.5)]'
                    : inScale
                    ? 'bg-[#E4E4E7] hover:bg-[#F4F4F5]'
                    : 'bg-[#71717A] opacity-50'
                }`}
              >
                {/* Computer Key Label */}
                {k.computerKey && (
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono mb-1 transition-colors ${
                      isActive
                        ? 'bg-[#0A0A0B] text-[#9B82FF] shadow'
                        : 'bg-[#18181B] text-[#E0E0E0] shadow-sm border border-[#28282A]'
                    }`}
                  >
                    {k.computerKey}
                  </div>
                )}
                {/* Note Name */}
                <span
                  className={`text-[10px] font-semibold ${
                    isActive ? 'text-[#0A0A0B] font-bold' : 'text-zinc-700'
                  }`}
                >
                  {k.noteName}
                </span>
              </div>
            );
          })}

          {/* Black Keys (Positioned absolutely over white keys) */}
          {keys.map((k) => {
            if (!k.isBlack) return null;

            // Calculate percentage position based on white key index
            const precedingWhiteKeys = keys.slice(0, keys.indexOf(k)).filter((x) => !x.isBlack).length;
            const totalWhite = whiteKeys.length;
            const leftPercent = ((precedingWhiteKeys - 0.3) / totalWhite) * 100;
            const widthPercent = (0.6 / totalWhite) * 100;

            const isActive = activeNotes.has(k.midiNote);
            const inScale = isNoteInScale(k.midiNote);

            return (
              <div
                key={k.midiNote}
                id={`piano-key-${k.midiNote}`}
                onMouseDown={() => handleKeyMouseDown(k.midiNote)}
                onMouseUp={() => handleKeyMouseUp(k.midiNote)}
                onMouseEnter={(e) => handleKeyMouseEnter(e, k.midiNote)}
                onMouseLeave={(e) => handleKeyMouseLeave(e, k.midiNote)}
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                  height: '62%',
                }}
                className={`absolute top-0 z-10 flex flex-col justify-end items-center pb-2 rounded-b-md select-none cursor-pointer shadow-2xl transition-all border border-[#0A0A0B] ${
                  isActive
                    ? 'bg-[#7C5DFF] shadow-[0_0_15px_rgba(124,93,255,0.6)]'
                    : inScale
                    ? 'bg-[#121214] hover:bg-[#18181B]'
                    : 'bg-[#0A0A0B] opacity-50'
                }`}
              >
                {/* Computer Key badge */}
                {k.computerKey && (
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold font-mono mb-1 ${
                      isActive ? 'bg-[#0A0A0B] text-[#9B82FF]' : 'bg-[#18181B] text-[#9B82FF] border border-[#28282A]'
                    }`}
                  >
                    {k.computerKey}
                  </div>
                )}
                <span
                  className={`text-[9px] font-medium ${
                    isActive ? 'text-white font-bold' : 'text-[#9E9E9E]'
                  }`}
                >
                  {k.noteName}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Keyboard Quick Legend */}
      <div className="mt-3 flex flex-wrap items-center justify-between text-[11px] text-[#9E9E9E] px-1 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#7C5DFF] inline-block shadow-[0_0_6px_rgba(124,93,255,0.6)]" />
            Active Note
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-[#18181B] border border-[#28282A] text-[#9B82FF] text-[9px] flex items-center justify-center font-bold">A</span>
            Computer Key Overlay
          </span>
          <span>Hold <strong className="text-[#F0F0F0]">SPACE</strong> for Sustain</span>
        </div>
        <div>
          <span>Press <strong className="text-[#F0F0F0]">[</strong> / <strong className="text-[#F0F0F0]">]</strong> to Shift Octave</span>
        </div>
      </div>
    </div>
  );
};
