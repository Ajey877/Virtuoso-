import { AudioEngine } from './AudioEngine';
import { DRUM_VOICES, DrumEngine, DrumSoundId } from './synthesis/DrumEngine';

export interface StepData {
  active: boolean;
  velocity: number; // 0.1 to 1.0
  pitchOffset?: number; // for melodic steps (-24 to +24 semitones)
  gate?: number; // 0.1 to 1.0
}

export interface DrumTrackState {
  soundId: DrumSoundId;
  name: string;
  shortName: string;
  color: string;
  muted: boolean;
  solo: boolean;
  steps: StepData[];
}

export interface MelodicTrackState {
  enabled: boolean;
  name: string;
  octaveOffset: number; // -2 to +2
  steps: StepData[];
}

export interface SequencerPreset {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  swing: number;
  drumSteps: Record<DrumSoundId, number[]>; // Array of active step indices
  melodicSteps?: Array<{ step: number; pitch: number; vel: number }>; // step, pitch semitone, vel
}

export const SEQUENCER_PRESETS: SequencerPreset[] = [
  {
    id: 'trap_808_banger',
    name: 'Atlanta Trap 808',
    genre: 'Hip Hop / Trap',
    bpm: 140,
    swing: 0.1,
    drumSteps: {
      kick_808: [0, 6, 10, 12],
      snare_trap: [4, 12],
      clap: [4, 12],
      hihat_closed: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      hihat_open: [2, 10],
      perc_conga: [7, 15],
      kick_punch: [],
      snare_909: [],
      perc_rim: [],
      sub_drop: [],
    },
    melodicSteps: [
      { step: 0, pitch: 0, vel: 0.9 },
      { step: 3, pitch: 3, vel: 0.8 },
      { step: 6, pitch: 7, vel: 0.85 },
      { step: 10, pitch: 10, vel: 0.9 },
      { step: 12, pitch: 8, vel: 0.8 },
      { step: 14, pitch: 7, vel: 0.75 },
    ],
  },
  {
    id: 'lofi_chill_groove',
    name: 'Lo-Fi Midnight Rain',
    genre: 'Chill / Lo-Fi',
    bpm: 84,
    swing: 0.35,
    drumSteps: {
      kick_808: [0, 7, 10],
      snare_trap: [4, 12],
      clap: [],
      hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
      hihat_open: [14],
      perc_conga: [3, 9, 13],
      kick_punch: [],
      snare_909: [],
      perc_rim: [],
      sub_drop: [],
    },
    melodicSteps: [
      { step: 0, pitch: 0, vel: 0.7 },
      { step: 4, pitch: 4, vel: 0.65 },
      { step: 8, pitch: 7, vel: 0.7 },
      { step: 11, pitch: 11, vel: 0.8 },
      { step: 14, pitch: 9, vel: 0.6 },
    ],
  },
  {
    id: 'synthwave_retro',
    name: 'Cyberpunk Synthwave',
    genre: 'Synthwave / 80s',
    bpm: 124,
    swing: 0.05,
    drumSteps: {
      kick_808: [0, 4, 8, 12],
      snare_trap: [4, 12],
      clap: [4, 12],
      hihat_closed: [2, 6, 10, 14],
      hihat_open: [2, 10],
      perc_conga: [6, 14],
      kick_punch: [],
      snare_909: [],
      perc_rim: [],
      sub_drop: [],
    },
    melodicSteps: [
      { step: 0, pitch: 0, vel: 0.85 },
      { step: 2, pitch: 0, vel: 0.7 },
      { step: 4, pitch: 7, vel: 0.85 },
      { step: 6, pitch: 7, vel: 0.7 },
      { step: 8, pitch: 10, vel: 0.9 },
      { step: 10, pitch: 10, vel: 0.75 },
      { step: 12, pitch: 12, vel: 0.95 },
      { step: 14, pitch: 10, vel: 0.8 },
    ],
  },
  {
    id: 'house_four_floor',
    name: 'Ibiza Deep House 4x4',
    genre: 'House / EDM',
    bpm: 126,
    swing: 0.15,
    drumSteps: {
      kick_808: [0, 4, 8, 12],
      snare_trap: [],
      clap: [4, 12],
      hihat_closed: [0, 2, 4, 6, 8, 10, 12, 14],
      hihat_open: [2, 6, 10, 14],
      perc_conga: [3, 7, 11, 15],
      kick_punch: [],
      snare_909: [],
      perc_rim: [],
      sub_drop: [],
    },
    melodicSteps: [
      { step: 0, pitch: 0, vel: 0.8 },
      { step: 3, pitch: 3, vel: 0.75 },
      { step: 6, pitch: 7, vel: 0.85 },
      { step: 8, pitch: 5, vel: 0.7 },
      { step: 11, pitch: 8, vel: 0.8 },
      { step: 14, pitch: 10, vel: 0.9 },
    ],
  },
  {
    id: 'afrobeat_groove',
    name: 'Lagos Afrobeat Rhythm',
    genre: 'Afrobeats / World',
    bpm: 104,
    swing: 0.25,
    drumSteps: {
      kick_808: [0, 6, 10],
      snare_trap: [4, 12],
      clap: [12],
      hihat_closed: [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15],
      hihat_open: [8],
      perc_conga: [2, 5, 8, 11, 14],
      kick_punch: [],
      snare_909: [],
      perc_rim: [],
      sub_drop: [],
    },
    melodicSteps: [
      { step: 0, pitch: 0, vel: 0.85 },
      { step: 3, pitch: 5, vel: 0.8 },
      { step: 6, pitch: 7, vel: 0.9 },
      { step: 9, pitch: 9, vel: 0.75 },
      { step: 12, pitch: 5, vel: 0.85 },
      { step: 14, pitch: 2, vel: 0.8 },
    ],
  },
];

export class SequencerEngine {
  private static instance: SequencerEngine | null = null;

  public isPlaying: boolean = false;
  public currentStep: number = 0;
  public totalSteps: number = 16;
  public swing: number = 0.15; // 0 to 0.5
  public drumTracks: DrumTrackState[] = [];
  public melodicTrack: MelodicTrackState;

  private timerWorkerId: number | null = null;
  private nextStepTime: number = 0;
  private scheduleAheadTime: number = 0.1; // 100ms
  private lookaheadInterval: number = 25; // 25ms timer
  private stepListeners: Set<(step: number) => void> = new Set();
  private stateChangeListeners: Set<() => void> = new Set();

  private drumEngine: DrumEngine;

  private constructor() {
    this.drumEngine = DrumEngine.getInstance();

    // Initialize default drum tracks
    this.drumTracks = DRUM_VOICES.map((v) => ({
      soundId: v.id,
      name: v.name,
      shortName: v.shortName,
      color: v.color,
      muted: false,
      solo: false,
      steps: Array.from({ length: 16 }, () => ({
        active: false,
        velocity: 0.8,
      })),
    }));

    // Initialize Melodic track
    this.melodicTrack = {
      enabled: true,
      name: 'Melodic Lead / Bass',
      octaveOffset: 0,
      steps: Array.from({ length: 16 }, () => ({
        active: false,
        velocity: 0.8,
        pitchOffset: 0,
        gate: 0.75,
      })),
    };

    // Load initial preset
    this.loadPreset(SEQUENCER_PRESETS[0]);
  }

  public static getInstance(): SequencerEngine {
    if (!SequencerEngine.instance) {
      SequencerEngine.instance = new SequencerEngine();
    }
    return SequencerEngine.instance;
  }

  public loadPreset(preset: SequencerPreset): void {
    const engine = AudioEngine.getInstance();
    engine.bpm = preset.bpm;
    this.swing = preset.swing;

    // Reset drum tracks
    this.drumTracks.forEach((track) => {
      const activeIndices = preset.drumSteps[track.soundId] || [];
      track.steps.forEach((step, idx) => {
        step.active = activeIndices.includes(idx);
        step.velocity = activeIndices.includes(idx) ? 0.85 : 0.8;
      });
    });

    // Reset melodic track
    this.melodicTrack.steps.forEach((s) => {
      s.active = false;
      s.pitchOffset = 0;
    });

    if (preset.melodicSteps) {
      preset.melodicSteps.forEach((m) => {
        if (m.step < this.melodicTrack.steps.length) {
          this.melodicTrack.steps[m.step].active = true;
          this.melodicTrack.steps[m.step].pitchOffset = m.pitch;
          this.melodicTrack.steps[m.step].velocity = m.vel;
        }
      });
    }

    this.notifyState();
  }

  public start(): void {
    const engine = AudioEngine.getInstance();
    if (!engine.ctx) {
      engine.init();
    }

    if (this.isPlaying) return;
    this.isPlaying = true;
    this.currentStep = 0;

    const ctx = engine.ctx;
    if (!ctx) return;

    this.nextStepTime = ctx.currentTime + 0.05;
    this.timerWorkerId = window.setInterval(() => this.scheduler(), this.lookaheadInterval);
    this.notifyState();
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerWorkerId !== null) {
      clearInterval(this.timerWorkerId);
      this.timerWorkerId = null;
    }
    this.currentStep = 0;
    this.notifyStep(0);
    this.notifyState();
  }

  public togglePlay(): void {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.start();
    }
  }

  private scheduler(): void {
    const engine = AudioEngine.getInstance();
    const ctx = engine.ctx;
    if (!ctx || !this.isPlaying) return;

    while (this.nextStepTime < ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleStep(this.currentStep, this.nextStepTime);
      this.advanceStep();
    }
  }

  private advanceStep(): void {
    const engine = AudioEngine.getInstance();
    const secondsPerBeat = 60.0 / engine.bpm;
    const stepDuration = secondsPerBeat / 4; // 16th notes

    // Apply swing on odd steps (1, 3, 5, 7...)
    const isOdd = this.currentStep % 2 === 1;
    const swingOffset = isOdd ? this.swing * stepDuration * 0.6 : -this.swing * stepDuration * 0.3;

    this.nextStepTime += stepDuration + swingOffset;

    this.currentStep = (this.currentStep + 1) % this.totalSteps;
  }

  private scheduleStep(stepIndex: number, time: number): void {
    const engine = AudioEngine.getInstance();
    const ctx = engine.ctx;
    if (!ctx || !engine.masterGain) return;

    // Trigger visual step notification
    setTimeout(() => {
      if (this.isPlaying) {
        this.notifyStep(stepIndex);
      }
    }, Math.max(0, (time - ctx.currentTime) * 1000));

    // Any soloed drum tracks?
    const hasSolo = this.drumTracks.some((t) => t.solo);

    // 1. Play Drum Voices
    this.drumTracks.forEach((track) => {
      if (track.muted) return;
      if (hasSolo && !track.solo) return;

      const step = track.steps[stepIndex];
      if (step && step.active) {
        this.drumEngine.triggerDrum(ctx, engine.masterGain!, track.soundId, step.velocity, time);
      }
    });

    // 2. Play Melodic Voice
    if (this.melodicTrack.enabled) {
      const step = this.melodicTrack.steps[stepIndex];
      if (step && step.active) {
        const rootMidi = 60 + engine.octaveShift * 12 + this.melodicTrack.octaveOffset * 12;
        const pitch = rootMidi + (step.pitchOffset || 0);
        const duration = (60.0 / engine.bpm / 4) * (step.gate || 0.75);

        // Schedule melodic note
        engine.playNoteAtTime(pitch, step.velocity, time, duration);
      }
    }
  }

  public clearAll(): void {
    this.drumTracks.forEach((t) => {
      t.steps.forEach((s) => (s.active = false));
    });
    this.melodicTrack.steps.forEach((s) => {
      s.active = false;
      s.pitchOffset = 0;
    });
    this.notifyState();
  }

  public randomize(): void {
    this.drumTracks.forEach((t) => {
      t.steps.forEach((s, idx) => {
        if (t.soundId === 'kick_808') {
          s.active = idx % 4 === 0 || (Math.random() < 0.25 && idx % 2 === 0);
        } else if (t.soundId === 'snare_trap' || t.soundId === 'clap') {
          s.active = idx === 4 || idx === 12;
        } else if (t.soundId === 'hihat_closed') {
          s.active = Math.random() < 0.75;
        } else {
          s.active = Math.random() < 0.2;
        }
        s.velocity = 0.6 + Math.random() * 0.4;
      });
    });

    this.melodicTrack.steps.forEach((s) => {
      s.active = Math.random() < 0.35;
      const scaleOffsets = [0, 3, 5, 7, 10, 12];
      s.pitchOffset = scaleOffsets[Math.floor(Math.random() * scaleOffsets.length)];
      s.velocity = 0.7 + Math.random() * 0.3;
    });

    this.notifyState();
  }

  public subscribeStep(cb: (step: number) => void): () => void {
    this.stepListeners.add(cb);
    return () => this.stepListeners.delete(cb);
  }

  public subscribeState(cb: () => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => this.stateChangeListeners.delete(cb);
  }

  private notifyStep(step: number): void {
    this.stepListeners.forEach((cb) => cb(step));
  }

  private notifyState(): void {
    this.stateChangeListeners.forEach((cb) => cb());
  }
}
