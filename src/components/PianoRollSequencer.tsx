import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Sparkles,
  Trash2,
  Copy,
  Sliders,
  Music,
  Maximize2,
  Wand2,
  Layers,
  Volume2,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { PianoRollEngine, MELODY_TEMPLATES } from '../audio/synthesis/PianoRollEngine';
import { PianoRollNote } from '../types/audio';
import { useAppStore } from '../store/useAppStore';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

function isBlackKey(midi: number): boolean {
  const noteInOctave = midi % 12;
  return [1, 3, 6, 8, 10].includes(noteInOctave);
}

export const PianoRollSequencer: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const pianoRoll = PianoRollEngine.getInstance();

  // We still need local re-renders for PianoRoll specific state, but without hacky empty setState
  const [rev, setRev] = useState(0);

  // Range of MIDI pitches to show (e.g. C2 (36) to C6 (84) or C3 to B5)
  const [minNote, setMinNote] = useState(48); // C3
  const [maxNote, setMaxNote] = useState(76); // E5
  const [activeVelocity, setActiveVelocity] = useState(0.85);
  const [defaultDuration, setDefaultDuration] = useState(2); // 2 steps = 1/8th note

  const gridContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // PianoRoll uses a separate pubsub which we can just use to trigger local component update
    const unsub = pianoRoll.subscribe(() => setRev(r => r + 1));
    return () => unsub();
  }, [pianoRoll]);

  // Generate vertical list of notes from maxNote down to minNote
  const pitchRows: number[] = [];
  for (let n = maxNote; n >= minNote; n--) {
    pitchRows.push(n);
  }

  const handleCellClick = (pitch: number, step: number) => {
    // Check if there's already a note at this pitch and step
    const existing = pianoRoll.notes.find(
      (n) => n.note === pitch && step >= n.step && step < n.step + n.duration
    );

    if (existing) {
      // Remove note
      pianoRoll.removeNote(existing.id);
    } else {
      // Audition note & add
      engine.playNote(pitch, activeVelocity);
      setTimeout(() => engine.stopNote(pitch), 200);
      pianoRoll.addNote(pitch, step, defaultDuration, activeVelocity);
    }
  };

  const handleAuditionKey = (pitch: number) => {
    engine.playNote(pitch, activeVelocity);
    setTimeout(() => engine.stopNote(pitch), 350);
  };

  const handleCycleDuration = (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const note = pianoRoll.notes.find((n) => n.id === noteId);
    if (!note) return;
    const durations = [1, 2, 4, 8];
    const curIdx = durations.indexOf(note.duration);
    note.duration = durations[(curIdx + 1) % durations.length];
    pianoRoll.notes = [...pianoRoll.notes];
    setRev(r => r + 1);
  };

  return (
    <div
      id="piano-roll-container"
      className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-2xl flex flex-col gap-3"
    >
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#28282A]">
        {/* Left: Title and Status */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#7C5DFF]/15 border border-[#7C5DFF]/40 flex items-center justify-center text-[#9B82FF]">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#F0F0F0] uppercase tracking-wide">
                Piano Roll & Melody Sequencer
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#7C5DFF]/20 text-[#C4B5FD] border border-[#7C5DFF]/40">
                {engine.currentInstrument.name}
              </span>
            </div>
            <p className="text-[11px] text-[#9E9E9E] font-mono">
              Click grid to draw notes • Click note to remove • Right-click or button to resize duration
            </p>
          </div>
        </div>

        {/* Center: Transport & Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Play/Stop Loop */}
          <button
            onClick={() => {
              if (pianoRoll.isPlaying) {
                pianoRoll.stopPlayback();
              } else {
                pianoRoll.startPlayback();
              }
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md ${
              pianoRoll.isPlaying
                ? 'bg-emerald-500 text-[#0A0A0B] shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'bg-[#7C5DFF] hover:bg-[#6A48F5] text-white shadow-[0_0_12px_rgba(124,93,255,0.3)]'
            }`}
          >
            {pianoRoll.isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>STOP LOOP</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY MELODY</span>
              </>
            )}
          </button>

          {/* Template Motif Selector */}
          <div className="flex items-center gap-1.5 bg-[#18181B] px-2.5 py-1 rounded-lg border border-[#28282A]">
            <Wand2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[11px] font-mono text-[#9E9E9E]">MOTIFS:</span>
            <select
              onChange={(e) => {
                if (e.target.value) {
                  pianoRoll.loadTemplate(e.target.value);
                  e.target.value = '';
                }
              }}
              defaultValue=""
              className="bg-[#0A0A0B] text-xs font-semibold text-[#F0F0F0] border border-[#28282A] rounded px-2 py-1 focus:outline-none focus:border-[#7C5DFF]"
            >
              <option value="" disabled>
                Load Melody Motif...
              </option>
              {MELODY_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.genre})
                </option>
              ))}
            </select>
          </div>

          {/* Grid Length Selector */}
          <div className="flex items-center bg-[#18181B] rounded-lg border border-[#28282A] p-0.5">
            {[16, 32, 64].map((steps) => (
              <button
                key={steps}
                onClick={() => {
                  pianoRoll.totalSteps = steps;
                  setRev((r) => r + 1);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
                  pianoRoll.totalSteps === steps
                    ? 'bg-[#7C5DFF] text-white'
                    : 'text-[#9E9E9E] hover:text-[#E0E0E0]'
                }`}
              >
                {steps / 16} {steps === 16 ? 'Bar' : 'Bars'}
              </button>
            ))}
          </div>
        </div>

        {/* Right Tools (Duplicate, Humanize, Octaves, Clear) */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => pianoRoll.duplicateBars()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] text-xs font-semibold transition-colors"
            title="Duplicate 1st bar into 2nd bar"
          >
            <Copy className="w-3.5 h-3.5 text-[#9B82FF]" />
            <span>Duplicate Bar</span>
          </button>

          <button
            onClick={() => pianoRoll.humanizeVelocities()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] text-xs font-semibold transition-colors"
            title="Add human velocity variation"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Humanize</span>
          </button>

          <button
            onClick={() => pianoRoll.transpose(12)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] text-xs font-mono"
            title="Transpose Octave Up (+12)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>+8ve</span>
          </button>

          <button
            onClick={() => pianoRoll.transpose(-12)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] text-xs font-mono"
            title="Transpose Octave Down (-12)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
            <span>-8ve</span>
          </button>

          <button
            onClick={() => pianoRoll.clearNotes()}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-950/30 border border-red-900/40 hover:bg-red-900/40 text-red-400 text-xs font-semibold transition-colors"
            title="Clear all notes from piano roll"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Piano Roll Grid & Keyboard Matrix */}
      <div
        ref={gridContainerRef}
        className="relative overflow-x-auto overflow-y-auto max-h-[480px] bg-[#0A0A0B] rounded-lg border border-[#28282A] shadow-inner custom-scrollbar"
      >
        <div
          className="min-w-fit"
          style={{ width: `${60 + pianoRoll.totalSteps * 32}px` }}
        >
          {/* Step Timeline Header */}
          <div className="sticky top-0 z-20 flex bg-[#121214] border-b border-[#28282A] text-[10px] font-mono text-[#71717A] h-6">
            <div className="w-[60px] min-w-[60px] border-r border-[#28282A] flex items-center justify-center font-bold text-[#9E9E9E] bg-[#18181B]">
              KEY
            </div>
            <div className="flex-1 flex">
              {Array.from({ length: pianoRoll.totalSteps }).map((_, step) => {
                const isBarStart = step % 16 === 0;
                const isBeatStart = step % 4 === 0;
                const isCurrent = pianoRoll.isPlaying && pianoRoll.currentStep === step;

                return (
                  <div
                    key={step}
                    className={`w-8 min-w-[32px] flex items-center justify-center border-r transition-colors ${
                      isCurrent
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold border-emerald-500'
                        : isBarStart
                        ? 'border-[#3F3F46] font-bold text-[#E0E0E0] bg-[#18181B]'
                        : isBeatStart
                        ? 'border-[#28282A] text-[#9E9E9E]'
                        : 'border-[#1C1C1F]'
                    }`}
                  >
                    {isBarStart
                      ? `B${Math.floor(step / 16) + 1}`
                      : isBeatStart
                      ? `${Math.floor((step % 16) / 4) + 1}`
                      : ''}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grid Rows (Notes) */}
          <div className="relative">
            {pitchRows.map((pitch) => {
              const isBlack = isBlackKey(pitch);
              const noteLabel = midiToNoteName(pitch);
              const isC = pitch % 12 === 0;

              return (
                <div
                  key={pitch}
                  className={`flex h-7 border-b transition-colors ${
                    isC
                      ? 'border-[#38383C] bg-[#18181B]/40'
                      : isBlack
                      ? 'border-[#18181B] bg-[#0E0E10]'
                      : 'border-[#1C1C1F] bg-[#121214]'
                  }`}
                >
                  {/* Left Piano Key */}
                  <div
                    onClick={() => handleAuditionKey(pitch)}
                    className={`sticky left-0 z-10 w-[60px] min-w-[60px] flex items-center justify-between px-2 cursor-pointer font-mono text-[11px] font-bold border-r select-none transition-all ${
                      isBlack
                        ? 'bg-[#18181B] text-[#9E9E9E] border-[#28282A] hover:bg-[#28282E] hover:text-[#F0F0F0]'
                        : 'bg-[#27272A] text-[#F0F0F0] border-[#3F3F46] hover:bg-[#3F3F46]'
                    } ${isC ? 'text-[#9B82FF]' : ''}`}
                    title={`Click to preview ${noteLabel}`}
                  >
                    <span>{noteLabel}</span>
                    {isC && <div className="w-1.5 h-1.5 rounded-full bg-[#9B82FF]" />}
                  </div>

                  {/* 16th Step Cells */}
                  <div className="flex-1 flex relative">
                    {Array.from({ length: pianoRoll.totalSteps }).map((_, step) => {
                      const isBarStart = step % 16 === 0;
                      const isBeatStart = step % 4 === 0;
                      const isCurrentStep =
                        pianoRoll.isPlaying && pianoRoll.currentStep === step;

                      return (
                        <div
                          key={step}
                          onClick={() => handleCellClick(pitch, step)}
                          className={`w-8 min-w-[32px] h-full border-r cursor-pointer transition-colors relative ${
                            isCurrentStep
                              ? 'bg-emerald-500/10'
                              : isBarStart
                              ? 'border-[#38383C]'
                              : isBeatStart
                              ? 'border-[#28282A]'
                              : 'border-[#1C1C1F]'
                          } hover:bg-[#7C5DFF]/20`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Note Rectangles Overlay */}
            {pianoRoll.notes.map((note) => {
              const rowIndex = maxNote - note.note;
              if (rowIndex < 0 || note.note < minNote) return null;

              const top = rowIndex * 28; // 28px height per row
              const left = 60 + note.step * 32;
              const width = note.duration * 32 - 3;

              return (
                <div
                  key={note.id}
                  onClick={(e) => handleCycleDuration(note.id, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    pianoRoll.removeNote(note.id);
                  }}
                  style={{
                    top: `${top + 2}px`,
                    left: `${left + 1}px`,
                    width: `${width}px`,
                    height: '24px',
                    opacity: 0.6 + note.velocity * 0.4,
                  }}
                  className="absolute z-10 rounded-md bg-gradient-to-r from-[#7C5DFF] to-[#9B82FF] text-[#0A0A0B] border border-[#C4B5FD] flex items-center justify-between px-1.5 text-[10px] font-bold font-mono shadow-[0_0_8px_rgba(124,93,255,0.4)] cursor-pointer group hover:ring-2 hover:ring-white transition-all overflow-hidden"
                  title={`${midiToNoteName(note.note)} • Step ${note.step + 1} • ${
                    note.duration
                  } 16ths (Click to cycle duration, Right-click to delete)`}
                >
                  <span className="truncate">{midiToNoteName(note.note)}</span>
                  <span className="text-[9px] opacity-75 font-mono">
                    {note.duration}x
                  </span>
                </div>
              );
            })}

            {/* Playhead Cursor Line */}
            {pianoRoll.isPlaying && (
              <div
                style={{
                  left: `${60 + pianoRoll.currentStep * 32}px`,
                }}
                className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_10px_#34d399] z-20 pointer-events-none transition-all duration-75"
              />
            )}
          </div>
        </div>
      </div>

      {/* Bottom Parameter / Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#18181B] p-2.5 rounded-lg border border-[#28282A] text-xs font-mono">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[#9E9E9E]">NOTE VELOCITY:</span>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={activeVelocity}
              onChange={(e) => setActiveVelocity(parseFloat(e.target.value))}
              className="w-24 accent-[#7C5DFF]"
            />
            <span className="text-[#F0F0F0] font-bold">
              {Math.round(activeVelocity * 127)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#9E9E9E]">DEFAULT LENGTH:</span>
            <select
              value={defaultDuration}
              onChange={(e) => setDefaultDuration(parseInt(e.target.value))}
              className="bg-[#0A0A0B] text-[#E0E0E0] border border-[#28282A] rounded px-2 py-0.5 focus:outline-none focus:border-[#7C5DFF]"
            >
              <option value="1">1/16 Note</option>
              <option value="2">1/8 Note</option>
              <option value="4">1/4 Note</option>
              <option value="8">1/2 Note</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#9E9E9E]">
          <span>Notes Placed: <strong className="text-[#9B82FF]">{pianoRoll.notes.length}</strong></span>
          <span>•</span>
          <span>BPM: <strong className="text-amber-400">{engine.bpm}</strong></span>
        </div>
      </div>
    </div>
  );
};
