/**
 * Ultra Low Latency Synthesized Drum Engine
 * Generates analog & digital drum hits using pure WebAudio DSP oscillators, noise, and envelopes.
 */

export type DrumSoundId =
  | 'kick_808'
  | 'kick_punch'
  | 'snare_909'
  | 'snare_trap'
  | 'hihat_closed'
  | 'hihat_open'
  | 'clap'
  | 'perc_rim'
  | 'perc_conga'
  | 'sub_drop';

export interface DrumVoiceDef {
  id: DrumSoundId;
  name: string;
  shortName: string;
  category: 'kick' | 'snare' | 'hihat' | 'perc' | 'clap' | 'bass';
  color: string;
}

export const DRUM_VOICES: DrumVoiceDef[] = [
  { id: 'kick_808', name: '808 Sub Kick', shortName: '808 KICK', category: 'kick', color: '#ef4444' },
  { id: 'snare_trap', name: 'Trap Snare / Rim', shortName: 'SNARE', category: 'snare', color: '#f59e0b' },
  { id: 'clap', name: 'Stereo Hand Clap', shortName: 'CLAP', category: 'clap', color: '#eab308' },
  { id: 'hihat_closed', name: 'Closed Hi-Hat', shortName: 'CH HAT', category: 'hihat', color: '#10b981' },
  { id: 'hihat_open', name: 'Open Cymbal Hat', shortName: 'OP HAT', category: 'hihat', color: '#06b6d4' },
  { id: 'perc_conga', name: 'World Perc / Conga', shortName: 'PERC', category: 'perc', color: '#8b5cf6' },
];

import { AudioEngine } from '../AudioEngine';

export class DrumEngine {
  private static instance: DrumEngine | null = null;

  public static getInstance(): DrumEngine {
    if (!DrumEngine.instance) {
      DrumEngine.instance = new DrumEngine();
    }
    return DrumEngine.instance;
  }

  /**
   * Triggers a synthesized drum voice at audio context time
   */
  public triggerDrum(
    ctx: AudioContext,
    destination: AudioNode,
    soundId: DrumSoundId,
    velocity: number = 0.8,
    time: number = ctx.currentTime
  ): void {
    const vel = Math.max(0.1, Math.min(1.0, velocity));

    // Sidechain pumping trigger for kicks & subs
    if (soundId === 'kick_808' || soundId === 'kick_punch' || soundId === 'sub_drop') {
      try {
        const engine = AudioEngine.getInstance();
        if (engine.sidechainEnabled) {
          engine.triggerSidechainPump();
        }
      } catch {
        // ignore
      }
    }

    switch (soundId) {
      case 'kick_808':
        this.play808Kick(ctx, destination, vel, time);
        break;
      case 'kick_punch':
        this.playPunchKick(ctx, destination, vel, time);
        break;
      case 'snare_909':
        this.play909Snare(ctx, destination, vel, time);
        break;
      case 'snare_trap':
        this.playTrapSnare(ctx, destination, vel, time);
        break;
      case 'hihat_closed':
        this.playClosedHiHat(ctx, destination, vel, time);
        break;
      case 'hihat_open':
        this.playOpenHiHat(ctx, destination, vel, time);
        break;
      case 'clap':
        this.playClap(ctx, destination, vel, time);
        break;
      case 'perc_rim':
        this.playRim(ctx, destination, vel, time);
        break;
      case 'perc_conga':
        this.playConga(ctx, destination, vel, time);
        break;
      case 'sub_drop':
        this.playSubDrop(ctx, destination, vel, time);
        break;
      default:
        this.play808Kick(ctx, destination, vel, time);
    }
  }

  // --- 808 Sub Kick ---
  private play808Kick(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Pitch sweep: starts punchy at 180Hz, drops quickly to 45Hz
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.08);

    // Amplitude envelope
    gain.gain.setValueAtTime(vel * 1.2, t);
    gain.gain.exponentialRampToValueAtTime(vel * 0.7, t + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    // Click transient
    const clickOsc = ctx.createOscillator();
    const clickGain = ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(320, t);
    clickOsc.frequency.exponentialRampToValueAtTime(30, t + 0.02);
    clickGain.gain.setValueAtTime(vel * 0.8, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.02);

    clickOsc.connect(clickGain);
    clickGain.connect(dest);
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.6);
  }

  // --- Punchy Dance Kick ---
  private playPunchKick(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.04);

    gain.gain.setValueAtTime(vel * 1.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.35);
  }

  // --- Snappy Trap Snare ---
  private playTrapSnare(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    // Tonal body
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.05);

    oscGain.gain.setValueAtTime(vel * 0.8, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.15);

    // Noise burst
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.25), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1200, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.9, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noiseSource.start(t);
    noiseSource.stop(t + 0.2);
  }

  // --- 909 Snare ---
  private play909Snare(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

    oscGain.gain.setValueAtTime(vel * 0.7, t);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    osc.connect(oscGain);
    oscGain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.22);

    // Noise
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2400, t);
    filter.Q.setValueAtTime(1.5, t);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(vel * 0.8, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(dest);

    noiseSource.start(t);
    noiseSource.stop(t + 0.25);
  }

  // --- Closed Hi-Hat ---
  private playClosedHiHat(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.08), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(7500, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.055);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noiseSource.start(t);
    noiseSource.stop(t + 0.06);
  }

  // --- Open Hi-Hat ---
  private playOpenHiHat(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.6), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(6500, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vel * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.38);

    noiseSource.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    noiseSource.start(t);
    noiseSource.stop(t + 0.4);
  }

  // --- Hand Clap ---
  private playClap(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.3), ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, t);
    filter.Q.setValueAtTime(1.8, t);
    filter.connect(dest);

    // Multi-tap flame impulses
    const tapTimes = [0, 0.012, 0.024];
    tapTimes.forEach((offset, idx) => {
      const isLast = idx === tapTimes.length - 1;
      const src = ctx.createBufferSource();
      src.buffer = noiseBuffer;
      const g = ctx.createGain();

      const tapStart = t + offset;
      const dur = isLast ? 0.2 : 0.02;

      g.gain.setValueAtTime(vel * (isLast ? 0.9 : 0.4), tapStart);
      g.gain.exponentialRampToValueAtTime(0.001, tapStart + dur);

      src.connect(g);
      g.connect(filter);

      src.start(tapStart);
      src.stop(tapStart + dur + 0.02);
    });
  }

  // --- World Conga / Hand Drum ---
  private playConga(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(340, t);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.06);

    gain.gain.setValueAtTime(vel * 0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  // --- Rimshot ---
  private playRim(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(820, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.02);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, t);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(vel * 0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(dest);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // --- Sub 808 Drop Hit ---
  private playSubDrop(ctx: AudioContext, dest: AudioNode, vel: number, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(38, t + 0.35);

    gain.gain.setValueAtTime(vel * 1.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(dest);
    osc.start(t);
    osc.stop(t + 1.0);
  }
}
