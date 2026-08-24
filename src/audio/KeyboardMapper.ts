import { AudioEngine } from './AudioEngine';

export interface KeyMapping {
  key: string;
  label: string;
  noteOffset: number; // Semitone offset from base note (e.g. 60 = C4)
  isBlack: boolean;
  row: 'upper' | 'lower';
}

export const COMPUTER_KEY_MAP: Record<string, { noteOffset: number; label: string; isBlack: boolean }> = {
  // Lower / Main Octave (Standard QWERTY piano mapping)
  'a': { noteOffset: 0, label: 'C4', isBlack: false },
  'w': { noteOffset: 1, label: 'C#4', isBlack: true },
  's': { noteOffset: 2, label: 'D4', isBlack: false },
  'e': { noteOffset: 3, label: 'D#4', isBlack: true },
  'd': { noteOffset: 4, label: 'E4', isBlack: false },
  'f': { noteOffset: 5, label: 'F4', isBlack: false },
  't': { noteOffset: 6, label: 'F#4', isBlack: true },
  'g': { noteOffset: 7, label: 'G4', isBlack: false },
  'y': { noteOffset: 8, label: 'G#4', isBlack: true },
  'h': { noteOffset: 9, label: 'A4', isBlack: false },
  'u': { noteOffset: 10, label: 'A#4', isBlack: true },
  'j': { noteOffset: 11, label: 'B4', isBlack: false },
  'k': { noteOffset: 12, label: 'C5', isBlack: false },
  'o': { noteOffset: 13, label: 'C#5', isBlack: true },
  'l': { noteOffset: 14, label: 'D5', isBlack: false },
  'p': { noteOffset: 15, label: 'D#5', isBlack: true },
  ';': { noteOffset: 16, label: 'E5', isBlack: false },
  "'": { noteOffset: 17, label: 'F5', isBlack: false },

  // Bottom Row / Bass octave
  'z': { noteOffset: -12, label: 'C3', isBlack: false },
  's_alt': { noteOffset: -11, label: 'C#3', isBlack: true },
  'x': { noteOffset: -10, label: 'D3', isBlack: false },
  'd_alt': { noteOffset: -9, label: 'D#3', isBlack: true },
  'c': { noteOffset: -8, label: 'E3', isBlack: false },
  'v': { noteOffset: -7, label: 'F3', isBlack: false },
  'g_alt': { noteOffset: -6, label: 'F#3', isBlack: true },
  'b': { noteOffset: -5, label: 'G3', isBlack: false },
  'h_alt': { noteOffset: -4, label: 'G#3', isBlack: true },
  'n': { noteOffset: -3, label: 'A3', isBlack: false },
  'j_alt': { noteOffset: -2, label: 'A#3', isBlack: true },
  'm': { noteOffset: -1, label: 'B3', isBlack: false },
  ',': { noteOffset: 0, label: 'C4', isBlack: false },
  '.': { noteOffset: 2, label: 'D4', isBlack: false },
  '/': { noteOffset: 4, label: 'E4', isBlack: false },
};

export class KeyboardMapper {
  private static instance: KeyboardMapper | null = null;
  private audioEngine: AudioEngine;

  private activePhysicalKeys: Set<string> = new Set();
  private keyDownTimes: Map<string, number> = new Map();
  public baseNote: number = 60; // C4
  public fixedVelocity: number = 0.85;
  public dynamicVelocityEnabled: boolean = true;

  private boundKeyDown = (e: KeyboardEvent) => this.handleKeyDown(e);
  private boundKeyUp = (e: KeyboardEvent) => this.handleKeyUp(e);
  private isAttached: boolean = false;

  public static getInstance(): KeyboardMapper {
    if (!KeyboardMapper.instance) {
      KeyboardMapper.instance = new KeyboardMapper();
    }
    return KeyboardMapper.instance;
  }

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
    this.init();
  }

  public init(): void {
    if (typeof window === 'undefined' || this.isAttached) return;
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    this.isAttached = true;
  }

  public destroy(): void {
    if (typeof window === 'undefined' || !this.isAttached) return;
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.isAttached = false;
  }


  private handleKeyDown(e: KeyboardEvent): void {
    // Ignore input events when user is typing in text fields/inputs
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const key = e.key.toLowerCase();

    // Hotkeys
    if (e.code === 'Space') {
      e.preventDefault();
      this.audioEngine.setSustainPedal(true);
      return;
    }

    if (e.key === '[' || e.key === 'ArrowDown' && e.altKey) {
      this.audioEngine.octaveShift = Math.max(-3, this.audioEngine.octaveShift - 1);
      this.audioEngine.notifyStateChange();
      return;
    }
    if (e.key === ']' || e.key === 'ArrowUp' && e.altKey) {
      this.audioEngine.octaveShift = Math.min(3, this.audioEngine.octaveShift + 1);
      this.audioEngine.notifyStateChange();
      return;
    }

    if (e.key === '-' && e.altKey) {
      this.audioEngine.semitoneTranspose = Math.max(-12, this.audioEngine.semitoneTranspose - 1);
      this.audioEngine.notifyStateChange();
      return;
    }
    if (e.key === '=' && e.altKey) {
      this.audioEngine.semitoneTranspose = Math.min(12, this.audioEngine.semitoneTranspose + 1);
      this.audioEngine.notifyStateChange();
      return;
    }

    // Momentary pitch bend
    if (e.key === 'ArrowUp' && !e.altKey) {
      this.audioEngine.setPitchBend(100);
      return;
    }
    if (e.key === 'ArrowDown' && !e.altKey) {
      this.audioEngine.setPitchBend(-100);
      return;
    }

    // Playable keyboard mapping
    const mapping = COMPUTER_KEY_MAP[key];
    if (mapping && !this.activePhysicalKeys.has(key)) {
      this.activePhysicalKeys.add(key);
      const now = performance.now();
      this.keyDownTimes.set(key, now);

      const targetMidiNote = this.baseNote + mapping.noteOffset;
      const velocity = this.fixedVelocity;

      this.audioEngine.playNote(targetMidiNote, velocity);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
      return;
    }

    const key = e.key.toLowerCase();

    if (e.code === 'Space') {
      e.preventDefault();
      this.audioEngine.setSustainPedal(false);
      return;
    }

    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      this.audioEngine.setPitchBend(0);
      return;
    }

    const mapping = COMPUTER_KEY_MAP[key];
    if (mapping && this.activePhysicalKeys.has(key)) {
      this.activePhysicalKeys.delete(key);
      this.keyDownTimes.delete(key);

      const targetMidiNote = this.baseNote + mapping.noteOffset;
      this.audioEngine.stopNote(targetMidiNote);
    }
  }

  public isKeyActive(key: string): boolean {
    return this.activePhysicalKeys.has(key.toLowerCase());
  }
}
