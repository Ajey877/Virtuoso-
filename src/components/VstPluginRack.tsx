import React, { useState, useEffect } from 'react';
import { Power, Sliders, Volume2, Waves } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { MidiManager } from '../audio/MidiManager';
import { RotaryKnob } from './common/RotaryKnob';

export const VstPluginRack: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const midiManager = MidiManager.getInstance();
  const [, setTick] = useState(0);

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => setTick((t) => t + 1));
    return () => unsub();
  }, [engine]);

  const handleMidiLearn = (pluginId: string, paramKey: string, controlName: string, min: number, max: number) => {
    midiManager.startLearning({
      targetType: 'plugin',
      targetId: pluginId,
      paramKey,
      controlName,
      minVal: min,
      maxVal: max,
    });
  };

  return (
    <div id="vst-plugin-rack-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      {/* VST Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Studio VST Plugin Rack & Effects Chain
          </h3>
          <span className="text-[10px] font-mono text-[#9E9E9E] bg-[#18181B] px-2 py-0.5 rounded border border-[#28282A]">
            8 Active Inserts • Sidechain & Serial DSP Flow
          </span>
        </div>

        {midiManager.isLearning && (
          <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500 rounded-full animate-pulse text-amber-300 text-xs font-semibold">
            <span>MIDI LEARN: Move physical knob to map {midiManager.learnTarget?.controlName}</span>
            <button
              onClick={() => midiManager.cancelLearning()}
              className="text-[10px] underline ml-1 text-amber-200 hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Plugins Grid / Rack Units */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* 1. Tube Saturation */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('saturation')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'saturation')?.bypass
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Saturation Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">TUBE SATURATION</span>
            </div>
            <span className="text-[9px] font-mono text-red-400 bg-red-950/40 px-1.5 py-0.5 rounded border border-red-900/40">
              WARMTH
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <RotaryKnob
              label="DRIVE"
              value={engine.vstPlugins.find((p) => p.id === 'saturation')?.params.drive || 12}
              min={0}
              max={50}
              step={1}
              color="#ef4444"
              size="sm"
              onChange={(val) => engine.updateVstParam('saturation', 'drive', val)}
              onMidiLearn={() => handleMidiLearn('saturation', 'drive', 'Saturation Drive', 0, 50)}
            />
            <RotaryKnob
              label="WARMTH"
              value={engine.vstPlugins.find((p) => p.id === 'saturation')?.params.warmth || 0.7}
              min={0}
              max={1.0}
              step={0.01}
              color="#ef4444"
              size="sm"
              onChange={(val) => engine.updateVstParam('saturation', 'warmth', val)}
            />
            <RotaryKnob
              label="MIX"
              value={engine.vstPlugins.find((p) => p.id === 'saturation')?.params.mix || 0.4}
              min={0}
              max={1.0}
              step={0.01}
              color="#ef4444"
              size="sm"
              onChange={(val) => engine.updateVstParam('saturation', 'mix', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Even-Order Harmonics</span>
            <span className="font-mono text-red-400">Class-A Triode</span>
          </div>
        </div>

        {/* 2. Resonant Ladder Filter */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('filter')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'filter')?.bypass
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Filter Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">LADDER FILTER</span>
            </div>
            <span className="text-[9px] font-mono text-blue-400 bg-blue-950/40 px-1.5 py-0.5 rounded border border-blue-900/40">
              24dB MOOG
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <RotaryKnob
              label="CUTOFF"
              value={engine.vstPlugins.find((p) => p.id === 'filter')?.params.cutoff || 14000}
              min={40}
              max={18000}
              step={20}
              unit="Hz"
              color="#3b82f6"
              size="sm"
              onChange={(val) => engine.updateVstParam('filter', 'cutoff', val)}
              onMidiLearn={() => handleMidiLearn('filter', 'cutoff', 'Filter Cutoff', 40, 18000)}
            />
            <RotaryKnob
              label="RESONANCE"
              value={engine.vstPlugins.find((p) => p.id === 'filter')?.params.resonance || 1.5}
              min={0.1}
              max={15}
              step={0.1}
              color="#3b82f6"
              size="sm"
              onChange={(val) => engine.updateVstParam('filter', 'resonance', val)}
              onMidiLearn={() => handleMidiLearn('filter', 'resonance', 'Filter Resonance', 0.1, 15)}
            />
            <RotaryKnob
              label="LFO RATE"
              value={engine.vstPlugins.find((p) => p.id === 'filter')?.params.lfoRate || 1.2}
              min={0.1}
              max={10}
              step={0.1}
              unit="Hz"
              color="#3b82f6"
              size="sm"
              onChange={(val) => engine.updateVstParam('filter', 'lfoRate', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Self-Oscillation Capable</span>
            <span className="font-mono text-blue-400">Lowpass 4-Pole</span>
          </div>
        </div>

        {/* 3. 4-Band Parametric EQ */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('eq')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'eq')?.bypass
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle EQ Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">4-BAND STUDIO EQ</span>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-900/40">
              SURGICAL
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 py-2">
            <RotaryKnob
              label="LOW 80Hz"
              value={engine.vstPlugins.find((p) => p.id === 'eq')?.params.lowGain || 0}
              min={-15}
              max={15}
              step={0.5}
              unit="dB"
              color="#10b981"
              size="sm"
              onChange={(val) => engine.updateVstParam('eq', 'lowGain', val)}
            />
            <RotaryKnob
              label="MID 450"
              value={engine.vstPlugins.find((p) => p.id === 'eq')?.params.lowMidGain || 0}
              min={-15}
              max={15}
              step={0.5}
              unit="dB"
              color="#10b981"
              size="sm"
              onChange={(val) => engine.updateVstParam('eq', 'lowMidGain', val)}
            />
            <RotaryKnob
              label="MID 2.8k"
              value={engine.vstPlugins.find((p) => p.id === 'eq')?.params.highMidGain || 0}
              min={-15}
              max={15}
              step={0.5}
              unit="dB"
              color="#10b981"
              size="sm"
              onChange={(val) => engine.updateVstParam('eq', 'highMidGain', val)}
            />
            <RotaryKnob
              label="HIGH 10k"
              value={engine.vstPlugins.find((p) => p.id === 'eq')?.params.highGain || 0}
              min={-15}
              max={15}
              step={0.5}
              unit="dB"
              color="#10b981"
              size="sm"
              onChange={(val) => engine.updateVstParam('eq', 'highGain', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Linear Phase Curves</span>
            <span className="font-mono text-emerald-400">Parametric</span>
          </div>
        </div>

        {/* 4. Shimmer Cathedral Reverb */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('reverb')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'reverb')?.bypass
                    ? 'bg-[#7C5DFF]/20 text-[#9B82FF] border border-[#7C5DFF]/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Reverb Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">SHIMMER REVERB</span>
            </div>
            <span className="text-[9px] font-mono text-[#9B82FF] bg-[#7C5DFF]/20 px-1.5 py-0.5 rounded border border-[#7C5DFF]/40">
              CONVOLUTION
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 py-2">
            <RotaryKnob
              label="DECAY"
              value={engine.vstPlugins.find((p) => p.id === 'reverb')?.params.decay || 2.8}
              min={0.5}
              max={8.0}
              step={0.1}
              unit="s"
              color="#7C5DFF"
              size="sm"
              onChange={(val) => engine.updateVstParam('reverb', 'decay', val)}
            />
            <RotaryKnob
              label="PRE-DLY"
              value={engine.vstPlugins.find((p) => p.id === 'reverb')?.params.preDelay || 0.02}
              min={0}
              max={0.2}
              step={0.01}
              unit="s"
              color="#7C5DFF"
              size="sm"
              onChange={(val) => engine.updateVstParam('reverb', 'preDelay', val)}
            />
            <RotaryKnob
              label="SHIMMER"
              value={engine.vstPlugins.find((p) => p.id === 'reverb')?.params.shimmer || 0.3}
              min={0}
              max={1.0}
              step={0.05}
              color="#7C5DFF"
              size="sm"
              onChange={(val) => engine.updateVstParam('reverb', 'shimmer', val)}
            />
            <RotaryKnob
              label="MIX"
              value={engine.vstPlugins.find((p) => p.id === 'reverb')?.params.mix || 0.35}
              min={0}
              max={1.0}
              step={0.01}
              color="#7C5DFF"
              size="sm"
              onChange={(val) => engine.updateVstParam('reverb', 'mix', val)}
              onMidiLearn={() => handleMidiLearn('reverb', 'mix', 'Reverb Wet Mix', 0, 1)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Harmonic Pitch-Shift Tails</span>
            <span className="font-mono text-[#9B82FF]">Cathedral IR</span>
          </div>
        </div>

        {/* 5. Stereo Tape Delay */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('delay')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'delay')?.bypass
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Delay Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">STEREO TAPE DELAY</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
              PING-PONG
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 py-2">
            <RotaryKnob
              label="TIME L"
              value={engine.vstPlugins.find((p) => p.id === 'delay')?.params.timeL || 0.25}
              min={0.05}
              max={1.5}
              step={0.01}
              unit="s"
              color="#f59e0b"
              size="sm"
              onChange={(val) => engine.updateVstParam('delay', 'timeL', val)}
            />
            <RotaryKnob
              label="TIME R"
              value={engine.vstPlugins.find((p) => p.id === 'delay')?.params.timeR || 0.375}
              min={0.05}
              max={1.5}
              step={0.01}
              unit="s"
              color="#f59e0b"
              size="sm"
              onChange={(val) => engine.updateVstParam('delay', 'timeR', val)}
            />
            <RotaryKnob
              label="FDBK"
              value={engine.vstPlugins.find((p) => p.id === 'delay')?.params.feedback || 0.35}
              min={0}
              max={0.9}
              step={0.01}
              color="#f59e0b"
              size="sm"
              onChange={(val) => engine.updateVstParam('delay', 'feedback', val)}
            />
            <RotaryKnob
              label="MIX"
              value={engine.vstPlugins.find((p) => p.id === 'delay')?.params.mix || 0.3}
              min={0}
              max={1.0}
              step={0.01}
              color="#f59e0b"
              size="sm"
              onChange={(val) => engine.updateVstParam('delay', 'mix', val)}
              onMidiLearn={() => handleMidiLearn('delay', 'mix', 'Delay Mix', 0, 1)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Analog Flutter & Damping</span>
            <span className="font-mono text-amber-400">BPM Synced</span>
          </div>
        </div>

        {/* 6. Vintage Dimension Chorus */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('chorus')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'chorus')?.bypass
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Chorus Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">DIMENSION CHORUS</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-900/40">
              BBD ENSEMBLE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <RotaryKnob
              label="RATE"
              value={engine.vstPlugins.find((p) => p.id === 'chorus')?.params.rate || 1.2}
              min={0.1}
              max={8.0}
              step={0.1}
              unit="Hz"
              color="#06b6d4"
              size="sm"
              onChange={(val) => engine.updateVstParam('chorus', 'rate', val)}
            />
            <RotaryKnob
              label="DEPTH"
              value={engine.vstPlugins.find((p) => p.id === 'chorus')?.params.depth || 0.4}
              min={0}
              max={1.0}
              step={0.01}
              color="#06b6d4"
              size="sm"
              onChange={(val) => engine.updateVstParam('chorus', 'depth', val)}
            />
            <RotaryKnob
              label="MIX"
              value={engine.vstPlugins.find((p) => p.id === 'chorus')?.params.mix || 0.5}
              min={0}
              max={1.0}
              step={0.01}
              color="#06b6d4"
              size="sm"
              onChange={(val) => engine.updateVstParam('chorus', 'mix', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Stereo Spatial Widening</span>
            <span className="font-mono text-cyan-400">Juno Style</span>
          </div>
        </div>

        {/* 7. Master Studio Compressor */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => engine.togglePluginBypass('compressor')}
                className={`p-1 rounded-full ${
                  !engine.vstPlugins.find((p) => p.id === 'compressor')?.bypass
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Compressor Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">DYNAMIC COMPRESSOR</span>
            </div>
            <span className="text-[9px] font-mono text-rose-400 bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-900/40">
              VCA GLUE
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 py-2">
            <RotaryKnob
              label="THRESH"
              value={engine.vstPlugins.find((p) => p.id === 'compressor')?.params.threshold || -16}
              min={-50}
              max={0}
              step={1}
              unit="dB"
              color="#f43f5e"
              size="sm"
              onChange={(val) => engine.updateVstParam('compressor', 'threshold', val)}
            />
            <RotaryKnob
              label="RATIO"
              value={engine.vstPlugins.find((p) => p.id === 'compressor')?.params.ratio || 3.5}
              min={1}
              max={20}
              step={0.5}
              color="#f43f5e"
              size="sm"
              onChange={(val) => engine.updateVstParam('compressor', 'ratio', val)}
            />
            <RotaryKnob
              label="ATTACK"
              value={engine.vstPlugins.find((p) => p.id === 'compressor')?.params.attack || 0.015}
              min={0.001}
              max={0.1}
              step={0.002}
              unit="s"
              color="#f43f5e"
              size="sm"
              onChange={(val) => engine.updateVstParam('compressor', 'attack', val)}
            />
            <RotaryKnob
              label="RELEASE"
              value={engine.vstPlugins.find((p) => p.id === 'compressor')?.params.release || 0.18}
              min={0.05}
              max={1.0}
              step={0.05}
              unit="s"
              color="#f43f5e"
              size="sm"
              onChange={(val) => engine.updateVstParam('compressor', 'release', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Punch & Transient Glue</span>
            <span className="font-mono text-rose-400">Peak Limiter Active</span>
          </div>
        </div>

        {/* 8. Sidechain Pumping Bus (Kick Dynamic Ducking) */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  engine.sidechainEnabled = !engine.sidechainEnabled;
                  engine.notifyStateChange();
                }}
                className={`p-1 rounded-full ${
                  engine.sidechainEnabled
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
                title="Toggle Sidechain Ducking Bypass"
              >
                <Power className="w-3 h-3" />
              </button>
              <span className="text-xs font-bold text-[#F0F0F0]">SIDECHAIN PUMPING</span>
            </div>
            <span className="text-[9px] font-mono text-amber-400 bg-amber-950/40 px-1.5 py-0.5 rounded border border-amber-900/40">
              KICK DUCK
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 py-2">
            <RotaryKnob
              label="DEPTH"
              value={engine.sidechainDepth}
              min={0}
              max={1.0}
              step={0.05}
              unit=""
              color="#f59e0b"
              size="sm"
              onChange={(val) => {
                engine.sidechainDepth = val;
                engine.notifyStateChange();
              }}
            />
            <RotaryKnob
              label="RELEASE"
              value={engine.sidechainRelease}
              min={0.04}
              max={0.5}
              step={0.02}
              unit="s"
              color="#f59e0b"
              size="sm"
              onChange={(val) => {
                engine.sidechainRelease = val;
                engine.notifyStateChange();
              }}
            />
            <div className="flex flex-col items-center justify-center">
              <button
                onClick={() => engine.triggerSidechainPump()}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[10px] font-bold hover:bg-amber-500/30 transition-colors shadow-sm"
              >
                TEST DUCK
              </button>
              <span className="text-[9px] font-mono text-[#71717A] mt-1">Kick-Linked</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Rhythmic EDM/Trap Pumping</span>
            <span className="font-mono text-amber-400">{engine.sidechainEnabled ? 'Active Ducking' : 'Bypassed'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
