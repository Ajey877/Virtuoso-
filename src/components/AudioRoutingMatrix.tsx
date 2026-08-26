import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Radio, Sliders, Volume2 } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { RotaryKnob } from './common/RotaryKnob';
import { VuMeter } from './common/VuMeter';
import { useAppStore } from '../store/useAppStore';

export const AudioRoutingMatrix: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const { syncFromEngine } = useAppStore();

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => syncFromEngine());
    return () => unsub();
  }, [engine, syncFromEngine]);

  const handleToggleMic = async () => {
    if (engine.micEnabled) {
      engine.disableMicrophone();
    } else {
      await engine.enableMicrophone();
    }
  };

  return (
    <div id="audio-routing-matrix-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Advanced Audio Routing & Studio Bus Patchbay
          </h3>
          <span className="text-[10px] font-mono text-[#9E9E9E] bg-[#18181B] px-2 py-0.5 rounded border border-[#28282A]">
            5 Sub-Busses • Matrix Routing • Aux Mic In
          </span>
        </div>
      </div>

      {/* Main Grid: Aux Mic In + Bus Strips */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        {/* Aux Microphone / External Line In */}
        <div className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
              <span className="text-xs font-bold text-[#F0F0F0]">AUX / MIC IN</span>
              <span
                className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${
                  engine.micEnabled
                    ? 'bg-red-950/60 text-red-400 border border-red-800/50 animate-pulse'
                    : 'bg-[#0E0E10] text-[#71717A] border border-[#28282A]'
                }`}
              >
                {engine.micEnabled ? 'LIVE' : 'OFF'}
              </span>
            </div>

            <button
              id="toggle-mic-input-btn"
              onClick={handleToggleMic}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all mb-3 ${
                engine.micEnabled
                  ? 'bg-red-900/30 border-red-500 text-red-300 shadow-[0_0_10px_rgba(239,68,68,0.2)]'
                  : 'bg-[#0E0E10] hover:bg-[#232326] text-[#E0E0E0] border-[#28282A]'
              }`}
            >
              {engine.micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
              <span>{engine.micEnabled ? 'Disable Live Mic' : 'Enable Live Mic'}</span>
            </button>

            <div className="flex flex-col items-center gap-2 py-1">
              <RotaryKnob
                label="MIC GAIN"
                value={engine.micGainNode?.gain.value || 0.85}
                min={0}
                max={2.0}
                step={0.05}
                size="sm"
                color="#ef4444"
                onChange={(val) => {
                  if (engine.micGainNode && engine.ctx) {
                    engine.micGainNode.gain.setValueAtTime(val, engine.ctx.currentTime);
                  }
                  engine.notifyStateChange();
                }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-[#28282A] text-[10px] text-[#9E9E9E] flex justify-between">
            <span>Route to:</span>
            <span className="font-mono text-[#9B82FF]">VST Insert Rack</span>
          </div>
        </div>

        {/* 5 Bus Channel Strips */}
        {engine.busChannels.map((bus) => (
          <div
            key={bus.id}
            id={`bus-channel-${bus.id}`}
            className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col justify-between shadow-md"
          >
            <div>
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#28282A]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: bus.color }} />
                  <span className="text-xs font-bold text-[#F0F0F0] truncate">{bus.name}</span>
                </div>
                <button
                  onClick={() => {
                    bus.mute = !bus.mute;
                    engine.notifyStateChange();
                  }}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    bus.mute ? 'bg-red-500 text-white' : 'bg-[#0E0E10] text-[#9E9E9E] hover:text-[#F0F0F0] border border-[#28282A]'
                  }`}
                >
                  M
                </button>
              </div>

              {/* Fader & Pan */}
              <div className="flex items-center justify-around py-1">
                <RotaryKnob
                  label="PAN"
                  value={bus.pan}
                  min={-1}
                  max={1}
                  step={0.05}
                  size="sm"
                  color={bus.color}
                  defaultValue={0}
                  onChange={(val) => {
                    bus.pan = val;
                    engine.notifyStateChange();
                  }}
                />
                <RotaryKnob
                  label="SEND A"
                  value={bus.sendLevelA}
                  min={0}
                  max={1}
                  step={0.05}
                  size="sm"
                  color="#f59e0b"
                  onChange={(val) => {
                    bus.sendLevelA = val;
                    engine.notifyStateChange();
                  }}
                />
              </div>

              <div className="my-2 flex flex-col items-center gap-1 bg-[#0A0A0B] p-2 rounded-lg border border-[#28282A]">
                <div className="flex justify-between w-full text-[10px] font-mono text-[#9E9E9E]">
                  <span>LEVEL</span>
                  <span className="text-[#9B82FF] font-bold">{Math.round(bus.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.02"
                  value={bus.volume}
                  onChange={(e) => {
                    bus.volume = parseFloat(e.target.value);
                    engine.notifyStateChange();
                  }}
                  className="w-full accent-[#7C5DFF] cursor-pointer"
                />
              </div>
            </div>

            {/* Target Output Router */}
            <div className="pt-2 border-t border-[#28282A] flex flex-col gap-1">
              <span className="text-[9px] text-[#9E9E9E] font-mono">ROUTED TO:</span>
              <select
                value={bus.outputTarget}
                onChange={(e) => {
                  bus.outputTarget = e.target.value as any;
                  engine.notifyStateChange();
                }}
                className="bg-[#0A0A0B] text-[#E0E0E0] border border-[#28282A] rounded px-1.5 py-1 text-[10px] font-mono focus:outline-none focus:border-[#7C5DFF]"
              >
                <option value="master">Master Out (1/2)</option>
                <option value="busA">Sub-Bus A</option>
                <option value="busB">Sub-Bus B</option>
                <option value="busC">Sub-Bus C</option>
                <option value="cue">Cue / Headphone</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Signal Matrix Patchbay Diagram */}
      <div className="mt-4 bg-[#18181B] p-3 rounded-lg border border-[#28282A] text-xs">
        <span className="font-bold text-[#F0F0F0] block mb-1">
          RECORDING SESSION SIGNAL GRAPH
        </span>
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono text-[#9E9E9E]">
          <span className="px-2 py-1 bg-[#0A0A0B] rounded text-[#9B82FF] border border-[#28282A]">
            [World Polyphonic Timbre]
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-[#0A0A0B] rounded text-blue-400 border border-[#28282A]">
            [Aux Mic / Ext In]
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-[#0A0A0B] rounded text-[#7C5DFF] border border-[#28282A]">
            [7-Stage VST Insert Rack]
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-[#0A0A0B] rounded text-amber-400 border border-[#28282A]">
            [Sub-Busses & Matrix Patch]
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-[#0A0A0B] rounded text-rose-400 border border-[#28282A]">
            [Brickwall Safety Limiter]
          </span>
          <span>→</span>
          <span className="px-2 py-1 bg-[#7C5DFF]/20 rounded text-[#F0F0F0] font-bold border border-[#7C5DFF]/50 shadow-[0_0_10px_rgba(124,93,255,0.25)]">
            [Master 24-Bit / 32-Bit Lossless Out]
          </span>
        </div>
      </div>
    </div>
  );
};
