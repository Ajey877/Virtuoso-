import React, { useState, useEffect } from 'react';
import { Activity, Plus, Radio, Sliders, Trash2, Zap } from 'lucide-react';
import { MidiManager } from '../audio/MidiManager';

export const MidiControllerPanel: React.FC = () => {
  const midiManager = MidiManager.getInstance();
  const [rev, setRev] = useState(0);

  useEffect(() => {
    midiManager.init();
    const unsub = midiManager.subscribe(() => setRev((t) => t + 1));
    return () => unsub();
  }, [midiManager]);

  return (
    <div id="midi-controller-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Web MIDI Controller Studio & Hardware Integration
          </h3>
          <span
            className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              midiManager.isSupported
                ? 'bg-[#7C5DFF]/20 text-[#9B82FF] border-[#7C5DFF]/40'
                : 'bg-amber-950/40 text-amber-400 border-amber-800/40'
            }`}
          >
            {midiManager.isSupported ? 'Web MIDI API Connected' : 'Web MIDI Not Detected'}
          </span>
        </div>

        <button
          id="scan-midi-devices-btn"
          onClick={() => midiManager.init()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181B] border border-[#28282A] hover:bg-[#232326] text-[#E0E0E0] text-xs font-semibold transition-all"
        >
          <Radio className="w-3.5 h-3.5 text-[#9B82FF]" />
          <span>Rescan MIDI Devices</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Column 1: Connected Devices & MIDI Learn Status */}
        <div className="space-y-4">
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <h4 className="text-xs font-bold text-[#F0F0F0] mb-2 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-[#9B82FF]" />
              DETECTED MIDI CONTROLLERS
            </h4>
            {midiManager.connectedDevices.length === 0 ? (
              <div className="p-3 bg-[#0A0A0B] rounded border border-[#28282A] text-center">
                <p className="text-xs text-[#9E9E9E]">No hardware MIDI keyboard detected.</p>
                <p className="text-[10px] text-[#71717A] mt-1">
                  Plug in any USB/Bluetooth MIDI keyboard (Akai, Arturia, Novation, etc.) and it will automatically connect!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {midiManager.connectedDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-2.5 bg-[#0A0A0B] rounded border border-[#7C5DFF]/40 flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-[#9B82FF] block">{dev.name}</span>
                      <span className="text-[10px] text-[#71717A] font-mono">
                        {dev.manufacturer || 'Standard MIDI Device'} • {dev.state}
                      </span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#7C5DFF] animate-ping" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick MIDI Learn Card */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <h4 className="text-xs font-bold text-[#F0F0F0] mb-1.5 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              ONE-CLICK MIDI LEARN
            </h4>
            <p className="text-[11px] text-[#9E9E9E] mb-3 leading-relaxed">
              Right-click any knob in the VST rack or click below to map any hardware knob/slider:
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() =>
                  midiManager.startLearning({
                    targetType: 'plugin',
                    targetId: 'filter',
                    paramKey: 'cutoff',
                    controlName: 'Filter Cutoff',
                    minVal: 40,
                    maxVal: 18000,
                  })
                }
                className="px-2.5 py-1.5 rounded bg-[#0A0A0B] hover:bg-[#232326] text-[11px] text-[#E0E0E0] border border-[#28282A] text-left truncate transition-colors"
              >
                Learn Filter Cutoff
              </button>
              <button
                onClick={() =>
                  midiManager.startLearning({
                    targetType: 'plugin',
                    targetId: 'reverb',
                    paramKey: 'mix',
                    controlName: 'Reverb Mix',
                    minVal: 0,
                    maxVal: 1,
                  })
                }
                className="px-2.5 py-1.5 rounded bg-[#0A0A0B] hover:bg-[#232326] text-[11px] text-[#E0E0E0] border border-[#28282A] text-left truncate transition-colors"
              >
                Learn Reverb Mix
              </button>
              <button
                onClick={() =>
                  midiManager.startLearning({
                    targetType: 'plugin',
                    targetId: 'delay',
                    paramKey: 'mix',
                    controlName: 'Delay Mix',
                    minVal: 0,
                    maxVal: 1,
                  })
                }
                className="px-2.5 py-1.5 rounded bg-[#0A0A0B] hover:bg-[#232326] text-[11px] text-[#E0E0E0] border border-[#28282A] text-left truncate transition-colors"
              >
                Learn Delay Mix
              </button>
              <button
                onClick={() =>
                  midiManager.startLearning({
                    targetType: 'master',
                    targetId: 'engine',
                    paramKey: 'masterVolume',
                    controlName: 'Master Volume',
                    minVal: 0,
                    maxVal: 1.2,
                  })
                }
                className="px-2.5 py-1.5 rounded bg-[#0A0A0B] hover:bg-[#232326] text-[11px] text-[#E0E0E0] border border-[#28282A] text-left truncate transition-colors"
              >
                Learn Master Vol
              </button>
            </div>
          </div>
        </div>

        {/* Column 2 & 3: MIDI CC Mapping Table & Live Byte Monitor */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mapping Table */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#F0F0F0]">ACTIVE CC & CONTROLLER MAPPINGS</h4>
              <span className="text-[10px] font-mono text-[#9E9E9E]">{midiManager.mappings.length} Assigned</span>
            </div>

            <div className="overflow-x-auto max-h-[160px] overflow-y-auto pr-1">
              <table className="w-full text-left text-[11px] font-mono">
                <thead>
                  <tr className="border-b border-[#28282A] text-[#9E9E9E]">
                    <th className="pb-1.5 font-normal">PARAMETER</th>
                    <th className="pb-1.5 font-normal">CC #</th>
                    <th className="pb-1.5 font-normal">CHANNEL</th>
                    <th className="pb-1.5 font-normal">RANGE</th>
                    <th className="pb-1.5 font-normal text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#28282A]">
                  {midiManager.mappings.map((map) => (
                    <tr key={map.id} className="hover:bg-[#0A0A0B]/60">
                      <td className="py-1.5 text-[#F0F0F0] font-sans font-medium">{map.controlName}</td>
                      <td className="py-1.5 text-[#9B82FF] font-bold">CC #{map.ccNumber}</td>
                      <td className="py-1.5 text-[#9E9E9E]">{map.midiChannel === 0 ? 'Omni (All)' : map.midiChannel}</td>
                      <td className="py-1.5 text-[#9E9E9E]">
                        {map.minVal.toFixed(0)} - {map.maxVal.toFixed(0)}
                      </td>
                      <td className="py-1.5 text-right">
                        <button
                          onClick={() => midiManager.removeMapping(map.id)}
                          className="text-[#71717A] hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live MIDI Monitor Terminal */}
          <div className="bg-[#18181B] p-3 rounded-lg border border-[#28282A]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-[#F0F0F0] flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#9B82FF]" />
                REAL-TIME MIDI EVENT MONITOR
              </h4>
              <span className="text-[9px] font-mono text-[#71717A]">Live Web MIDI Feed</span>
            </div>

            <div className="bg-[#0A0A0B] p-2.5 rounded-lg border border-[#28282A] font-mono text-[10px] h-32 overflow-y-auto space-y-1">
              {midiManager.monitorLogs.length === 0 ? (
                <div className="text-[#71717A] italic">
                  Awaiting incoming MIDI messages... (Press keys or turn knobs on your hardware controller)
                </div>
              ) : (
                midiManager.monitorLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between text-[#9E9E9E] hover:text-[#F0F0F0]">
                    <span className="text-[#9B82FF] font-bold">{log.description}</span>
                    <span className="text-[#71717A]">
                      Data: [{log.data1}, {log.data2}] • Ch {log.channel}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
