import { create } from 'zustand';
import { AppTab, BusChannel, RecordedTrack, VstPlugin } from '../types/audio';
import { AudioEngine } from '../audio/AudioEngine';

interface AppState {
  activeTab: AppTab;
  masterVolume: number;
  bpm: number;
  octaveShift: number;
  semitoneTranspose: number;
  scaleLockEnabled: boolean;
  metronomeEnabled: boolean;
  isRunning: boolean;
  isRecording: boolean;
  sustainPedal: boolean;
  macroCutoff: number;
  macroDrive: number;
  macroSpace: number;
  macroMotion: number;
  busChannels: BusChannel[];
  vstPlugins: VstPlugin[];
  recordedTracks: RecordedTrack[];

  // Actions to mutate UI state and engine state simultaneously
  setActiveTab: (tab: AppTab) => void;
  setMasterVolume: (val: number) => void;
  setBpm: (val: number) => void;
  setOctaveShift: (val: number) => void;
  setSemitoneTranspose: (val: number) => void;
  setScaleLockEnabled: (enabled: boolean) => void;
  setMetronomeEnabled: (enabled: boolean) => void;
  setSustainPedal: (down: boolean) => void;
  setMacro: (macro: 'cutoff' | 'drive' | 'space' | 'motion', val: number) => void;
  setIsRunning: (running: boolean) => void;
  syncFromEngine: () => void; // Sync rare events from engine back to UI if needed
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: 'instruments',
  masterVolume: 0.85,
  bpm: 120,
  octaveShift: 0,
  semitoneTranspose: 0,
  scaleLockEnabled: false,
  metronomeEnabled: false,
  isRunning: false,
  isRecording: false,
  sustainPedal: false,
  macroCutoff: 1.0,
  macroDrive: 0.0,
  macroSpace: 0.0,
  macroMotion: 0.0,
  busChannels: [],
  vstPlugins: [],
  recordedTracks: [],

  setActiveTab: (tab) => set({ activeTab: tab }),

  setMasterVolume: (val) => {
    const engine = AudioEngine.getInstance();
    engine.masterVolume = val;
    if (engine.masterGain && engine.ctx) {
      engine.masterGain.gain.setValueAtTime(val, engine.ctx.currentTime);
    }
    set({ masterVolume: val });
  },

  setBpm: (val) => {
    const engine = AudioEngine.getInstance();
    engine.bpm = val;
    set({ bpm: val });
  },

  setOctaveShift: (val) => {
    AudioEngine.getInstance().octaveShift = val;
    set({ octaveShift: val });
  },

  setSemitoneTranspose: (val) => {
    AudioEngine.getInstance().semitoneTranspose = val;
    set({ semitoneTranspose: val });
  },

  setScaleLockEnabled: (enabled) => {
    AudioEngine.getInstance().scaleLockEnabled = enabled;
    set({ scaleLockEnabled: enabled });
  },

  setMetronomeEnabled: (enabled) => {
    const engine = AudioEngine.getInstance();
    if (engine.metronomeEnabled !== enabled) {
      engine.toggleMetronome(); // Keep internal logic for now
    }
    set({ metronomeEnabled: enabled });
  },

  setSustainPedal: (down) => {
    AudioEngine.getInstance().setSustainPedal(down);
    set({ sustainPedal: down });
  },

  setMacro: (macro, val) => {
    AudioEngine.getInstance().setProducerMacro(macro, val);
    set((state) => ({ ...state, [`macro${macro.charAt(0).toUpperCase() + macro.slice(1)}`]: val }));
  },

  setIsRunning: (running) => set({ isRunning: running }),

  syncFromEngine: () => {
    const engine = AudioEngine.getInstance();
    set({
      masterVolume: engine.masterVolume,
      bpm: engine.bpm,
      octaveShift: engine.octaveShift,
      semitoneTranspose: engine.semitoneTranspose,
      scaleLockEnabled: engine.scaleLockEnabled,
      metronomeEnabled: engine.metronomeEnabled,
      isRunning: engine.isRunning,
      isRecording: engine.isRecording,
      sustainPedal: engine.sustainPedal,
      macroCutoff: engine.macroCutoff,
      macroDrive: engine.macroDrive,
      macroSpace: engine.macroSpace,
      macroMotion: engine.macroMotion,
      busChannels: [...engine.busChannels],
      vstPlugins: [...engine.vstPlugins],
      recordedTracks: [...engine.recordedTracks],
    });
  },
}));
