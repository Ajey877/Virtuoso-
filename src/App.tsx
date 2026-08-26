import React, { useState, useEffect } from 'react';
import {
  Activity,
  Download,
  Flame,
  Globe,
  Keyboard,
  Layers,
  Music,
  Radio,
  Sliders,
  Sparkles,
  Upload,
  Waves,
  Zap,
} from 'lucide-react';
import { AudioEngine } from './audio/AudioEngine';
import { KeyboardMapper } from './audio/KeyboardMapper';
import { MidiManager } from './audio/MidiManager';
import { AudioRoutingMatrix } from './components/AudioRoutingMatrix';
import { AudioVisualizer } from './components/AudioVisualizer';
import { CustomSampleLoader } from './components/CustomSampleLoader';
import { ExportModal } from './components/ExportModal';
import { GrooveSequencer } from './components/GrooveSequencer';
import { Header } from './components/Header';
import { InstrumentEditor } from './components/InstrumentEditor';
import { InstrumentSelector } from './components/InstrumentSelector';
import { MidiControllerPanel } from './components/MidiControllerPanel';
import { MultiTrackRecorder } from './components/MultiTrackRecorder';
import { ScaleChordPanel } from './components/ScaleChordPanel';
import { VirtualKeyboard } from './components/VirtualKeyboard';
import { VstPluginRack } from './components/VstPluginRack';
import { PianoRollSequencer } from './components/PianoRollSequencer';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useAppStore } from './store/useAppStore';

export const App: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const midiManager = MidiManager.getInstance();
  const keyboardMapper = KeyboardMapper.getInstance();
  const { activeTab, syncFromEngine } = useAppStore();

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Initialize keyboard hooks & AudioEngine subscriptions
  useEffect(() => {
    keyboardMapper.init();
    midiManager.init();
    syncFromEngine(); // Initial sync from engine state

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    const unsub = engine.subscribeStateChange(() => syncFromEngine());

    return () => {
      unsub();
      window.removeEventListener('keydown', handleKeyDown);
      keyboardMapper.destroy();
    };
  }, [engine, keyboardMapper, midiManager, syncFromEngine]);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-[#E0E0E0] flex flex-col justify-between selection:bg-[#7C5DFF] selection:text-[#0A0A0B] font-sans antialiased">
      {/* Top Application Bar */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => useAppStore.getState().setActiveTab(tab)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-3 py-3 space-y-3">
        {/* Active Tab View Content */}
        <div className="transition-all duration-150">
          {activeTab === 'instruments' && (
            <InstrumentSelector onSelectCustomTab={() => useAppStore.getState().setActiveTab('sampler')} />
          )}

          {activeTab === 'pianoroll' && <PianoRollSequencer />}

          {activeTab === 'sequencer' && <GrooveSequencer />}

          {activeTab === 'designer' && <InstrumentEditor />}

          {activeTab === 'vst' && <VstPluginRack />}

          {activeTab === 'routing' && <AudioRoutingMatrix />}

          {activeTab === 'recorder' && <MultiTrackRecorder />}

          {activeTab === 'midi' && <MidiControllerPanel />}

          {activeTab === 'scales' && <ScaleChordPanel />}

          {activeTab === 'sampler' && <CustomSampleLoader />}
        </div>

        {/* Real-time Oscilloscope / FFT Spectrum Visualizer */}
        <AudioVisualizer />

        {/* 61-Key Interactive Virtual Keyboard with Keymap Overlay */}
        <VirtualKeyboard />

        {/* Keyboard Quick Hotkey Guide */}
        <div className="bg-[#121214] p-2.5 rounded-xl border border-[#28282A] flex flex-wrap items-center justify-between text-[11px] font-mono text-[#9E9E9E] gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <Keyboard className="w-3.5 h-3.5 text-[#9B82FF]" />
            <span className="text-[#F0F0F0] font-bold">KEYBOARD MAPPING:</span>
            <span className="bg-[#18181B] px-1.5 py-0.5 rounded text-[#9B82FF] border border-[#28282A]">
              A S D F G H J K L ; &apos; (White Keys)
            </span>
            <span className="bg-[#18181B] px-1.5 py-0.5 rounded text-[#C4B5FD] border border-[#28282A]">
              W E T Y U O P (Black Keys)
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span>
              Octave: <strong className="text-[#F0F0F0]">Z / X</strong>
            </span>
            <span>
              Pitch Bend: <strong className="text-[#F0F0F0]">, / .</strong>
            </span>
            <span>
              Sustain: <strong className="text-[#F0F0F0]">Spacebar</strong>
            </span>
            <span className="text-[#9B82FF] font-semibold">
              Ultra Low Latency WebAudio DSP
            </span>
          </div>
        </div>
      </main>

      {/* High-Resolution Audio / MIDI Export Modal */}
      <ExportModal isOpen={isExportOpen} onClose={() => setIsExportOpen(false)} />

      {/* Keyboard Shortcuts & Quick HUD Modal */}
      <KeyboardShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />
    </div>
  );
};

export default App;
