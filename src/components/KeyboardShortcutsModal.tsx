import React from 'react';
import { Keyboard, X, Zap, Sliders, Music, Disc, Sparkles, Activity } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<Props> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        id="shortcuts-modal-card"
        className="bg-[#121214] border border-[#28282A] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#28282A] bg-[#18181B]/50">
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-[#9B82FF]" />
            <h3 className="text-base font-bold text-[#F0F0F0]">
              COOKUP Producer Workflow & Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#28282A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          {/* Section 1: Musical Typing Keyboard */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#9B82FF] flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5" />
              <span>Real-Time Musical Typing (Piano Keys)</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">White Keys (C to C):</span>
                <span className="font-bold text-[#F0F0F0] bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  A S D F G H J K L ;
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Black Keys (Sharps/Flats):</span>
                <span className="font-bold text-[#C4B5FD] bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  W E T Y U O P
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Octave Shift Down / Up:</span>
                <span className="font-bold text-amber-400 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  Z / X
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Pitch Bend Down / Up:</span>
                <span className="font-bold text-emerald-400 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  , / .
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: MPC Slicer & Drum Triggering */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5" />
              <span>MPC Sampler & Slicer Pad Triggers</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Chop Slices 1 to 8:</span>
                <span className="font-bold text-amber-300 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  Number Keys 1 - 8
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Chop Slices 9 to 16:</span>
                <span className="font-bold text-amber-300 bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  Q W E R T Y U I
                </span>
              </div>
            </div>
          </div>

          {/* Section 3: DAW Workflow & Stems */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              <span>Multi-Track DAW & Export Hotkeys</span>
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">Sustain Pedal Hold:</span>
                <span className="font-bold text-[#F0F0F0] bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  Spacebar (Hold)
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded bg-[#18181B] border border-[#28282A]">
                <span className="text-[#9E9E9E]">DAW Stems Export:</span>
                <span className="font-bold text-[#9B82FF] bg-[#0A0A0B] px-2 py-0.5 rounded border border-[#28282A]">
                  Multi-Track Tab &gt; Export WAV
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#28282A] bg-[#18181B]/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#7C5DFF] hover:bg-[#6A48F5] text-white text-xs font-bold transition-all shadow-md"
          >
            Got It (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
