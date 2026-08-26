import { AudioEngine } from '../AudioEngine';

export interface ChordStep {
  name: string;
  roman: string;
  rootOffset: number; // semitones from key root
  intervals: number[]; // relative intervals in semitones (e.g. [0, 4, 7, 11] for Maj7)
  octaveOffset?: number;
}

export interface ProgressionTemplate {
  id: string;
  name: string;
  genre: string;
  mood: string;
  tag: string;
  bpm: number;
  steps: ChordStep[];
}

export const PRODUCER_PROGRESSIONS: ProgressionTemplate[] = [
  {
    id: 'emotional_trap',
    name: 'Emotional Trap 9ths',
    genre: 'Trap / Drill',
    mood: 'Dark, Reflective, Moody',
    tag: 'METRO / TRAVIS',
    bpm: 140,
    steps: [
      { name: 'Min 9', roman: 'i 9', rootOffset: 0, intervals: [0, 3, 7, 10, 14] },
      { name: 'Maj 7', roman: 'VI maj7', rootOffset: 8, intervals: [0, 4, 7, 11] },
      { name: 'Maj 9', roman: 'III maj9', rootOffset: 3, intervals: [0, 4, 7, 11, 14] },
      { name: '7sus4', roman: 'VII 7sus4', rootOffset: 10, intervals: [0, 5, 7, 10] },
    ],
  },
  {
    id: 'neosoul_butter',
    name: 'Neo-Soul Silk 11ths',
    genre: 'Neo-Soul / R&B',
    mood: 'Lush, Jazzy, Velvet',
    tag: 'SZA / TYLER',
    bpm: 88,
    steps: [
      { name: 'Min 11', roman: 'ii 11', rootOffset: 2, intervals: [0, 3, 7, 10, 14, 17] },
      { name: 'Dominant 13', roman: 'V 13', rootOffset: 7, intervals: [0, 4, 7, 10, 14, 21] },
      { name: 'Maj 9', roman: 'I maj9', rootOffset: 0, intervals: [0, 4, 7, 11, 14] },
      { name: '7 (#9)', roman: 'VI 7alt', rootOffset: 9, intervals: [0, 4, 7, 10, 15] },
    ],
  },
  {
    id: 'lofi_midnight',
    name: 'Midnight Lo-Fi 2-5-1',
    genre: 'Lo-Fi Chill',
    mood: 'Warm Tape, Nostalgic, Study',
    tag: 'LO-FI / CHILLHOP',
    bpm: 78,
    steps: [
      { name: 'Min 9', roman: 'ii 9', rootOffset: 2, intervals: [0, 3, 7, 10, 14] },
      { name: '7 (b9)', roman: 'V 7b9', rootOffset: 7, intervals: [0, 4, 7, 10, 13] },
      { name: 'Maj 7', roman: 'I maj7', rootOffset: 0, intervals: [0, 4, 7, 11] },
      { name: 'Min 7 (b13)', roman: 'vi 7b13', rootOffset: 9, intervals: [0, 3, 7, 10, 16] },
    ],
  },
  {
    id: 'japanese_citypop',
    name: 'Royal Road City Pop',
    genre: 'City Pop / Anime',
    mood: 'Euphoric, Summer, Tokyo Drive',
    tag: 'J-POP / CITYPOP',
    bpm: 118,
    steps: [
      { name: 'Maj 7', roman: 'IV maj7', rootOffset: 5, intervals: [0, 4, 7, 11] },
      { name: 'Dom 7', roman: 'V 7', rootOffset: 7, intervals: [0, 4, 7, 10] },
      { name: 'Min 7', roman: 'iii 7', rootOffset: 4, intervals: [0, 3, 7, 10] },
      { name: 'Min 7', roman: 'vi 7', rootOffset: 9, intervals: [0, 3, 7, 10] },
    ],
  },
  {
    id: 'afrobeats_sunset',
    name: 'Afrobeat Sunset Groove',
    genre: 'Afrobeat / Amapiano',
    mood: 'Bouncy, Infectious, Vibrant',
    tag: 'BURNA / REMA',
    bpm: 104,
    steps: [
      { name: 'Min 7', roman: 'vi 7', rootOffset: 9, intervals: [0, 3, 7, 10] },
      { name: 'Maj 7', roman: 'IV maj7', rootOffset: 5, intervals: [0, 4, 7, 11] },
      { name: 'Major', roman: 'I', rootOffset: 0, intervals: [0, 4, 7, 12] },
      { name: 'Major', roman: 'V', rootOffset: 7, intervals: [0, 4, 7, 12] },
    ],
  },
  {
    id: 'synthwave_80s',
    name: 'Cyberpunk Neon Drive',
    genre: 'Synthwave / Darksynth',
    mood: 'Night City, Retro 80s, Driving',
    tag: 'SYNTHWAVE',
    bpm: 124,
    steps: [
      { name: 'Minor', roman: 'i', rootOffset: 0, intervals: [0, 3, 7, 12] },
      { name: 'Major', roman: 'bVI', rootOffset: 8, intervals: [0, 4, 7, 12] },
      { name: 'Major', roman: 'bVII', rootOffset: 10, intervals: [0, 4, 7, 12] },
      { name: 'Sus 2', roman: 'i sus2', rootOffset: 0, intervals: [0, 2, 7, 12] },
    ],
  },
  {
    id: 'bedroom_pop',
    name: 'Bedroom Pop Melancholy',
    genre: 'Indie / Bedroom Pop',
    mood: 'Dreamy, Nostalgic, Cozy',
    tag: 'CLAIRO / BEABADOOBEE',
    bpm: 92,
    steps: [
      { name: 'Maj 7', roman: 'I maj7', rootOffset: 0, intervals: [0, 4, 7, 11] },
      { name: 'Min 7', roman: 'iii 7', rootOffset: 4, intervals: [0, 3, 7, 10] },
      { name: 'Maj 7', roman: 'IV maj7', rootOffset: 5, intervals: [0, 4, 7, 11] },
      { name: 'Min 6', roman: 'iv 6', rootOffset: 5, intervals: [0, 3, 7, 9] },
    ],
  },
];

export class ProgressionEngine {
  private static instance: ProgressionEngine | null = null;
  public isPlaying: boolean = false;
  public currentProgressionId: string = 'emotional_trap';
  public currentStepIndex: number = 0;
  public strumSpeedMs: number = 22; // 0 (block) to 60ms (guitar roll)
  public humanizeVelocity: boolean = true;
  public octaves: number = 1; // 1 or 2 octaves
  public loopProgression: boolean = true;
  private playbackTimerId: number | null = null;

  public static getInstance(): ProgressionEngine {
    if (!ProgressionEngine.instance) {
      ProgressionEngine.instance = new ProgressionEngine();
    }
    return ProgressionEngine.instance;
  }

  public getActiveProgression(): ProgressionTemplate {
    return (
      PRODUCER_PROGRESSIONS.find((p) => p.id === this.currentProgressionId) ||
      PRODUCER_PROGRESSIONS[0]
    );
  }

  /**
   * Triggers a specific chord step with humanized strumming
   */
  public triggerStep(stepIndex: number, durationMs: number = 1400): void {
    const engine = AudioEngine.getInstance();
    const progression = this.getActiveProgression();
    const step = progression.steps[stepIndex % progression.steps.length];
    if (!step) return;

    this.currentStepIndex = stepIndex % progression.steps.length;

    const baseRoot = 60 + engine.octaveShift * 12 + engine.semitoneTranspose + engine.currentRootNote + step.rootOffset;

    // Collect full notes to trigger
    const notesToPlay: number[] = [];
    step.intervals.forEach((interval) => {
      notesToPlay.push(baseRoot + interval);
      if (this.octaves > 1 && interval < 12) {
        notesToPlay.push(baseRoot + interval + 12);
      }
    });

    // Sort lowest to highest for realistic guitar/piano strumming
    notesToPlay.sort((a, b) => a - b);

    // Strum trigger with micro-delays
    notesToPlay.forEach((note, idx) => {
      const strumDelay = idx * this.strumSpeedMs;
      const velocityJitter = this.humanizeVelocity ? (Math.random() * 0.16 - 0.08) : 0;
      const velocity = Math.max(0.4, Math.min(1.0, 0.82 + velocityJitter));

      setTimeout(() => {
        engine.playNote(note, velocity);
      }, strumDelay);
    });

    // Note off release after step duration
    setTimeout(() => {
      notesToPlay.forEach((note) => {
        engine.stopNote(note);
      });
    }, durationMs - 50);

    engine.notifyStateChange();
  }

  /**
   * Starts rhythmic playback loop of the progression
   */
  public startPlayback(): void {
    this.stopPlayback();
    this.isPlaying = true;
    this.currentStepIndex = 0;

    const progression = this.getActiveProgression();
    const stepDurationMs = (60 / progression.bpm) * 2 * 1000; // 2 beats per chord

    this.triggerStep(0, stepDurationMs);
    let nextStepTime = performance.now() + stepDurationMs;

    const scheduler = () => {
      if (!this.isPlaying) return;
      const now = performance.now();

      if (now >= nextStepTime) {
        this.currentStepIndex = (this.currentStepIndex + 1) % progression.steps.length;
        this.triggerStep(this.currentStepIndex, stepDurationMs);
        nextStepTime += stepDurationMs;

        if (!this.loopProgression && this.currentStepIndex === 0) {
          this.stopPlayback();
          return;
        }
      }
      this.playbackTimerId = requestAnimationFrame(scheduler) as unknown as number;
    };

    this.playbackTimerId = requestAnimationFrame(scheduler) as unknown as number;
  }

  public stopPlayback(): void {
    if (this.playbackTimerId) {
      cancelAnimationFrame(this.playbackTimerId as unknown as number);
      this.playbackTimerId = null;
    }
    this.isPlaying = false;
    AudioEngine.getInstance().notifyStateChange();
  }
}
