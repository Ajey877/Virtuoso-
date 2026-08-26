import React, { useState, useEffect } from 'react';
import { Activity, Flame, Sparkles, Sliders, Wand2, Waves, Zap } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { MORPH_STYLES, SoundMorpher } from '../audio/synthesis/SoundMorpher';
import { RotaryKnob } from './common/RotaryKnob';
import { useAppStore } from '../store/useAppStore';

export const InstrumentEditor: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const { syncFromEngine } = useAppStore();

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => syncFromEngine());
    return () => unsub();
  }, [engine, syncFromEngine]);

  const inst = engine.currentInstrument;

  const handleEnvChange = (key: 'attack' | 'decay' | 'sustain' | 'release', val: number) => {
    inst.envelope[key] = val;
    engine.notifyStateChange();
  };

  const handleFilterChange = (key: 'cutoff' | 'resonance' | 'envelopeAmount', val: number) => {
    inst.filter[key] = val;
    engine.notifyStateChange();
  };

  const handleVibratoChange = (key: 'rate' | 'depth' | 'delay', val: number) => {
    inst.vibrato[key] = val;
    engine.notifyStateChange();
  };

  // Generate SVG ADSR visualization curve
  const renderAdsrCurve = () => {
    const { attack, decay, sustain, release } = inst.envelope;
    const w = 180;
    const h = 50;

    const totalTime = attack + decay + 0.8 + release;
    const attackX = (attack / totalTime) * w;
    const decayX = attackX + (decay / totalTime) * w;
    const sustainX = decayX + (0.8 / totalTime) * w;
    const releaseX = w;

    const sustainY = h - sustain * (h - 8) - 4;

    const pathData = `M 0,${h} L ${attackX},4 L ${decayX},${sustainY} L ${sustainX},${sustainY} L ${releaseX},${h}`;

    return (
      <svg width={w} height={h} className="bg-[#0A0A0B] rounded-lg border border-[#28282A]">
        <path d={pathData} fill="none" stroke="#7C5DFF" strokeWidth={2} strokeLinecap="round" />
        <path d={`${pathData} L ${w},${h} L 0,${h} Z`} fill="rgba(124, 93, 255, 0.18)" />
      </svg>
    );
  };

  return (
    <div id="instrument-editor-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Acoustic & Synthesizer Sound Designer
          </h3>
          <span className="text-[10px] font-mono text-[#9B82FF] bg-[#18181B] px-2 py-0.5 rounded border border-[#28282A]">
            {inst.name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-[#9E9E9E] font-mono bg-[#18181B] px-2.5 py-1 rounded-lg border border-[#28282A]">
            <span>GLIDE / PORTAMENTO:</span>
            <input
              type="range"
              min="0"
              max="0.3"
              step="0.01"
              value={inst.portamento}
              onChange={(e) => {
                inst.portamento = parseFloat(e.target.value);
                engine.notifyStateChange();
              }}
              className="w-16 accent-[#7C5DFF] cursor-pointer"
            />
            <span className="text-[#9B82FF] font-bold">{Math.round(inst.portamento * 1000)}ms</span>
          </div>
        </div>
      </div>

      {/* 1-Click Algorithmic Sound Morpher Bar */}
      <div className="mb-4 p-3 bg-[#18181B] rounded-xl border border-[#28282A] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#9B82FF]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
              PRODUCER TIMBRE MORPHER & RE-SYNTHESIS
            </span>
            <span className="text-[10px] text-[#9E9E9E] hidden sm:inline">
              Instantly re-synthesizes the active instrument into genre-defining sound design profiles
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {MORPH_STYLES.map((style) => (
            <button
              key={style.id}
              onClick={() => SoundMorpher.applyMorph(style.id, inst)}
              className="p-2 rounded-lg bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF]/60 hover:bg-[#1C1C20] transition-all text-left group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: `${style.color}20`,
                    color: style.color,
                    border: `1px solid ${style.color}40`,
                  }}
                >
                  {style.badge}
                </span>
                <Wand2 className="w-3 h-3 text-[#71717A] group-hover:text-white transition-colors" />
              </div>
              <p className="text-[11px] font-bold text-[#E0E0E0] group-hover:text-[#9B82FF] truncate">
                {style.name}
              </p>
              <p className="text-[9px] text-[#71717A] line-clamp-2 mt-0.5 leading-tight">
                {style.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: ADSR Envelope */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E0E0E0] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#9B82FF]" />
              AMPLITUDE ENVELOPE (ADSR)
            </span>
          </div>

          <div className="flex justify-center my-1.5">{renderAdsrCurve()}</div>

          <div className="grid grid-cols-4 gap-1 pt-2 border-t border-[#28282A]">
            <RotaryKnob
              label="ATTACK"
              value={inst.envelope.attack}
              min={0.001}
              max={1.5}
              step={0.005}
              unit="s"
              size="sm"
              color="#7C5DFF"
              onChange={(val) => handleEnvChange('attack', val)}
            />
            <RotaryKnob
              label="DECAY"
              value={inst.envelope.decay}
              min={0.01}
              max={5.0}
              step={0.05}
              unit="s"
              size="sm"
              color="#7C5DFF"
              onChange={(val) => handleEnvChange('decay', val)}
            />
            <RotaryKnob
              label="SUSTAIN"
              value={inst.envelope.sustain}
              min={0}
              max={1.0}
              step={0.01}
              size="sm"
              color="#7C5DFF"
              onChange={(val) => handleEnvChange('sustain', val)}
            />
            <RotaryKnob
              label="RELEASE"
              value={inst.envelope.release}
              min={0.02}
              max={4.0}
              step={0.02}
              unit="s"
              size="sm"
              color="#7C5DFF"
              onChange={(val) => handleEnvChange('release', val)}
            />
          </div>
        </div>

        {/* Module 2: Resonant Filter & Brightness */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E0E0E0] flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#38BDF8]" />
              TIMBRE & ACOUSTIC FILTER
            </span>
            <span className="text-[10px] uppercase font-mono text-[#9E9E9E] bg-[#0A0A0B] px-1.5 py-0.5 rounded border border-[#28282A]">
              {inst.filter.type}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-auto">
            <RotaryKnob
              label="CUTOFF"
              value={inst.filter.cutoff}
              min={50}
              max={18000}
              step={10}
              unit="Hz"
              size="sm"
              color="#38BDF8"
              onChange={(val) => handleFilterChange('cutoff', val)}
            />
            <RotaryKnob
              label="RESONANCE"
              value={inst.filter.resonance}
              min={0.1}
              max={15}
              step={0.1}
              size="sm"
              color="#38BDF8"
              onChange={(val) => handleFilterChange('resonance', val)}
            />
            <RotaryKnob
              label="ENV MOD"
              value={inst.filter.envelopeAmount}
              min={-1}
              max={1}
              step={0.05}
              size="sm"
              color="#38BDF8"
              onChange={(val) => handleFilterChange('envelopeAmount', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] flex items-center justify-between text-[10px] text-[#9E9E9E]">
            <span>Filter Slope: 24dB / Oct</span>
            <span className="text-[#38BDF8] font-mono">Analog Ladder</span>
          </div>
        </div>

        {/* Module 3: Physical Body & Harmonic Overtones */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E0E0E0] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#F59E0B]" />
              HARMONICS & BODY RESONANCE
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-auto">
            <RotaryKnob
              label="OVERTONES"
              value={inst.harmonics}
              min={0}
              max={1}
              step={0.01}
              size="sm"
              color="#F59E0B"
              onChange={(val) => {
                inst.harmonics = val;
                engine.notifyStateChange();
              }}
            />
            <RotaryKnob
              label="BODY RES."
              value={inst.resonanceTone}
              min={0}
              max={1}
              step={0.01}
              size="sm"
              color="#F59E0B"
              onChange={(val) => {
                inst.resonanceTone = val;
                engine.notifyStateChange();
              }}
            />
            <RotaryKnob
              label="TRANSIENT"
              value={inst.noiseAmount}
              min={0}
              max={1}
              step={0.01}
              size="sm"
              color="#F59E0B"
              onChange={(val) => {
                inst.noiseAmount = val;
                engine.notifyStateChange();
              }}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Plectrum / Hammer / Bow</span>
            <span className="text-[#F59E0B] font-mono">Physical Model</span>
          </div>
        </div>

        {/* Module 4: Vibrato / LFO Expressiveness */}
        <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#E0E0E0] flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-[#A78BFA]" />
              EXPRESSIVE VIBRATO & LFO
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-auto">
            <RotaryKnob
              label="RATE"
              value={inst.vibrato.rate}
              min={0.2}
              max={12}
              step={0.1}
              unit="Hz"
              size="sm"
              color="#A78BFA"
              onChange={(val) => handleVibratoChange('rate', val)}
            />
            <RotaryKnob
              label="DEPTH"
              value={inst.vibrato.depth}
              min={0}
              max={1}
              step={0.01}
              size="sm"
              color="#A78BFA"
              onChange={(val) => handleVibratoChange('depth', val)}
            />
            <RotaryKnob
              label="DELAY"
              value={inst.vibrato.delay}
              min={0}
              max={2.0}
              step={0.05}
              unit="s"
              size="sm"
              color="#A78BFA"
              onChange={(val) => handleVibratoChange('delay', val)}
            />
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Mod Wheel Link: Active</span>
            <span className="text-[#A78BFA] font-mono">Sine LFO</span>
          </div>
        </div>
      </div>

      {/* Special Hammond Organ 9 Drawbar Controls if active */}
      {inst.drawbars && (
        <div className="mt-4 bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[#F0F0F0]">
              HAMMOND B3 TONETRAIN 9 DRAWBAR RACK
            </span>
            <span className="text-[10px] font-mono text-[#9E9E9E]">
              16&apos; • 5⅓&apos; • 8&apos; • 4&apos; • 2⅔&apos; • 2&apos; • 1⅗&apos; • 1⅓&apos; • 1&apos;
            </span>
          </div>
          <div className="grid grid-cols-9 gap-2">
            {inst.drawbars.map((lvl, idx) => {
              const labels = ["16'", "5 1/3'", "8'", "4'", "2 2/3'", "2'", "1 3/5'", "1 1/3'", "1'"];
              return (
                <div key={idx} className="flex flex-col items-center gap-1 bg-[#0A0A0B] p-2 rounded-lg border border-[#28282A]">
                  <span className="text-[10px] font-mono text-[#9E9E9E]">{labels[idx]}</span>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={lvl}
                    onChange={(e) => {
                      const newDrawbars = [...inst.drawbars!];
                      newDrawbars[idx] = parseInt(e.target.value);
                      inst.drawbars = newDrawbars;
                      engine.notifyStateChange();
                    }}
                    className="h-20 [writing-mode:vertical-lr] [direction:rtl] cursor-pointer accent-[#7C5DFF]"
                  />
                  <span className="text-xs font-bold font-mono text-[#9B82FF]">{lvl}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
