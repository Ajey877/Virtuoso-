import { AudioEngine } from '../AudioEngine';
import { PianoRollNote } from '../../types/audio';

export interface PianoRollPattern {
  id: string;
  name: string;
  genre: string;
  bpm: number;
  totalSteps: number; // usually 16, 32, or 64
  notes: PianoRollNote[];
}

export const MELODY_TEMPLATES: PianoRollPattern[] = [
  {
    id: 'dark_drill_bells',
    name: 'Dark Drill Minor 9th Bell',
    genre: 'UK/NY Drill',
    bpm: 140,
    totalSteps: 32,
    notes: [
      { id: 'n1', note: 60, step: 0, duration: 4, velocity: 0.9 }, // C4
      { id: 'n2', note: 63, step: 4, duration: 4, velocity: 0.85 }, // Eb4
      { id: 'n3', note: 67, step: 8, duration: 2, velocity: 0.8 }, // G4
      { id: 'n4', note: 70, step: 10, duration: 2, velocity: 0.9 }, // Bb4
      { id: 'n5', note: 74, step: 12, duration: 4, velocity: 0.95 }, // D5
      { id: 'n6', note: 72, step: 16, duration: 4, velocity: 0.85 }, // C5
      { id: 'n7', note: 68, step: 20, duration: 4, velocity: 0.8 }, // Ab4
      { id: 'n8', note: 67, step: 24, duration: 4, velocity: 0.85 }, // G4
      { id: 'n9', note: 63, step: 28, duration: 4, velocity: 0.75 }, // Eb4
    ],
  },
  {
    id: 'metro_trap_arp',
    name: 'Metro Night Triad Rolls',
    genre: 'Trap',
    bpm: 136,
    totalSteps: 32,
    notes: [
      { id: 'm1', note: 60, step: 0, duration: 2, velocity: 0.9 },
      { id: 'm2', note: 63, step: 2, duration: 2, velocity: 0.75 },
      { id: 'm3', note: 67, step: 4, duration: 2, velocity: 0.85 },
      { id: 'm4', note: 72, step: 6, duration: 2, velocity: 0.9 },
      { id: 'm5', note: 70, step: 8, duration: 2, velocity: 0.8 },
      { id: 'm6', note: 67, step: 10, duration: 2, velocity: 0.75 },
      { id: 'm7', note: 65, step: 12, duration: 2, velocity: 0.85 },
      { id: 'm8', note: 63, step: 14, duration: 2, velocity: 0.7 },
      { id: 'm9', note: 59, step: 16, duration: 2, velocity: 0.9 },
      { id: 'm10', note: 63, step: 18, duration: 2, velocity: 0.75 },
      { id: 'm11', note: 67, step: 20, duration: 2, velocity: 0.85 },
      { id: 'm12', note: 71, step: 22, duration: 2, velocity: 0.9 },
      { id: 'm13', note: 68, step: 24, duration: 4, velocity: 0.85 },
      { id: 'm14', note: 67, step: 28, duration: 4, velocity: 0.8 },
    ],
  },
  {
    id: 'lofi_chill_chords',
    name: 'Midnight Lo-Fi Silk Chords',
    genre: 'Lo-Fi',
    bpm: 82,
    totalSteps: 32,
    notes: [
      // Chord 1: Dm9 (D3, F3, A3, C4, E4)
      { id: 'l1', note: 50, step: 0, duration: 8, velocity: 0.8 },
      { id: 'l2', note: 53, step: 0, duration: 8, velocity: 0.75 },
      { id: 'l3', note: 57, step: 0, duration: 8, velocity: 0.7 },
      { id: 'l4', note: 60, step: 0, duration: 8, velocity: 0.85 },
      { id: 'l5', note: 64, step: 0, duration: 8, velocity: 0.9 },

      // Chord 2: G13 (G3, B3, F4, E4)
      { id: 'l6', note: 55, step: 8, duration: 8, velocity: 0.8 },
      { id: 'l7', note: 59, step: 8, duration: 8, velocity: 0.75 },
      { id: 'l8', note: 65, step: 8, duration: 8, velocity: 0.8 },
      { id: 'l9', note: 64, step: 8, duration: 8, velocity: 0.85 },

      // Chord 3: Cmaj9 (C3, E3, G3, B3, D4)
      { id: 'l10', note: 48, step: 16, duration: 8, velocity: 0.85 },
      { id: 'l11', note: 52, step: 16, duration: 8, velocity: 0.7 },
      { id: 'l12', note: 55, step: 16, duration: 8, velocity: 0.75 },
      { id: 'l13', note: 59, step: 16, duration: 8, velocity: 0.8 },
      { id: 'l14', note: 62, step: 16, duration: 8, velocity: 0.9 },

      // Chord 4: A7alt (A3, C#4, G4, C5)
      { id: 'l15', note: 57, step: 24, duration: 8, velocity: 0.8 },
      { id: 'l16', note: 61, step: 24, duration: 8, velocity: 0.75 },
      { id: 'l17', note: 67, step: 24, duration: 8, velocity: 0.85 },
      { id: 'l18', note: 72, step: 24, duration: 8, velocity: 0.9 },
    ],
  },
  {
    id: 'tokyo_citypop_hook',
    name: 'Tokyo Neon Lead Hook',
    genre: 'City Pop / Anime',
    bpm: 120,
    totalSteps: 32,
    notes: [
      { id: 't1', note: 69, step: 0, duration: 3, velocity: 0.9 }, // A4
      { id: 't2', note: 71, step: 3, duration: 3, velocity: 0.85 }, // B4
      { id: 't3', note: 72, step: 6, duration: 4, velocity: 0.95 }, // C5
      { id: 't4', note: 76, step: 10, duration: 4, velocity: 0.9 }, // E5
      { id: 't5', note: 74, step: 14, duration: 2, velocity: 0.8 }, // D5
      { id: 't6', note: 72, step: 16, duration: 4, velocity: 0.9 }, // C5
      { id: 't7', note: 71, step: 20, duration: 4, velocity: 0.85 }, // B4
      { id: 't8', note: 69, step: 24, duration: 4, velocity: 0.95 }, // A4
      { id: 't9', note: 67, step: 28, duration: 4, velocity: 0.8 }, // G4
    ],
  },
  {
    id: 'drill_808_slide_bass',
    name: 'UK/NY 808 Glide Bassline',
    genre: 'Drill / Trap',
    bpm: 142,
    totalSteps: 32,
    notes: [
      { id: 'd1', note: 36, step: 0, duration: 6, velocity: 0.95 }, // C2
      { id: 'd2', note: 48, step: 6, duration: 2, velocity: 0.9 }, // C3 (Slide snapshot)
      { id: 'd3', note: 36, step: 8, duration: 4, velocity: 0.85 }, // C2
      { id: 'd4', note: 39, step: 12, duration: 4, velocity: 0.9 }, // Eb2
      { id: 'd5', note: 41, step: 16, duration: 6, velocity: 0.95 }, // F2
      { id: 'd6', note: 53, step: 22, duration: 2, velocity: 0.9 }, // F3 (High drill slide)
      { id: 'd7', note: 41, step: 24, duration: 4, velocity: 0.85 }, // F2
      { id: 'd8', note: 44, step: 28, duration: 4, velocity: 0.9 }, // Ab2
    ],
  },
];

export class PianoRollEngine {
  private static instance: PianoRollEngine | null = null;
  public isPlaying: boolean = false;
  public currentStep: number = 0;
  public totalSteps: number = 32; // 2 bars of 16ths
  public notes: PianoRollNote[] = [...MELODY_TEMPLATES[0].notes];
  public quantizeGrid: number = 1; // 1 = 16th, 2 = 8th, 4 = 1/4 note
  public selectedNoteIds: Set<string> = new Set();
  public snapToScale: boolean = true;
  private intervalTimerId: number | null = null;
  private listeners: Array<() => void> = [];

  public static getInstance(): PianoRollEngine {
    if (!PianoRollEngine.instance) {
      PianoRollEngine.instance = new PianoRollEngine();
    }
    return PianoRollEngine.instance;
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }

  public addNote(note: number, step: number, duration: number = 2, velocity: number = 0.85): PianoRollNote {
    const newNote: PianoRollNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      note,
      step,
      duration,
      velocity,
    };
    this.notes.push(newNote);
    this.notify();
    return newNote;
  }

  public removeNote(id: string): void {
    this.notes = this.notes.filter((n) => n.id !== id);
    this.selectedNoteIds.delete(id);
    this.notify();
  }

  public clearNotes(): void {
    this.notes = [];
    this.selectedNoteIds.clear();
    this.notify();
  }

  public loadTemplate(templateId: string): void {
    const t = MELODY_TEMPLATES.find((p) => p.id === templateId);
    if (!t) return;
    this.notes = JSON.parse(JSON.stringify(t.notes));
    this.totalSteps = t.totalSteps;
    const engine = AudioEngine.getInstance();
    engine.bpm = t.bpm;
    engine.notifyStateChange();
    this.notify();
  }

  public transpose(semitones: number): void {
    this.notes.forEach((n) => {
      n.note = Math.max(24, Math.min(96, n.note + semitones));
    });
    this.notify();
  }

  public humanizeVelocities(): void {
    this.notes.forEach((n) => {
      const jitter = (Math.random() * 0.2 - 0.1);
      n.velocity = Math.max(0.4, Math.min(1.0, n.velocity + jitter));
    });
    this.notify();
  }

  public duplicateBars(): void {
    const half = this.totalSteps / 2;
    const firstHalfNotes = this.notes.filter((n) => n.step < half);
    const duplicated = firstHalfNotes.map((n) => ({
      ...n,
      id: `note_dup_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      step: n.step + half,
    }));
    this.notes = [...this.notes.filter((n) => n.step < half), ...duplicated];
    this.notify();
  }

  public startPlayback(): void {
    this.stopPlayback();
    this.isPlaying = true;
    this.currentStep = 0;

    const engine = AudioEngine.getInstance();
    const stepDurationMs = (60 / engine.bpm) / 4 * 1000; // 16th note in ms

    const triggerCurrentStep = () => {
      const stepNotes = this.notes.filter((n) => n.step === this.currentStep);
      stepNotes.forEach((n) => {
        engine.playNote(n.note, n.velocity);
        const noteDurationMs = n.duration * stepDurationMs * 0.95;
        setTimeout(() => {
          engine.stopNote(n.note);
        }, noteDurationMs);
      });
    };

    triggerCurrentStep();

    let nextStepTime = performance.now() + stepDurationMs;

    const scheduler = () => {
      if (!this.isPlaying) return;
      const now = performance.now();

      if (now >= nextStepTime) {
        this.currentStep = (this.currentStep + 1) % this.totalSteps;
        triggerCurrentStep();
        this.notify();
        nextStepTime += stepDurationMs;
      }
      this.intervalTimerId = requestAnimationFrame(scheduler) as unknown as number;
    };

    this.intervalTimerId = requestAnimationFrame(scheduler) as unknown as number;

    this.notify();
  }

  public stopPlayback(): void {
    if (this.intervalTimerId) {
      cancelAnimationFrame(this.intervalTimerId as unknown as number);
      this.intervalTimerId = null;
    }
    this.isPlaying = false;
    this.currentStep = 0;
    this.notify();
  }
}
